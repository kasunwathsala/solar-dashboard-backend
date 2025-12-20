import "dotenv/config";
import { connectDB } from "./infrastructure/db";
import { Invoice } from "./infrastructure/entities/Invoice";
import { SolarUnit } from "./infrastructure/entities/SolarUnit";
import { User } from "./infrastructure/entities/User";
import mongoose from "mongoose";

async function fixInvoiceUserIds() {
  await connectDB();
  
  console.log("\n=== FIXING INVOICE USER IDs ===\n");
  
  // Get all invoices
  const invoices = await Invoice.find();
  
  console.log(`Found ${invoices.length} invoices to check\n`);
  
  let fixed = 0;
  let alreadyCorrect = 0;
  let errors = 0;
  
  for (const invoice of invoices) {
    try {
      // Check if userId is a MongoDB ObjectId (wrong format)
      const isMongoId = mongoose.isValidObjectId(invoice.userId) && invoice.userId.length === 24;
      
      if (isMongoId) {
        console.log(`📝 Invoice ${invoice.invoiceNumber}:`);
        console.log(`   Current userId: ${invoice.userId} (MongoDB ObjectId format - WRONG)`);
        
        // Get the solar unit
        const solarUnit = await SolarUnit.findById(invoice.solarUnitId);
        
        if (!solarUnit) {
          console.log(`   ❌ Solar unit not found`);
          errors++;
          continue;
        }
        
        // Get the user by MongoDB ObjectId
        const user = await User.findById(solarUnit.userid);
        
        if (!user || !user.clerkUserId) {
          console.log(`   ❌ No Clerk user ID found for this solar unit`);
          errors++;
          continue;
        }
        
        // Update the invoice with correct Clerk user ID
        invoice.userId = user.clerkUserId;
        await invoice.save();
        
        console.log(`   ✅ Updated to: ${user.clerkUserId} (Clerk ID)`);
        console.log(`   User: ${user.email}\n`);
        fixed++;
      } else {
        // Already has correct format (Clerk user ID)
        alreadyCorrect++;
      }
    } catch (error) {
      console.error(`   ❌ Error fixing invoice ${invoice.invoiceNumber}:`, error);
      errors++;
    }
  }
  
  console.log("\n=== SUMMARY ===");
  console.log(`✅ Fixed: ${fixed} invoice(s)`);
  console.log(`✓  Already correct: ${alreadyCorrect} invoice(s)`);
  console.log(`❌ Errors: ${errors} invoice(s)`);
  console.log("\n");
  
  process.exit(0);
}

fixInvoiceUserIds().catch(console.error);
