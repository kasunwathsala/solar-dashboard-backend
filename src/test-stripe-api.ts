import "dotenv/config";
import Stripe from "stripe";

async function testStripeSession() {
  console.log("\n=== TESTING STRIPE SESSION CREATION ===\n");
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover",
  });
  
  try {
    // Test session creation with actual Stripe API
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 100, // Test with smaller quantity first
        },
      ],
      mode: "payment",
      return_url: `${process.env.FRONTEND_URL}/dashboard/invoices/complete?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        invoiceId: "test-invoice-123",
        userId: "test-user-123",
      },
    });
    
    console.log("✅ Session created successfully!");
    console.log(`Session ID: ${session.id}`);
    console.log(`Client Secret: ${session.client_secret?.substring(0, 20)}...`);
    console.log(`Amount Total: $${(session.amount_total! / 100).toFixed(2)}`);
    
  } catch (error: any) {
    console.error("❌ Failed to create session:");
    console.error(`Error: ${error.message}`);
    if (error.type) {
      console.error(`Type: ${error.type}`);
    }
    if (error.code) {
      console.error(`Code: ${error.code}`);
    }
    if (error.param) {
      console.error(`Param: ${error.param}`);
    }
  }
}

testStripeSession().catch(console.error);
