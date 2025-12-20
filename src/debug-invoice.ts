import "dotenv/config";
import { connectDB } from "./infrastructure/db";
import { Invoice } from "./infrastructure/entities/Invoice";
import { SolarUnit } from "./infrastructure/entities/SolarUnit";
import { User } from "./infrastructure/entities/User";

async function debugInvoice() {
  await connectDB();
  
  console.log("\n=== DEBUGGING INVOICE ISSUE ===\n");
  
  // Find the solar unit
  const solarUnit = await SolarUnit.findOne({ serialNumber: "SU-TEST-2024" }).populate('userid');
  
  if (!solarUnit) {
    console.log("❌ Solar unit 'SU-test-2024' not found!");
    process.exit(1);
  }
  
  console.log("✅ Solar Unit Found:");
  console.log(`   Serial Number: ${solarUnit.serialNumber}`);
  console.log(`   Name: ${solarUnit.name}`);
  console.log(`   MongoDB _id: ${solarUnit._id}`);
  console.log(`   User ObjectId: ${solarUnit.userid}`);
  
  // Get the user details
  const user = solarUnit.userid as any;
  if (user) {
    console.log("\n✅ Linked User:");
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Clerk User ID: ${user.clerkUserId}`);
    console.log(`   MongoDB _id: ${user._id}`);
  } else {
    console.log("\n❌ No user linked to this solar unit!");
  }
  
  // Find invoices for this solar unit
  const invoices = await Invoice.find({ solarUnitId: solarUnit._id });
  
  console.log(`\n📄 Invoices for this solar unit (${invoices.length}):`);
  invoices.forEach((invoice, idx) => {
    console.log(`\n   Invoice ${idx + 1}:`);
    console.log(`   - Invoice Number: ${invoice.invoiceNumber}`);
    console.log(`   - Status: ${invoice.status}`);
    console.log(`   - userId field: "${invoice.userId}"`);
    console.log(`   - Expected userId: "${user?.clerkUserId}"`);
    console.log(`   - Match: ${invoice.userId === user?.clerkUserId ? "✅ YES" : "❌ NO"}`);
  });
  
  // Check what the user would see
  if (user?.clerkUserId) {
    const userInvoices = await Invoice.find({ userId: user.clerkUserId });
    console.log(`\n🔍 Invoices visible to user (querying by Clerk ID "${user.clerkUserId}"):`);
    console.log(`   Found ${userInvoices.length} invoice(s)`);
    userInvoices.forEach((inv) => {
      console.log(`   - ${inv.invoiceNumber}`);
    });
  }
  
  console.log("\n=== END DEBUG ===\n");
  process.exit(0);
}

debugInvoice().catch(console.error);
