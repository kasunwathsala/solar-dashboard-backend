import express from "express";
import { getWeatherData } from "../application/weather";
import { validateRequest, commonSchemas } from "./middlewares/validation-middleware";

const weatherRouter = express.Router();

// GET /api/weather?lat=<latitude>&lon=<longitude>
weatherRouter.get("/", validateRequest(commonSchemas.weatherQuery, 'query'), async (req, res, next) => {
  try {
    const { lat, lon } = req.query as unknown as { lat: number; lon: number };
    
    const weatherData = await getWeatherData(lat, lon);
    res.status(200).json(weatherData);
  } catch (error) {
    console.error("Weather API error:", error);
    next(error);
  }
});

export default weatherRouter;
