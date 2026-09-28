# BHU-DRISHTI — Public Safety & Mine Monitoring Platform

AI-powered, low-cost mine subsidence monitoring and early-warning platform — **Team VEYRONIX**.
Prototype: all map zones are **simulated demo sites**; the hardware prototype rig streams real sensor data.

## Quick start

```bash
npm install
cp .env.example .env        # optional — sensible defaults work without it
npm run dev                  # http://localhost:3000
```

| What | Where |
|---|---|
| Public portal | `/` · `/live` · `/alerts` · `/regions` · `/how-it-works` · `/safety` · `/about` |
| Authority dashboard | `/login?role=authority` → `/authority/dashboard` (demo login `authority` / `authority@123`) |
| Mine operator dashboard | `/login?role=operator` → `/operator/dashboard` (demo login `operator` / `operator@123`) |
| Emergency view (control room) | `/emergency` (after login) |
| System health | `/system-health` (after login) |
| Original prototype console (unchanged) | `/operator/console` |
| Grafana (technical control room) | `docker compose up -d postgres grafana` → http://localhost:3001 |

Production: `npm run build && npm start`.

## Demo mode (for presentations)

Every screen shows a **DEMO DATA** tag. Use the **Demo** button (bottom-right) to switch scenarios — all
open screens update together because the simulation runs on the server:

| Scenario | What happens |
|---|---|
| Normal | All zones green |
| Warning | Korba Zone B ramps to amber → warning alert |
| Critical | Raniganj Zone B escalates WARNING → CRITICAL (correlated tilt + vibration + displacement + crack), alert escalates, AI forecast rises, map marker turns red; Korba stays amber |
| Sensor fault | One node's tilt sensor drifts; fusion suppresses the false alarm and flags the sensor for maintenance |
| Internet offline | Gateways keep logging + local LED/buzzer; cloud data freezes, SMS/e-mail queue; on restore the backlog syncs |

Set `DEMO_CONTROLS=staff` to require login for demo controls.

## Architecture

```
Sensor nodes (MPU6050 · piezo · potentiometers) → Arduino Nano → LoRa RA-02
  → Raspberry Pi gateway (local SQLite, LED/buzzer, Grafana)            ← works offline
  → Backend API (Express, /api/sensor-data ingestion, fusion, alert engine, prediction)
  → BHU-DRISHTI web platform → Public / Authority / Mine operator
```

### Code map (new platform)

| Path | Purpose |
|---|---|
| `server/platform/engine.ts` | Multi-site engine: demo zones, live prototype zone (from `telemetryStore`), offline-first sync, alerts, incidents |
| `server/platform/fusion.ts` | Multi-sensor fusion (≥ 2 corroborating signals required to alarm) |
| `server/platform/predictor.ts` | Risk forecast. Simulated trend baseline; plug the LSTM in via `AI_PREDICT_URL` |
| `server/platform/aiSummary.ts` | Optional OpenAI narrative (server-side key only; numbers never come from the LLM) |
| `server/platform/auth.ts` | Prototype role login (HMAC-signed session tokens) — **not production-grade** |
| `server/platform/routes.ts` | REST API at `/api/v1` |
| `src/platform/services/api.ts` | Single frontend API layer (`VITE_API_BASE_URL`) |
| `src/platform/pages/{public,authority,operator,shared}` | Pages |
| `src/platform/components` | `RiskBadge`, `MetricCard`, `StatusCard`, `MonitoringMap`, `TelemetryChart`, `PredictionChart`, `NodeTable`, `SensorHealthCard`, `GatewayStatusPanel`, `IncidentTimeline`, `ArchitectureDiagram`, `FusionDiagram`, … |
| `src/legacy/LegacyApp.tsx` | Original single-page console, preserved |

### Platform API (`/api/v1`)

Public (no auth, non-technical data only): `GET /public/summary`, `/public/zones`, `/public/regions`, `/public/alerts`, `GET /meta`, `GET|POST /demo`, `POST /demo/reset`.
Auth: `POST /auth/login`, `GET /auth/me`.
Authority + operator (Bearer token): `GET /zones`, `/zones/:id`, `PATCH /zones/:id` (operator), `/regions`, `/nodes`, `/nodes/:id`, `/telemetry?nodeId=|zoneId=&range=`, `/alerts`, `POST /alerts/:id/acknowledge`, `POST /alerts/:id/resolve`, `/predictions`, `/predictions/:zoneId`, `/gateways`, `/gateways/:id`, `POST /gateways/:id/silence`, `/system-health`, `/incidents`, `/incidents/:id`, `/reports?period=daily|weekly`, `POST /ai/summary`.

The original endpoints below (`/api/sensor-data`, `/api/telemetry/ingest`, `/api/gateway/heartbeat`, `/api/grafana/*`, …) are unchanged, so the Raspberry Pi scripts keep working.

