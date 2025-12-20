import "dotenv/config";
import { connectDB } from "./infrastructure/db";
import { SolarUnit } from "./infrastructure/entities/SolarUnit";

async function listSolarUnits() {
  await connectDB();
  
  const units = await SolarUnit.find();
  
  console.log("\n=== ALL SOLAR UNITS ===\n");
  units.forEach((unit, idx) => {
    console.log(`${idx + 1}. Serial: ${unit.serialNumber}, Name: ${unit.name || 'N/A'}, Status: ${unit.status}`);
  });
  console.log("\n");
  
  process.exit(0);
}

listSolarUnits().catch(console.error);
