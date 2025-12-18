import { getAllEnergyGenerationRecordsBySolarUnitIdQueryDto } from "../domain/dtos/solar-unit";
import { ValidationError } from "../domain/error/errors";
import { EnergyGenerationRecord } from "../infrastructure/entities/EnergyGenerationRecord";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

export const getAllEnergyGenerationRecordsBySolarUnitId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    console.log("📊 Energy Records Request:", { id, query: req.query });
    const results = getAllEnergyGenerationRecordsBySolarUnitIdQueryDto.safeParse(req.query);
    if (!results.success) {
      console.error("❌ Validation error:", results.error);
      throw new ValidationError(results.error.message);
    }

    const { groupBy, limit } = results.data;
    console.log("✅ Parsed params:", { groupBy, limit });

    if (!groupBy) {
      const energyGenerationRecords = await EnergyGenerationRecord.find({
        solarUnitId: id,
      }).sort({ timestamp: -1 });
      return res.status(200).json(energyGenerationRecords);
    }

    if (groupBy === "daily") {
      const pipeline: any[] = [
        { $match: { solarUnitId: new mongoose.Types.ObjectId(id) } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
            },
            totalEnergy: { $sum: "$energyGenerated" },
          },
        },
        {
          $sort: { "_id": -1 },
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            totalEnergy: 1,
          },
        },
      ];

      if (limit) {
        pipeline.push({ $limit: parseInt(limit) });
      }

      const energyGenerationRecords = await EnergyGenerationRecord.aggregate(pipeline);

      return res.status(200).json(energyGenerationRecords);
    }

    // Handle other groupBy options or invalid values
    return res.status(400).json({ message: "Invalid or unsupported groupBy value" });
  } catch (error) {
    next(error);
  }
};