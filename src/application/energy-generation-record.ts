import { getAllEnergyGenerationRecordsBySolarUnitIdQueryDto } from "../domain/dtos/solar-unit";
import { ValidationError } from "../domain/error/errors";
import { EnergyGenerationRecord } from "../infrastructure/entities/EnergyGenerationRecord";
import { NextFunction, Request, Response } from "express";

export const getAllEnergyGenerationRecordsBySolarUnitId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const results = getAllEnergyGenerationRecordsBySolarUnitIdQueryDto.safeParse(req.query);
    if (!results.success) {
      throw new ValidationError(results.error.message);
    }

    const { groupBy, limit } = results.data;

    if (!groupBy) {
      const energyGenerationRecords = await EnergyGenerationRecord.find({
        solarUnitId: id,
      }).sort({ timestamp: -1 });
      return res.status(200).json(energyGenerationRecords);
    }

    if (groupBy === "daily") {
      if (!limit) {
        const energyGenerationRecords = await EnergyGenerationRecord.aggregate([
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

      const energyGenerationRecords = await EnergyGenerationRecord.aggregate([
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

      return res.status(200).json(energyGenerationRecords.slice(0, parseInt(limit!)));
    }

    // Handle other groupBy options or invalid values
    return res.status(400).json({ message: "Invalid or unsupported groupBy value" });
  } catch (error) {
    next(error);
  }
};