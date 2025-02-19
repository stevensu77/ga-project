import { useState, useEffect, useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "bootstrap/dist/css/bootstrap.min.css";

const API_KEY = "b6f362efc9161afa6841bf015cb7e63e";

export default function WeatherDashboard() {
  const [city, setCity] = useState("");
  const [cities, setCities] = useState([]);
  const [searchedCities, setSearchedCities] = useState(() => {
    return JSON.parse(localStorage.getItem("recentCities")) || [];
  });
  const [weatherData, setWeatherData] = useState(null);
  const [forecastTemData, setForecastTemData] = useState({});
  const [forecastData, setForecastData] = useState([]);
  const [error, setError] = useState(null);
  const [selectedChart, setSelectedChart] = useState('temperature');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return JSON.parse(localStorage.getItem("darkMode")) || false;
  });

  useEffect(() => {
    localStorage.setItem("recentCities", JSON.stringify(searchedCities));
  }, [searchedCities]);

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    document.body.className = darkMode ? "bg-dark text-white" : "bg-light text-dark";
  }, [darkMode]);

  const fetchWeather = async (cityName) => {
    setLoading(true);
    try {
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}`
      );
      const weatherJson = await weatherResponse.json();
      if (weatherJson.cod !== 200) throw new Error(weatherJson.message);
      setWeatherData(weatherJson);
      setError(null);

      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_KEY}`
      );
      const forecastJson = await forecastResponse.json();
      setForecastData(forecastJson.list); // Next 24 hours (every 3 hours)
      setForecastTemData((prevData) => ({ ...prevData, [cityName]: forecastJson.list.slice(0, 8) }));
      setCity(cityName);
      setCities([cityName]);
      if (!searchedCities.includes(cityName)) {
        setSearchedCities((prevCities) => [...prevCities, cityName]);
      }
    } catch (err) {
      setError(err.message);
      setWeatherData(null);
      setForecastData([]);
    } finally {
        setLoading(false);
    }
  };

  const fetchTempCompare = async (cityName) => {
    setLoading(true);
    try {
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_KEY}`
      );
      const forecastJson = await forecastResponse.json();
      if (forecastJson.cod !== "200") throw new Error(forecastJson.message);
      setForecastTemData((prevData) => ({ ...prevData, [cityName]: forecastJson.list.slice(0, 8) }));
      setError(null);
      if (!cities.includes(cityName)) {
        setCities((prevCities) => [...prevCities, cityName]);
      }
      if (!searchedCities.includes(cityName)) {
        setSearchedCities((prevCities) => [...prevCities, cityName]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
      fetchWeather(city);
  };

  const handleAddCompare = () => {
    fetchTempCompare(city);
  };

  const handleSelectChange = (e) => {
    setSelectedChart(e.target.value);
  };

  const tempChartOptions = useMemo(
    ()=>({
        chart: {
            backgroundColor: darkMode ? "#2c2c2c" : "#ffffff",
        },
        title: { text: "Temperature Forecast (Next 24 Hours)",style: { color: darkMode ? "#ffffff" : "#000000" } },
        credits: {
            enabled: false,
        },
        xAxis: { categories: forecastTemData[cities[0]]?.map((data) => data.dt_txt.split(" ")[1]) || [],labels: { style: { color: darkMode ? "#ffffff" : "#000000" } }, },
        yAxis: { labels: { style: { color: darkMode ? "#ffffff" : "#000000" } },title: { text: "Temperature (°F)",style: { color: darkMode ? "#ffffff" : "#000000" } } },
        series: cities.map((city) => ({
          name: city,
          data: forecastTemData[city]?.map((data) =>
            parseFloat(((data.main.temp - 273.15) * 1.8 + 32).toFixed(2))
          ) || []
        }))
    }),[forecastTemData,darkMode,cities]
  );

  const rainChartOptions = useMemo(
    ()=>({
        chart: {
            backgroundColor: darkMode ? "#2c2c2c" : "#ffffff",
            type: "column"
        },
       
        credits: {
            enabled: false,
        },
        title: { text: "Rain Probability (Next Five Days)",style: { color: darkMode ? "#ffffff" : "#000000" } },
        xAxis: { categories: forecastData?.map((data) => data.dt_txt.split(" ")[0]) ,labels: { style: { color: darkMode ? "#ffffff" : "#000000" } },},
        yAxis: { title: { text: "Probability (%)" ,style: { color: darkMode ? "#ffffff" : "#000000" }}, labels: { style: { color: darkMode ? "#ffffff" : "#000000" } }},
        series: [
          {
            name: "Rain Probability",
            data: forecastData?.map((data) => data.pop * 100),
          },
        ],
      }),[forecastData, darkMode]
    );

  const humidityChartOptions = useMemo(
    ()=>({
        chart: {
            backgroundColor: darkMode ? "#2c2c2c" : "#ffffff",
            type: "column"
        },
        credits: {
            enabled: false, 
        },
        title: { text: "Humidity Levels (Next Five Days)",style: { color: darkMode ? "#ffffff" : "#000000" } },
        xAxis: { categories: forecastData?.map((data) => data.dt_txt.split(" ")[0]),labels: { style: { color: darkMode ? "#ffffff" : "#000000" } }, },
        yAxis: { title: { text: "Humidity (%)",style: { color: darkMode ? "#ffffff" : "#000000" } }, labels: { style: { color: darkMode ? "#ffffff" : "#000000" } } },
        series: [
          {
            name: "Humidity",
            data: forecastData?.map((data) => data.main.humidity),
          },
        ],
      }),[forecastData, darkMode]
  );

  const windChartOptions = {
    chart: {
        backgroundColor: darkMode ? "#2c2c2c" : "#ffffff",
        type: "column"
    },
    credits: {
        enabled: false, 
    },
    title: { text: "Wind Speed (Next Five Days)",style: { color: darkMode ? "#ffffff" : "#000000" } },
    xAxis: { categories: forecastData?.map((data) => data.dt_txt.split(" ")[0]) ,labels: { style: { color: darkMode ? "#ffffff" : "#000000" } }, },
    yAxis: { title: { text: "Wind Speed (m/s)" },style: { color: darkMode ? "#ffffff" : "#000000" } },
    series: [
      {
        name: "Wind Speed",
        data: forecastData?.map((data) => data.wind.speed),
      },
    ],
  };
  
  const weatherConditions = forecastData?.reduce((acc, data) => {
    const condition = data.weather[0].main;
    acc[condition] = (acc[condition] || 0) + 1;
    return acc;
  }, {});

  const pieChartOptions = {
    chart: {
        backgroundColor: darkMode ? "#2c2c2c" : "#ffffff",
        type: "pie"
    },
    title: { text: "Weather Conditions Breakdown", style: { color: darkMode ? "#ffffff" : "#000000" } },
    credits: {
        enabled: false, 
    },
    tooltip: {
      pointFormat: "<b>{point.percentage:.2f}%</b>",
    },
    series: [
      {
        name: "Occurrences",
        data: Object.entries(weatherConditions).map(([key, value]) => ({
          name: key,
          y: parseFloat(value.toFixed(2)),
        })),
      },
    ],
  };

   // Render the appropriate chart based on the selected value
   const renderChart = () => {
    switch (selectedChart) {
      case 'temperature':
        return <HighchartsReact highcharts={Highcharts} options={tempChartOptions} />;
      case 'rainProbability':
        return <HighchartsReact highcharts={Highcharts} options={rainChartOptions} />;
      case 'humidityLevel':
        return <HighchartsReact highcharts={Highcharts} options={humidityChartOptions} />;
      case 'windSpeed':
          return <HighchartsReact highcharts={Highcharts} options={windChartOptions} />;
      case 'weatherCondition':
        return <HighchartsReact highcharts={Highcharts} options={pieChartOptions} />;
      default:
        return null;
    }
  };

  return (
    <div className={`container mt-4 ${darkMode ? "bg-dark text-white" : "bg-light text-dark"}`}>
      <h1 className="text-center">Weather Analytics Dashboard</h1>
      <div className="text-center mb-3">
        <button className="btn btn-secondary" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        </button>
      </div>
      <div className="row">
        <div className="col-md-6 mx-auto">
          <input
            type="text"
            className={`form-control ${darkMode ? "bg-dark text-white" : "bg-light text-dark"}`}
            placeholder="Enter city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <button className="btn btn-primary mt-2 w-100" onClick={handleSearch}>
            Search
          </button>
          {selectedChart==='temperature'&&
          (<button className="btn btn-success mt-2 w-100" onClick={handleAddCompare}>
            Add Compare
          </button>)}
          
        </div>
        <ul className={`list-group mt-3 ${darkMode ? "bg-dark text-white" : "bg-light text-dark"}`}>
            {searchedCities.map((c, index) => (
              <li key={index} className={`list-group-item ${darkMode ? "bg-dark text-white" : "bg-light text-dark"}`} onClick={() => fetchWeather(c)}>
                {c}
              </li>
            ))}
        </ul>
      </div>
      {error && <div className="alert alert-danger mt-3">{error}</div>}
      {loading && <div className="text-center mt-3">Fetching weather data...</div>}
      {weatherData && (
        <div className={`card mt-4 p-4 ${darkMode ? "bg-dark text-white" : "bg-light text-dark"}`}>
          <h2>{weatherData.name}</h2>
          <p>Temperature: {((weatherData.main.temp-273.15)*1.8 +32).toFixed(2)}°F</p>
          <p>Humidity: {weatherData.main.humidity}%</p>
          <p>Wind Speed: {weatherData.wind.speed} m/s</p>
          <p>Weather: {weatherData.weather[0].description.charAt(0).toUpperCase() + weatherData.weather[0].description.slice(1)}</p>
        </div>
      )}
      {forecastData.length > 0 && (<select value={selectedChart} onChange={handleSelectChange} className={`form-control chart-select ${darkMode ? "bg-dark text-white" : "bg-light text-dark"}`}>
        <option value="temperature">Temperature Forecast</option>
        <option value="rainProbability">Rain Probability</option>
        <option value="humidityLevel">Humidity Level</option>
        <option value="windSpeed">WindSpeed</option>
        <option value="weatherCondition">Weather Condition</option>
      </select>)}

      <div className="chart-container">
        {forecastData.length > 0 && !loading && renderChart()}
      </div>
    </div>
  );
}
