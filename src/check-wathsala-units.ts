import dotenv from "dotenv";
dotenv.config();

import { SolarUnit } from "./infrastructure/entities/SolarUnit";
import { EnergyGenerationRecord } from "./infrastructure/entities/EnergyGenerationRecord";
import { User } from "./infrastructure/entities/User";
import { connectDB } from "./infrastructure/db";

async function checkWathsalaUnits() {
  try {
    await connectDB();
    
    console.log("=== CHECKING WATHSALA'S SOLAR UNITS ===");
    
    // Find wathsala
    const wathsala = await User.findOne({ email: 'wathsala.nilaweera2001@gmail.com' });
    
    if (!wathsala) {
      console.log("❌ User wathsala.nilaweera2001@gmail.com not found!");
      process.exit(1);
    }
    
    console.log(`\nUser ID: ${wathsala._id}`);
    
    // Find wathsala's solar units
    const units = await SolarUnit.find({ userid: wathsala._id });
    
    console.log(`\nSolar Units: ${units.length}`);
    
    for (const unit of units) {
      console.log(`\n--- Unit ${unit.serialNumber} ---`);
      console.log(`- ID: ${unit._id}`);
      console.log(`- Status: ${unit.status}`);
      console.log(`- Capacity: ${unit.capacity || 'Not set'}`);
      
      const recordCount = await EnergyGenerationRecord.countDocuments({ 
        solarUnitId: unit._id 
      });
      
      console.log(`- Total Records: ${recordCount}`);
      
      if (recordCount > 0) {
        // Get today's records
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayRecords = await EnergyGenerationRecord.find({ 
          solarUnitId: unit._id,
          timestamp: { $gte: today, $lt: tomorrow }
        });
        
        console.log(`- Today's Records: ${todayRecords.length}`);
        
        if (todayRecords.length > 0) {
          const totalEnergy = todayRecords.reduce((sum, r) => sum + r.energyGenerated, 0);
          console.log(`- Today's Total Energy: ${totalEnergy.toFixed(2)} W`);
        }
        
        // Check latest record
        const latestRecord = await EnergyGenerationRecord.findOne({ 
          solarUnitId: unit._id 
        }).sort({ timestamp: -1 });
        
        console.log(`- Latest Record Date: ${latestRecord?.timestamp}`);
      }
    }
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

checkWathsalaUnits();