### Potentiometer units (bug fix)
The ML engine treated any potentiometer value ≤ 50 as millimetres, so raw ADC readings in the normal range (5–25) were scored as 5–25 mm → **CRITICAL**. Ingestion now accepts `pot_unit: "adc" | "mm" | "auto"`; the built-in simulator sends `adc`, and the Pi scripts send `POT_UNIT` (env, default `auto` = old behaviour for backwards compatibility). **Set `POT_UNIT=adc` on the Raspberry Pi** when the Arduino sends raw ADC values.

### Honesty notes
- Demo zones, regions, incidents and SMS/e-mail delivery are simulated and labelled as such.
- AI forecasts are labelled **SIMULATED PREDICTION** until a real model is connected via `AI_PREDICT_URL`.
- Prototype authentication only. `firebase-applet-config.json` contains a Firebase *web* config (public by design) used by the classic console.

---

# Original prototype documentation

# BHU-DRISHTI — IoT Ground Movement & Early-Warning Monitoring System

An end-to-end geotechnical hazard monitoring and analytical early-warning platform designed for landslide-prone slopes, open-pit mines, and civil infrastructure.

---

## 1. Hardware & System Architecture

```text
  [Field Sensor Unit]
     Arduino Nano
          ↓
  MPU6050 (3-Axis Accel/Gyro) + Potentiometer (Shear Displacement)
          ↓
  LoRa Transmitter (SX1278 433MHz)
          ↓ (Long-Range Radio)
  [Base Station Gateway]
     Arduino Mega (LoRa Receiver)
          ↓ USB Serial (/dev/ttyACM0 @ 115200 baud)
  Raspberry Pi 3B Gateway
     ├── Local SQLite DB (Offline-First Storage)
     ├── Local Hardware Alarm (Green / Yellow / Red LEDs + Buzzer)
     └── Cloud Sync Service (Auto-buffering with retry backoff)
          ↓ HTTP REST / JSON Telemetry Stream
  [Cloud & Analytical Dashboard]
     Node.js / Express Server + Vite React 18
     ├── Google Cloud SQL (PostgreSQL) Database Engine
     ├── Grafana Cloud / Local 10-Panel Analytical Dashboard
     └── Dual AI Engine (Local Random Forest + Gemini 3.6 Geotechnical Model)
```

### Sensor Payload Definition
Every packet transmitted from the Arduino Nano across LoRa contains:
`timestamp,ax,ay,az,pot`
- `timestamp`: Sensor reading ISO or relative epoch timestamp
- `ax`: Acceleration along the transverse axis ($m/s^2$)
- `ay`: Acceleration along the slope gradient / longitudinal axis ($m/s^2$)
- `az`: Acceleration along the vertical gravity axis ($m/s^2$)
- `pot`: Direct shear displacement sensor (ADC 0–1023 or calibrated mm)

Derived kinematic features calculated at the Raspberry Pi & Backend:
- $\text{Acceleration Magnitude} = \sqrt{a_x^2 + a_y^2 + a_z^2}$
- $\text{Acceleration Deviation} = | \text{Magnitude} - 9.806\ m/s^2 |$
- $\text{Tilt Angle} = \text{atan2}(\sqrt{a_x^2 + a_y^2},\ |a_z|) \times \frac{180}{\pi}$

---

## 2. Local Development Setup

### Prerequisites
- Node.js 18+ or 20+
- Python 3.9+ (for Pi scripts & AI microservice)
- Docker & Docker Compose (optional for full containerized stack)

### Quickstart
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Start development server (port 3000)
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Raspberry Pi 3B Gateway Deployment

The Raspberry Pi 3B operates as the on-site base station. It connects to the Arduino Mega via USB serial and runs an offline-first storage and alarm system.

### Hardware Wiring (Raspberry Pi 3B BCM GPIO)
- **Pin 17 (GPIO 17)**: GREEN LED (Normal State)
- **Pin 27 (GPIO 27)**: YELLOW LED (Warning State)
- **Pin 22 (GPIO 22)**: RED LED (Critical State)
- **Pin 23 (GPIO 23)**: Active Buzzer (Engages **only** when system reaches RED / Critical)
- **Pin 6 / 9 / 14 / 20**: Ground (GND)

### Installation on Raspberry Pi
```bash
cd pi/
pip3 install -r requirements.txt

# Run serial receiver and local alarm
python3 serial_receiver.py

# In background / systemd service, run cloud synchronizer:
python3 cloud_sync.py
```

### Offline-First Behavior
If cellular or Wi-Fi internet drops, the Raspberry Pi continues logging all data to `/home/pi/bhu_drishti/local_telemetry.db` and drives the physical LEDs and Buzzer independently. Once connectivity returns, `cloud_sync.py` bursts the backlog queue to the cloud endpoint without loss.

---

## 4. Cloud SQL (PostgreSQL) Setup & Relational Storage

