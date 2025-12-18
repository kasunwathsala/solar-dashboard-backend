import { NextFunction, Request, Response } from "express";
import { getAuth} from "@clerk/express";
import { NotFoundError } from "../../../domain/error/errors";
import { User } from "../../../infrastructure/entities/User";
import { SolarUnit } from "../../../infrastructure/entities/SolarUnit";
import { EnergyGenerationRecord } from "../../../infrastructure/entities/EnergyGenerationRecord";

import { z } from "zod";

export const DataAPIEnergyGenerationRecordDto = z.object({
    _id: z.string(),
    serialNumber: z.string(),
    energyGenerated: z.number(),
    timestamp: z.string(),
    intervalHours: z.number(),
    __v: z.number(),
});

export const syncMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
    const auth = getAuth(req);
    const user = await User.findOne({ clerkUserId: auth.userId });
    if (!user) {
        throw new NotFoundError("User not found");
    }
    const solarUnit = await SolarUnit.findOne({ userId: user._id });
    if (!solarUnit) {
        throw new NotFoundError("Solar unit not found");
    }

    // Call the solar unit data service to fetch the missing data.
    const dataAPIResponse = await fetch(`http://localhost:8000/api/energy-generation-records/solar-unit/${solarUnit.serialNumber}`);
    if (!dataAPIResponse.ok) {
        throw new Error("Failed to fetch energy generation records");
    }
    const latestEnergyGenerationRecords = DataAPIEnergyGenerationRecordDto.array().parse(await dataAPIResponse.json())
    console.log(latestEnergyGenerationRecords);

    const existingEnergyGenerationRecords = await EnergyGenerationRecord.find({ serialNumber: solarUnit.serialNumber }).sort({ timestamp: 1 });
    console.log(existingEnergyGenerationRecords);

    const missingEnergyGenerationRecords = latestEnergyGenerationRecords.filter((record: any) => !existingEnergyGenerationRecords.some((existingRecord: any) => existingRecord.timestamp === record.timestamp));
    console.log(missingEnergyGenerationRecords);

    await EnergyGenerationRecord.insertMany(missingEnergyGenerationRecords);

    next();
};
