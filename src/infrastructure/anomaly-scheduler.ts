import cron from "node-cron";
import { AnomalyDetectionService } from "../application/anomaly-detection";

/**
 * Start anomaly detection scheduler
 * Runs every hour at minute 15 (e.g., 1:15, 2:15, 3:15)
 */
export const startAnomalyDetectionScheduler = () => {
  console.log("🔍 Starting anomaly detection scheduler...");

  // Run every hour at minute 15
  cron.schedule("15 * * * *", async () => {
    console.log("⏰ Running scheduled anomaly detection...");
    try {
      await AnomalyDetectionService.detectAnomaliesForAllUnits();
      console.log("✅ Scheduled anomaly detection completed");
    } catch (error: any) {
      console.error("❌ Scheduled anomaly detection failed:", error.message);
    }
  });

  console.log("✅ Anomaly detection scheduler started (runs hourly at :15)");
};
