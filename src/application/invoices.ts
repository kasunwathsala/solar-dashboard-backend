import { Invoice } from "../infrastructure/entities/Invoice";
import { SolarUnit } from "../infrastructure/entities/SolarUnit";
import { EnergyGenerationRecord } from "../infrastructure/entities/EnergyGenerationRecord";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import Stripe from "stripe";

// Initialize Stripe with proper error handling
const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.warn("⚠️ STRIPE_SECRET_KEY not found. Stripe features will be disabled.");
    return null;
  }
  return new Stripe(secretKey, {
    apiVersion: "2025-12-15.clover",
  });
};

const stripe = getStripe();

/**
 * Generate invoice number in format: INV-YYYY-MM-XXXXX
 */
const generateInvoiceNumber = async (): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  
  // Count invoices for this month
  const count = await Invoice.countDocuments({
    invoiceNumber: new RegExp(`^INV-${year}-${month}-`)
  });
  
  const sequence = (count + 1).toString().padStart(5, '0');
  return `INV-${year}-${month}-${sequence}`;
};

/**
 * Generate monthly invoice for a solar unit
 * Called by scheduler or manually by admin
 */
export const generateInvoiceForSolarUnit = async (
  solarUnitId: string,
  startDate: Date,
  endDate: Date
) => {
  try {
    const solarUnit = await SolarUnit.findById(solarUnitId);
    if (!solarUnit) {
      throw new Error("Solar unit not found");
    }

    // Check if invoice already exists for this period
    const existingInvoice = await Invoice.findOne({
      solarUnitId: new mongoose.Types.ObjectId(solarUnitId),
      "billingPeriod.startDate": startDate,
      "billingPeriod.endDate": endDate,
    });

    if (existingInvoice) {
      console.log(`Invoice already exists for solar unit ${solarUnitId} for period ${startDate} - ${endDate}`);
      return existingInvoice;
    }

    // Calculate total energy generated in the billing period
    const energyRecords = await EnergyGenerationRecord.aggregate([
      {
        $match: {
          solarUnitId: new mongoose.Types.ObjectId(solarUnitId),
          timestamp: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalEnergy: { $sum: "$energyGenerated" },
        },
      },
    ]);

    const energyGenerated = energyRecords.length > 0 ? energyRecords[0].totalEnergy : 0;

    // Get rate from environment or use default (15 cents per kWh)
    const ratePerKwh = parseInt(process.env.RATE_PER_KWH || "15");
    const totalAmount = Math.round(energyGenerated * ratePerKwh);

    // Due date is 30 days from end of billing period
    const dueDate = new Date(endDate);
    dueDate.setDate(dueDate.getDate() + 30);

    // Generate unique invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Create invoice
    const invoice = await Invoice.create({
      solarUnitId: new mongoose.Types.ObjectId(solarUnitId),
      userId: solarUnit.userid?.toString() || "",
      billingPeriod: {
        startDate,
        endDate,
      },
      energyGenerated: parseFloat(energyGenerated.toFixed(2)),
      ratePerKwh,
      totalAmount,
      status: "PENDING",
      dueDate,
      invoiceNumber,
    });

    console.log(`✅ Invoice ${invoiceNumber} generated for solar unit ${solarUnitId}: ${energyGenerated.toFixed(2)} kWh, $${(totalAmount / 100).toFixed(2)}`);
    
    return invoice;
  } catch (error) {
    console.error("Error generating invoice:", error);
    throw error;
  }
};

/**
 * Get all invoices for authenticated user
 */
export const getInvoicesForUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId; // From auth middleware
    const { status } = req.query;

    const filter: any = { userId };
    if (status && status !== "ALL") {
      filter.status = status;
    }

    const invoices = await Invoice.find(filter)
      .populate("solarUnitId", "serialNumber")
      .sort({ createdAt: -1 });

    res.status(200).json(invoices);
  } catch (error) {
    console.error("Error fetching user invoices:", error);
    next(error);
  }
};

/**
 * Get all invoices (admin only)
 */
export const getAllInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, userId } = req.query;

    const filter: any = {};
    if (status && status !== "ALL") {
      filter.status = status;
    }
    if (userId) {
      filter.userId = userId;
    }

    const invoices = await Invoice.find(filter)
      .populate("solarUnitId", "serialNumber")
      .sort({ createdAt: -1 });

    res.status(200).json(invoices);
  } catch (error) {
    console.error("Error fetching all invoices:", error);
    next(error);
  }
};

