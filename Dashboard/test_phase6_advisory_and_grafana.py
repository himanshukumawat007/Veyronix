#!/usr/bin/env python3
"""
BHU-DRISHTI — Phase 6 Automated Verification:
Geotechnical Advisory, Alert Dispatch & Grafana 10-Panel Analytical Dashboard
-----------------------------------------------------------------------------
Validates:
1. Grafana Provisioning Config (GET /api/grafana/config)
2. 10-Panel Grafana Analytical Dashboard JSON Generation (GET /api/grafana/dashboard-json)
3. AI Geotechnical Risk Assessment (POST /api/ai-risk) across NORMAL, WARNING, CRITICAL regimes
4. End-to-End Alert Ingestion & Acknowledgment Lifecycle (/api/alerts, /api/alerts/ack)
5. Full Project Repository ZIP Archive Exporter (GET /api/export-project-zip)
"""

import json
import logging
import os
import sys
import time
import urllib.request
import urllib.error
import zipfile
import io

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [PHASE 6] %(message)s"
)
logger = logging.getLogger("phase6_test")

BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:3000")


def get_json(url):
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as response:
        return response.status, json.loads(response.read().decode("utf-8"))


def post_json(url, data):
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=20) as response:
        return response.status, json.loads(response.read().decode("utf-8"))


