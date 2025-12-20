import mongoose from "mongoose";
import { EnergyGenerationRecord } from "./EnergyGenerationRecord";
//-------------embedding seen eka me------------------
// import { EnergyGenerationRecordschema } from "./EnergyGenerationRecord";

const solarUnitSchema = new mongoose.Schema({
  //----------child referencing seen eka me----------------

  // EnergyGenerationRecords: [{
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "EnergyGenerationRecord",
  // }],

  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
   
  },
  
  serialNumber: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: false,
  },
  location: {
    type: String,
    required: false,
  },
  installationDate: {
    type: Date,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["ACTIVE", "INACTIVE", "MAINTENANCE"],
  },
  //-------------embedding seen eka me------------------
  // EnergyGenerationRecords: [EnergyGenerationRecordschema],
});

export const SolarUnit = mongoose.model("SolarUnit", solarUnitSchema);