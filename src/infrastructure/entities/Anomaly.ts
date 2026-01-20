import mongoose, { Schema, Document } from "mongoose";

export interface IAnomalyDetails {
  expectedValue?: number;
  actualValue?: number;
  threshold?: number;
  dropPercent?: number;
  gapDuration?: number;
  capacityFactor?: number;
  additionalContext?: Record<string, any>;
}

export interface IAnomaly extends Document {
  solarUnit: mongoose.Types.ObjectId;
  userId: string; // Clerk user ID
  type: 'ZERO_GENERATION' | 'SUDDEN_DROP' | 'CAPACITY_FACTOR' | 'IRREGULAR_PATTERN' | 'MISSING_DATA';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  
  detectedAt: Date;
  affectedPeriod: {
    start: Date;
    end: Date;
  };
  
  description: string;
  details: IAnomalyDetails;
  
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'FALSE_POSITIVE';
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
  
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: Date;
  updatedAt: Date;
}

const AnomalySchema = new Schema<IAnomaly>(
  {
    solarUnit: {
      type: Schema.Types.ObjectId,
      ref: "SolarUnit",
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['ZERO_GENERATION', 'SUDDEN_DROP', 'CAPACITY_FACTOR', 'IRREGULAR_PATTERN', 'MISSING_DATA'],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['CRITICAL', 'WARNING', 'INFO'],
      required: true,
      index: true,
    },
    detectedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    affectedPeriod: {
      start: {
        type: Date,
        required: true,
      },
      end: {
        type: Date,
        required: true,
      },
    },
    description: {
      type: String,
      required: true,
    },
    details: {
      expectedValue: Number,
      actualValue: Number,
      threshold: Number,
      dropPercent: Number,
      gapDuration: Number,
      capacityFactor: Number,
      additionalContext: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {}
      }
    },
    status: {
      type: String,
      enum: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'FALSE_POSITIVE'],
      default: 'OPEN',
      index: true,
    },
    resolvedAt: Date,
    resolvedBy: String,
    resolutionNotes: String,
    confidence: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
AnomalySchema.index({ userId: 1, status: 1, severity: 1 });
AnomalySchema.index({ solarUnit: 1, detectedAt: -1 });
AnomalySchema.index({ type: 1, severity: 1 });

export const Anomaly = mongoose.model<IAnomaly>("Anomaly", AnomalySchema);
