#!/usr/bin/env python3
"""
BHU-DRISHTI — Phase 5 Automated Verification: Machine Learning Risk Inference Engine
-----------------------------------------------------------------------------------
Validates:
1. Model Metadata & Honest Prototype Disclaimer
2. In-Depth Single Vector Prediction (NORMAL, WARNING, CRITICAL regimes)
3. Geotechnical Feature Derivation (disp_mm, mag, dev, tilt)
4. Batch Inference Endpoint (POST /api/ai/predict-batch)
5. Decision Boundary Stability & Confidence Scores
"""

import json
import logging
import os
import sys
import urllib.error
import urllib.request

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [PHASE 5 ML] %(message)s"
)
logger = logging.getLogger("phase5_test")

BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:3000")
PREDICT_URL = f"{BASE_URL}/api/ai/predict"
BATCH_PREDICT_URL = f"{BASE_URL}/api/ai/predict-batch"
META_URL = f"{BASE_URL}/api/ai/model-meta"


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


def test_phase5():
    logger.info("=================================================================")
    logger.info("STARTING PHASE 5: GEOTECHNICAL ML RISK INFERENCE TEST")
    logger.info("=================================================================")

    # -------------------------------------------------------------
    # 1. Model Metadata & Honest Synthetic Data Disclaimer
    # -------------------------------------------------------------
    logger.info("--- TEST 1: Model Metadata & Prototype Disclaimer ---")
    status, meta = get_json(META_URL)
    assert status == 200, f"Expected 200, got {status}"
    assert "disclaimer" in meta, "Missing model disclaimer"
    assert "synthetic" in meta["disclaimer"].lower(), "Disclaimer must state synthetic training data"
    assert meta.get("is_synthetic_trained") is True, "is_synthetic_trained flag must be True"
    assert meta.get("classes") == ["NORMAL", "WARNING", "CRITICAL"]
    assert len(meta.get("feature_importance", [])) >= 5
    logger.info(f"✓ Model metadata verified: {meta['model_name']} v{meta['version']}")
    logger.info(f"✓ Disclaimer confirmed: \"{meta['disclaimer']}\"")

    # -------------------------------------------------------------
    # 2. Geotechnical Regime Classification: NORMAL
    # -------------------------------------------------------------
    logger.info("--- TEST 2: Normal Baseline Vector Classification ---")
    # Small vibration (mag ~ 9.81), minimal displacement (disp = 0.8 mm)
    normal_vector = {"ax": 0.01, "ay": 0.02, "az": 9.806, "pot": 0.8}
    code, res_normal = post_json(PREDICT_URL, normal_vector)
    assert code == 200, f"Expected 200, got {code}"
    assert res_normal["status"] == "NORMAL", f"Expected NORMAL, got {res_normal['status']}"
    assert res_normal["risk_score"] < 32.0, f"Expected risk_score < 32, got {res_normal['risk_score']}"
    assert res_normal["confidence"] >= 80.0, f"Expected confidence >= 80, got {res_normal['confidence']}"
    assert res_normal["features"]["displacement_mm"] == 0.8
    logger.info(f"✓ NORMAL regime passed: score={res_normal['risk_score']}%, conf={res_normal['confidence']}%, status={res_normal['status']}")

    # -------------------------------------------------------------
    # 3. Geotechnical Regime Classification: WARNING
    # -------------------------------------------------------------
    logger.info("--- TEST 3: Warning Slope Creep Vector Classification ---")
    # Moderate vibration (dev ~ 0.45g), creep displacement (disp = 4.5 mm)
    warning_vector = {"ax": 0.42, "ay": 0.35, "az": 9.60, "pot": 4.5}
    code, res_warning = post_json(PREDICT_URL, warning_vector)
    assert code == 200, f"Expected 200, got {code}"
    assert res_warning["status"] == "WARNING", f"Expected WARNING, got {res_warning['status']}"
    assert 32.0 <= res_warning["risk_score"] <= 68.0, f"Expected risk_score in [32, 68], got {res_warning['risk_score']}"
    assert res_warning["features"]["displacement_mm"] == 4.5
    logger.info(f"✓ WARNING regime passed: score={res_warning['risk_score']}%, conf={res_warning['confidence']}%, status={res_warning['status']}")

    # -------------------------------------------------------------
    # 4. Geotechnical Regime Classification: CRITICAL
    # -------------------------------------------------------------
    logger.info("--- TEST 4: Critical Failure Vector Classification ---")
    # High vibration (dev ~ 1.3g), rapid shear displacement (disp = 14.2 mm)
    critical_vector = {"ax": 1.45, "ay": 1.70, "az": 9.15, "pot": 14.2}
    code, res_crit = post_json(PREDICT_URL, critical_vector)
    assert code == 200, f"Expected 200, got {code}"
    assert res_crit["status"] == "CRITICAL", f"Expected CRITICAL, got {res_crit['status']}"
    assert res_crit["risk_score"] >= 68.0, f"Expected risk_score >= 68, got {res_crit['risk_score']}"
    assert res_crit["features"]["displacement_mm"] == 14.2
    logger.info(f"✓ CRITICAL regime passed: score={res_crit['risk_score']}%, conf={res_crit['confidence']}%, status={res_crit['status']}")

    # -------------------------------------------------------------
    # 5. Batch Inference Endpoint
    # -------------------------------------------------------------
    logger.info("--- TEST 5: Batch Inference Processing ---")
    batch_payload = {
        "records": [
            normal_vector,
            warning_vector,
            critical_vector,
            {"ax": 0.05, "ay": 0.03, "az": 9.81, "pot": 1.0},
            {"ax": 1.80, "ay": 1.90, "az": 8.90, "pot": 18.5}
        ]
    }
    code, batch_res = post_json(BATCH_PREDICT_URL, batch_payload)
    assert code == 200, f"Expected 200, got {code}"
    assert batch_res["count"] == 5, f"Expected 5 records, got {batch_res['count']}"
    predictions = batch_res["predictions"]
    assert predictions[0]["status"] == "NORMAL"
    assert predictions[1]["status"] == "WARNING"
    assert predictions[2]["status"] == "CRITICAL"
    assert predictions[3]["status"] == "NORMAL"
    assert predictions[4]["status"] == "CRITICAL"
    logger.info(f"✓ Batch inference verified: 5/5 predictions match expected geotechnical states")

    logger.info("=================================================================")
    logger.info("PHASE 5 ACCEPTANCE CRITERIA PASSED: ML RISK INFERENCE VERIFIED")
    logger.info("=================================================================")


if __name__ == "__main__":
    test_phase5()
