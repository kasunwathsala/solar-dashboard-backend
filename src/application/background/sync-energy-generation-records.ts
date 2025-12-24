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
        
        const DATA_API_BASE_URL = process.env.DATA_API_BASE_URL ?? "http://localhost:8000";

        // Check if data API is available before attempting sync
        try {
            const healthCheck = await fetch(`${DATA_API_BASE_URL}/api/energy-generation-records`, { 
                method: 'HEAD',
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });
            if (!healthCheck.ok && healthCheck.status !== 404) {
                console.warn(`⚠️  Data API at ${DATA_API_BASE_URL} returned ${healthCheck.status}. Skipping sync.`);
                return;
            }
        } catch (error: any) {
            console.warn(`⚠️  Data API at ${DATA_API_BASE_URL} is not reachable. Skipping sync.`);
            console.warn(`   To start the data API, run: cd data_backend/solar-dashboard-data-api && npm run dev`);
            return;
        }

        console.log(`✓ Data API is available at ${DATA_API_BASE_URL}`);
        
        // Get all solar units
        const solarUnits = await SolarUnit.find();

        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

        async function fetchWithRetries(url: string, options: any = {}, retries = 3, backoff = 500) {
            for (let attempt = 0; attempt <= retries; attempt++) {
                try {
                    return await fetch(url, options);
                } catch (err: any) {
                    const isLast = attempt === retries;
                    console.error(`Fetch attempt ${attempt + 1}/${retries + 1} failed for ${url}:`, err?.message ?? err);
                    if (isLast) throw err;
                    await sleep(backoff * Math.pow(2, attempt));
                }
            }
            // Should never get here
            throw new Error("Unreachable: fetchWithRetries exhausted");
        }

        for (const solarUnit of solarUnits) {
            try {
                // Call the data API to fetch the latest records
                const url = `${DATA_API_BASE_URL}/api/energy-generation-records/solar-unit/${solarUnit.serialNumber}`;
                const dataAPIResponse = await fetchWithRetries(url);
                
                if (!dataAPIResponse.ok) {
                    console.error(`Failed to fetch records for solar unit ${solarUnit.serialNumber}: ${dataAPIResponse.status} ${dataAPIResponse.statusText}`);
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
            } catch (error: any) {
                // If the underlying error contains multiple errors (AggregateError from Node/undici), surface them
                if (error?.cause?.errors && Array.isArray(error.cause.errors)) {
                    console.error(`Error syncing solar unit ${solarUnit.serialNumber}: ${error?.message ?? error}`);
                    for (const inner of error.cause.errors) {
                        try {
                            console.error(`  - Cause: ${inner?.message ?? inner}`);
                        } catch (e) {
                            console.error(`  - Cause (unknown):`, inner);
                        }
                    }
                } else {
                    console.error(`Error syncing solar unit ${solarUnit.serialNumber}:`, error);
                }
            }
        }
        
        console.log("Background sync completed");
    } catch (error) {
        console.error("Error in background sync:", error);
    }
};
