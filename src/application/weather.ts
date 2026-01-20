import axios from 'axios';
import { ANOMALY_THRESHOLDS } from '../config/anomaly-thresholds';

interface WeatherData {
  temperature: number;
  cloudCover: number;
  precipitation: number;
  uvIndex: number;
  windSpeed: number;
  humidity: number;
  isGoodForSolar: boolean;
  solarProductionEstimate: string;
}

// In-memory cache for weather data
interface WeatherCache {
  data: WeatherData;
  timestamp: number;
}

const weatherCache = new Map<string, WeatherCache>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Get cached weather data or fetch new data
 */
export const getWeatherData = async (latitude: number, longitude: number): Promise<WeatherData> => {
  const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  
  // Check cache first
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('☁️ Returning cached weather data');
    return cached.data;
  }

  try {
    console.log('☁️ Fetching fresh weather data from API');
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude,
        longitude,
        current: 'temperature_2m,cloud_cover,precipitation,uv_index,wind_speed_10m,relative_humidity_2m',
        timezone: 'auto'
      }
    });

    const current = response.data.current;
    
    // Calculate solar production estimate using configurable thresholds
    const cloudCover = current.cloud_cover || 0;
    const uvIndex = current.uv_index || 0;
    const precipitation = current.precipitation || 0;
    
    const CLOUD_COVER_THRESHOLD = ANOMALY_THRESHOLDS?.WEATHER?.CLOUD_COVER_THRESHOLD || 30;
    const MIN_UV_INDEX = ANOMALY_THRESHOLDS?.WEATHER?.MIN_UV_INDEX || 3;
    const isGoodForSolar = cloudCover < CLOUD_COVER_THRESHOLD && uvIndex > MIN_UV_INDEX && precipitation === 0;
    
    let solarProductionEstimate = 'Poor';
    if (cloudCover < 20 && uvIndex > 6) {
      solarProductionEstimate = 'Excellent';
    } else if (cloudCover < 40 && uvIndex > 4) {
      solarProductionEstimate = 'Good';
    } else if (cloudCover < 60 && uvIndex > 2) {
      solarProductionEstimate = 'Moderate';
    }

    const weatherData: WeatherData = {
      temperature: current.temperature_2m,
      cloudCover: current.cloud_cover,
      precipitation: current.precipitation,
      uvIndex: current.uv_index,
      windSpeed: current.wind_speed_10m,
      humidity: current.relative_humidity_2m,
      isGoodForSolar,
      solarProductionEstimate
    };
    
    // Update cache
    weatherCache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now()
    });
    
    // Clean up old cache entries (keep only last 100 locations)
    if (weatherCache.size > 100) {
      const firstKey = weatherCache.keys().next().value;
      if (firstKey) {
        weatherCache.delete(firstKey);
      }
    }

    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
};
