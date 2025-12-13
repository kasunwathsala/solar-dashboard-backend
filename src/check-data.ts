import { User } from "./infrastructure/entities/User";
import { SolarUnit } from "./infrastructure/entities/SolarUnit";
import { EnergyGenerationRecord } from "./infrastructure/entities/EnergyGenerationRecord";
import { connectDB } from "./infrastructure/db";

async function checkData() {
  try {
    await connectDB();
    
    console.log("=== CURRENT DATABASE STATE ===");
    
    const users = await User.find({});
    console.log(`\nUsers (${users.length}):`);
    users.forEach(user => {
      console.log(`- ID: ${user._id}`);
      console.log(`  Name: ${user.name || user.firstName} ${user.lastName || ''}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  ClerkID: ${user.clerkUserId}`);
    });
    
    const solarUnits = await SolarUnit.find({}).populate('userid');
    console.log(`\nSolar Units (${solarUnits.length}):`);
    solarUnits.forEach(unit => {
      console.log(`- ID: ${unit._id}`);
      console.log(`  Serial: ${unit.serialNumber}`);
      console.log(`  Status: ${unit.status}`);
      console.log(`  User: ${unit.userid ? (unit.userid as any).email : 'No user assigned'}`);
    });
    
    const records = await EnergyGenerationRecord.find({});
    console.log(`\nEnergy Records: ${records.length}`);
    
  } catch (err) {
    console.error("Error checking data:", err);
  } finally {
    process.exit(0);
  }
}

checkData();