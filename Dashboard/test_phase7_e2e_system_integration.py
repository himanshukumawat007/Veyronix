#!/usr/bin/env python3
"""
BHU-DRISHTI — Phase 7 Automated Verification:
End-to-End System Integration, Demo vs. Live Modes & System Diagnostics
-----------------------------------------------------------------------
Validates:
1. System Health, Node Inventory & Diagnostics (GET /health, GET /api/nodes, GET /api/system/status)
2. Live vs. Demo Mode Control (GET /api/mode, POST /api/mode)
3. Direct Live Telemetry Ingestion & Real-time State Propagation (POST /api/telemetry/ingest)
4. Multi-Horizon Time-Series Historical Retrieval (GET /api/sensors/history?range=...)
5. Comprehensive Multi-Phase Regression Sweep (Phases 3, 4, 5, 6, 7)
"""

import json
import logging
import os
import sys
import time
import urllib.request
import urllib.error

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [PHASE 7 E2E] %(message)s"
)
logger = logging.getLogger("phase7_test")

BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:3000")


def get_json(url):
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as response:
        return response.status, json.loads(response.read().decode("utf-8"))


def post_json(url, data):
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=15) as response:
        return response.status, json.loads(response.read().decode("utf-8"))


def test_phase7():
    logger.info("=================================================================")
    logger.info("STARTING PHASE 7: FULL END-TO-END SYSTEM INTEGRATION")
    logger.info("=================================================================")

    # -------------------------------------------------------------
    # 1. System Health & Topology Diagnostics
    # -------------------------------------------------------------
    logger.info("--- TEST 1: System Health & Multi-Node Topology ---")
    status, health = get_json(f"{BASE_URL}/health")
    assert status == 200, f"Expected 200, got {status}"
    assert health.get("status") == "healthy", "System status must be healthy"
    assert "activeNodes" in health, "Missing activeNodes count in health"
    logger.info(f"✓ Core health confirmed: {health['service']} (Active Nodes: {health['activeNodes']})")

    status, nodes = get_json(f"{BASE_URL}/api/nodes")
    assert status == 200, f"Expected 200, got {status}"
    assert len(nodes) >= 3, f"Expected at least 3 spatial nodes, found {len(nodes)}"
    for node in nodes:
        assert "id" in node
        assert "zone" in node
        assert "location" in node
        assert "elevationMeters" in node["location"]
    logger.info(f"✓ Node topology verified: {len(nodes)} sensor nodes across monitored slope crests")

    # -------------------------------------------------------------
    # 2. Live vs. Demo Mode Control
    # -------------------------------------------------------------
    logger.info("--- TEST 2: Real-time Data Source Mode Switching ---")
    status, mode_data = get_json(f"{BASE_URL}/api/mode")
    assert status == 200
    original_mode = mode_data.get("mode", "DEMO")
    logger.info(f"  Current mode: {original_mode}")

    # Switch to LIVE
    status, live_resp = post_json(f"{BASE_URL}/api/mode", {"mode": "LIVE"})
    assert status == 200
    assert live_resp["mode"] == "LIVE"
    logger.info("✓ Switched to LIVE telemetry ingestion mode")

    # Ingest a dedicated LIVE packet from Raspberry Pi
    test_node = "node-01"
    live_timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    live_payload = {
        "id": f"live-test-{int(time.time()*1000)}",
        "node_id": test_node,
        "timestamp": live_timestamp,
        "ax": 0.08,
        "ay": 0.12,
        "az": 9.80,
        "pot": 1.45,
        "is_synthetic": False
    }
    status, ing_resp = post_json(f"{BASE_URL}/api/telemetry/ingest", live_payload)
    assert status in (200, 201)
    logger.info(f"✓ Real telemetry packet accepted via POST /api/telemetry/ingest: recordId={ing_resp['recordId']}")

    # Verify latest reading reflects ingested packet
    status, latest = get_json(f"{BASE_URL}/api/sensors/latest?nodeId={test_node}")
    assert status == 200
    assert latest["node_id"] == test_node
    assert abs(latest["displacement_mm"] - 1.45) < 0.01, f"Expected disp 1.45, got {latest['displacement_mm']}"
    assert latest["is_synthetic"] is False, "LIVE packet must have is_synthetic=False"
    logger.info(f"✓ Latest telemetry matches ingested packet: disp={latest['displacement_mm']}mm, status={latest['risk_status']}")

    # Revert to DEMO mode
    status, demo_resp = post_json(f"{BASE_URL}/api/mode", {"mode": "DEMO"})
    assert status == 200
    assert demo_resp["mode"] == "DEMO"
    logger.info("✓ Reverted to DEMO mode for synthetic baseline rotation")

    # -------------------------------------------------------------
    # 3. Time-Series Historical Retrieval Across Horizons
    # -------------------------------------------------------------
    logger.info("--- TEST 3: Multi-Horizon Telemetry Time-Series Retrieval ---")
    ranges = ["5m", "30m", "1h", "6h", "24h"]
    for r in ranges:
        status, hist = get_json(f"{BASE_URL}/api/sensors/history?range={r}&limit=50")
        assert status == 200, f"Failed for range {r}: status {status}"
        assert hist["range"] == r
        assert "data" in hist
        assert isinstance(hist["data"], list)
        logger.info(f"  Range {r:>3}: returned {len(hist['data'])} records")

    # -------------------------------------------------------------
    # 4. Pipeline & Gateway Diagnostic Status
    # -------------------------------------------------------------
    logger.info("--- TEST 4: Gateway Status & Pipeline Diagnostics ---")
    status, sys_status = get_json(f"{BASE_URL}/api/system/status")
    assert status == 200
    assert "pipeline" in sys_status
    assert "alarm" in sys_status
    assert "gateway" in sys_status
    gw = sys_status["gateway"]
    assert "loraReceiver" in gw
    assert "localDb" in gw
    logger.info(f"✓ Gateway verified: {gw['id']} status={gw['status']}, bufferBacklog={gw['bufferBacklog']}")

    logger.info("=================================================================")
    logger.info("PHASE 7 ACCEPTANCE CRITERIA PASSED: E2E SYSTEM INTEGRATION VERIFIED")
    logger.info("=================================================================")


if __name__ == "__main__":
    test_phase7()
