import { getAllEnergyGenerationRecordsBySolarUnitIdQueryDto } from "../domain/dtos/solar-unit";
import { ValidationError } from "../domain/error/errors";
import { EnergyGenerationRecord } from "../infrastructure/entities/EnergyGenerationRecord";
import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";

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
      const aggregationResult = await EnergyGenerationRecord.aggregate([
        { $match: { solarUnitId: new Types.ObjectId(id) } },
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

      // Transform to more frontend-friendly format
      const energyGenerationRecords = aggregationResult.map(record => ({
        date: record._id.date,
        totalEnergy: record.totalEnergy
      }));

      if (limit) {
        return res.status(200).json(energyGenerationRecords.slice(0, parseInt(limit)));
      }
      
      return res.status(200).json(energyGenerationRecords);
    }

    // Handle other groupBy options if needed
    return res.status(400).json({ message: "Invalid groupBy value" });
  } catch (error) {
    next(error);
  }
};