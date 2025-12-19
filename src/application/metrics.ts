import { EnergyGenerationRecord } from "../infrastructure/entities/EnergyGenerationRecord";
import { SolarUnit } from "../infrastructure/entities/SolarUnit";
import mongoose from "mongoose";
import { NextFunction, Request, Response } from "express";

/**
 * Calculate Capacity Factor for a solar unit
 * Capacity Factor = (Actual Energy Generated / Theoretical Maximum) × 100%
 * 
 * Theoretical Maximum = Capacity (kW) × 24 hours × Days
 * This shows how efficiently the solar unit performs compared to its rated capacity
 */
export const getCapacityFactorBySolarUnitId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { days = "7" } = req.query;

    // Get solar unit to retrieve capacity
    const solarUnit = await SolarUnit.findById(id);
    if (!solarUnit) {
      return res.status(404).json({ message: "Solar unit not found" });
    }

    const daysCount = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysCount);

    // Aggregate daily energy generation
    const pipeline: any[] = [
      {
        $match: {
          solarUnitId: new mongoose.Types.ObjectId(id),
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          actualEnergy: { $sum: "$energyGenerated" },
        },
      },
      {
        $sort: { "_id": 1 },
      },
    ];

    const dailyRecords = await EnergyGenerationRecord.aggregate(pipeline);

    // Calculate capacity factor for each day
    const capacityFactorData = dailyRecords.map((record) => {
      // Theoretical maximum = capacity (kW) × 24 hours
      const theoreticalMax = solarUnit.capacity * 24;
      
      // Capacity Factor = (Actual / Theoretical) × 100
      const capacityFactor = (record.actualEnergy / theoreticalMax) * 100;

      return {
        date: record._id,
        actualEnergy: parseFloat(record.actualEnergy.toFixed(2)),
        theoreticalMax: parseFloat(theoreticalMax.toFixed(2)),
        capacityFactor: parseFloat(capacityFactor.toFixed(2)),
      };
    });

    // Calculate average capacity factor
    const avgCapacityFactor = capacityFactorData.length > 0
      ? capacityFactorData.reduce((sum, d) => sum + d.capacityFactor, 0) / capacityFactorData.length
      : 0;

    res.status(200).json({
      solarUnitId: id,
      capacity: solarUnit.capacity,
      period: {
        days: daysCount,
        from: startDate.toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
      },
      averageCapacityFactor: parseFloat(avgCapacityFactor.toFixed(2)),
      dailyData: capacityFactorData,
    });
  } catch (error) {
    console.error("Capacity factor calculation error:", error);
    next(error);
  }
};

/**
 * Analyze peak hour generation patterns
 * Groups energy generation by hour of day to identify peak production times
 */
export const getPeakHourAnalysisBySolarUnitId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { days = "30" } = req.query;

    const daysCount = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysCount);

    // Aggregate by hour of day
    const pipeline: any[] = [
      {
        $match: {
          solarUnitId: new mongoose.Types.ObjectId(id),
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $hour: "$timestamp" },
          totalEnergy: { $sum: "$energyGenerated" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id": 1 },
      },
    ];

    const hourlyData = await EnergyGenerationRecord.aggregate(pipeline);

    // Format data with hour labels
    const formattedData = hourlyData.map((record) => ({
      hour: record._id,
      hourLabel: `${record._id.toString().padStart(2, '0')}:00`,
      totalEnergy: parseFloat(record.totalEnergy.toFixed(2)),
      averageEnergy: parseFloat((record.totalEnergy / record.count).toFixed(2)),
      recordCount: record.count,
    }));

    // Calculate peak hours (top 3)
    const sortedByEnergy = [...formattedData].sort((a, b) => b.totalEnergy - a.totalEnergy);
    const peakHours = sortedByEnergy.slice(0, 3);

    // Classify by time of day
    const totalEnergy = formattedData.reduce((sum, d) => sum + d.totalEnergy, 0);
    
    const timeCategories = {
      morning: { hours: [6, 7, 8, 9, 10, 11], energy: 0 }, // 6 AM - 11 AM
      midday: { hours: [12, 13, 14, 15], energy: 0 },      // 12 PM - 3 PM
      afternoon: { hours: [16, 17, 18, 19], energy: 0 },   // 4 PM - 7 PM
      other: { hours: [], energy: 0 },                     // Night/Early morning
    };

    formattedData.forEach((record) => {
      if (timeCategories.morning.hours.includes(record.hour)) {
        timeCategories.morning.energy += record.totalEnergy;
      } else if (timeCategories.midday.hours.includes(record.hour)) {
        timeCategories.midday.energy += record.totalEnergy;
      } else if (timeCategories.afternoon.hours.includes(record.hour)) {
        timeCategories.afternoon.energy += record.totalEnergy;
      } else {
        timeCategories.other.energy += record.totalEnergy;
      }
    });

    const distribution = [
      {
        name: "Morning (6AM-11AM)",
        value: parseFloat(timeCategories.morning.energy.toFixed(2)),
        percentage: parseFloat(((timeCategories.morning.energy / totalEnergy) * 100).toFixed(1)),
      },
      {
        name: "Midday (12PM-3PM)",
        value: parseFloat(timeCategories.midday.energy.toFixed(2)),
        percentage: parseFloat(((timeCategories.midday.energy / totalEnergy) * 100).toFixed(1)),
      },
      {
        name: "Afternoon (4PM-7PM)",
        value: parseFloat(timeCategories.afternoon.energy.toFixed(2)),
        percentage: parseFloat(((timeCategories.afternoon.energy / totalEnergy) * 100).toFixed(1)),
      },
      {
        name: "Other Hours",
        value: parseFloat(timeCategories.other.energy.toFixed(2)),
        percentage: parseFloat(((timeCategories.other.energy / totalEnergy) * 100).toFixed(1)),
      },
    ];

    res.status(200).json({
      solarUnitId: id,
      period: {
        days: daysCount,
        from: startDate.toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
      },
      peakHours,
      hourlyData: formattedData,
      distribution,
      totalEnergy: parseFloat(totalEnergy.toFixed(2)),
    });
  } catch (error) {
    console.error("Peak hour analysis error:", error);
    next(error);
  }
};
