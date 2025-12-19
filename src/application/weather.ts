import axios from 'axios';

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

export const getWeatherData = async (latitude: number, longitude: number): Promise<WeatherData> => {
  try {
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude,
        longitude,
        current: 'temperature_2m,cloud_cover,precipitation,uv_index,wind_speed_10m,relative_humidity_2m',
        timezone: 'auto'
      }
    });

    const current = response.data.current;
    
    // Calculate solar production estimate based on conditions
    const cloudCover = current.cloud_cover || 0;
    const uvIndex = current.uv_index || 0;
    const precipitation = current.precipitation || 0;
    
    // Good conditions: low cloud cover, high UV, no rain
    const isGoodForSolar = cloudCover < 30 && uvIndex > 3 && precipitation === 0;
    
    let solarProductionEstimate = 'Poor';
    if (cloudCover < 20 && uvIndex > 6) {
      solarProductionEstimate = 'Excellent';
    } else if (cloudCover < 40 && uvIndex > 4) {
      solarProductionEstimate = 'Good';
    } else if (cloudCover < 60 && uvIndex > 2) {
      solarProductionEstimate = 'Moderate';
    }

    return {
      temperature: current.temperature_2m,
      cloudCover: current.cloud_cover,
      precipitation: current.precipitation,
      uvIndex: current.uv_index,
      windSpeed: current.wind_speed_10m,
      humidity: current.relative_humidity_2m,
      isGoodForSolar,
      solarProductionEstimate
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
};
