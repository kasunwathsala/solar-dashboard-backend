import mongoose from "mongoose";
import { SolarUnit } from "./infrastructure/entities/SolarUnit";
import { User } from "./infrastructure/entities/User";
import dotenv from "dotenv";
import { connectDB } from "./infrastructure/db";

dotenv.config();

async function setupUserAndSolarUnit() {
  try {
    // Connect to DB
    await connectDB();

    console.log("\n=== Checking Users ===");
    const users = await User.find();
    console.log(`Found ${users.length} users:`);
    users.forEach((user) => {
      console.log(`  - ${user.name} (${user.email}) - Clerk ID: ${user.clerkUserId}`);
    });

    if (users.length === 0) {
      console.log("\n⚠️ No users found. Users are created via Clerk webhooks when you sign up.");
      console.log("Please sign up through the frontend first!");
      return;
    }

    // Use the first user
    const user = users[0];
    console.log(`\n✅ Using user: ${user.name} (${user.email})`);

    // Check if this user already has a solar unit
    let solarUnit = await SolarUnit.findOne({ userId: user._id });
    
    if (solarUnit) {
      console.log(`\n✅ User already has a solar unit:`);
      console.log(`   Serial Number: ${solarUnit.serialNumber}`);
      console.log(`   Name: ${solarUnit.name}`);
      console.log(`   Location: ${solarUnit.location}`);
      console.log(`   Status: ${solarUnit.status}`);
      
      // Update serial number to match data backend
      if (solarUnit.serialNumber !== "SU-0001") {
        console.log(`\n🔄 Updating serial number to SU-0001 to match data backend...`);
        solarUnit.serialNumber = "SU-0001";
        await solarUnit.save();
        console.log("✅ Serial number updated!");
      }
    } else {
      console.log(`\n📝 Creating new solar unit for user...`);
      solarUnit = await SolarUnit.create({
        userId: user._id,
        serialNumber: "SU-0001", // Match data backend serial number
        name: `${user.name}'s Solar Unit`,
        location: "Home Installation",
        installationDate: new Date("2025-08-01"),
        capacity: 5000,
        status: "ACTIVE",
      });
      console.log("✅ Solar unit created!");
    }

    console.log(`\n=== Setup Complete ===`);
    console.log(`User: ${user.name}`);
    console.log(`Solar Unit: ${solarUnit.serialNumber}`);
    console.log(`\n📊 Energy records will be synced from Data API (port 8000)`);
    console.log(`   Data API has ${await getDataAPIRecordCount()} records for ${solarUnit.serialNumber}`);

  } catch (err) {
    console.error("Setup error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

async function getDataAPIRecordCount() {
  try {
    const response = await fetch("http://localhost:8000/api/energy-generation-records/solar-unit/SU-0001");
    if (response.ok) {
      const data = await response.json();
      return data.length;
    }
  } catch (e) {
    return "unable to fetch (make sure data backend is running)";
  }
  return 0;
}

setupUserAndSolarUnit();
