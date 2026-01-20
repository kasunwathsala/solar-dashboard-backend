import "dotenv/config";
import { connectDB } from "./infrastructure/db";
import { Invoice } from "./infrastructure/entities/Invoice";

async function testCheckoutEndpoint() {
  await connectDB();
  
  console.log("\n=== TESTING CHECKOUT SESSION PREREQUISITES ===\n");
  
  // Check environment variables
  console.log("Environment Variables Check:");
  console.log(`✓ STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? "SET" : "❌ MISSING"}`);
  console.log(`✓ STRIPE_PRICE_ID: ${process.env.STRIPE_PRICE_ID || "❌ MISSING"}`);
  console.log(`✓ FRONTEND_URL: ${process.env.FRONTEND_URL || "❌ MISSING"}`);
  
  // Get a pending invoice
  const invoice = await Invoice.findOne({ status: "PENDING" });
  
  if (!invoice) {
    console.log("\n❌ No pending invoices found to test!");
    process.exit(0);
  }
  
  console.log(`\n✅ Found test invoice: ${invoice.invoiceNumber}`);
  console.log(`   Invoice ID: ${invoice._id}`);
  console.log(`   User ID: ${invoice.userId}`);
  console.log(`   Energy Generated: ${invoice.energyGenerated} kWh`);
  console.log(`   Rate per kWh: ${invoice.ratePerKwh} cents`);
  console.log(`   Total Amount: $${(invoice.totalAmount / 100).toFixed(2)}`);
  console.log(`   Quantity for Stripe: ${Math.round(invoice.energyGenerated)}`);
  
  // Test Stripe initialization
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-12-15.clover" as any,
    });
    console.log("\n✅ Stripe initialized successfully");
    
    // Try to create a session (dry run)
    console.log("\nTesting session creation parameters...");
    const sessionParams = {
      ui_mode: "embedded" as const,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: Math.round(invoice.energyGenerated),
        },
      ],
      mode: "payment" as const,
      return_url: `${process.env.FRONTEND_URL}/dashboard/invoices/complete?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        invoiceId: invoice._id.toString(),
        userId: invoice.userId,
      },
    };
    
    console.log("Session parameters:", JSON.stringify(sessionParams, null, 2));
    
  } catch (error) {
    console.error("\n❌ Stripe initialization failed:", error);
  }
  
  process.exit(0);
}

testCheckoutEndpoint().catch(console.error);
