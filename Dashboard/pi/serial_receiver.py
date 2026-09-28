#!/usr/bin/env python3
"""
BHU-DRISHTI — Raspberry Pi 3B Gateway Serial Ingestion Service (Phase 2)
------------------------------------------------------------------------
Data Pipeline:
  Arduino Mega (ATmega2560 LoRa Transceiver)
        ↓ USB Serial (/dev/ttyACM0 @ 115200 baud)
  Raspberry Pi 3B Gateway
        ├── Serial Ingestion & Line Buffer
        ├── Packet Parser (timestamp,ax,ay,az,pot or node_id,timestamp,ax,ay,az,pot)
        ├── Validation Engine:
        │     - Structure & Type Validation
        │     - Malformed-Packet Handling (non-blocking rejection)
        │     - Impossible-Value Rejection (physical geotechnical limits)
        ├── Local Hardware Alarm (GPIO 17 Green, 27 Yellow, 22 Red, 23 Buzzer)
        ├── Local SQLite Offline Cache (offline-first resilience)
        └── PostgreSQL Synchronization with Exponential Backoff Retries
"""

import os
import sys
import time
import math
import json
import logging
import datetime
import urllib.request
import urllib.error
import urllib.parse

# Local gateway modules
from database_writer import DatabaseWriter
from local_alarm import LocalAlarmController

# Configure structured logging
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] [GATEWAY] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("bhu_drishti_gateway")

SERIAL_PORT = os.environ.get("SERIAL_PORT", "/dev/ttyACM0")
BAUD_RATE = int(os.environ.get("BAUD_RATE", "115200"))
DEFAULT_NODE_ID = os.environ.get("NODE_ID", "node-01")
POSTGRES_INGEST_URL = os.environ.get("INGEST_URL", "http://localhost:3000/api/sensor-data?waitForDb=true")
MAX_RETRIES = 3
INITIAL_BACKOFF = 0.5  # seconds

# Physical geotechnical validation boundaries
ACCEL_MAX_ABS = 50.0   # m/s² (~5g physical upper bound for slope movement)
POT_MIN = 0.0          # ADC minimum
POT_MAX = 1023.0       # ADC maximum (10-bit Arduino ADC)
# Potentiometer unit: "adc" (raw 0-1023, recommended for the Arduino node), "mm" (pre-calibrated),
# or "auto" (legacy heuristic: values <= 50 are treated as mm). Sent to the server as pot_unit.
POT_UNIT = os.environ.get("POT_UNIT", "auto").lower()
MAGNITUDE_MIN = 1.0    # Gravity must be detectable (sensor not disconnected/floating)
MAGNITUDE_MAX = 60.0   # Extreme dynamic impact limit


def calculate_derived_features(ax, ay, az, pot):
    """
    Computes geotechnical kinematic telemetry:
    - Acceleration magnitude: sqrt(ax^2 + ay^2 + az^2)
    - Deviation from 1g gravity (9.806 m/s^2)
    - Calibrated displacement in mm (0-50mm range)
    - Tilt in degrees from gravity vector
    - Geotechnical risk state (NORMAL / WARNING / CRITICAL)
    """
    mag = math.sqrt(ax * ax + ay * ay + az * az)
    dev = abs(mag - 9.806)

    # Potentiometer displacement calibration:
    # 0-1023 ADC mapped to 0-50mm; if already <= 50, assume pre-calibrated mm
    if POT_UNIT == "adc":
        disp_mm = (pot / 1023.0) * 50.0
    elif POT_UNIT == "mm":
        disp_mm = pot
    else:
        disp_mm = pot if pot <= 50.0 else (pot / 1023.0) * 50.0

    # Tilt angle from vertical Z axis (in degrees)
    tilt_deg = math.degrees(math.acos(min(1.0, max(-1.0, az / (mag if mag > 0 else 9.806)))))

    # Geotechnical decision boundaries
    if disp_mm >= 7.5 or dev >= 1.0 or mag >= 12.0:
        status = "CRITICAL"
        score = min(99.0, 70.0 + disp_mm * 1.8 + dev * 15.0)
    elif disp_mm >= 2.5 or dev >= 0.3:
        status = "WARNING"
        score = min(68.0, 32.0 + disp_mm * 5.0 + dev * 20.0)
    else:
        status = "NORMAL"
        score = max(5.0, 10.0 + disp_mm * 8.0 + dev * 12.0)

    return disp_mm, mag, dev, tilt_deg, status, round(score, 1)


