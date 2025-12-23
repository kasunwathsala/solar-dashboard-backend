import "dotenv/config";
import { connectDB } from "../src/infrastructure/db";
import { SolarUnit } from "../src/infrastructure/entities/SolarUnit";

async function populateNames() {
  await connectDB();
  const units = await SolarUnit.find({ $or: [{ name: { $exists: false } }, { name: null }, { name: "" }] });
  console.log(`Found ${units.length} units without a name`);
  for (const u of units) {
    const newName = `Solar Unit ${u.serialNumber}`;
    console.log(` - Setting name for ${u.serialNumber} -> ${newName}`);
    u.name = newName;
    await u.save();
  }
  console.log('Done');
  process.exit(0);
}

populateNames().catch(err => { console.error(err); process.exit(1); });
