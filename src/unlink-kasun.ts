import mongoose from "mongoose";
import { SolarUnit } from "./infrastructure/entities/SolarUnit";
import { User } from "./infrastructure/entities/User";
import dotenv from "dotenv";
import { connectDB } from "./infrastructure/db";

dotenv.config();

async function unlinkKasunFromSolarUnit() {
  try {
    await connectDB();

    // Find kasun user
    const user = await User.findOne({ email: "kasunnilaweera2@gmail.com" });
    
    if (!user) {
      console.log("❌ User kasunnilaweera2@gmail.com not found!");
      return;
    }

    // Find solar units linked to kasun
    const solarUnits: any[] = await SolarUnit.find({ userid: user._id });
    
    console.log(`\n📋 Solar units linked to ${user.email}:`);
    
    if (solarUnits.length === 0) {
      console.log("✅ No solar units linked - user is already admin-only!");
      return;
    }

    for (const unit of solarUnits) {
      console.log(`- ${unit.serialNumber} (ID: ${unit._id})`);
      unit.userid = null;
      await unit.save();
      console.log(`  ✅ Unlinked!`);
    }
    
    console.log(`\n✅ Successfully unlinked all solar units from ${user.email}`);
    console.log(`This user can now access admin panel without solar unit data.`);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

unlinkKasunFromSolarUnit();
