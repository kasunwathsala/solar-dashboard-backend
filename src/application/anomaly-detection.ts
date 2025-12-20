import { Anomaly } from "../infrastructure/entities/Anomaly";
import { SolarUnit } from "../infrastructure/entities/SolarUnit";
import { EnergyGenerationRecord } from "../infrastructure/entities/EnergyGenerationRecord";
import { User } from "../infrastructure/entities/User";

interface AnomalyDetectionResult {
  type: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  description: string;
  details: any;
  affectedPeriod: {
    start: Date;
    end: Date;
  };
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * Anomaly Detection Service
 * Analyzes energy generation data to identify anomalies
 */
export class AnomalyDetectionService {
  
  /**
   * Run anomaly detection for all solar units
   */
  static async detectAnomaliesForAllUnits(): Promise<void> {
    console.log("🔍 Starting anomaly detection for all units...");
    
    try {
      const solarUnits = await SolarUnit.find({ status: "ACTIVE" }).populate('userid');
      console.log(`   Found ${solarUnits.length} active solar units`);

      for (const unit of solarUnits) {
        try {
          await this.detectAnomaliesForUnit(unit._id.toString());
        } catch (error: any) {
          console.error(`   Error detecting anomalies for unit ${unit._id}:`, error.message);
        }
      }

      console.log("✅ Anomaly detection completed");
    } catch (error: any) {
      console.error("❌ Anomaly detection failed:", error.message);
      throw error;
    }
  }

  /**
   * Run anomaly detection for a specific solar unit
   */
  static async detectAnomaliesForUnit(solarUnitId: string): Promise<void> {
    const unit = await SolarUnit.findById(solarUnitId).populate('userid');
    if (!unit || !unit.userid) {
      throw new Error("Solar unit or user not found");
    }

    const user = unit.userid as any;
    const userId = user.clerkUserId;

    // Get last 7 days of data for analysis
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const records = await EnergyGenerationRecord.find({
      solarUnitId: solarUnitId,
      timestamp: { $gte: startDate, $lte: endDate },
    }).sort({ timestamp: 1 });

    if (records.length === 0) {
      console.log(`   No data for unit ${solarUnitId}, skipping...`);
      return;
    }

    // Run all detection algorithms
    const detections: AnomalyDetectionResult[] = [];

    detections.push(...await this.detectZeroGeneration(records, unit));
    detections.push(...await this.detectSuddenDrop(records, unit));
    detections.push(...await this.detectCapacityFactorAnomaly(records, unit));
    detections.push(...await this.detectIrregularPattern(records, unit));
    detections.push(...await this.detectMissingData(records, unit));

    // Save detected anomalies
    for (const detection of detections) {
      // Check if similar anomaly already exists (within last 24 hours)
      const existingAnomaly = await Anomaly.findOne({
        solarUnit: unit._id,
        type: detection.type,
        status: { $in: ['OPEN', 'ACKNOWLEDGED'] },
        'affectedPeriod.start': {
          $gte: new Date(detection.affectedPeriod.start.getTime() - 24 * 60 * 60 * 1000),
        },
      });

      if (!existingAnomaly) {
        await Anomaly.create({
          solarUnit: unit._id,
          userId: userId,
          type: detection.type,
          severity: detection.severity,
          description: detection.description,
          details: detection.details,
          affectedPeriod: detection.affectedPeriod,
          confidence: detection.confidence,
          detectedAt: new Date(),
          status: 'OPEN',
        });
        console.log(`   ⚠️  New ${detection.severity} anomaly detected: ${detection.type}`);
      }
    }
  }

  /**
   * Detect Zero Generation During Peak Hours
   */
  private static async detectZeroGeneration(
    records: any[],
    unit: any
  ): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = [];

    // Group by date
    const recordsByDate = this.groupByDate(records);

