import z from "zod";

export const createSolarUnitDto = z.object({
  serialNumber: z.string().min(1).max(100),
  installationDate: z.string().min(1).max(100),
  capacity: z.number().min(0),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]),
  userid: z.string().min(1).max(100),
});
