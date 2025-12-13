import express from "express";
import {
  getAllSolarUnits,
  createSolarUnit,
  getSolarUnitById,
  updateSolarUnit,
  deleteSolarUnit,
  updateSolarUnitValidator,
  getSolarUnitForUser,
} from "../application/solar-unit";
import { authenticationMiddleware } from "./middlewares/authentication-middleware";
import { authorizationMiddleware } from "./middlewares/authorization-middleware";
import { syncMiddleware } from "./middlewares/sync-middleware";

const solarUnitRouter = express.Router();

// DEVELOPMENT TEST ROUTES (No Authentication)
solarUnitRouter.route("/test").get(getAllSolarUnits);
solarUnitRouter.route("/test/:id").get(getSolarUnitById);

// PROTECTED ROUTES
solarUnitRouter.route("/").get(authenticationMiddleware, authorizationMiddleware, getAllSolarUnits).post(authenticationMiddleware, authorizationMiddleware, createSolarUnit);
solarUnitRouter.route("/me").get(authenticationMiddleware, syncMiddleware, getSolarUnitForUser);
solarUnitRouter
  .route("/:id")
  .get(authenticationMiddleware, authorizationMiddleware, getSolarUnitById)
  .put(authenticationMiddleware, authorizationMiddleware, updateSolarUnit)
  .delete(authenticationMiddleware, authorizationMiddleware, deleteSolarUnit);

export default solarUnitRouter;