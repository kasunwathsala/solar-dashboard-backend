import express from "express";

import { getAllSolarUnits,createSolarUnit,getSolarUnitById,updateSolarUnit,deleteSolarUnit, createsolarunitvalidator, getSolarUnitsByClerkUserId} from "../application/solar-unit";

const solarUnitRouter = express.Router();
solarUnitRouter.route("/").get(getAllSolarUnits).post(createsolarunitvalidator, createSolarUnit);
solarUnitRouter
               .route("/:id")
               .get(getSolarUnitById)
               .put(updateSolarUnit)
               .delete(deleteSolarUnit);
solarUnitRouter
               .route("/user/:clerkUserId")
               .get( getSolarUnitsByClerkUserId);               

export default solarUnitRouter;