import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './infrastructure/entities/User';
import { SolarUnit } from './infrastructure/entities/SolarUnit';
import { EnergyGenerationRecord } from './infrastructure/entities/EnergyGenerationRecord';

async function verifyDashboardData() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Check specific users
    const kasunEmail = 'kasun.wathsala2001@gmail.com';
    const wathsalaEmail = 'wathsala.nilaweera2001@gmail.com';

    const users = await User.find({ 
      email: { $in: [kasunEmail, wathsalaEmail] } 
    });

    for (const user of users) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`👤 User: ${user.email}`);
      console.log(`   ID: ${user._id}`);
      console.log(`${'='.repeat(60)}`);

      // Find user's solar units
      const solarUnits = await SolarUnit.find({ userid: user._id });
      console.log(`\n📊 Solar Units: ${solarUnits.length}`);

      for (const unit of solarUnits) {
        console.log(`\n   🔆 ${unit.name} (${unit.serialNumber})`);
        console.log(`      Status: ${unit.status}`);
        console.log(`      Capacity: ${unit.capacity} kW`);

        // Get today's record
        const startOfDay = new Date('2025-12-24T00:00:00.000Z');
        const endOfDay = new Date('2025-12-24T23:59:59.999Z');

        const todayRecord = await EnergyGenerationRecord.findOne({
          solarUnitId: unit._id,
          timestamp: { $gte: startOfDay, $lte: endOfDay }
        });

        if (todayRecord) {
          console.log(`      ✅ December 24, 2025: ${todayRecord.energyGenerated} kWh`);
          console.log(`         Timestamp: ${todayRecord.timestamp.toISOString()}`);
        } else {
          console.log(`      ❌ No data for December 24, 2025`);
        }

        // Get last 7 days
        const sevenDaysAgo = new Date('2025-12-17T00:00:00.000Z');
        const recentRecords = await EnergyGenerationRecord.find({
          solarUnitId: unit._id,
          timestamp: { $gte: sevenDaysAgo }
        }).sort({ timestamp: -1 });

        console.log(`\n      📅 Recent Records (last 7 days):`);
        if (recentRecords.length > 0) {
          recentRecords.forEach(record => {
            const dateStr = record.timestamp.toISOString().split('T')[0];
            console.log(`         ${dateStr}: ${record.energyGenerated} kWh`);
          });
        } else {
          console.log(`         No recent records found`);
        }
      }
    }

    console.log(`\n\n${'='.repeat(60)}`);
    console.log(`✅ Verification Complete!`);
    console.log(`💡 Dashboard should now display today's energy generation`);
    console.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
  }
}

verifyDashboardData();
