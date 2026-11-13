
import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import './App.css';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ambulanceIcon = new L.DivIcon({
  className: 'ambulance-pin-wrap',
  html: '<div class="ambulance-pin">🚑</div>',
  iconSize: [44, 44],
  iconAnchor: [22, 22]
});

const hospitalIcon = new L.DivIcon({
  className: 'hospital-pin-wrap',
  html: '<div class="hospital-pin">✚</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const clearanceSteps = [
  { value: 'EMERGENCY_RECEIVED', label: 'Emergency received' },
  { value: 'OFFICER_ASSIGNED', label: 'Officer assigned' },
  { value: 'TRAFFIC_CLEARING', label: 'Traffic clearing' },
  { value: 'ROUTE_CLEARED', label: 'Route cleared' },
  { value: 'COMPLETED', label: 'Completed' }
];

function FollowAmbulance({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.panTo(position, { animate: true, duration: 0.5 });
    }
  }, [map, position[0], position[1]]);

  return null;
}

function formatTime(value) {
  if (!value) return 'Waiting for data';

  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function readableStatus(status) {
  return clearanceSteps.find(step => step.value === status)?.label
    || status?.replaceAll('_', ' ')
    || 'Unknown';
}

export default function App() {
  const [ambulance, setAmbulance] = useState(null);
  const [apiStatus, setApiStatus] = useState('connecting');
  const [lastError, setLastError] = useState('');

  const [clearance, setClearance] = useState(null);
  const [history, setHistory] = useState([]);
  const [officerName, setOfficerName] = useState('');
  const [notes, setNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [clearanceError, setClearanceError] = useState('');
  const [clearanceMessage, setClearanceMessage] = useState('');

  // Fetch the latest ambulance location.
  useEffect(() => {
    let active = true;

    async function loadLocation() {
      try {
        const response = await fetch(
          `${API_BASE}/api/ambulance/location`
        );

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();

        if (active) {
          setAmbulance(data);
          setApiStatus('online');
          setLastError('');
        }
      } catch (error) {
        if (active) {
          setApiStatus('offline');
          setLastError(error.message || 'Could not reach backend');
        }
      }
    }

    loadLocation();
    const timer = setInterval(loadLocation, 1000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  // Fetch clearance status and history from the backend.
  useEffect(() => {
    let active = true;

    async function loadClearance() {
      try {
        const response = await fetch(`${API_BASE}/api/clearance`);

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();

        if (active) {
          setClearance(data.clearance);
          setHistory(data.history || []);
          setClearanceError('');
        }
      } catch (error) {
        if (active) {
          setClearanceError(
            error.message || 'Could not load clearance information'
          );
        }
      }
    }

    loadClearance();
    const timer = setInterval(loadClearance, 3000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  async function updateClearance(nextStatus) {
    if (savingStatus) return;

    setSavingStatus(true);
    setClearanceError('');
    setClearanceMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/clearance`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: nextStatus,
          officerName,
          notes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not update clearance');
      }

      setClearance(data.clearance);
      setClearanceMessage(
        `Status updated: ${readableStatus(data.clearance.status)}`
      );

      // Refresh history after a successful update.
      const historyResponse = await fetch(
        `${API_BASE}/api/clearance/history`
      );

      if (historyResponse.ok) {
        setHistory(await historyResponse.json());
      }
    } catch (error) {
      setClearanceError(
        error.message || 'Could not save the clearance update'
      );
    } finally {
      setSavingStatus(false);
    }
  }

  const position = ambulance
    ? [Number(ambulance.latitude), Number(ambulance.longitude)]
    : [19.0176, 72.8562];

  const hospitalPosition = [19.026, 72.865];

  const sourceLabel =
    ambulance?.source === 'DEMO_SIMULATION'
      ? 'SIMULATED DEMO DATA'
      : 'DEVICE / MODEL DATA';

  const currentStatus = clearance?.status || 'EMERGENCY_RECEIVED';

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top">
          <span className="brand-icon">🚑</span>
          <span>
            <strong>Aarogya-Path</strong>
            <small>SMART EMERGENCY RESPONSE</small>
          </span>
        </a>

        <nav>
          <a href="#overview">Overview</a>
          <a href="#tracking">Live Tracking</a>
          <a href="#police-control">Police Control</a>
          <a href="#how-it-works">How It Works</a>
        </nav>

        <a className="topbar-cta" href="#police-control">
          Open Control View ↗
        </a>
      </header>

      <main id="top">
        <section className="hero" id="overview">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="pulse-dot" />
              IOT-POWERED EMERGENCY RESPONSE
            </div>

            <h1>
              Every second matters.
              <br />
              <em>Every route counts.</em>
            </h1>

            <p>
              Aarogya-Path connects ambulance location data with a traffic
              police dashboard, helping officers monitor an ambulance and
              coordinate manual traffic clearance.
            </p>

            <div className="hero-actions">
              <a className="button primary" href="#tracking">
                View ambulance location ↓
              </a>
              <a className="button light" href="#police-control">
                Police control panel
              </a>
            </div>

            <div className="hero-points">
              <span>✓ GPS location feed</span>
              <span>✓ Police clearance updates</span>
              <span>✓ ESP32-ready API</span>
            </div>
          </div>

          <div className="hero-panel">
            <div className="panel-top">
              <span><i className="live-dot" /> SYSTEM STATUS</span>
              <b className={apiStatus === 'online' ? 'good' : 'bad'}>
                {apiStatus === 'online'
                  ? 'API CONNECTED'
                  : apiStatus === 'connecting'
                    ? 'CONNECTING…'
                    : 'API OFFLINE'}
              </b>
            </div>

            <div className="panel-stat-row">
              <div>
                <small>AMBULANCE ID</small>
                <strong>{ambulance?.ambulanceId || 'AMB-102'}</strong>
              </div>
              <div>
                <small>VEHICLE STATUS</small>
                <strong className="green-text">
                  {ambulance?.status || 'WAITING'}
                </strong>
              </div>
            </div>

            <div className="panel-bottom">
              <span>
                Last update
                <br />
                <b>{formatTime(ambulance?.updatedAt)}</b>
              </span>
              <span>
                Speed
                <br />
                <b>{ambulance?.speedKmph ?? '—'} km/h</b>
              </span>
            </div>
          </div>
        </section>

        <section className="tracking-section section-wrap" id="tracking">
          <div className="section-heading">
            <div>
              <div className="eyebrow">LIVE MONITORING</div>
              <h2>Ambulance live tracking</h2>
              <p>
                Latest coordinates received by the Aarogya-Path backend.
              </p>
            </div>

            <div className={`connection-pill ${apiStatus}`}>
              <span />
              {apiStatus === 'online'
                ? 'Connected to API'
                : apiStatus === 'connecting'
                  ? 'Connecting to API'
                  : 'Backend unavailable'}
            </div>
          </div>

          {apiStatus === 'offline' && (
            <div className="error-banner">
              Cannot connect to the backend at {API_BASE}. Start the backend
              server first. Details: {lastError}
            </div>
          )}

          <div className="tracking-layout">
            <div className="map-frame">
              <MapContainer
                center={position}
                zoom={14}
                scrollWheelZoom={true}
                className="map"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <FollowAmbulance position={position} />

                <Marker key={`${position[0]}-${position[1]}`} position={position} icon={ambulanceIcon}>
                  <Popup>
                    <strong>{ambulance?.ambulanceId || 'AMB-102'}</strong>
                    <br />
                    Current ambulance position
                  </Popup>
                </Marker>

                <Marker position={hospitalPosition} icon={hospitalIcon}>
                  <Popup>Demo destination: City Hospital</Popup>
                </Marker>

                <Polyline
                  positions={[position, hospitalPosition]}
                  pathOptions={{
                    color: '#0c9a83',
                    weight: 5,
                    dashArray: '9 8'
                  }}
                />
              </MapContainer>

              <div className="map-legend">
                <span><i className="legend-ambulance">🚑</i> Ambulance</span>
                <span><i className="legend-hospital">✚</i> Demo hospital</span>
              </div>
            </div>

            <aside className="detail-column">
              <div className="detail-card">
                <div className="detail-title">
                  <span className="small-icon">⌖</span>
                  <div>
                    <small>TRACKED VEHICLE</small>
                    <h3>{ambulance?.ambulanceId || 'AMB-102'}</h3>
                  </div>
                </div>

                <div className="detail-line">
                  <span>Latitude</span>
                  <b>{ambulance ? Number(ambulance.latitude).toFixed(6) : '—'}</b>
                </div>
                <div className="detail-line">
                  <span>Longitude</span>
                  <b>{ambulance ? Number(ambulance.longitude).toFixed(6) : '—'}</b>
                </div>
                <div className="detail-line">
                  <span>Speed</span>
                  <b>{ambulance?.speedKmph ?? '—'} km/h</b>
                </div>
                <div className="detail-line">
                  <span>Vehicle status</span>
                  <b className="green-text">{ambulance?.status || 'WAITING'}</b>
                </div>
                <div className="detail-line">
                  <span>Data received</span>
                  <b>{formatTime(ambulance?.updatedAt)}</b>
                </div>

                <div className="source-tag">{sourceLabel}</div>
              </div>

              <div className="notice-card">
                <span>ⓘ</span>
                <p>
                  <strong>Demo disclaimer</strong>
                  <br />
                  The moving location is simulated until an ESP32/GPS device
                  sends real coordinates to the API.
                </p>
              </div>
            </aside>
          </div>
        </section>

        {/* TRAFFIC POLICE CONTROL PANEL */}
        <section className="police-section section-wrap" id="police-control">
          <div className="section-heading">
            <div>
              <div className="eyebrow">TRAFFIC POLICE OPERATIONS</div>
              <h2>Emergency clearance control</h2>
              <p>
                Officers can acknowledge the emergency and record each
                manual traffic-clearance stage.
              </p>
            </div>

            <div className="emergency-id">
              EMERGENCY ID
              <strong>{clearance?.emergencyId || 'EMG-102'}</strong>
            </div>
          </div>

          {clearanceError && (
            <div className="error-banner">{clearanceError}</div>
          )}

          {clearanceMessage && (
            <div className="success-banner">{clearanceMessage}</div>
          )}

          <div className="police-layout">
            <div className="police-card">
              <div className="police-card-heading">
                <span className="control-icon">🚦</span>
                <div>
                  <h3>Clearance status</h3>
                  <p>Update the status as the response progresses.</p>
                </div>
              </div>

              <div className="current-clearance">
                <span>Current status</span>
                <strong className={`status-chip ${currentStatus.toLowerCase()}`}>
                  {readableStatus(currentStatus)}
                </strong>
              </div>

              <div className="clearance-timeline">
                {clearanceSteps.map((step, index) => {
                  const currentIndex = clearanceSteps.findIndex(
                    item => item.value === currentStatus
                  );
                  const complete = index <= currentIndex;

                  return (
                    <div
                      className={`timeline-step ${complete ? 'complete' : ''} ${
                        step.value === currentStatus ? 'active' : ''
                      }`}
                      key={step.value}
                    >
                      <span className="timeline-marker">
                        {complete ? '✓' : index + 1}
                      </span>
                      <span>{step.label}</span>
                    </div>
                  );
                })}
              </div>

              <label className="field-label" htmlFor="officer-name">
                Traffic officer name
              </label>
              <input
                id="officer-name"
                className="police-input"
                type="text"
                maxLength={100}
                placeholder="Enter officer name"
                value={officerName}
                onChange={event => setOfficerName(event.target.value)}
              />

              <label className="field-label" htmlFor="clearance-notes">
                Clearance notes
              </label>
              <textarea
                id="clearance-notes"
                className="police-input police-textarea"
                maxLength={500}
                placeholder="Example: Traffic team informed at the main junction."
                value={notes}
                onChange={event => setNotes(event.target.value)}
                rows={3}
              />

              <div className="police-actions">
                <button
                  className="police-button secondary"
                  disabled={savingStatus}
                  onClick={() => updateClearance('OFFICER_ASSIGNED')}
                >
                  Acknowledge emergency
                </button>

                <button
                  className="police-button secondary"
                  disabled={savingStatus}
                  onClick={() => updateClearance('TRAFFIC_CLEARING')}
                >
                  Start clearing traffic
                </button>

                <button
                  className="police-button primary"
                  disabled={savingStatus}
                  onClick={() => updateClearance('ROUTE_CLEARED')}
                >
                  Mark route cleared
                </button>

                <button
                  className="police-button complete"
                  disabled={savingStatus}
                  onClick={() => updateClearance('COMPLETED')}
                >
                  Complete emergency
                </button>
              </div>

              {savingStatus && (
                <p className="saving-message">Saving status update…</p>
              )}
            </div>

            <div className="police-card history-card">
              <div className="police-card-heading">
                <span className="control-icon">📋</span>
                <div>
                  <h3>Clearance activity</h3>
                  <p>Recent updates recorded by the backend.</p>
                </div>
              </div>

              {!history.length ? (
                <p className="empty-history">No updates recorded yet.</p>
              ) : (
                <div className="history-list">
                  {history.map((item, index) => (
                    <article
                      className="history-item"
                      key={`${item.updatedAt}-${index}`}
                    >
                      <span className="history-dot" />
                      <div>
                        <strong>{readableStatus(item.status)}</strong>
                        <p>
                          {item.officerName || 'Officer not specified'}
                        </p>
                        {item.notes && <p>{item.notes}</p>}
                        <small>{formatTime(item.updatedAt)}</small>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <div className="manual-note">
                <strong>Manual clearance only</strong>
                <p>
                  This dashboard records the officer's updates. It does not
                  automatically control traffic signals or verify that a
                  road is physically clear.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="workflow section-wrap" id="how-it-works">
          <div className="section-heading">
            <div>
              <div className="eyebrow">THE WORKFLOW</div>
              <h2>From GPS signal to traffic clearance</h2>
              <p>A starter architecture for your physical model.</p>
            </div>
          </div>

          <div className="steps-grid">
            <article>
              <span>01</span>
              <div className="step-icon">📡</div>
              <h3>Collect coordinates</h3>
              <p>An ESP32 and GPS module provide latitude and longitude.</p>
            </article>
            <article>
              <span>02</span>
              <div className="step-icon">🔌</div>
              <h3>Send to API</h3>
              <p>The device posts JSON coordinates to the Express backend.</p>
            </article>
            <article>
              <span>03</span>
              <div className="step-icon">🗺️</div>
              <h3>Monitor location</h3>
              <p>The website polls the API and updates the ambulance marker.</p>
            </article>
            <article>
              <span>04</span>
              <div className="step-icon">🚦</div>
              <h3>Coordinate clearance</h3>
              <p>Traffic officers record their actions and confirm route clearance.</p>
            </article>
          </div>
        </section>

        <section className="api-note section-wrap">
          <div>
            <div className="eyebrow">INTEGRATION READY</div>
            <h2>Your model can feed this dashboard.</h2>
            <p>
              Use <code>POST /api/ambulance/location</code> to send the latest
              coordinates. See the included README for an example.
            </p>
          </div>
          <div className="api-badge">
            <span>POST</span>
            <code>/api/ambulance/location</code>
          </div>
        </section>
      </main>

      <footer>
        <a className="brand footer-brand" href="#top">
          <span className="brand-icon">🚑</span>
          <span>
            <strong>Aarogya-Path</strong>
            <small>SMART EMERGENCY RESPONSE</small>
          </span>
        </a>
        <span>IoT-Based Ambulance Traffic Management · Student Project</span>
        <span>© 2026 Aarogya-Path</span>
      </footer>
    </div>
  );
}