def parse_and_validate_packet(raw_line, default_node_id=DEFAULT_NODE_ID):
    """
    Parses and strictly validates raw serial telemetry packets.
    Supported packet formats:
      1. timestamp,ax,ay,az,pot
      2. node_id,timestamp,ax,ay,az,pot
      3. ax,ay,az,pot (current timestamp and default node_id injected)

    Returns:
      (True, parsed_dict) on success.
      (False, error_reason) on rejection (malformed or impossible value).
    """
    line = raw_line.strip()
    if not line:
        return False, "MALFORMED: Empty packet line"

    # Tokenize comma-separated values
    tokens = [t.strip() for t in line.split(",") if t.strip() != ""]
    if len(tokens) < 4:
        return False, f"MALFORMED: Insufficient fields ({len(tokens)} tokens, expected >= 4). Raw: '{line}'"

    node_id = default_node_id
    timestamp_str = None

    try:
        if len(tokens) == 4:
            # Format: ax, ay, az, pot
            ax = float(tokens[0])
            ay = float(tokens[1])
            az = float(tokens[2])
            pot = float(tokens[3])
            timestamp_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
        elif len(tokens) == 5:
            # Format: timestamp, ax, ay, az, pot
            timestamp_str = tokens[0]
            ax = float(tokens[1])
            ay = float(tokens[2])
            az = float(tokens[3])
            pot = float(tokens[4])
        elif len(tokens) >= 6:
            # Format: node_id, timestamp, ax, ay, az, pot
            node_id = tokens[0]
            timestamp_str = tokens[1]
            ax = float(tokens[2])
            ay = float(tokens[3])
            az = float(tokens[4])
            pot = float(tokens[5])
    except ValueError as e:
        return False, f"MALFORMED: Non-numeric sensor coordinate. Raw: '{line}' (Error: {e})"

    # Timestamp normalization and validation
    if not timestamp_str or len(timestamp_str) < 10:
        timestamp_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
    else:
        # Validate timestamp structure
        try:
            # Accept ISO timestamps with Z or offset
            cleaned_ts = timestamp_str.replace("Z", "+00:00")
            datetime.datetime.fromisoformat(cleaned_ts)
        except Exception:
            timestamp_str = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # Node ID validation
    if not node_id or not all(c.isalnum() or c in "-_" for c in node_id):
        return False, f"MALFORMED: Invalid node_id '{node_id}'"

    # IMPOSSIBLE-VALUE CHECKS (Physical Geotechnical Sensor Guardrails)
    if any(math.isnan(v) or math.isinf(v) for v in (ax, ay, az, pot)):
        return False, f"IMPOSSIBLE_VALUE: NaN or Infinity in sensor payload (ax={ax}, ay={ay}, az={az}, pot={pot})"

    if abs(ax) > ACCEL_MAX_ABS or abs(ay) > ACCEL_MAX_ABS or abs(az) > ACCEL_MAX_ABS:
        return False, (
            f"IMPOSSIBLE_VALUE: Acceleration exceeds physical slope dynamics [-{ACCEL_MAX_ABS}, +{ACCEL_MAX_ABS}] m/s². "
            f"Received: ax={ax}, ay={ay}, az={az}"
        )

    if pot < POT_MIN or pot > POT_MAX:
        return False, (
            f"IMPOSSIBLE_VALUE: Potentiometer/Crack meter reading outside valid range [{POT_MIN}, {POT_MAX}]. "
            f"Received: pot={pot}"
        )

    mag = math.sqrt(ax * ax + ay * ay + az * az)
    if mag < MAGNITUDE_MIN or mag > MAGNITUDE_MAX:
        return False, (
            f"IMPOSSIBLE_VALUE: Gravity vector magnitude ({mag:.2f} m/s²) out of valid bound [{MAGNITUDE_MIN}, {MAGNITUDE_MAX}]. "
            f"Sensor possibly disconnected or saturated."
        )

    # Compute derived physical features
    disp_mm, mag, dev, tilt_deg, status, score = calculate_derived_features(ax, ay, az, pot)

    return True, {
        "node_id": node_id,
        "timestamp": timestamp_str,
        "ax": ax,
        "ay": ay,
        "az": az,
        "pot": pot,
        "disp_mm": disp_mm,
        "mag": mag,
        "dev": dev,
        "tilt_deg": tilt_deg,
        "status": status,
        "risk_score": score,
    }


