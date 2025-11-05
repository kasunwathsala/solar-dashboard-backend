import { EnergyGenerationRecord } from "../infrastructure/entities/EnergyGenerationRecord";
import { Request, Response } from "express";

export const getAllEnergyGenerationRecordsBySolarUnitId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const groupBy = req.query.groupBy as string | undefined;

    if (!groupBy) {
      const energyGenerationRecords = await EnergyGenerationRecord.find({
        solarUnitId: id,
      }).sort({ timestamp: -1 }); // Sort by timestamp descending
      return res.status(200).json(energyGenerationRecords);
    }

    if (groupBy === "date") {
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
      return res.status(200).json(energyGenerationRecords);
    }

    return res.status(400).json({ message: "Invalid groupBy value" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};