High-frequency telemetry, alerts, and operator actions are persisted into Google Cloud SQL (PostgreSQL):
- **Tables**: `sensor_nodes`, `telemetry_records`, `geotechnical_alerts`, `users`
- **ORM**: Drizzle ORM with zero data loss during network reconnects
- **Proxy**: Connected securely via Cloud SQL Auth Proxy Unix socket or TCP port 5432
```bash
# Local Docker Postgres (optional offline local testing)
docker compose up -d postgres
```

---

## 5. Grafana Integration & Cloud

BHU-DRISHTI provides a complete 10-panel Grafana dashboard:
1. **Panel 1**: Ax / Ay / Az Telemetry (MPU6050 Accelerometer)
2. **Panel 2**: Potentiometer Physical Shear Displacement
3. **Panel 3**: Acceleration Magnitude $|\vec{a}| = \sqrt{A_x^2 + A_y^2 + A_z^2}$
4. **Panel 4**: Acceleration Deviation $|\ |\vec{a}| - 9.806\ m/s^2 |$
5. **Panel 5**: Current Geotechnical Risk Score (0–100 Gauge)
6. **Panel 6**: Geotechnical Risk Status (Discrete Normal / Warning / Critical)
7. **Panel 7**: Node Activity & Online Sensors Count
8. **Panel 8**: Data Ingestion Rate (packets / min)
9. **Panel 9**: Historical Risk Score & Trend Timeline
10. **Panel 10**: End-to-End System Health

### Import to Grafana
- Local Grafana: Automatically provisioned via `grafana/provisioning/`
- Grafana Cloud: Download the JSON file from the dashboard (`GET /api/grafana/dashboard-json` or through the Grafana tab) and import into your Grafana instance.

---

## 6. AI Model Pipeline & Retraining

### Dual-Layer AI Architecture
1. **Local ML Classifier (Random Forest)**:
   - Microsecond inference latency.
   - Evaluates `ax, ay, az, pot, magnitude, deviation, tilt`.
   - Generates deterministic numeric `risk_score` (0–100%), `confidence` (85–98%), and status (`NORMAL`, `WARNING`, `CRITICAL`).
   - Feature Importance:
     - Acceleration Deviation ($\Delta g$): 38%
     - Potentiometer Displacement: 28%
     - Ax (Transverse Shear): 14%
     - Ay (Down-Slope Thrust): 12%
     - Az (Vertical Lift/Settlement): 8%

2. **Cloud Geotechnical Narrative (Gemini 3.6 Flash)**:
   - Translates raw kinematic readings into actionable geological context for field engineers.

### Retraining on Real Field Data
```bash
cd ai/
# Train new model from collected database records
python3 train_model.py
```
*Honest Model Disclosure*: The default shipped prototype model is calibrated on synthetic geotechnical validation sets. The retraining pipeline allows immediate replacement with empirical field data as more borehole logs are captured.

---

## 7. Demo vs Live Mode

Toggle between modes directly in the dashboard header:
- **DEMO MODE**: Automatically steps through a realistic cyclical sequence:
  `NORMAL` (stable baseline) $\rightarrow$ `WARNING` (embankment creep) $\rightarrow$ `CRITICAL` (shear slip) $\rightarrow$ `WARNING` $\rightarrow$ `NORMAL`.
- **LIVE MODE**: Silences synthetic generator and accepts real sensor telemetry over `POST /api/telemetry/ingest` from the Raspberry Pi 3B.

---

## 8. REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Core system health, database & AI status |
| `GET` | `/api/sensors/latest` | Latest reading for all monitored nodes |
| `GET` | `/api/sensors/history?range=30m` | Time-series telemetry (5m, 30m, 1h, 6h, 24h) |
| `POST` | `/api/telemetry/ingest` | Real sensor payload receiver from Raspberry Pi |
| `POST` | `/predict` | ML Model inference API (`ax, ay, az, pot`) |
| `POST` | `/api/ai-risk` | Gemini 3.6 Flash geotechnical narrative model |
| `GET` | `/api/grafana/dashboard-json`| Download complete 10-panel Grafana JSON |
| `GET` | `/api/export-project-zip` | Download complete project repository archive |

---

## 9. Troubleshooting

- **No Serial Data on Pi**: Check `dmesg | grep tty` to verify whether the Arduino Mega is mounted on `/dev/ttyACM0` or `/dev/ttyUSB0`. Set `export SERIAL_PORT=/dev/ttyUSB0`.
- **Buzzer Continuously Sounding**: A critical condition is triggered if displacement $\ge 7.5\text{ mm}$ or deviation $\ge 1.0\text{ m/s}^2$. Silence via UI or `/api/alarm/silence`.
- **Database Connection Error**: Verify `SQL_HOST`, `SQL_USER`, and `SQL_DB_NAME` are configured or ensure the Cloud SQL Auth Proxy is running.
