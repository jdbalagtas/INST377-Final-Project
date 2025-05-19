# INST377 - Final Project
# Global Air Quality Monitor
### By Joshua Balagtas, Maya Mistry

## Project Description
For our project, we would like to introduce our Air Quality Tracker, which aims to address and serve the growing issues of air pollution and the lack of real-time information about your local air quality. Many individuals everywhere have underlying conditions that can be affected by their local air quality, possibly making it a health hazard, on the other hand, there are many outdoor enthusiasts and planners that would also need reliable data and information about their local air quality. Our web application will provide that real-time data, in order to benefit many different kinds of people and provide them with the right information about their area, covering over 1,000 cities using the Air Quality Programmic API. Our web app features an interactive map with Leaflet.js, real-time data charts with Chart.js, and all user report submissions are stored in Supabase. 

### Target Browsers:
#### Our web application is designed to be accessible on all major modern browsers across multiple platforms, including Google Chrome, Safari, Firefox, and Microsoft Edge. It will also be fully responsive and optimized for both iOS and Android devices.

## Developer Manual
### Installation Guide

#### Setup Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/jdbalagtas/INST377-Final-Project.git
   cd inst377_proj


2. Install the required packages:
run these commands in your terminal: 
npm install node-fetch
npm install @supabase/supabase-js

3. Create a .env file in the root directory with required variables such as:
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

4. start and run backend server
run this command in your terminal: node backend.js
- By default, the backend runs on http://localhost:3000


### API Endpoints
All API requests are handled through the `backend.js` server running at `http://localhost:3000`.

#### GET /api/airquality/:city
- **Description:** Retrieves real-time air quality data for a specified city.
- **Params:** `:city` – the name of the city.
- **Returns:** JSON object with air quality from an external API.

#### POST /api/reports
- **Description:** Submits a user report about air quality to Supabase.
- **Returns:** Confirmation of data submission.

#### GET /api/reports
- **Description:** Fetches all user-submitted reports from Supabase.
- **Returns:** An array of reports.

### Known Issues
- If the backend server is not properly running, the API will not be available to provide real-time data.
- The city search bar is case-sensitive and may return errors for lowercase entries.
- API rate limits may cause occasional fetch errors if too many requests are made in a short time (limit is 1000 requests a day)
- On some mobile devices, the dimensions might appear skewed. 

