import express from "express";
import { getWeatherData } from "../application/weather";

const weatherRouter = express.Router();

// GET /api/weather?lat=<latitude>&lon=<longitude>
weatherRouter.get("/", async (req, res, next) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ 
        message: "Missing required parameters: lat (latitude) and lon (longitude)" 
      });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lon as string);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ 
        message: "Invalid latitude or longitude values" 
      });
    }

    const weatherData = await getWeatherData(latitude, longitude);
    res.status(200).json(weatherData);
  } catch (error) {
    console.error("Weather API error:", error);
    next(error);
  }
});

export default weatherRouter;
