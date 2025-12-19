import express from "express";
import { getCapacityFactorBySolarUnitId, getPeakHourAnalysisBySolarUnitId } from "../application/metrics";
import { authenticationMiddleware } from "./middlewares/authentication-middleware";

const metricsRouter = express.Router();

// GET /api/metrics/capacity-factor/solar-unit/:id?days=7
metricsRouter.get(
  "/capacity-factor/solar-unit/:id",
  authenticationMiddleware,
  getCapacityFactorBySolarUnitId
);

// GET /api/metrics/peak-hours/solar-unit/:id?days=30
metricsRouter.get(
  "/peak-hours/solar-unit/:id",
  authenticationMiddleware,
  getPeakHourAnalysisBySolarUnitId
);

export default metricsRouter;