def send_to_postgresql_with_retry(payload, url=None, max_retries=MAX_RETRIES):
    """
    Sends parsed telemetry to the PostgreSQL ingestion endpoint with exponential backoff retries.
    Returns (True, response_data) on success, (False, error_msg) on failure.
    """
    target_url = url or os.environ.get("INGEST_URL") or POSTGRES_INGEST_URL
    body_data = json.dumps({
        "node_id": payload["node_id"],
        "timestamp": payload["timestamp"],
        "ax": payload["ax"],
        "ay": payload["ay"],
        "az": payload["az"],
        "pot": payload["pot"],
        "pot_unit": POT_UNIT,
        "waitForDb": True,
    }).encode("utf-8")

    req = urllib.request.Request(
        target_url,
        data=body_data,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )

    backoff = INITIAL_BACKOFF
    last_error = None

    for attempt in range(1, max_retries + 1):
        try:
            start_time = time.time()
            with urllib.request.urlopen(req, timeout=5.0) as resp:
                elapsed_ms = (time.time() - start_time) * 1000.0
                if resp.status in (200, 201):
                    resp_json = json.loads(resp.read().decode("utf-8"))
                    logger.info(
                        f"PostgreSQL Row Created: node={payload['node_id']} | "
                        f"record_id={resp_json.get('recordId')} | latency={elapsed_ms:.1f}ms"
                    )
                    return True, resp_json
                else:
                    last_error = f"HTTP status {resp.status}"
        except urllib.error.HTTPError as e:
            try:
                err_body = e.read().decode("utf-8")
                last_error = f"HTTP {e.code}: {err_body}"
            except Exception:
                last_error = f"HTTP {e.code}"
        except Exception as e:
            last_error = str(e)

        if attempt < max_retries:
            logger.warning(f"PostgreSQL sync attempt {attempt}/{max_retries} failed: {last_error}. Retrying in {backoff:.1f}s...")
            time.sleep(backoff)
            backoff *= 2.0

    logger.error(f"PostgreSQL sync failed after {max_retries} attempts: {last_error}")
    return False, last_error


def process_raw_packet(raw_line, db=None, alarm=None, default_node_id=DEFAULT_NODE_ID, sync_pg=True, url=None):
    """
    Complete processing pipeline for a single raw packet line:
    1. Parse & Validate
    2. Impossible-value rejection
    3. Local Alarm actuation
    4. Local SQLite logging (offline-first)
    5. PostgreSQL transmission with retries
    """
    valid, result = parse_and_validate_packet(raw_line, default_node_id=default_node_id)
    if not valid:
        logger.warning(f"[REJECTED] {result}")
        return False, result

    payload = result

    # 1. Update physical Raspberry Pi alarm LEDs & buzzer
    if alarm:
        try:
            alarm.set_state(payload["status"])
        except Exception as e:
            logger.warning(f"Alarm controller warning: {e}")

    # 2. Log to local SQLite database (offline-first resilience)
    if db:
        try:
            db.log_reading(
                timestamp=payload["timestamp"],
                node_id=payload["node_id"],
                ax=payload["ax"],
                ay=payload["ay"],
                az=payload["az"],
                pot=payload["pot"],
                disp_mm=payload["disp_mm"],
                mag=payload["mag"],
                dev=payload["dev"],
                status=payload["status"],
                score=payload["risk_score"],
            )
        except Exception as e:
            logger.warning(f"Local SQLite write warning: {e}")

    # 3. Synchronize to PostgreSQL
    pg_success = True
    if sync_pg:
        pg_success, pg_resp = send_to_postgresql_with_retry(payload, url=url)
        payload["pg_record_id"] = pg_resp.get("recordId") if pg_success else None

    return pg_success, payload


def main():
    logger.info("=" * 70)
    logger.info("BHU-DRISHTI — Raspberry Pi 3B Gateway Serial Ingestion Service")
    logger.info(f"Target Serial Port: {SERIAL_PORT} @ {BAUD_RATE} baud")
    logger.info(f"Default Node ID: {DEFAULT_NODE_ID}")
    logger.info(f"PostgreSQL Ingestion URL: {POSTGRES_INGEST_URL}")
    logger.info("=" * 70)

    db = DatabaseWriter()
    alarm = LocalAlarmController()
    alarm.self_test()

    # Import serial library if running against physical hardware
    try:
        import serial
    except ImportError:
        serial = None
        logger.warning("pyserial module not found. Physical serial reading disabled.")

    while True:
        if not serial:
            logger.info("No physical serial available in container environment. Idle.")
            time.sleep(10)
            continue

        try:
            logger.info(f"Opening serial port {SERIAL_PORT}...")
            ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=2.0)
            logger.info(f"Connected to Arduino Mega transceiver on {SERIAL_PORT}")

            while True:
                line_bytes = ser.readline()
                if not line_bytes:
                    continue

                try:
                    raw_str = line_bytes.decode("utf-8", errors="replace").strip()
                except Exception:
                    continue

                if not raw_str:
                    continue

                process_raw_packet(raw_str, db=db, alarm=alarm, default_node_id=DEFAULT_NODE_ID)

        except Exception as e:
            logger.warning(f"Serial port connection notice ({e}). Reconnecting in 5 seconds...")
            alarm.set_state("WARNING")
            time.sleep(5)


if __name__ == "__main__":
    main()
