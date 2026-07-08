import React, { useState, useEffect } from 'react';
import './WeatherApp.css';

function WeatherApp() {
  const [city, setCity] = useState('Пятигорск');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_KEY = '1a37984684f49dde5f9914f80457e92e'; // ⬅️ НЕ ЗАБУДЬТЕ ВСТАВИТЬ ВАШ КЛЮЧ!

  // --- Функция для определения фона по коду погоды ---
  const getWeatherBackground = (weatherCode) => {
    // Коды погоды: https://openweathermap.org/weather-conditions
    if (weatherCode >= 200 && weatherCode < 300) return 'thunderstorm';
    if (weatherCode >= 300 && weatherCode < 600) return 'rainy';
    if (weatherCode >= 600 && weatherCode < 700) return 'snowy';
    if (weatherCode >= 700 && weatherCode < 800) return 'foggy';
    if (weatherCode === 800) return 'sunny';
    if (weatherCode === 801) return 'cloudy';
    if (weatherCode >= 802 && weatherCode < 900) return 'cloudy';
    return 'default';
  };

  // --- Функция запроса погоды и прогноза ---
  const fetchWeather = async () => {
    setLoading(true);
    setError('');
    setWeather(null);

    try {
      // Получаем координаты города
      const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`;
      const geoResponse = await fetch(geoUrl);
      const geoData = await geoResponse.json();

      if (!geoData.length) {
        throw new Error('Город не найден');
      }

      const { lat, lon } = geoData[0];

      // Запрашиваем прогноз на 5 дней по координатам
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`;
      const forecastResponse = await fetch(forecastUrl);
      const forecastData = await forecastResponse.json();

      if (!forecastResponse.ok) {
        throw new Error(forecastData.message || 'Ошибка получения прогноза');
      }

      // Группируем данные по дням (берем одну точку в день, на 12:00)
      const dailyForecast = {};
      forecastData.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        const hour = new Date(item.dt * 1000).getHours();
        
        if (!dailyForecast[date] || Math.abs(hour - 12) < Math.abs(new Date(dailyForecast[date].dt * 1000).getHours() - 12)) {
          dailyForecast[date] = item;
        }
      });

      const forecastDays = Object.values(dailyForecast).slice(0, 7);
      
      // Сохраняем все данные в состояние
      setWeather({
        city: geoData[0].name,
        country: geoData[0].country,
        current: forecastData.list[0],
        forecast: forecastDays
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Запрос при первом запуске ---
  useEffect(() => {
    fetchWeather();
  }, []);

  // --- Отрисовка страницы ---
  return (
    // Класс для фона формируется динамически: container + bg-sunny, bg-rainy и т.д.
    <div className={`container ${weather ? `bg-${getWeatherBackground(weather.current.weather[0].id)}` : ''}`}>
      
      <div className="search-box">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              fetchWeather();
            }
          }}
          placeholder="Введите город"
          className="input"
        />
        <button onClick={fetchWeather} className="button">
          <img src='/images/icon_search.svg'/>
        </button>
      </div>

      <div className="result">
        {loading && <p className="info">Загрузка...</p>}
        {error && <p className="error"> {error}</p>}
        
        {weather && (
          <div>
            {/* ТЕКУЩАЯ ПОГОДА */}
            <div className="card current-weather">
            <h2 className="city-name">{`Погода в городе`}</h2>
            <h2 className="city-name">{weather.city}</h2>
              <p className="temp">{Math.round(weather.current.main.temp)}°C</p>
              <p className="description">{weather.current.weather[0].description}</p>
              <p className="details">
                Влажность: {weather.current.main.humidity}% | Ветер: {weather.current.wind.speed} м/с
              </p>
            </div>

            {/* ПРОГНОЗ НА НЕДЕЛЮ */}
            <div className="forecast-container">
              <h3 className="forecast-title">Прогноз на неделю</h3>
              <div className="forecast-list">
                {weather.forecast.map((day, index) => (
                  <div key={index} className="forecast-item">
                    <p className="forecast-date">
                      {new Date(day.dt * 1000).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' })}
                    </p>
                    <p className="forecast-temp">{Math.round(day.main.temp)}°C</p>
                    <p className="forecast-desc">{day.weather[0].description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WeatherApp;
