import 'dotenv/config';
import mongoose from 'mongoose';
import { SolarUnit } from './infrastructure/entities/SolarUnit';

async function activateKasunUnit() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find kasun's solar unit (using userid - lowercase!)
    console.log('🔍 Searching for solar units with userid: 6943e5d7940b57016aa6850c');
    const kasunUnit = await SolarUnit.findOne({ userid: '6943e5d7940b57016aa6850c' });
    
    if (!kasunUnit) {
      console.log('❌ Solar unit not found! Trying to find all units...');
      const allUnits = await SolarUnit.find({});
      console.log(`Found ${allUnits.length} total units`);
      allUnits.forEach(unit => {
        console.log(`- ${unit.serialNumber}: userid=${unit.userid}, status=${unit.status}, name=${unit.name}`);
      });
      return;
    }

    console.log('\n📊 Before Update:');
    console.log(`Serial Number: ${kasunUnit.serialNumber}`);
    console.log(`Name: ${kasunUnit.name}`);
    console.log(`Status: ${kasunUnit.status}`);
    console.log(`Owner: ${kasunUnit.userid}`);

    // Activate the unit
    kasunUnit.status = 'ACTIVE';
    await kasunUnit.save();

    console.log('\n✅ Updated Status: ACTIVE');
    console.log('\n🎉 Kasun ගේ solar unit එක successfully activate කරන ලදි!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

activateKasunUnit();
