import "dotenv/config";
import { connectDB } from "./infrastructure/db";
import { Invoice } from "./infrastructure/entities/Invoice";
import { SolarUnit } from "./infrastructure/entities/SolarUnit";

async function fixInvoiceUsers() {
  await connectDB();
  
  console.log("\n=== FIXING INVOICE USER IDs ===\n");
  
  // Get all invoices
  const invoices = await Invoice.find();
  
  console.log(`Found ${invoices.length} invoices to check\n`);
  
  let fixedCount = 0;
  let skippedCount = 0;
  
  for (const invoice of invoices) {
    // Get the solar unit with populated user
    const solarUnit = await SolarUnit.findById(invoice.solarUnitId).populate('userid');
    
    if (!solarUnit) {
      console.log(`❌ Invoice ${invoice.invoiceNumber}: Solar unit not found`);
      skippedCount++;
      continue;
    }
    
    const user = solarUnit.userid as any;
    if (!user || !user.clerkUserId) {
      console.log(`⚠️  Invoice ${invoice.invoiceNumber}: No user linked to solar unit ${solarUnit.serialNumber}`);
      skippedCount++;
      continue;
    }
    
    // Check if userId needs updating
    if (invoice.userId !== user.clerkUserId) {
      console.log(`🔧 Fixing Invoice ${invoice.invoiceNumber}:`);
      console.log(`   Old userId: "${invoice.userId}"`);
      console.log(`   New userId: "${user.clerkUserId}"`);
      console.log(`   User: ${user.email}`);
      
      // Update the invoice
      await Invoice.findByIdAndUpdate(invoice._id, {
        userId: user.clerkUserId
      });
      
      fixedCount++;
    } else {
      console.log(`✅ Invoice ${invoice.invoiceNumber}: Already correct`);
    }
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`✅ Fixed: ${fixedCount}`);
  console.log(`⏭️  Skipped: ${skippedCount}`);
  console.log(`✓  Already correct: ${invoices.length - fixedCount - skippedCount}`);
  console.log("\n");
  
  process.exit(0);
}

fixInvoiceUsers().catch(console.error);