def test_phase6():
    logger.info("=================================================================")
    logger.info("STARTING PHASE 6: ADVISORY, ALERTS & GRAFANA 10-PANEL INTEGRATION")
    logger.info("=================================================================")

    # -------------------------------------------------------------
    # 1. Grafana Config & Cloud SQL Datasource Info
    # -------------------------------------------------------------
    logger.info("--- TEST 1: Grafana Provisioning Configuration ---")
    status, config = get_json(f"{BASE_URL}/api/grafana/config")
    assert status == 200, f"Expected 200, got {status}"
    assert "postgres" in config, "Missing postgres configuration block"
    assert config["postgres"]["table"] == "telemetry_records"
    logger.info(f"✓ Grafana config confirmed: Target table={config['postgres']['table']}, UID={config['dashboardUid']}")

    # -------------------------------------------------------------
    # 2. 10-Panel Grafana Analytical Dashboard JSON
    # -------------------------------------------------------------
    logger.info("--- TEST 2: Complete 10-Panel Grafana Analytical Dashboard ---")
    status, dashboard = get_json(f"{BASE_URL}/api/grafana/dashboard-json")
    assert status == 200, f"Expected 200, got {status}"
    panels = dashboard.get("panels", [])
    assert len(panels) == 10, f"Expected exactly 10 Grafana panels, found {len(panels)}"
    
    panel_titles = [p.get("title", "") for p in panels]
    logger.info(f"✓ Verified 10 analytical panels in exported JSON:")
    for idx, title in enumerate(panel_titles, 1):
        logger.info(f"    Panel {idx}: {title}")
        assert title, f"Panel {idx} has an empty title"

    # -------------------------------------------------------------
    # 3. Geotechnical Risk Advisory (Dual-Layer AI Engine)
    # -------------------------------------------------------------
    logger.info("--- TEST 3: AI Geotechnical Risk Assessment ---")
    
    # 3a. Baseline Nominal State
    normal_req = {
        "nodes": [{"id": "node-01", "displacement": 0.8, "status": "NORMAL"}],
        "criticalCount": 0,
        "warningCount": 0,
        "avgDisplacement": 0.8,
    }
    status, normal_ai = post_json(f"{BASE_URL}/api/ai-risk", normal_req)
    assert status == 200, f"Expected 200, got {status}"
    assert "riskLevel" in normal_ai
    assert "factors" in normal_ai
    assert "shortExplanation" in normal_ai
    logger.info(f"✓ AI Normal Assessment: {normal_ai['riskLevel']} — \"{normal_ai['shortExplanation']}\" (Confidence: {normal_ai['factors']['confidence']})")

    # 3b. Warning State (Embankment creep)
    warning_req = {
        "nodes": [
            {"id": "node-01", "displacement": 4.5, "status": "WARNING"},
            {"id": "node-02", "displacement": 1.2, "status": "NORMAL"}
        ],
        "criticalCount": 0,
        "warningCount": 1,
        "avgDisplacement": 2.85,
    }
    status, warn_ai = post_json(f"{BASE_URL}/api/ai-risk", warning_req)
    assert status == 200, f"Expected 200, got {status}"
    assert warn_ai["riskLevel"] in ("MODERATE RISK", "HIGH RISK")
    logger.info(f"✓ AI Warning Assessment: {warn_ai['riskLevel']} — \"{warn_ai['shortExplanation']}\"")

    # 3c. Critical State (Shear failure imminent)
    crit_req = {
        "nodes": [
            {"id": "node-01", "displacement": 14.5, "status": "CRITICAL"},
            {"id": "node-02", "displacement": 8.2, "status": "CRITICAL"}
        ],
        "criticalCount": 2,
        "warningCount": 0,
        "avgDisplacement": 11.35,
    }
    status, crit_ai = post_json(f"{BASE_URL}/api/ai-risk", crit_req)
    assert status == 200, f"Expected 200, got {status}"
    assert crit_ai["riskLevel"] == "HIGH RISK"
    logger.info(f"✓ AI Critical Assessment: {crit_ai['riskLevel']} — \"{crit_ai['shortExplanation']}\"")

    # -------------------------------------------------------------
    # 4. Ingestion-Triggered Alert & Acknowledgment Workflow
    # -------------------------------------------------------------
    logger.info("--- TEST 4: Alert Dispatch & Acknowledgment Lifecycle ---")
    crit_telemetry = {
        "id": f"crit-alert-test-{int(time.time()*1000)}",
        "node_id": "node-03",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "ax": 1.85,
        "ay": 1.95,
        "az": 8.90,
        "pot": 15.0,
        "disp_mm": 15.0,
        "status": "CRITICAL",
        "risk_score": 85.0,
        "waitForDb": False
    }
    status, ing_resp = post_json(f"{BASE_URL}/api/sensor-data", crit_telemetry)
    assert status in (200, 201), f"Expected 200/201, got {status}"

    # Verify alert logged in GET /api/alerts
    status, alerts = get_json(f"{BASE_URL}/api/alerts")
    assert status == 200, f"Expected 200, got {status}"
    assert len(alerts) > 0, "Expected at least 1 active alert"
    latest_alert = alerts[0]
    assert latest_alert["severity"] == "CRITICAL", f"Expected CRITICAL severity, got {latest_alert['severity']}"
    assert latest_alert["acknowledged"] is False, "Alert should start unacknowledged"
    logger.info(f"✓ Critical alert logged: id={latest_alert['id']} for node={latest_alert['nodeId']}")

    # Acknowledge alert via POST /api/alerts/ack
    status, ack_resp = post_json(f"{BASE_URL}/api/alerts/ack", {"id": latest_alert["id"]})
    assert status == 200, f"Expected 200, got {status}"
    assert ack_resp.get("status") == "acknowledged"
    logger.info(f"✓ Alert {latest_alert['id']} successfully acknowledged")

    # -------------------------------------------------------------
    # 5. Project Repository Archive Exporter
    # -------------------------------------------------------------
    logger.info("--- TEST 5: Complete Project Archive Exporter ---")
    req = urllib.request.Request(f"{BASE_URL}/api/export-project-zip")
    with urllib.request.urlopen(req, timeout=15) as response:
        assert response.status == 200, f"Expected 200, got {response.status}"
        zip_bytes = response.read()
        assert len(zip_bytes) > 5000, f"Zip archive suspiciously small: {len(zip_bytes)} bytes"
        
        # Test valid ZIP contents
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
            file_list = zf.namelist()
            assert any("package.json" in name for name in file_list), "ZIP missing package.json"
            assert any("README.md" in name for name in file_list), "ZIP missing README.md"
            logger.info(f"✓ Project ZIP verified: {len(file_list)} files archived ({len(zip_bytes)} bytes)")

    logger.info("=================================================================")
    logger.info("PHASE 6 ACCEPTANCE CRITERIA PASSED: ADVISORY, ALERTS & GRAFANA VERIFIED")
    logger.info("=================================================================")


if __name__ == "__main__":
    test_phase6()
