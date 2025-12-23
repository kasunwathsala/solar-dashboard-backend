import express from 'express';
import { syncEnergyGenerationRecords } from '../application/background/sync-energy-generation-records';

const adminRouter = express.Router();

// Simple admin endpoint to trigger immediate sync of energy generation records
// Useful for testing/dev to run the sync without waiting for the interval
adminRouter.post('/sync-energy-generation-records', async (req, res) => {
  try {
    await syncEnergyGenerationRecords();
    return res.status(200).json({ message: 'Sync started' });
  } catch (error: any) {
    console.error('Admin sync failed:', error);
    return res.status(500).json({ message: 'Sync failed', error: error?.message || String(error) });
  }
});

export default adminRouter;
