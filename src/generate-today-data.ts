import 'dotenv/config';
import mongoose from 'mongoose';
import { SolarUnit } from './infrastructure/entities/SolarUnit';
import { EnergyGenerationRecord } from './infrastructure/entities/EnergyGenerationRecord';

async function generateTodayData() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all ACTIVE solar units
    const activeSolarUnits = await SolarUnit.find({ status: 'ACTIVE' });
    console.log(`\n📊 Found ${activeSolarUnits.length} ACTIVE solar units`);

    // Today's date (December 24, 2025)
    const today = new Date('2025-12-24');
    today.setHours(0, 0, 0, 0);

    let generatedCount = 0;

    for (const unit of activeSolarUnits) {
      console.log(`\n🔧 Processing: ${unit.name} (${unit.serialNumber})`);
      
      // Check if data already exists for today
      const startOfDay = new Date('2025-12-24T00:00:00.000Z');
      const endOfDay = new Date('2025-12-24T23:59:59.999Z');
      
      const existingRecord = await EnergyGenerationRecord.findOne({
        solarUnitId: unit._id,
        timestamp: { $gte: startOfDay, $lte: endOfDay }
      });

      if (existingRecord) {
        console.log(`  ⚠️  Data already exists for today (${existingRecord.energyGenerated} kWh)`);
        continue;
      }

      // Generate realistic energy data for a day
      const baseEnergy = unit.capacity * 4.5; // Average solar panel produces 4-5 hours equivalent
      const randomVariation = 0.85 + Math.random() * 0.3; // 85% - 115%
      const energyGenerated = baseEnergy * randomVariation;

      // Create energy record for today
      const newRecord = new EnergyGenerationRecord({
        solarUnitId: unit._id,
        energyGenerated: parseFloat(energyGenerated.toFixed(2)),
        timestamp: new Date('2025-12-24T12:00:00.000Z'), // Noon time
        intervalHours: 24 // Full day record
      });

      await newRecord.save();
      generatedCount++;
      
      console.log(`  ✅ Generated: ${newRecord.energyGenerated} kWh`);
    }

    console.log(`\n\n🎉 Success! Generated data for ${generatedCount} solar units`);
    console.log(`📅 Date: December 24, 2025`);
    console.log(`\n💡 Users can now see today's energy generation on their dashboard!`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

generateTodayData();
