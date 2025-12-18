import mongoose from "mongoose";
import { SolarUnit } from "./infrastructure/entities/SolarUnit";
import { EnergyGenerationRecord } from "./infrastructure/entities/EnergyGenerationRecord";
import { User } from "./infrastructure/entities/User";
import dotenv from "dotenv";
import { connectDB } from "./infrastructure/db";

dotenv.config();

async function listAll() {
  try {
    await connectDB();

    console.log("\n=== ALL USERS ===");
    const users = await User.find();
    users.forEach((user: any) => {
      console.log(`- ${user.email} (Clerk: ${user.clerkUserId}, DB: ${user._id})`);
    });

    console.log("\n=== ALL SOLAR UNITS ===");
    const solarUnits = await SolarUnit.find();
    for (const unit of solarUnits) {
      const unitAny: any = unit;
      const recordCount = await EnergyGenerationRecord.countDocuments({ solarUnitId: unit._id });
      console.log(`- Serial: ${unit.serialNumber}, User: ${unitAny.userid || 'UNLINKED'}, Records: ${recordCount}`);
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

listAll();
