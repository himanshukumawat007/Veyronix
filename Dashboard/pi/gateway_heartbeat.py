#!/usr/bin/env python3
"""
BHU-DRISHTI Raspberry Pi Gateway Heartbeat Daemon
Periodically reports gateway operational metrics, buffer backlog, and interface health to PostgreSQL.
"""

import json
import logging
import os
import sys
import time
import urllib.error
import urllib.request

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [HEARTBEAT] %(message)s"
)
logger = logging.getLogger("gateway_heartbeat")

GATEWAY_ID = os.environ.get("GATEWAY_ID", "pi3b-gateway-01")
HEARTBEAT_ENDPOINT = os.environ.get("HEARTBEAT_ENDPOINT", "http://localhost:3000/api/gateway/heartbeat")
SERIAL_PORT = os.environ.get("SERIAL_PORT", "/dev/ttyACM0")
BAUD_RATE = int(os.environ.get("BAUD_RATE", "115200"))
HEARTBEAT_INTERVAL_SEC = int(os.environ.get("HEARTBEAT_INTERVAL_SEC", "15"))

START_TIME = time.time()


def get_uptime_seconds():
    return int(time.time() - START_TIME)


def send_heartbeat(endpoint=None, gateway_id=GATEWAY_ID, buffer_backlog=0, status="ONLINE", system_info="Linux ARMv7"):
    target_url = endpoint or os.environ.get("HEARTBEAT_ENDPOINT") or HEARTBEAT_ENDPOINT
    payload = {
        "id": gateway_id,
        "status": status,
        "bufferBacklog": buffer_backlog,
        "serialPort": SERIAL_PORT,
        "baudRate": BAUD_RATE,
        "uptimeSeconds": get_uptime_seconds(),
        "systemInfo": system_info,
    }

    req = urllib.request.Request(
        target_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status in (200, 201):
                data = json.loads(response.read().decode("utf-8"))
                logger.info(f"Heartbeat sent successfully to {target_url} (status: {status})")
                return True, data
            return False, f"HTTP {response.status}"
    except urllib.error.URLError as e:
        logger.warning(f"Heartbeat failed to reach {target_url}: {e.reason}")
        return False, str(e.reason)
    except Exception as e:
        logger.error(f"Unexpected heartbeat error: {e}")
        return False, str(e)


def run_daemon():
    logger.info(f"Starting Gateway Heartbeat Daemon for {GATEWAY_ID} targeting {HEARTBEAT_ENDPOINT}")
    while True:
        try:
            send_heartbeat()
        except Exception as e:
            logger.error(f"Heartbeat loop error: {e}")
        time.sleep(HEARTBEAT_INTERVAL_SEC)


if __name__ == "__main__":
    run_daemon()