    for (const [date, dayRecords] of Object.entries(recordsByDate)) {
      // Filter peak hours (10 AM - 3 PM)
      const peakRecords = (dayRecords as any[]).filter((r) => {
        const hour = r.timestamp.getHours();
        return hour >= 10 && hour <= 15;
      });

      // Check if all peak hour readings are zero
      const allZero = peakRecords.every((r) => r.energyGenerated === 0);
      
      if (allZero && peakRecords.length >= 2) {
        const duration = peakRecords.length * 15; // Assuming 15-minute intervals
        const severity = duration >= 240 ? 'CRITICAL' : 'WARNING'; // 4+ hours = critical

        anomalies.push({
          type: 'ZERO_GENERATION',
          severity,
          description: `No energy generation detected during peak hours (${duration} minutes of zero output)`,
          details: {
            expectedValue: unit.capacity * 0.7, // Expected ~70% of capacity during peak
            actualValue: 0,
            threshold: 0,
            additionalContext: {
              peakHoursAffected: peakRecords.length,
              durationMinutes: duration,
            },
          },
          affectedPeriod: {
            start: peakRecords[0].timestamp,
            end: peakRecords[peakRecords.length - 1].timestamp,
          },
          confidence: 'HIGH',
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect Sudden Drop in Output
   */
  private static async detectSuddenDrop(
    records: any[],
    unit: any
  ): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = [];

    if (records.length < 50) return anomalies; // Need enough historical data

    // Calculate baseline (average of first 70% of data)
    const baselineSize = Math.floor(records.length * 0.7);
    const baselineRecords = records.slice(0, baselineSize);
    
    // Calculate average for each hour of the day
    const hourlyAverages = this.calculateHourlyAverages(baselineRecords);

    // Check recent records (last 30%)
    const recentRecords = records.slice(baselineSize);
    
    for (const record of recentRecords) {
      const hour = record.timestamp.getHours();
      const expectedValue = hourlyAverages[hour] || 0;

      // Skip nighttime hours
      if (hour < 6 || hour > 20) continue;
      if (expectedValue < 0.1) continue; // Skip if baseline is near zero

      const actualValue = record.energyGenerated;
      const dropPercent = ((expectedValue - actualValue) / expectedValue) * 100;

      // Detect if drop is >50%
      if (dropPercent > 50) {
        const severity = dropPercent > 70 ? 'CRITICAL' : 'WARNING';

        anomalies.push({
          type: 'SUDDEN_DROP',
          severity,
          description: `Energy generation dropped by ${dropPercent.toFixed(1)}% compared to expected output`,
          details: {
            expectedValue: parseFloat(expectedValue.toFixed(2)),
            actualValue: parseFloat(actualValue.toFixed(2)),
            dropPercent: parseFloat(dropPercent.toFixed(1)),
            threshold: 50,
          },
          affectedPeriod: {
            start: record.timestamp,
            end: record.timestamp,
          },
          confidence: 'MEDIUM',
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect Capacity Factor Anomaly
   */
  private static async detectCapacityFactorAnomaly(
    records: any[],
    unit: any
  ): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = [];

    // Group by date and calculate daily capacity factor
    const recordsByDate = this.groupByDate(records);

    const abnormalDays: { date: string; capacityFactor: number }[] = [];

    for (const [date, dayRecords] of Object.entries(recordsByDate)) {
      const totalEnergy = (dayRecords as any[]).reduce((sum, r) => sum + r.energyGenerated, 0);
      const maxPossibleEnergy = (unit.capacity / 1000) * 24; // kW * 24 hours
      const capacityFactor = (totalEnergy / maxPossibleEnergy) * 100;

      // Flag if outside 10-30% range
      if (capacityFactor < 10 || capacityFactor > 30) {
        abnormalDays.push({ date, capacityFactor });
      }
    }

    // If 3+ consecutive abnormal days, create anomaly
    if (abnormalDays.length >= 3) {
      const avgCapacityFactor =
        abnormalDays.reduce((sum, d) => sum + d.capacityFactor, 0) / abnormalDays.length;
      
      const severity = avgCapacityFactor < 5 || avgCapacityFactor > 35 ? 'CRITICAL' : 'WARNING';

      anomalies.push({
        type: 'CAPACITY_FACTOR',
        severity,
        description: `Abnormal capacity factor: ${avgCapacityFactor.toFixed(1)}% (normal range: 15-25%)`,
        details: {
          capacityFactor: parseFloat(avgCapacityFactor.toFixed(2)),
          threshold: avgCapacityFactor < 15 ? 10 : 30,
          expectedValue: 20, // Typical capacity factor
          actualValue: parseFloat(avgCapacityFactor.toFixed(2)),
          additionalContext: {
            abnormalDaysCount: abnormalDays.length,
          },
        },
        affectedPeriod: {
          start: new Date(abnormalDays[0].date),
          end: new Date(abnormalDays[abnormalDays.length - 1].date),
        },
        confidence: 'HIGH',
      });
    }

    return anomalies;
  }

  /**
   * Detect Irregular Generation Pattern
   */
  private static async detectIrregularPattern(
    records: any[],
    unit: any
  ): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = [];

    // Check for nighttime generation (11 PM - 5 AM)
    const nighttimeGeneration = records.filter((r) => {
      const hour = r.timestamp.getHours();
      return (hour >= 23 || hour <= 5) && r.energyGenerated > 0.1;
    });

    if (nighttimeGeneration.length >= 3) {
      anomalies.push({
        type: 'IRREGULAR_PATTERN',
        severity: 'WARNING',
        description: `Unexpected energy generation detected during nighttime hours (${nighttimeGeneration.length} occurrences)`,
        details: {
          actualValue: nighttimeGeneration.length,
          threshold: 0,
          expectedValue: 0,
          additionalContext: {
            nighttimeReadings: nighttimeGeneration.length,
          },
        },
        affectedPeriod: {
          start: nighttimeGeneration[0].timestamp,
          end: nighttimeGeneration[nighttimeGeneration.length - 1].timestamp,
        },
        confidence: 'MEDIUM',
      });
    }

    // Check for multiple sharp spikes/drops
    let spikeCount = 0;
    for (let i = 1; i < records.length; i++) {
      const prevValue = records[i - 1].energyGenerated;
      const currentValue = records[i].energyGenerated;

      if (prevValue === 0 || currentValue === 0) continue;

      const changePercent = Math.abs((currentValue - prevValue) / prevValue) * 100;
      if (changePercent > 30) {
        spikeCount++;
      }
    }

    const avgSpikeRate = spikeCount / records.length;
    if (avgSpikeRate > 0.2) {
      // More than 20% of readings have sharp changes
      anomalies.push({
        type: 'IRREGULAR_PATTERN',
        severity: 'WARNING',
        description: `Highly erratic generation pattern with ${spikeCount} sharp fluctuations`,
        details: {
          actualValue: spikeCount,
          threshold: records.length * 0.2,
          additionalContext: {
            totalReadings: records.length,
            spikeCount,
          },
        },
        affectedPeriod: {
          start: records[0].timestamp,
          end: records[records.length - 1].timestamp,
        },
        confidence: 'LOW',
      });
    }

    return anomalies;
  }

  /**
   * Detect Missing Data / Reporting Gaps
   */
  private static async detectMissingData(
    records: any[],
    unit: any
  ): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = [];

    if (records.length < 2) return anomalies;

    const expectedInterval = 15 * 60 * 1000; // 15 minutes in milliseconds
    const maxAcceptableGap = 2 * 60 * 60 * 1000; // 2 hours

    for (let i = 1; i < records.length; i++) {
      const prevTime = records[i - 1].timestamp.getTime();
      const currentTime = records[i].timestamp.getTime();
      const gap = currentTime - prevTime;

      // Check if gap is during operational hours (6 AM - 8 PM)
      const hour = records[i - 1].timestamp.getHours();
      const isDuringOperationalHours = hour >= 6 && hour <= 20;

      if (gap > maxAcceptableGap && isDuringOperationalHours) {
        const gapHours = gap / (60 * 60 * 1000);
        const severity = gapHours > 24 ? 'CRITICAL' : 'WARNING';

        anomalies.push({
          type: 'MISSING_DATA',
          severity,
          description: `Data reporting gap of ${gapHours.toFixed(1)} hours detected`,
          details: {
            gapDuration: parseFloat(gapHours.toFixed(1)),
            threshold: 2,
            expectedValue: 0.25, // 15 minutes
            actualValue: parseFloat(gapHours.toFixed(1)),
          },
          affectedPeriod: {
            start: records[i - 1].timestamp,
            end: records[i].timestamp,
          },
          confidence: 'HIGH',
        });
      }
    }

    return anomalies;
  }

  /**
   * Helper: Group records by date
   */
  private static groupByDate(records: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    for (const record of records) {
      const dateKey = record.timestamp.toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(record);
    }

    return grouped;
  }

  /**
   * Helper: Calculate hourly averages
   */
  private static calculateHourlyAverages(records: any[]): Record<number, number> {
    const hourlyData: Record<number, number[]> = {};

    for (const record of records) {
      const hour = record.timestamp.getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = [];
      }
      hourlyData[hour].push(record.energyGenerated);
    }

    const averages: Record<number, number> = {};
    for (const [hour, values] of Object.entries(hourlyData)) {
      averages[parseInt(hour)] = values.reduce((sum, v) => sum + v, 0) / values.length;
    }

    return averages;
  }
}
