import mongoose from "mongoose";
import { SolarUnit } from "./infrastructure/entities/SolarUnit";
import { User } from "./infrastructure/entities/User";
import dotenv from "dotenv";
import { connectDB } from "./infrastructure/db";

dotenv.config();

async function linkWathsalaToSU0004() {
  try {
    await connectDB();

    // Find wathsala user
    const user = await User.findOne({ email: "wathsala.nilaweera2001@gmail.com" });
    
    if (!user) {
      console.log("❌ User wathsala.nilaweera2001@gmail.com not found!");
      return;
    }

    // Find solar unit SU-0004 (which has 1664 energy records)
    const solarUnit: any = await SolarUnit.findOne({ serialNumber: "SU-0004" });
    
    if (!solarUnit) {
      console.log("❌ Solar Unit SU-0004 not found!");
      return;
    }

    console.log(`\n🔗 Linking Solar Unit ${solarUnit.serialNumber} to User ${user.email}`);
    
    solarUnit.userid = user._id;
    await solarUnit.save();
    
    console.log("✅ Successfully linked!");
    console.log(`\nUser Details:`);
    console.log(`- Name: ${user.name || 'N/A'}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Clerk ID: ${user.clerkUserId}`);
    console.log(`- User DB ID: ${user._id}`);
    console.log(`\nSolar Unit Details:`);
    console.log(`- Serial: ${solarUnit.serialNumber}`);
    console.log(`- Solar Unit DB ID: ${solarUnit._id}`);
    console.log(`- Linked to User ID: ${solarUnit.userid}`);
    console.log(`\n📊 This solar unit has 1664 energy generation records!`);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

linkWathsalaToSU0004();
