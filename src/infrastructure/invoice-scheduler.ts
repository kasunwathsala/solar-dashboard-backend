import cron from "node-cron";
import { SolarUnit } from "./entities/SolarUnit";
import { generateInvoiceForSolarUnit } from "../application/invoices";

/**
 * Calculate billing period based on installation date
 * Billing cycles are monthly, anchored to the installation date
 * E.g., if installed on Jan 15, billing periods are: Jan 15 - Feb 14, Feb 15 - Mar 14, etc.
 */
const calculateBillingPeriod = (installationDate: Date): { startDate: Date; endDate: Date } => {
  const now = new Date();
  const installDay = installationDate.getDate();
  
  // Calculate the start date of the current billing period
  const startDate = new Date(now.getFullYear(), now.getMonth(), installDay);
  
  // If today is before the billing day, the current period started last month
  if (now.getDate() < installDay) {
    startDate.setMonth(startDate.getMonth() - 1);
  }
  
  // End date is one day before the next billing day
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(endDate.getDate() - 1);
  
  return { startDate, endDate };
};

/**
 * Check if invoice should be generated for a solar unit
 * Invoices are generated on the installation date anniversary each month
 */
const shouldGenerateInvoice = (installationDate: Date): boolean => {
  const now = new Date();
  const installDay = installationDate.getDate();
  const today = now.getDate();
  
  // Generate invoice on the installation day of each month
  return today === installDay;
};

/**
 * Generate invoices for all solar units
 * Runs daily and checks which units need invoices generated
 */
export const generateMonthlyInvoices = async () => {
  try {
    console.log("🔄 Running monthly invoice generation job...");
    
    // Get all active solar units
    const solarUnits = await SolarUnit.find({ status: "ACTIVE" });
    
    let generatedCount = 0;
    let skippedCount = 0;
    
    for (const unit of solarUnits) {
      try {
        // Check if invoice should be generated today
        if (shouldGenerateInvoice(unit.installationDate)) {
          const { startDate, endDate } = calculateBillingPeriod(unit.installationDate);
          
          console.log(`Generating invoice for solar unit ${unit.serialNumber} (${unit._id})`);
          console.log(`Billing period: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
          
          await generateInvoiceForSolarUnit(
            unit._id.toString(),
            startDate,
            endDate
          );
          
          generatedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`Error generating invoice for solar unit ${unit._id}:`, error);
      }
    }
    
    console.log(`✅ Invoice generation completed: ${generatedCount} generated, ${skippedCount} skipped`);
  } catch (error) {
    console.error("Error in monthly invoice generation job:", error);
  }
};

/**
 * Mark overdue invoices
 * Runs daily to check for invoices past their due date
 */
export const markOverdueInvoices = async () => {
  try {
    console.log("🔄 Checking for overdue invoices...");
    
    const { Invoice } = await import("./entities/Invoice");
    const now = new Date();
    
    const result = await Invoice.updateMany(
      {
        status: "PENDING",
        dueDate: { $lt: now },
      },
      {
        $set: { status: "OVERDUE" },
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`⚠️ Marked ${result.modifiedCount} invoices as OVERDUE`);
    } else {
      console.log("✅ No overdue invoices found");
    }
  } catch (error) {
    console.error("Error marking overdue invoices:", error);
  }
};

/**
 * Start the invoice scheduler
 * - Runs daily at 2 AM to generate invoices
 * - Runs daily at 3 AM to mark overdue invoices
 */
export const startInvoiceScheduler = () => {
  console.log("📅 Starting invoice scheduler...");
  
  // Run invoice generation daily at 2:00 AM
  cron.schedule("0 2 * * *", async () => {
    console.log("⏰ Triggering scheduled invoice generation (2:00 AM)");
    await generateMonthlyInvoices();
  });
  
  // Run overdue check daily at 3:00 AM
  cron.schedule("0 3 * * *", async () => {
    console.log("⏰ Triggering overdue invoice check (3:00 AM)");
    await markOverdueInvoices();
  });
  
  // Optional: Run immediately on startup for testing
  if (process.env.NODE_ENV === "development") {
    console.log("🧪 Development mode: Running invoice jobs immediately for testing...");
    setTimeout(async () => {
      // await generateMonthlyInvoices();
      // await markOverdueInvoices();
      console.log("✅ Test invoice jobs completed (commented out to prevent spam)");
    }, 5000);
  }
  
  console.log("✅ Invoice scheduler started successfully");
};
