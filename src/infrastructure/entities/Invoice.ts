import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  solarUnitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SolarUnit",
    required: true,
  },
  userId: {
    type: String, // Clerk user ID
    required: true,
  },
  billingPeriod: {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
  },
  energyGenerated: {
    type: Number, // Total kWh for the period
    required: true,
  },
  ratePerKwh: {
    type: Number, // Price per kWh in cents
    required: true,
    default: 15, // $0.15 per kWh
  },
  totalAmount: {
    type: Number, // Total amount in cents
    required: true,
  },
  status: {
    type: String,
    enum: ["PENDING", "PAID", "FAILED", "OVERDUE"],
    default: "PENDING",
  },
  stripePaymentIntentId: {
    type: String,
  },
  stripeCheckoutSessionId: {
    type: String,
  },
  paidAt: {
    type: Date,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  invoiceNumber: {
    type: String,
    unique: true,
    required: true,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
invoiceSchema.index({ userId: 1, status: 1 });
invoiceSchema.index({ solarUnitId: 1 });
invoiceSchema.index({ invoiceNumber: 1 });

export const Invoice = mongoose.model("Invoice", invoiceSchema);
