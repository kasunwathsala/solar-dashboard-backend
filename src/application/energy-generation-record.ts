import { getAllEnergyGenerationRecordsBySolarUnitIdQueryDto } from "../domain/dtos/solar-unit";
import { ValidationError } from "../domain/error/errors";
import { EnergyGenerationRecord } from "../infrastructure/entities/EnergyGenerationRecord";
import { Request, Response } from "express";

export const getAllEnergyGenerationRecordsBySolarUnitId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const results = getAllEnergyGenerationRecordsBySolarUnitIdQueryDto.safeParse(req.query);
    if (!results.success) {
      return res.status(400).json({ message: "Validation error", errors: results.error?.issues ?? [] });
    }
    const {groupBy,limit} = results.data;

    if (!groupBy) {
      const energyGenerationRecords = await EnergyGenerationRecord.find({
        solarUnitId: id,
      }).sort({ timestamp: -1 }); // Sort by timestamp descending
      return res.status(200).json(energyGenerationRecords);
    }

    if (groupBy === "daily") {
      const energyGenerationRecords = await EnergyGenerationRecord.aggregate([
        { $match: { solarUnitId: id } },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
              },
            },
            totalEnergy: { $sum: "$energyGenerated" },
          },
        },
        {
          $sort: { "_id.date": -1 },
        },
      ]);
      if(!limit){
          return res.status(200).json(energyGenerationRecords);
      } else {
       return res.status(200).json(energyGenerationRecords.slice(0, limit ? parseInt(limit) : energyGenerationRecords.length));
      }
    }

    return res.status(400).json({ message: "Invalid groupBy value" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};