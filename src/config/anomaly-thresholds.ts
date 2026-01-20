/**
 * Configuration for anomaly detection thresholds
 * These values can be overridden via environment variables
 */

export const ANOMALY_THRESHOLDS = {
  // Capacity Factor Thresholds
  CAPACITY_FACTOR: {
    MIN_NORMAL: parseFloat(process.env.CAPACITY_FACTOR_MIN || "15"), // %
    MAX_NORMAL: parseFloat(process.env.CAPACITY_FACTOR_MAX || "25"), // %
    CONSECUTIVE_DAYS: parseInt(process.env.CAPACITY_FACTOR_CONSECUTIVE_DAYS || "3", 10)
  },
  
  // Nighttime Generation Threshold
  NIGHTTIME: {
    THRESHOLD: parseFloat(process.env.NIGHTTIME_GENERATION_THRESHOLD || "0.1"), // kWh
    MIN_OCCURRENCES: parseInt(process.env.NIGHTTIME_MIN_OCCURRENCES || "3", 10)
  },
  
  // Weather-based Thresholds
  WEATHER: {
    CLOUD_COVER_THRESHOLD: parseFloat(process.env.CLOUD_COVER_THRESHOLD || "30"), // %
    MIN_UV_INDEX: parseFloat(process.env.MIN_UV_INDEX || "3")
  },
  
  // Zero Generation Detection
  ZERO_GENERATION: {
    PEAK_HOUR_START: parseInt(process.env.PEAK_HOUR_START || "10", 10), // 10 AM
    PEAK_HOUR_END: parseInt(process.env.PEAK_HOUR_END || "14", 10), // 2 PM
    MIN_CONSECUTIVE_ZEROS: parseInt(process.env.MIN_CONSECUTIVE_ZEROS || "3", 10)
  },
  
  // Sudden Drop Detection
  SUDDEN_DROP: {
    DROP_PERCENTAGE_THRESHOLD: parseFloat(process.env.DROP_PERCENTAGE_THRESHOLD || "50"), // %
    MIN_BASELINE_AVERAGE: parseFloat(process.env.MIN_BASELINE_AVERAGE || "1"), // kWh
  },
  
  // Missing Data Detection
  MISSING_DATA: {
    MAX_GAP_HOURS: parseInt(process.env.MAX_GAP_HOURS || "3", 10),
    OPERATIONAL_HOUR_START: parseInt(process.env.OPERATIONAL_HOUR_START || "6", 10), // 6 AM
    OPERATIONAL_HOUR_END: parseInt(process.env.OPERATIONAL_HOUR_END || "18", 10), // 6 PM
  }
};

/**
 * Get current threshold configuration as a formatted object
 */
export const getThresholdConfig = () => {
  return {
    capacityFactor: {
      normalRange: `${ANOMALY_THRESHOLDS.CAPACITY_FACTOR.MIN_NORMAL}% - ${ANOMALY_THRESHOLDS.CAPACITY_FACTOR.MAX_NORMAL}%`,
      consecutiveDays: ANOMALY_THRESHOLDS.CAPACITY_FACTOR.CONSECUTIVE_DAYS
    },
    nighttime: {
      threshold: `${ANOMALY_THRESHOLDS.NIGHTTIME.THRESHOLD} kWh`,
      minOccurrences: ANOMALY_THRESHOLDS.NIGHTTIME.MIN_OCCURRENCES
    },
    weather: {
      cloudCoverThreshold: `${ANOMALY_THRESHOLDS.WEATHER.CLOUD_COVER_THRESHOLD}%`,
      minUvIndex: ANOMALY_THRESHOLDS.WEATHER.MIN_UV_INDEX
    },
    zeroGeneration: {
      peakHours: `${ANOMALY_THRESHOLDS.ZERO_GENERATION.PEAK_HOUR_START}:00 - ${ANOMALY_THRESHOLDS.ZERO_GENERATION.PEAK_HOUR_END}:00`,
      minConsecutiveZeros: ANOMALY_THRESHOLDS.ZERO_GENERATION.MIN_CONSECUTIVE_ZEROS
    },
    suddenDrop: {
      dropPercentageThreshold: `${ANOMALY_THRESHOLDS.SUDDEN_DROP.DROP_PERCENTAGE_THRESHOLD}%`,
      minBaselineAverage: `${ANOMALY_THRESHOLDS.SUDDEN_DROP.MIN_BASELINE_AVERAGE} kWh`
    },
    missingData: {
      maxGapHours: `${ANOMALY_THRESHOLDS.MISSING_DATA.MAX_GAP_HOURS} hours`,
      operationalHours: `${ANOMALY_THRESHOLDS.MISSING_DATA.OPERATIONAL_HOUR_START}:00 - ${ANOMALY_THRESHOLDS.MISSING_DATA.OPERATIONAL_HOUR_END}:00`
    }
  };
};
