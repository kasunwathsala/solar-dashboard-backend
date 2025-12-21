import mongoose from "mongoose";
import { SolarUnit } from "./infrastructure/entities/SolarUnit";
import { User } from "./infrastructure/entities/User";
import dotenv from "dotenv";
import { connectDB } from "./infrastructure/db";

dotenv.config();

async function linkSolarToUser() {
  try {
    await connectDB();

    // Find the user with email wathsala.nilaweera2001@gmail.com
    const user = await User.findOne({ email: "wathsala.nilaweera2001@gmail.com" });
    
    if (!user) {
      console.log("❌ User not found!");
      return;
    }

    console.log(`✅ Found user: ${user.email}`);
    console.log(`   User ID: ${user._id}`);

    // Find the solar unit with serial number SU-TEST-2024
    const solarUnit: any = await SolarUnit.findOne({ serialNumber: "SU-TEST-2024" });

    if (!solarUnit) {
      console.log("❌ Solar unit SU-TEST-2024 not found!");
      return;
    }

    console.log(`✅ Found solar unit: ${solarUnit.serialNumber}`);
    console.log(`   Current userId: ${solarUnit.userId || 'NOT LINKED'}`);

    // Link the solar unit to the user
    solarUnit.userId = user._id;
    await solarUnit.save();

    console.log(`\n🎉 Successfully linked!`);
    console.log(`   User: ${user.email}`);
    console.log(`   Solar Unit: ${solarUnit.serialNumber}`);
    console.log(`   Status: ${solarUnit.status}`);
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
  }
}

linkSolarToUser();
