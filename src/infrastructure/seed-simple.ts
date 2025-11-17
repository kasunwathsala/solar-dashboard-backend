import mongoose from "mongoose";
import { SolarUnit } from "./entities/SolarUnit";
import { EnergyGenerationRecord } from "./entities/EnergyGenerationRecord";
import { User } from "./entities/User";
import dotenv from "dotenv";
import { connectDB } from "./db";

dotenv.config();

async function seed() {
  try {
    // Connect to DB
    await connectDB();

    // Check existing solar units
    const existingSolarUnits = await SolarUnit.find({});
    console.log(`Found ${existingSolarUnits.length} existing solar units:`);
    existingSolarUnits.forEach(su => {
      console.log(`- ID: ${su._id}, Serial: ${su.serialNumber}, Status: ${su.status}`);
    });

    // Create a new solar unit without clearing existing data
    const solarUnit = await SolarUnit.create({
      serialNumber: "SU-0003",
      installationDate: new Date("2025-11-17"),
      capacity: 6000,
      status: "ACTIVE",
    });

    console.log(`Created new solar unit: ${solarUnit.serialNumber} with ID: ${solarUnit._id}`);

    // Check all solar units after creation
    const allSolarUnits = await SolarUnit.find({});
    console.log(`Total solar units in database: ${allSolarUnits.length}`);
    
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();