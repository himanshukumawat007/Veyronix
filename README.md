# Mine Subsidence Monitoring

BHU-DRISHTI / mine subsidence monitoring project combining:

- Arduino sensor nodes using MPU6050 + potentiometer
- LoRa communication
- Arduino Mega gateway with local LED/buzzer alerts
- Raspberry Pi PostgreSQL + CSV data logging
- React/Vite monitoring dashboard
- AI/ML components
- Grafana visualization

## Project structure

```text
Mine-Subsidence-Monitoring/
├── Arduino/
│   ├── Node1/
│   │   └── node1.ino
│   ├── Node2/
│   │   └── node2.ino
│   └── Gateway/
│       └── gateway.ino
│
├── Raspberry-Pi/
│   └── data_logger.py
│
├── Database/
│   └── schema.sql
│
├── Grafana/
│   └── dashboard.json
│
├── Dashboard/
│   └── BHU-DRISHTI web platform
│
└── README.md
```

## Arduino

### Node 1 / Node 2

Each node reads:

- Potentiometer on A0
- MPU6050 over I2C
- LoRa at 433 MHz

Packets are sent every 3 seconds in this format:

```text
NODE1,POT=...,AX=...,AY=...,AZ=...
```

Node 2 uses `NODE2`.

### Gateway

The Arduino Mega receives LoRa packets and:

1. Validates the node.
2. Reads POT and MPU6050 values.
3. Calculates X/Y tilt.
4. Uses the maximum tilt for the alert decision.
5. Controls green/yellow/red LED and buzzer.
6. Outputs a clean one-line packet for the Raspberry Pi.

Serial communication is currently **9600 baud**.

## Raspberry Pi

`Raspberry-Pi/data_logger.py` reads the gateway over:

```text
/dev/ttyACM0 @ 9600
```

The serial port and database settings are configurable through environment variables.

Example:

```bash
export SERIAL_PORT=/dev/ttyACM0
export BAUD_RATE=9600
export DB_NAME=mine_monitoring
export DB_USER=mine_user
export DB_PASSWORD='your_password'
export DB_HOST=127.0.0.1
export DB_PORT=5432
export CSV_PATH=~/node_data.csv

python3 Raspberry-Pi/data_logger.py
```

**Do not put a real PostgreSQL password in GitHub.**

Install the Python dependency:

```bash
pip install pyserial psycopg2-binary
```

## Database

Create the database first, then run:

```bash
psql -U mine_user -d mine_monitoring -f Database/schema.sql
```

The logger stores:

- timestamp
- node ID
- potentiometer value
- AX / AY / AZ
- RSSI
- tilt
- status

## Dashboard

The complete BHU-DRISHTI web platform supplied in the ZIP is stored under:

```text
Dashboard/
```

Open that folder in VS Code if you want to run the web application separately.

Typical setup:

```bash
cd Dashboard
npm install
npm run dev
```

The supplied dashboard also contains its own backend, AI service, Docker configuration, Grafana provisioning, and supporting source files.

## Grafana

The project-level Grafana dashboard is copied to:

```text
Grafana/dashboard.json
```

The original dashboard provisioning files remain inside:

```text
Dashboard/grafana/
```

## Important hardware note

The current prototype uses a potentiometer as the displacement input. This is a prototype measurement method, not a field-grade subsidence displacement sensor.

Likewise, the current MPU6050 logic provides tilt/acceleration-derived information; it should not be described as a direct measurement of ground subsidence.

## GitHub

From the project root:

```bash
cd Mine-Subsidence-Monitoring

git init
git add .
git commit -m "Initial mine subsidence monitoring project"
git branch -M main

git remote add origin https://github.com/YOUR_USERNAME/Mine-Subsidence-Monitoring.git
git push -u origin main
```

Before pushing, check:

```bash
git status
```

and make sure no `.env`, passwords, API keys, database dumps, or generated build files containing secrets are being committed.
