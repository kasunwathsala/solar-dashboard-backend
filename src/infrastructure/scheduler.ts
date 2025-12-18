import { syncEnergyGenerationRecords } from "../application/background/sync-energy-generation-records";

export const startScheduler = () => {
    console.log("Starting scheduler...");
    
    // Run sync every 5 minutes (300000 ms)
    const syncInterval = 5 * 60 * 1000;
    
    // Run immediately on startup
    syncEnergyGenerationRecords();
    
    // Then run at intervals
    setInterval(() => {
        syncEnergyGenerationRecords();
    }, syncInterval);
    
    console.log(`Scheduler started - syncing every ${syncInterval / 1000} seconds`);
};
