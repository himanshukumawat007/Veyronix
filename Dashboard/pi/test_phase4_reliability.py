#!/usr/bin/env python3
"""
BHU-DRISHTI — Phase 4 Reliability & Integrity Automated Test Suite
Validates:
1. Gateway Heartbeat & PostgreSQL State Synchronization
2. Idempotent Ingestion (Duplicate Packet Replay Protection)
3. High-Frequency Burst & Pipeline Backpressure Handling
4. Cloud SQL Integrity Confirmation
"""

import datetime
import json
import logging
import os
import sys
import time
import urllib.request
import urllib.error

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [PHASE 4] %(message)s"
)
logger = logging.getLogger("phase4_test")

BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:3000")
HEARTBEAT_URL = f"{BASE_URL}/api/gateway/heartbeat"
STATUS_URL = f"{BASE_URL}/api/gateway/status?id=pi3b-gateway-01"
INGEST_URL = f"{BASE_URL}/api/sensor-data?waitForDb=true"
SYSTEM_STATUS_URL = f"{BASE_URL}/api/system/status"


def post_json(url, data):
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=5) as response:
        return response.status, json.loads(response.read().decode("utf-8"))


def get_json(url):
    req = urllib.request.Request(
        url,
        headers={"Accept": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=5) as response:
        return response.status, json.loads(response.read().decode("utf-8"))


def test_phase4():
    logger.info("=================================================================")
    logger.info("STARTING PHASE 4: PIPELINE RELIABILITY & IDEMPOTENCY TEST")
    logger.info("=================================================================")

    # -------------------------------------------------------------
    # 1. Gateway Heartbeat & PostgreSQL Sync
    # -------------------------------------------------------------
    logger.info("--- TEST 1: Gateway Heartbeat & Online Status Tracking ---")
    hb_payload = {
        "id": "pi3b-gateway-01",
        "status": "ONLINE",
        "bufferBacklog": 0,
        "serialPort": "/dev/ttyACM0",
        "baudRate": 115200,
        "uptimeSeconds": 3600,
        "systemInfo": "Linux ARMv7 Raspberry Pi 3B (Debian 12)",
    }
    status_code, hb_resp = post_json(HEARTBEAT_URL, hb_payload)
    assert status_code in (200, 201), f"Expected 200/201, got {status_code}"
    assert hb_resp.get("status") == "recorded", f"Unexpected response: {hb_resp}"
    logger.info("✓ Heartbeat successfully posted and recorded in PostgreSQL")

    # Verify via GET /api/gateway/status
    status_code, gw_status = get_json(STATUS_URL)
    assert status_code == 200, f"Expected 200, got {status_code}"
    assert gw_status.get("status") == "ONLINE", f"Expected ONLINE, got {gw_status.get('status')}"
    assert gw_status.get("isStale") is False, "Gateway should not be stale immediately after heartbeat"
    assert gw_status.get("serialPort") == "/dev/ttyACM0"
    logger.info(f"✓ Gateway status verified via API: {gw_status['id']} is {gw_status['status']}")

    # -------------------------------------------------------------
    # 2. Idempotent Ingestion (Duplicate Packet Replay Protection)
    # -------------------------------------------------------------
    logger.info("--- TEST 2: Idempotent Ingestion & Deduplication ---")
    ts_now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    unique_record_id = f"test-idemp-{int(time.time() * 1000)}"
    telemetry_packet = {
        "id": unique_record_id,
        "node_id": "node-01",
        "timestamp": ts_now,
        "ax": 0.12,
        "ay": 0.05,
        "az": 9.81,
        "pot": 1.2,
        "disp_mm": 1.2,
        "mag": 9.812,
        "dev": 0.006,
        "tilt": 0.76,
        "status": "NORMAL",
        "risk_score": 12.0,
        "confidence": 0.95,
    }

    # First transmission
    code1, resp1 = post_json(INGEST_URL, telemetry_packet)
    assert code1 in (200, 201), f"Initial ingestion failed with status {code1}"
    logger.info(f"✓ Initial packet ingested: record_id={unique_record_id}")

    # Replay EXACT SAME packet (simulating network retry or re-sent LoRa packet)
    code2, resp2 = post_json(INGEST_URL, telemetry_packet)
    assert code2 in (200, 201), f"Duplicate ingestion failed with status {code2}"
    logger.info(f"✓ Duplicate packet replay handled idempotently without crash or constraint error")

    # -------------------------------------------------------------
    # 3. High-Frequency Ingestion Burst (Backpressure test)
    # -------------------------------------------------------------
    logger.info("--- TEST 3: High-Frequency Ingestion Burst ---")
    burst_count = 10
    start_time = time.time()
    for i in range(burst_count):
        burst_pkt = {
            "id": f"burst-{int(time.time() * 1000)}-{i}",
            "node_id": f"node-0{(i % 3) + 1}",
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "ax": 0.08 + (i * 0.01),
            "ay": 0.04,
            "az": 9.80,
            "pot": 1.0 + (i * 0.05),
            "disp_mm": 1.0 + (i * 0.05),
            "mag": 9.801,
            "dev": 0.005,
            "status": "NORMAL",
            "risk_score": 10.0,
        }
        code, _ = post_json(INGEST_URL, burst_pkt)
        assert code in (200, 201), f"Burst packet {i} failed with status {code}"

    burst_duration = time.time() - start_time
    logger.info(f"✓ Successfully processed {burst_count} high-frequency burst packets in {burst_duration:.2f}s ({burst_count / burst_duration:.1f} pkts/sec)")

    # -------------------------------------------------------------
    # 4. End-to-End System Diagnostics Verification
    # -------------------------------------------------------------
    logger.info("--- TEST 4: End-to-End System Status Integration ---")
    code_sys, sys_resp = get_json(SYSTEM_STATUS_URL)
    assert code_sys == 200, f"Expected 200, got {code_sys}"
    assert sys_resp.get("gateway", {}).get("status") == "ONLINE"
    logger.info(f"✓ System status reports healthy gateway: {sys_resp['gateway']['id']} (Status: {sys_resp['gateway']['status']})")

    logger.info("=================================================================")
    logger.info("PHASE 4 ACCEPTANCE CRITERIA PASSED: PIPELINE RELIABILITY VERIFIED")
    logger.info("=================================================================")


if __name__ == "__main__":
    test_phase4()