/**
 * Get single invoice by ID
 */
export const getInvoiceById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const invoice = await Invoice.findById(id).populate("solarUnitId", "serialNumber");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Check if user owns this invoice (unless admin)
    if (invoice.userId !== userId && (req as any).userRole !== "ADMIN") {
      return res.status(403).json({ message: "Unauthorized to view this invoice" });
    }

    res.status(200).json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    next(error);
  }
};

/**
 * Create Stripe Checkout Session for invoice payment (Embedded Checkout)
 */
export const createCheckoutSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { invoiceId } = req.body;
    const userId = (req as any).userId;

    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Check ownership
    if (invoice.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Check if already paid
    if (invoice.status === "PAID") {
      return res.status(400).json({ message: "Invoice already paid" });
    }

    // Get price ID from environment or use default rate
    const priceId = process.env.STRIPE_PRICE_ID;
    
    let lineItems;
    if (priceId) {
      // Use predefined price from Stripe Dashboard
      lineItems = [
        {
          price: priceId,
          quantity: Math.round(invoice.energyGenerated), // kWh as quantity
        },
      ];
    } else {
      // Create price on the fly
      lineItems = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Solar Energy Invoice ${invoice.invoiceNumber}`,
              description: `Energy generated: ${invoice.energyGenerated} kWh (${invoice.billingPeriod?.startDate.toISOString().split('T')[0]} - ${invoice.billingPeriod?.endDate.toISOString().split('T')[0]})`,
            },
            unit_amount: invoice.ratePerKwh, // Rate per kWh in cents
          },
          quantity: Math.round(invoice.energyGenerated), // kWh quantity
        },
      ];
    }

    // Check if Stripe is configured
    if (!stripe) {
      throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.");
    }

    // Create Stripe Checkout Session with Embedded mode
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      line_items: lineItems,
      mode: "payment",
      return_url: `${process.env.FRONTEND_URL}/dashboard/invoices/complete?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        invoiceId: invoice._id.toString(),
        userId: invoice.userId,
      },
    });

    // Update invoice with session ID
    invoice.stripeCheckoutSessionId = session.id;
    await invoice.save();

    res.status(200).json({ 
      clientSecret: session.client_secret 
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    next(error);
  }
};

/**
 * Get Stripe Checkout Session Status
 */
export const getSessionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ message: "Missing session_id" });
    }

    if (!stripe) {
      return res.status(503).json({ message: "Payment service unavailable" });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id as string);

    res.status(200).json({
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email,
      amountTotal: session.amount_total,
    });
  } catch (error) {
    console.error("Error retrieving session status:", error);
    next(error);
  }
};

/**
 * Handle Stripe webhook events
 */
export const handleStripeWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripe) {
      return res.status(503).json({ message: "Payment service unavailable" });
    }

    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const invoiceId = session.metadata?.invoiceId;

        if (invoiceId) {
          const invoice = await Invoice.findById(invoiceId);
          if (invoice) {
            invoice.status = "PAID";
            invoice.paidAt = new Date();
            invoice.stripePaymentIntentId = session.payment_intent as string;
            await invoice.save();
            console.log(`✅ Invoice ${invoice.invoiceNumber} marked as PAID`);
          }
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const invoiceId = session.metadata?.invoiceId;

        if (invoiceId) {
          console.log(`⚠️ Checkout session expired for invoice ${invoiceId}`);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        // Find invoice by payment intent ID
        const invoice = await Invoice.findOne({ stripePaymentIntentId: paymentIntent.id });
        if (invoice) {
          invoice.status = "FAILED";
          await invoice.save();
          console.log(`❌ Payment failed for invoice ${invoice.invoiceNumber}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error handling webhook:", error);
    next(error);
  }
};

/**
 * Generate invoice manually (admin only)
 */
export const generateInvoiceManually = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { solarUnitId, startDate, endDate } = req.body;

    if (!solarUnitId || !startDate || !endDate) {
      return res.status(400).json({ 
        message: "Missing required fields: solarUnitId, startDate, endDate" 
      });
    }

    const invoice = await generateInvoiceForSolarUnit(
      solarUnitId,
      new Date(startDate),
      new Date(endDate)
    );

    res.status(201).json(invoice);
  } catch (error) {
    console.error("Error generating invoice manually:", error);
    next(error);
  }
};
