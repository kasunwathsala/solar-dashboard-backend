import { z } from "zod";
import { EnergyGenerationRecord } from "../../infrastructure/entities/EnergyGenerationRecord";
import { SolarUnit } from "../../infrastructure/entities/SolarUnit";

export const DataAPIEnergyGenerationRecordDto = z.object({
    _id: z.string(),
    serialNumber: z.string(),
    energyGenerated: z.number(),
    timestamp: z.string(),
    intervalHours: z.number(),
    __v: z.number(),
});

export const syncEnergyGenerationRecords = async () => {
    try {
        console.log("Starting background sync of energy generation records...");
        
        // Get all solar units
        const solarUnits = await SolarUnit.find();
        
        for (const solarUnit of solarUnits) {
            try {
                // Call the data API to fetch the latest records
                const dataAPIResponse = await fetch(`http://localhost:8000/api/energy-generation-records/solar-unit/${solarUnit.serialNumber}`);
                
                if (!dataAPIResponse.ok) {
                    console.error(`Failed to fetch records for solar unit ${solarUnit.serialNumber}`);
                    continue;
                }
                
                const latestEnergyGenerationRecords = DataAPIEnergyGenerationRecordDto.array().parse(await dataAPIResponse.json());
                
                // Get existing records for this solar unit
                const existingEnergyGenerationRecords = await EnergyGenerationRecord.find({ 
                    serialNumber: solarUnit.serialNumber 
                }).sort({ timestamp: 1 });
                
                // Find missing records
                const missingEnergyGenerationRecords = latestEnergyGenerationRecords.filter(
                    (record: any) => !existingEnergyGenerationRecords.some(
                        (existingRecord: any) => existingRecord.timestamp === record.timestamp
                    )
                );
                
                if (missingEnergyGenerationRecords.length > 0) {
                    await EnergyGenerationRecord.insertMany(missingEnergyGenerationRecords);
                    console.log(`Synced ${missingEnergyGenerationRecords.length} records for solar unit ${solarUnit.serialNumber}`);
                }
            } catch (error) {
                console.error(`Error syncing solar unit ${solarUnit.serialNumber}:`, error);
            }
        }
        
        console.log("Background sync completed");
    } catch (error) {
        console.error("Error in background sync:", error);
    }
};
