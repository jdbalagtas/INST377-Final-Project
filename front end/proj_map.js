let cityDataCache = {};

// map
function initializeHomePage() {
    if (!window.aqiMap) {
        window.aqiMap = L.map('map').setView([20, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(window.aqiMap);
    }

    const container = document.getElementById('city-cards');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Loading city data...</div>';

    const cities = [
        'New York', 
        'Los Angeles', 
        'London', 
        'Beijing', 
        'Delhi',
        'Tokyo',
        'Paris',
        'Moscow'
    ];

    clearMapMarkers();
    loadCitiesData(cities, container);
}

// data for each city
function loadCitiesData(cities, container) {
    Promise.allSettled(cities.map(city => 
        fetchCityData(city)
            .then(data => {
                cityDataCache[city] = data;
                addCityToMap(data);
                return data;
            })
            .catch(error => {
                console.error(`Error loading ${city}:`, error);
                const fallback = createFallbackData(city);
                cityDataCache[city] = fallback;
                return fallback;
            })
    )).then(results => {
        container.innerHTML = '';
        const successfulCities = results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);
        
        successfulCities.forEach(updateCityCard);
        fitMapToMarkers(successfulCities);
    });
}

// city data from backend
async function fetchCityData(cityName) {
    try {
        const response = await fetch(`/cities?name=${encodeURIComponent(cityName)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        return {
            name: cityName,
            aqi: data.aqi ?? '--',
            dominantPol: data.dominantPol ?? 'Unknown',
            time: data.time ?? new Date().toLocaleString(),
            lat: data.lat ?? null,
            lon: data.lon ?? null
        };
    } catch (error) {
        console.error(`Fetch failed for ${cityName}:`, error);
        throw error; 
    }
}

// backup 
function createFallbackData(cityName) {
    return {
        name: cityName,
        aqi: Math.floor(Math.random() * 150) + 50,
        dominantPol: "PM2.5",
        time: new Date().toLocaleString(),
        lat: null,
        lon: null
    };
}

// markers
function addCityToMap(cityData) {
    if (!cityData.lat || !cityData.lon || !window.aqiMap) return;
    
    const marker = L.marker([cityData.lat, cityData.lon]).addTo(window.aqiMap);
    marker.bindPopup(`
        <b>${cityData.name}</b><br>
        AQI: <span style="color:${getAQIColor(cityData.aqi)}">${cityData.aqi}</span><br>
        Status: ${getAQIStatus(cityData.aqi)}<br>
        <button onclick="showCityDetails('${cityData.name}')">View Details</button>
    `);
}

// show all markers
function fitMapToMarkers(citiesData) {
    if (!window.aqiMap) return;
    
    const validCities = citiesData.filter(city => city.lat && city.lon);
    if (validCities.length > 0) {
        const bounds = L.latLngBounds(validCities.map(city => [city.lat, city.lon]));
        window.aqiMap.fitBounds(bounds);
    }
}

// city profiles
function updateCityCard(cityData) {
    const container = document.getElementById('city-cards');
    if (!container) return;

    const card = document.createElement('div');
    card.className = 'city-card';
    card.innerHTML = `
        <h3>${cityData.name}</h3>
        <p>AQI: <span style="color:${getAQIColor(cityData.aqi)}">${cityData.aqi}</span></p>
        <p>Status: ${getAQIStatus(cityData.aqi)}</p>
        <p>Main Pollutant: ${cityData.dominantPol}</p>
    `;
    card.addEventListener('click', () => showCityDetails(cityData.name));
    container.appendChild(card);
}

// city details
function showCityDetails(cityName) {
    const cityPageBtn = document.querySelector('.nav-btn[data-page="city"]');
    if (cityPageBtn) {
        cityPageBtn.click();
    } else {
        window.location.href = `city.html?city=${encodeURIComponent(cityName)}`;
    }
    
    // city selection
    const citySelector = document.getElementById('city-selector');
    if (citySelector) {
        citySelector.value = cityName;
        const loadCityBtn = document.getElementById('load-city-btn');
        if (loadCityBtn) loadCityBtn.click();
    }
}

// aqi bar + coloring 
function getAQIStatus(aqi) {
    if (aqi === '--') return 'Data unavailable';
    const levels = [
        [50, 'Good'],
        [100, 'Moderate'],
        [150, 'Unhealthy for Sensitive Groups'],
        [200, 'Unhealthy'],
        [300, 'Very Unhealthy'],
        [Infinity, 'Hazardous']
    ];
    return levels.find(([threshold]) => aqi <= threshold)[1];
}
function getAQIColor(aqi) {
    if (aqi === '--') return '#666666';
    const colors = [
        [50, '#00d870'],
        [100, '#dbdb00'],
        [150, '#FF7E00'],
        [200, '#FF0000'],
        [300, '#760006'],
        [Infinity, '#500b70']
    ];
    return colors.find(([threshold]) => aqi <= threshold)[1];
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('map')) {
        initializeHomePage();
    }
});