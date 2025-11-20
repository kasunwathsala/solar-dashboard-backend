import mongoose from "mongoose";
import { User } from "./infrastructure/entities/User";
import { SolarUnit } from "./infrastructure/entities/SolarUnit";
import { connectDB } from "./infrastructure/db";
import dotenv from "dotenv";

dotenv.config();

async function createTestUser() {
  try {
    await connectDB();

    // Create/update test user
    const testUser = await User.findOneAndUpdate(
      { clerkUserId: "user_35gVzP4WAsXi1uvQEZOTURiPUgr" },
      {
        firstName: "Test",
        lastName: "User",
        email: "testuser@example.com",
        clerkUserId: "user_35gVzP4WAsXi1uvQEZOTURiPUgr",
      },
      { upsert: true, new: true }
    );

    console.log("✅ User created/updated:", {
      id: testUser._id,
      clerkUserId: testUser.clerkUserId,
      email: testUser.email
    });

    // Create solar unit for this user
    const solarUnit = await SolarUnit.create({
      userid: testUser._id,
      clerkUserId: "user_35gVzP4WAsXi1uvQEZOTURiPUgr",
      serialNumber: "SU-TEST-USER",
      name: "User's Solar Unit",
      location: "Rooftop Installation",
      installationDate: new Date("2025-11-19"),
      capacity: 6000,
      status: "ACTIVE",
    });

    console.log("✅ Solar unit created:", {
      id: solarUnit._id,
      serialNumber: solarUnit.serialNumber,
      status: solarUnit.status
    });

    console.log("\n🔥 Test this endpoint now:");
    console.log("GET http://localhost:8002/api/solar-units/users/user_35gVzP4WAsXi1uvQEZOTURiPUgr");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestUser();