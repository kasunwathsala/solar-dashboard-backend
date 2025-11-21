import express from "express";
import {
getAllSolarUnits,
createSolarUnit,
getSolarUnitById,
updateSolarUnit,
deleteSolarUnit,
getSolarUnitForUser,
} from "../application/solar-unit";
import { authenticationMiddleware } from "./middlewares/authentication-middleware";
import { authorizationMiddleware } from "./middlewares/authorization-middleware";

const solarUnitRouter = express.Router();

// solarUnitRouter.route("/").get(getAllSolarUnits).post(createSolarUnitValidator, createSolarUnit);
solarUnitRouter.route("/").get(authenticationMiddleware, authorizationMiddleware, getAllSolarUnits).post(authenticationMiddleware, authorizationMiddleware, createSolarUnit);
solarUnitRouter
.route("/:id")
  // .get(getSolarUnitById)
  // .put(updateSolarUnit)
  // .delete(deleteSolarUnit);
  .get(authenticationMiddleware, authorizationMiddleware, getSolarUnitById)
  .put(authenticationMiddleware, authorizationMiddleware, updateSolarUnit)
  .delete(authenticationMiddleware, authorizationMiddleware, deleteSolarUnit);

export default solarUnitRouter;