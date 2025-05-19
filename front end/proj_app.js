// navigation b/w pgs + nav buttons
document.addEventListener('DOMContentLoaded', function() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const pages = document.querySelectorAll('.page');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const pageId = this.dataset.page + '-page';
            pages.forEach(page => {
                page.classList.remove('active-page');
                if (page.id === pageId) {
                    page.classList.add('active-page');
                }
            });
            
            const titleMap = {
                'home': 'Global Air Quality Monitor',
                'about': 'About Air Quality',
                'city': 'Air Quality Data By City'
            };
            document.getElementById('main-title').textContent = titleMap[this.dataset.page];
            
            if (this.dataset.page === 'city') {
                initializeCityPage();
            }
        });
    });
    
    if (document.getElementById('map')) {
        initializeMap();
    }
    initializeHomePage();
});

// aqi info
function getAQIStatus(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
}

function getAQIColor(aqi) {
    if (aqi <= 50) return '#00d870';
    if (aqi <= 100) return '#dbdb00';
    if (aqi <= 150) return '#FF7E00';
    if (aqi <= 200) return '#FF0000';
    if (aqi <= 300) return '#760006';
    return '#500b70';
}

let cityDataCache = {};

// getting map
function initializeMap() {
    const map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    window.aqiMap = map;
}

// home pg 
function initializeHomePage() {
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
    
    const container = document.getElementById('city-cards');
    container.innerHTML = '<div class="loading">Loading city data...</div>';
    
    if (window.aqiMap) {
        window.aqiMap.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                window.aqiMap.removeLayer(layer);
            }
        });
    }
    
    const fetchPromises = cities.map(city => {
        return fetchCityData(city)
            .then(data => {
                cityDataCache[city] = data;
                addCityToMap(data);
                return data;
            })
            .catch(error => {
                console.error(`Error fetching data for ${city}:`, error);
                const fallbackData = {
                    name: city,
                    aqi: '--',
                    dominantPol: 'Data unavailable',
                    time: '--',
                    lat: null,
                    lon: null
                };
                cityDataCache[city] = fallbackData;
                return fallbackData;
            });
    });
    
    Promise.all(fetchPromises).then(citiesData => {
        container.innerHTML = '';
        citiesData.forEach(cityData => {
            updateCityCard(cityData);
        });
        
        if (window.aqiMap) {
            const validCities = citiesData.filter(city => city.lat && city.lon);
            if (validCities.length > 0) {
                const markers = validCities.map(city => L.latLng(city.lat, city.lon));
                window.aqiMap.fitBounds(L.latLngBounds(markers));
            }
        }
    });
}

// uses backend api
async function fetchCityData(cityName) {
    try {
        const response = await fetch(`http://localhost:3000/cities?name=${encodeURIComponent(cityName)}`);
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        if (!data) throw new Error('no data received from API');
        
        return {
            name: cityName,
            aqi: data.aqi || '--',
            dominantPol: data.dominantPol || 'unknown',
            time: data.time || new Date().toLocaleString(),
            lat: data.lat || null,
            lon: data.lon || null
        };
    } catch (error) {
        console.error(`error fetching data for ${cityName}:`, error);
        return {
            name: cityName,
            aqi: '--',
            dominantPol: 'API unavailable',
            time: new Date().toLocaleString(),
            lat: null,
            lon: null
        };
    }
}


// report submissions go to backend
async function submitReport(reportData) {
    try {
        const response = await fetch('/reports', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                city_name: reportData.city,
                user_name: reportData.user_name,
                report_text: reportData.report_text,
                reported_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'failed to submit report');
        }

        return await response.json();
    } catch (error) {
        console.error('report submission error:', error);
        throw error;
    }
}

// city markers
function addCityToMap(cityData) {
    if (!cityData.lat || !cityData.lon || !window.aqiMap) return;
    
    const marker = L.marker([cityData.lat, cityData.lon]).addTo(window.aqiMap);
    marker.bindPopup(`
        <b>${cityData.name}</b><br>
        AQI: <span style="color:${getAQIColor(cityData.aqi)}">${cityData.aqi}</span><br>
        Status: ${getAQIStatus(cityData.aqi)}<br>
        <button onclick="showCity('${cityData.name}')">View Details</button>
    `);
}

