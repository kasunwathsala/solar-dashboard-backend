import { NextFunction, Request, Response } from "express";
import { Anomaly } from "../infrastructure/entities/Anomaly";
import { SolarUnit } from "../infrastructure/entities/SolarUnit";
import { User } from "../infrastructure/entities/User";
import { AnomalyDetectionService } from "./anomaly-detection";

/**
 * Get anomalies for current user
 */
export const getUserAnomalies = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).auth.userId;
    const { type, severity, status, startDate, endDate } = req.query;

    // Build query
    const query: any = { userId };

    if (type) query.type = type;
    if (severity) query.severity = severity;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.detectedAt = {};
      if (startDate) query.detectedAt.$gte = new Date(startDate as string);
      if (endDate) query.detectedAt.$lte = new Date(endDate as string);
    }

    const anomalies = await Anomaly.find(query)
      .populate("solarUnit", "name serialNumber capacity")
      .sort({ detectedAt: -1 })
      .limit(100);

    res.status(200).json(anomalies);
  } catch (error: any) {
    console.error("Error fetching user anomalies:", error.message);
    next(error);
  }
};

/**
 * Get specific anomaly details
 */
export const getAnomalyById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).auth.userId;
    const { id } = req.params;

    const anomaly = await Anomaly.findOne({ _id: id, userId }).populate(
      "solarUnit",
      "name serialNumber capacity location"
    );

    if (!anomaly) {
      return res.status(404).json({ message: "Anomaly not found" });
    }

    res.status(200).json(anomaly);
  } catch (error: any) {
    console.error("Error fetching anomaly:", error.message);
    next(error);
  }
};

/**
 * Acknowledge an anomaly
 */
export const acknowledgeAnomaly = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).auth.userId;
    const { id } = req.params;

    const anomaly = await Anomaly.findOne({ _id: id, userId });

    if (!anomaly) {
      return res.status(404).json({ message: "Anomaly not found" });
    }

    if (anomaly.status !== 'OPEN') {
      return res.status(400).json({ message: "Anomaly is not in OPEN status" });
    }

    anomaly.status = 'ACKNOWLEDGED';
    await anomaly.save();

    res.status(200).json({ message: "Anomaly acknowledged", anomaly });
  } catch (error: any) {
    console.error("Error acknowledging anomaly:", error.message);
    next(error);
  }
};

/**
 * Resolve an anomaly
 */
export const resolveAnomaly = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).auth.userId;
    const { id } = req.params;
    const { resolutionNotes } = req.body;

    const anomaly = await Anomaly.findOne({ _id: id, userId });

    if (!anomaly) {
      return res.status(404).json({ message: "Anomaly not found" });
    }

    if (anomaly.status === 'RESOLVED') {
      return res.status(400).json({ message: "Anomaly already resolved" });
    }

    anomaly.status = 'RESOLVED';
    anomaly.resolvedAt = new Date();
    anomaly.resolvedBy = userId;
    anomaly.resolutionNotes = resolutionNotes || '';
    await anomaly.save();

    res.status(200).json({ message: "Anomaly resolved", anomaly });
  } catch (error: any) {
    console.error("Error resolving anomaly:", error.message);
    next(error);
  }
};

/**
 * Mark anomaly as false positive
 */
export const markAsFalsePositive = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).auth.userId;
    const { id } = req.params;
    const { notes } = req.body;

    const anomaly = await Anomaly.findOne({ _id: id, userId });

    if (!anomaly) {
      return res.status(404).json({ message: "Anomaly not found" });
    }

    anomaly.status = 'FALSE_POSITIVE';
    anomaly.resolvedAt = new Date();
    anomaly.resolvedBy = userId;
    anomaly.resolutionNotes = notes || 'Marked as false positive';
    await anomaly.save();

    res.status(200).json({ message: "Anomaly marked as false positive", anomaly });
  } catch (error: any) {
    console.error("Error marking anomaly as false positive:", error.message);
    next(error);
  }
};

/**
 * Get anomaly statistics for user
 */
