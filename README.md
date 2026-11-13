# Aarogya-Path – IoT-Based Ambulance Tracking System

## Project Overview
Aarogya-Path is an IoT-based ambulance tracking and monitoring system designed to display ambulance location information on a web-based dashboard.

The system uses an ESP32 microcontroller integrated with a NEO-6M GPS module to obtain geographical coordinates. These coordinates are transmitted to a backend server and displayed dynamically on an interactive map.

## Key Features
- Real-time ambulance location tracking using GPS.
- ESP32-based hardware integration.
- Dynamic latitude and longitude updates.
- Ambulance speed and vehicle status display.
- Interactive map with Leaflet and OpenStreetMap.
- Backend API for receiving and providing ambulance coordinates.
- Web-based ambulance monitoring dashboard.

## Technology Stack

**Hardware**
- ESP32
- NEO-6M GPS Module
- USB connection for programming and testing

**Embedded Programming**
- Arduino IDE
- Arduino C/C++

**Frontend**
- React.js
- Vite
- JavaScript
- Leaflet
- OpenStreetMap

**Backend**
- Node.js
- Express.js
- REST API
- JSON

## System Workflow
1. The NEO-6M GPS module receives geographical coordinates.
2. The ESP32 processes the GPS data.
3. The ESP32 sends ambulance location information to the backend API.
4. The backend receives and updates the latest ambulance coordinates.
5. The frontend retrieves the updated information.
6. The ambulance location is displayed dynamically on the website map.

## Project Structure
```text
Aarogya-Path/
├── backend/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Running the Project

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
Open another terminal:
```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite in your browser.

## Hardware Integration
The physical prototype was tested using an ESP32 and NEO-6M GPS module programmed through Arduino IDE.

GPS readings were visible in the Arduino Serial Monitor, and successful HTTP responses confirmed that location data was received by the Aarogya-Path backend and reflected on the website.

## Project Objective
The objective is to demonstrate how IoT hardware, GPS technology and web development can work together to provide ambulance location monitoring through an interactive dashboard.

## Future Enhancements
- Integration with real traffic management systems.
- Route optimization for emergency vehicles.
- Emergency notifications and alerts.
- Deployment to a cloud server for remote monitoring.

## Developer
**Sayli Krishnadev Shelar**