// city aqi preview
function updateCityCard(cityData) {
    const container = document.getElementById('city-cards');
    const card = document.createElement('div');
    card.className = 'city-card';
    card.innerHTML = `
        <h3>${cityData.name}</h3>
        <p>AQI: <span style="color:${getAQIColor(cityData.aqi)}">${cityData.aqi}</span></p>
        <p>Status: ${getAQIStatus(cityData.aqi)}</p>
        <p>Main Pollutant: ${cityData.dominantPol}</p>
    `;
    card.addEventListener('click', () => showCity(cityData.name));
    container.appendChild(card);
}

// city details redirect
function showCity(cityName) {
    document.querySelector('.nav-btn[data-page="city"]').click();
    document.getElementById('city-selector').value = cityName;
    document.getElementById('load-city-btn').click();
}

// city pg
function initializeCityPage() {
    const cityContent = document.querySelector('.city-content');
    const citySelector = document.getElementById('city-selector');
    const loadCityBtn = document.getElementById('load-city-btn');
    
    loadCityBtn.addEventListener('click', function() {
        const selectedCity = citySelector.value;
        loadCityData(selectedCity);
    });
    
    citySelector.addEventListener('change', function() {
        const selectedCity = citySelector.value;
        loadCityData(selectedCity);
    });
    
    async function loadCityData(cityName) {
        const statusElement = document.getElementById('aqi-status');
        statusElement.textContent = 'Loading...';
        statusElement.style.color = '#000';
        
        try {
            let cityData = cityDataCache[cityName];
            if (!cityData) {
                cityData = await fetchCityData(cityName);
                cityDataCache[cityName] = cityData;
            }
            
            updateCityDisplay(cityData);
            cityContent.classList.add('show-data');
        } catch (error) {
            console.error('error loading city data:', error);
            statusElement.textContent = 'error loading data';
            statusElement.style.color = '#FF0000';
        }
    }
    
    function updateCityDisplay(cityData) {
        document.getElementById('city-title').textContent = `${cityData.name} Air Quality`;
        document.getElementById('aqi-value').textContent = cityData.aqi;
        document.getElementById('dominant-pol').textContent = cityData.dominantPol;
        document.getElementById('last-updated').textContent = cityData.time;
        
        const statusElement = document.getElementById('aqi-status');
        statusElement.textContent = getAQIStatus(cityData.aqi);
        statusElement.style.color = getAQIColor(cityData.aqi);
        
        updateChart(cityData.aqi);
    }
    
    function updateChart(aqiValue) {
        const ctx = document.getElementById('aqi-chart').getContext('2d');
        
        if (window.aqiChart) {
            window.aqiChart.destroy();
        }
        
        const historicalData = Array(7).fill(0).map((_, i) => {
            const variation = (Math.random() - 0.5) * 20;
            return Math.max(0, Math.round((aqiValue || 50) + (i - 3) * 5 + variation));
        });
        
        window.aqiChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['6am', '9am', '12pm', '3pm', '6pm', '9pm', '12am'],
                datasets: [{
                    label: 'AQI (Last 24 Hours)',
                    data: historicalData,
                    borderColor: '#3498db',
                    tension: 0.1,
                    fill: true,
                    backgroundColor: '#349cdb'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: '#000000'
                        }
                    },
                    x: {
                        grid: {
                            color: '#000000'
                        }
                    }
                }
            }
        });
    }
    
    // report form submission
    document.getElementById('report-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'submitting..';
        
        const cityName = citySelector.value;
        const userName = document.getElementById('user-name').value;
        const reportText = document.getElementById('user-report').value;
        
        try {
            await submitReport({
                city: cityName,
                user_name: userName,
                report_text: reportText
            });
            
            alert(`Thank you for your report about ${cityName}!`);
            this.reset();
        } catch (error) {
            console.error('Report submission failed:', error);
            alert(`Submission failed: ${error.message || 'please try again later.'}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
}