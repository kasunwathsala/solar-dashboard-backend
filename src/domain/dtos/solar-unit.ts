import z from "zod";

export const createSolarUnitDto = z.object({
  serialNumber: z.string().min(1).max(100),
  installationDate: z.string().min(1).max(100),
  capacity: z.number().min(0),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]),
  userid: z.string().min(1).max(100).optional(),
});

export const UpdateSolarUnitDto = z.object({
  serialNumber: z.string().min(1),
  installationDate: z.string().min(1),
  capacity: z.number(),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]),
  userid: z.string().min(1).optional(),
});

export const getAllEnergyGenerationRecordsBySolarUnitIdQueryDto = z.object({
  groupBy: z.enum(["hourly", "daily", "monthly"]).optional(),
  limit: z.string().optional(),
});