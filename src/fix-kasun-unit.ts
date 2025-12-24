import dotenv from "dotenv";
dotenv.config();

import { SolarUnit } from "./infrastructure/entities/SolarUnit";
import { connectDB } from "./infrastructure/db";

async function fixKasunUnit() {
  try {
    await connectDB();
    
    console.log("=== FIXING KASUN'S SOLAR UNIT ===");
    
    // Find and update kasun's solar unit to ACTIVE
    const result = await SolarUnit.findOneAndUpdate(
      { serialNumber: 'ss-11' },
      { status: 'ACTIVE' },
      { new: true }
    );
    
    if (!result) {
      console.log("❌ Solar unit ss-11 not found!");
      process.exit(1);
    }
    
    console.log(`✅ Solar unit ${result.serialNumber} updated to ${result.status}`);
    console.log(`- ID: ${result._id}`);
    console.log(`- User ID: ${result.userid}`);
    console.log(`- Capacity: ${result.capacity}W`);
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

fixKasunUnit();
