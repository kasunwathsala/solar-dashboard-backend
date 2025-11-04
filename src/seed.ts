import mongoose from "mongoose";
import { SolarUnit } from "./infrastructure/entities/SolarUnit";
import { EnergyGenerationRecord } from "./infrastructure/entities/EnergyGenerationRecord";
import { User } from "./infrastructure/entities/User";
import dotenv from "dotenv";
import { connectDB } from "./infrastructure/db";

dotenv.config();

async function seed() {
  try {
    // Connect to DB
    await connectDB();

    // Idempotent setup: ensure a user and a solar unit exist (no deletions)
    let user = await User.findOne({ email: "alice@example.com" });
    if (!user) {
      user = await User.create({
        name: "Alice Example",
        email: "alice@example.com",
      });
    }

    // Ensure a solar unit exists and is linked to the user
    let solarUnit = await SolarUnit.findOne({ serialNumber: "SU-0001" });
    if (!solarUnit) {
      solarUnit = await SolarUnit.create({
        userid: user._id,
        serialNumber: "SU-0001",
        installationDate: new Date("2025-09-21"),
        capacity: 5000,
        status: "ACTIVE",
      });
    }

    // Create historical energy generation records from Aug 1, 2025 8pm up to now, every 2 hours
    const records: Array<{ solarUnitId: any; timestamp: Date; energyGenerated: number }> = [];

    // Determine the next timestamp to generate from (incremental)
    const lastRecord = await EnergyGenerationRecord.findOne({ solarUnitId: solarUnit._id })
      .sort({ timestamp: -1 })
      .lean();

    const baseStart = new Date("2025-08-01T20:00:00Z"); // August 1, 2025 8pm UTC
    const startDate = lastRecord
      ? new Date(new Date(lastRecord.timestamp).getTime() + 2 * 60 * 60 * 1000)
      : baseStart;
  // End at current time (now) so records are generated up to this moment
  const endDate = new Date();

    let currentDate = new Date(startDate);
    let recordCount = 0;

    if (startDate > endDate) {
      console.log(
        `No new records to insert. Latest record timestamp is ${lastRecord?.timestamp?.toISOString?.() ?? "<none>"}`
      );
      return;
    }

    while (currentDate <= endDate) {
      // Generate realistic energy values based on time of day and season
      const hour = currentDate.getUTCHours();
      const month = currentDate.getUTCMonth(); // 0-11

      // Base energy generation (higher in summer months)
      let baseEnergy = 200;
      if (month >= 5 && month <= 7) {
        // June-August (summer)
        baseEnergy = 300;
      } else if (month >= 2 && month <= 4) {
        // March-May (spring)
        baseEnergy = 250;
      } else if (month >= 8 && month <= 10) {
        // September-November (fall)
        baseEnergy = 200;
      } else {
        // December-February (winter)
        baseEnergy = 150;
      }

      // Adjust based on time of day (solar panels generate more during daylight)
      let timeMultiplier = 1;
      if (hour >= 6 && hour <= 18) {
        // Daylight hours
        timeMultiplier = 1.2;
        if (hour >= 10 && hour <= 14) {
          // Peak sun hours
          timeMultiplier = 1.5;
        }
      } else {
        // Night hours
        timeMultiplier = 0; // Minimal generation at night
      }

      // Add some random variation (±20%)
      const variation = 0.8 + Math.random() * 0.4;
      const energyGenerated = Math.round(baseEnergy * timeMultiplier * variation);

      records.push({
        solarUnitId: solarUnit._id,
        timestamp: new Date(currentDate),
        energyGenerated: energyGenerated,
      });

      // Move to next 2-hour interval
      currentDate = new Date(currentDate.getTime() + 2 * 60 * 60 * 1000);
      recordCount++;
    }
    await EnergyGenerationRecord.insertMany(records);

    console.log(
      `Database seeded successfully. Generated ${recordCount} energy generation records from ${startDate.toISOString()} to ${endDate.toISOString()}.`
    );
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();