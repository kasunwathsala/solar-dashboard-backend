import express from "express";

import { 
  getAllSolarUnits, 
  createSolarUnit, 
  getSolarUnitById, 
  updateSolarUnit, 
  deleteSolarUnit, 
  getSolarUnitsByClerkUserId,
  getSolarUnitForUser
} from "../application/solar-unit";
import { authenticationMiddleware } from "./middlewares/authentication-middleware";

const solarUnitRouter = express.Router();

// Public routes
solarUnitRouter.route("/").get(getAllSolarUnits).post(createSolarUnit);

// User-specific routes  
solarUnitRouter.route("/users/:clerkUserId").get(getSolarUnitsByClerkUserId);
solarUnitRouter.route("/me").get(authenticationMiddleware, getSolarUnitForUser);

// Individual solar unit routes
solarUnitRouter
  .route("/:id")
  .get(getSolarUnitById)
  .put(updateSolarUnit)
  .delete(deleteSolarUnit);               

export default solarUnitRouter;