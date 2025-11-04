import { EnergyGenerationRecord } from "../infrastructure/entities/EnergyGenerationRecord";
import { Request, Response } from "express";

export const getAllEnergyGenerationRecordsBySolarUnitId = async (req: Request, res: Response) => {
  try {
    const energyGenerationRecords = await EnergyGenerationRecord.find({
      solarUnitId: req.params.id,
    }).sort({ timestamp: -1 }); // Sort by timestamp descending
    res.status(200).json(energyGenerationRecords);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};