
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Latest ambulance location
let ambulance = {
  ambulanceId: 'AMB-102',
  latitude: 19.0176,
  longitude: 72.8562,
  speedKmph: 32,
  status: 'ON_ROUTE',
  source: 'DEMO_SIMULATION',
  updatedAt: new Date().toISOString()
};

// Police clearance information for the active emergency
let clearance = {
  emergencyId: 'EMG-102',
  ambulanceId: 'AMB-102',
  status: 'EMERGENCY_RECEIVED',
  officerName: '',
  notes: '',
  updatedAt: new Date().toISOString()
};

const allowedStatuses = [
  'EMERGENCY_RECEIVED',
  'OFFICER_ASSIGNED',
  'TRAFFIC_CLEARING',
  'ROUTE_CLEARED',
  'COMPLETED'
];

const clearanceHistory = [];

function recordClearance() {
  clearanceHistory.unshift({ ...clearance });
  if (clearanceHistory.length > 100) {
    clearanceHistory.pop();
  }
}

recordClearance();

// Simulated movement for development only
const demoMode = process.env.DEMO_MODE !== 'false';

if (demoMode) {
  setInterval(() => {
    ambulance = {
      ...ambulance,
      latitude: ambulance.latitude + (Math.random() - 0.5) * 0.00012,
      longitude: ambulance.longitude + (Math.random() - 0.5) * 0.00012,
      updatedAt: new Date().toISOString(),
      source: 'DEMO_SIMULATION'
    };
  }, 5000);
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'Aarogya-Path API',
    time: new Date().toISOString()
  });
});

// Ambulance location
app.get('/api/ambulance/location', (_req, res) => {
  res.json(ambulance);
});

// Receive GPS coordinates from ESP32 or another device
app.post('/api/ambulance/location', (req, res) => {
  const {
    ambulanceId,
    latitude,
    longitude,
    speedKmph,
    status
  } = req.body ?? {};

  const lat = Number(latitude);
  const lon = Number(longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 || lat > 90 ||
    lon < -180 || lon > 180
  ) {
    return res.status(400).json({
      error: 'Valid latitude and longitude are required.'
    });
  }

  ambulance = {
    ambulanceId: String(ambulanceId || ambulance.ambulanceId),
    latitude: lat,
    longitude: lon,
    speedKmph: Number.isFinite(Number(speedKmph))
      ? Number(speedKmph)
      : 0,
    status: String(status || 'ON_ROUTE').toUpperCase(),
    source: 'DEVICE_OR_MODEL',
    updatedAt: new Date().toISOString()
  };

  res.json({
    ok: true,
    message: 'Ambulance location updated',
    ambulance
  });
});

// Read the current police clearance status
app.get('/api/clearance', (_req, res) => {
  res.json({
    clearance,
    history: clearanceHistory
  });
});

// Update police clearance status
app.patch('/api/clearance', (req, res) => {
  const { status, officerName, notes } = req.body ?? {};

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      error: 'Invalid clearance status.',
      allowedStatuses
    });
  }

  clearance = {
    ...clearance,
    status,
    officerName:
      typeof officerName === 'string'
        ? officerName.trim().slice(0, 100)
        : clearance.officerName,
    notes:
      typeof notes === 'string'
        ? notes.trim().slice(0, 500)
        : clearance.notes,
    updatedAt: new Date().toISOString()
  };

  recordClearance();

  res.json({
    ok: true,
    message: 'Clearance status updated',
    clearance
  });
});

app.get('/api/clearance/history', (_req, res) => {
  res.json(clearanceHistory);
});

app.listen(PORT, () => {
  console.log(`Aarogya-Path backend running at http://localhost:${PORT}`);
  console.log(`Demo mode: ${demoMode ? 'ON (simulated location)' : 'OFF'}`);
});
