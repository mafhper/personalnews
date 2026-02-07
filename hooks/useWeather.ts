import { useState, useEffect, useCallback } from 'react';

interface WeatherData {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
}

interface WeatherState {
  data: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  city: string;
}

const WEATHER_STORAGE_KEY = 'personalnews_weather_city';
const DEFAULT_CITY = 'São Paulo';

// Weather codes to description/icon mapping
const weatherCodeToIcon = (code: number, isDay: boolean): string => {
  // WMO Weather interpretation codes (WW)
  // https://open-meteo.com/en/docs
  if (code === 0) return isDay ? '☀️' : '🌙'; // Clear sky
  if (code <= 3) return isDay ? '⛅' : '☁️'; // Partly cloudy
  if (code <= 48) return '🌫️'; // Fog
  if (code <= 57) return '🌧️'; // Drizzle
  if (code <= 67) return '🌧️'; // Rain
  if (code <= 77) return '❄️'; // Snow
  if (code <= 82) return '🌧️'; // Rain showers
  if (code <= 86) return '🌨️'; // Snow showers
  if (code >= 95) return '⛈️'; // Thunderstorm
  return '☁️';
};

// Simple geocoding using Open-Meteo's geocoding API
const geocodeCity = async (cityName: string): Promise<{ lat: number; lon: number; name: string } | null> => {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=pt&format=json`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return {
        lat: data.results[0].latitude,
        lon: data.results[0].longitude,
        name: data.results[0].name,
      };
    }
    return null;
  } catch {
    return null;
  }
};

export const useWeather = () => {
  const [state, setState] = useState<WeatherState>({
    data: null,
    isLoading: true,
    error: null,
    city: localStorage.getItem(WEATHER_STORAGE_KEY) || DEFAULT_CITY,
  });

  const fetchWeather = useCallback(async (cityName: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const geo = await geocodeCity(cityName);
    if (!geo) {
      setState((prev) => ({ ...prev, isLoading: false, error: 'City not found' }));
      return;
    }

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}&current=temperature_2m,weather_code,is_day`
      );
      const data = await response.json();

      if (data.current) {
        setState({
          data: {
            temperature: Math.round(data.current.temperature_2m),
            weatherCode: data.current.weather_code,
            isDay: data.current.is_day === 1,
          },
          isLoading: false,
          error: null,
          city: geo.name,
        });
        localStorage.setItem(WEATHER_STORAGE_KEY, geo.name);
      } else {
        setState((prev) => ({ ...prev, isLoading: false, error: 'Failed to fetch weather' }));
      }
    } catch {
      setState((prev) => ({ ...prev, isLoading: false, error: 'Network error' }));
    }
  }, []);

  const changeCity = useCallback((newCity: string) => {
    fetchWeather(newCity);
  }, [fetchWeather]);

  useEffect(() => {
    // Use requestAnimationFrame to avoid "synchronous setState" error during initial mount
    const handle = requestAnimationFrame(() => fetchWeather(state.city));
    
    // Refresh every 30 minutes
    const interval = setInterval(() => fetchWeather(state.city), 30 * 60 * 1000);
    
    return () => {
      cancelAnimationFrame(handle);
      clearInterval(interval);
    };
  }, [fetchWeather, state.city]);

  const getWeatherIcon = useCallback(() => {
    if (!state.data) return '🌡️';
    return weatherCodeToIcon(state.data.weatherCode, state.data.isDay);
  }, [state.data]);

  return {
    ...state,
    changeCity,
    refreshWeather: () => fetchWeather(state.city),
    getWeatherIcon,
  };
};
