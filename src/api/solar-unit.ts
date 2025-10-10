import express from "express";
import { getAllSolarUnits,createSolarUnit,getSolarUnitById,updateSolarUnit,deleteSolarUnit, createsolarunitvalidator} from "../application/solar-unit";

const solarUnitRouter = express.Router();
solarUnitRouter.route("/").get(getAllSolarUnits).post(createsolarunitvalidator, createSolarUnit);
solarUnitRouter
               .route("/:id")
               .get(getSolarUnitById)
               .put(updateSolarUnit)
               .delete(deleteSolarUnit);

export default solarUnitRouter;