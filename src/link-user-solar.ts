import mongoose from "mongoose";
import { SolarUnit } from "./infrastructure/entities/SolarUnit";
import { User } from "./infrastructure/entities/User";
import dotenv from "dotenv";
import { connectDB } from "./infrastructure/db";

dotenv.config();

async function linkUserToSolar() {
  try {
    await connectDB();

    console.log("\n=== Current Users ===");
    const users = await User.find();
    users.forEach(user => {
      console.log(`ID: ${user._id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Clerk ID: ${user.clerkUserId}`);
      console.log("---");
    });

    console.log("\n=== Current Solar Units ===");
    const solarUnits = await SolarUnit.find();
    solarUnits.forEach((unit: any) => {
      console.log(`ID: ${unit._id}`);
      console.log(`Serial: ${unit.serialNumber}`);
      console.log(`User ID: ${unit.userid || 'NOT LINKED'}`);
      console.log("---");
    });

    if (users.length > 0 && solarUnits.length > 0) {
      const user = users[0];
      const solarUnit: any = solarUnits[0];
      
      console.log(`\n🔗 Linking Solar Unit ${solarUnit.serialNumber} to User ${user.email}`);
      
      solarUnit.userid = user._id;
      await solarUnit.save();
      
      console.log("✅ Successfully linked!");
      console.log(`\nUser can now access solar unit at:`);
      console.log(`- User ID: ${user._id}`);
      console.log(`- Clerk ID: ${user.clerkUserId}`);
      console.log(`- Solar Unit: ${solarUnit.serialNumber}`);
    } else {
      console.log("\n⚠️ No users or solar units found!");
      console.log("Please create a user via Clerk sign-up first.");
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

linkUserToSolar();
