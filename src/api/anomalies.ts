import { Router } from "express";
import { authenticationMiddleware } from "../api/middlewares/authentication-middleware";
import { authorizationMiddleware } from "../api/middlewares/authorization-middleware";
import {
  getUserAnomalies,
  getAnomalyById,
  acknowledgeAnomaly,
  resolveAnomaly,
  markAsFalsePositive,
  getAnomalyStats,
  triggerAnomalyDetection,
  getAllAnomalies,
  getAnomalySummary,
  triggerSystemWideDetection,
} from "../application/anomalies";

const router = Router();

// User endpoints
router.get("/", authenticationMiddleware, getUserAnomalies);
router.get("/stats", authenticationMiddleware, getAnomalyStats);
router.get("/:id", authenticationMiddleware, getAnomalyById);
router.patch("/:id/acknowledge", authenticationMiddleware, acknowledgeAnomaly);
router.patch("/:id/resolve", authenticationMiddleware, resolveAnomaly);
router.patch("/:id/false-positive", authenticationMiddleware, markAsFalsePositive);
router.post("/detect", authenticationMiddleware, triggerAnomalyDetection);

// Admin endpoints
router.get("/admin/all", authenticationMiddleware, authorizationMiddleware, getAllAnomalies);
router.get("/admin/summary", authenticationMiddleware, authorizationMiddleware, getAnomalySummary);
router.post("/admin/detect", authenticationMiddleware, authorizationMiddleware, triggerSystemWideDetection);

export default router;
