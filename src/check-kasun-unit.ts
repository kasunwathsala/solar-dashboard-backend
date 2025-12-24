import dotenv from "dotenv";
dotenv.config();

import { SolarUnit } from "./infrastructure/entities/SolarUnit";
import { EnergyGenerationRecord } from "./infrastructure/entities/EnergyGenerationRecord";
import { connectDB } from "./infrastructure/db";

async function checkKasunUnit() {
  try {
    await connectDB();
    
    console.log("=== CHECKING KASUN'S SOLAR UNIT ===");
    
    // Find kasun's solar unit
    const kasunUnit = await SolarUnit.findOne({ serialNumber: 'ss-11' });
    
    if (!kasunUnit) {
      console.log("❌ Solar unit ss-11 not found!");
      process.exit(1);
    }
    
    console.log("\nSolar Unit Details:");
    console.log(`- ID: ${kasunUnit._id}`);
    console.log(`- Serial Number: ${kasunUnit.serialNumber}`);
    console.log(`- Status: ${kasunUnit.status}`);
    console.log(`- User ID: ${kasunUnit.userid}`);
    console.log(`- Capacity: ${kasunUnit.capacity || 'Not set'}`);
    console.log(`- Installation Date: ${kasunUnit.installationDate || 'Not set'}`);
    
    // Check energy generation records
    const recordCount = await EnergyGenerationRecord.countDocuments({ 
      solarUnitId: kasunUnit._id 
    });
    
    console.log(`\nEnergy Generation Records: ${recordCount}`);
    
    if (recordCount > 0) {
      const latestRecord = await EnergyGenerationRecord.findOne({ 
        solarUnitId: kasunUnit._id 
      }).sort({ timestamp: -1 });
      
      console.log(`\nLatest Record:`);
      console.log(`- Date: ${latestRecord?.timestamp}`);
      console.log(`- Energy: ${latestRecord?.energyGenerated} W`);
    }
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

checkKasunUnit();
