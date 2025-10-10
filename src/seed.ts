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

    // Clear existing data
    await EnergyGenerationRecord.deleteMany({});
    await SolarUnit.deleteMany({});
    await User.deleteMany({});

    // Create a user
    const user = await User.create({
      name: "John Doe", 
      email: "john.doe@example.com",
    });

    // Create a new solar unit linked to the user
    const solarUnit = await SolarUnit.create({
      userid: user._id,
      serialNumber: "SU-0001",
      installationDate: new Date("2025-09-21"),
      capacity: 5000,
      status: "ACTIVE",
    });

    // Create 10 sequential energy generation records every 2 hours
    const records = [];
    const baseDate = new Date("2025-09-21T00:00:00Z");
    for (let i = 0; i < 10; i++) {
      records.push({
        solarUnitId: solarUnit._id,
        timestamp: new Date(baseDate.getTime() + i * 2 * 60 * 60 * 1000), // every 2 hours
        energyGenerated: 100 + i * 10, // e.g., 100, 110, ..., 190
      });
    }
    await EnergyGenerationRecord.insertMany(records);

    console.log("Database seeded successfully.");
    console.log(`Created user: ${user.name} (${user.email})`);
    console.log(`Created solar unit: ${solarUnit.serialNumber} linked to user ${user.name}`);
    console.log(`Created ${records.length} energy generation records`);
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();