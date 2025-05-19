import { createServer } from 'http';
import url from 'url';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://aaegqouodiyrscgljpla.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZWdxb3VvZGl5cnNjZ2xqcGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MDg4NDQsImV4cCI6MjA2MzE4NDg0NH0.Ta4Zo6Bhxz3tJ8IWy6DBAXdEsRd4WCxffACap26ILAg';
const AQICN_TOKEN = process.env.AQICN_TOKEN || '571ea4d2d9cab6f38be24b287f2f0c7a97f61c11';

// supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function sendJSON(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', 
  });
  res.end(JSON.stringify(data));
}

// city data from supabase or backup to api
async function getCityData(cityName) {
  let { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('name', cityName)
    .single();

  if (error || !data) {
    const aqiResponse = await fetch(
      `https://api.waqi.info/feed/${encodeURIComponent(cityName)}/?token=${AQICN_TOKEN}`
    );
    const aqiData = await aqiResponse.json();

    if (aqiData.status === 'ok') {
      return {
        name: cityName,
        aqi: aqiData.data.aqi,
        dominantPol: aqiData.data.dominentpol,
        time: aqiData.data.time.s,
        lat: aqiData.data.city.geo[0],
        lon: aqiData.data.city.geo[1],
      };
    } else {
      return {
        name: cityName,
        aqi: '--',
        dominantPol: 'Unknown',
        time: new Date().toISOString(),
        lat: null,
        lon: null,
      };
    }
  }
  return data;
}

// server req
async function handler(req, res) {
  const parsedUrl = url.parse(req.url, true);
  
  if (req.method === 'GET' && parsedUrl.pathname === '/cities') {
    const cityName = parsedUrl.query.name;
    if (!cityName) {
      sendJSON(res, { error: 'missing city name' }, 400);
      return;
    }
    try {
      const cityData = await getCityData(cityName);
      sendJSON(res, cityData);
    } catch (err) {
      sendJSON(res, { error: 'failed to fetch city data' }, 500);
    }
  }
  else if (req.method === 'GET' && parsedUrl.pathname === '/reports') {
    sendJSON(res, { message: 'reports endpoint not implemented' }, 501);
  }
  else {
    sendJSON(res, { error: '404 error: not found' }, 404);
  }
}
// start server
const PORT = process.env.PORT || 3000;

createServer(handler).listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}/`);
});