export const getAnomalyStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).auth.userId;

    const [
      totalCount,
      openCount,
      criticalCount,
      warningCount,
      typeDistribution,
    ] = await Promise.all([
      Anomaly.countDocuments({ userId }),
      Anomaly.countDocuments({ userId, status: 'OPEN' }),
      Anomaly.countDocuments({ userId, severity: 'CRITICAL', status: { $in: ['OPEN', 'ACKNOWLEDGED'] } }),
      Anomaly.countDocuments({ userId, severity: 'WARNING', status: { $in: ['OPEN', 'ACKNOWLEDGED'] } }),
      Anomaly.aggregate([
        { $match: { userId } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
    ]);

    res.status(200).json({
      total: totalCount,
      open: openCount,
      critical: criticalCount,
      warning: warningCount,
      byType: typeDistribution.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    });
  } catch (error: any) {
    console.error("Error fetching anomaly stats:", error.message);
    next(error);
  }
};

/**
 * Trigger manual anomaly detection for user's units
 */
export const triggerAnomalyDetection = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("🔍 Manual anomaly detection triggered");
    const clerkUserId = (req as any).auth.userId;
    console.log("   Clerk User ID:", clerkUserId);

    // First find the user document
    const user = await User.findOne({ clerkUserId });
    if (!user) {
      console.log("   User not found in database");
      return res.status(404).json({ message: "User not found" });
    }
    console.log("   User document ID:", user._id);

    // Get user's solar units using the MongoDB user._id
    const units = await SolarUnit.find({ userid: user._id, status: "ACTIVE" });
    console.log(`   Found ${units.length} active units for user`);

    if (units.length === 0) {
      console.log("   No active units found");
      return res.status(404).json({ message: "No active solar units found" });
    }

    // Run detection for each unit
    for (const unit of units) {
      console.log(`   Running detection for unit: ${unit._id}`);
      await AnomalyDetectionService.detectAnomaliesForUnit(unit._id.toString());
    }

    console.log("✅ Manual detection completed successfully");
    res.status(200).json({
      message: `Anomaly detection completed for ${units.length} unit(s)`,
    });
  } catch (error: any) {
    console.error("❌ Error triggering anomaly detection:", error);
    console.error("   Stack trace:", error.stack);
    next(error);
  }
};

// ============ ADMIN ENDPOINTS ============

/**
 * Get all anomalies (admin only)
 */
export const getAllAnomalies = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type, severity, status, startDate, endDate, limit = 100 } = req.query;

    // Build query
    const query: any = {};

    if (type) query.type = type;
    if (severity) query.severity = severity;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.detectedAt = {};
      if (startDate) query.detectedAt.$gte = new Date(startDate as string);
      if (endDate) query.detectedAt.$lte = new Date(endDate as string);
    }

    const anomalies = await Anomaly.find(query)
      .populate("solarUnit", "name serialNumber capacity location")
      .sort({ detectedAt: -1 })
      .limit(parseInt(limit as string));

    res.status(200).json(anomalies);
  } catch (error: any) {
    console.error("Error fetching all anomalies:", error.message);
    next(error);
  }
};

/**
 * Get system-wide anomaly summary (admin only)
 */
export const getAnomalySummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const [
      totalCount,
      openCount,
      criticalCount,
      severityDistribution,
      typeDistribution,
      recentAnomalies,
    ] = await Promise.all([
      Anomaly.countDocuments(),
      Anomaly.countDocuments({ status: 'OPEN' }),
      Anomaly.countDocuments({ 
        severity: 'CRITICAL', 
        status: { $in: ['OPEN', 'ACKNOWLEDGED'] } 
      }),
      Anomaly.aggregate([
        { $group: { _id: "$severity", count: { $sum: 1 } } },
      ]),
      Anomaly.aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
      Anomaly.find({ status: 'OPEN' })
        .populate("solarUnit", "name serialNumber")
        .sort({ detectedAt: -1 })
        .limit(10),
    ]);

    res.status(200).json({
      total: totalCount,
      open: openCount,
      critical: criticalCount,
      bySeverity: severityDistribution.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byType: typeDistribution.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recent: recentAnomalies,
    });
  } catch (error: any) {
    console.error("Error fetching anomaly summary:", error.message);
    next(error);
  }
};

/**
 * Trigger system-wide anomaly detection (admin only)
 */
export const triggerSystemWideDetection = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Run detection for all units
    await AnomalyDetectionService.detectAnomaliesForAllUnits();

    res.status(200).json({
      message: "System-wide anomaly detection completed",
    });
  } catch (error: any) {
    console.error("Error triggering system-wide detection:", error.message);
    next(error);
  }
};
