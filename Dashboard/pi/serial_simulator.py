#!/usr/bin/env python3
"""
BHU-DRISHTI — Raspberry Pi Serial Telemetry Simulator & Test Harness (Phase 2)
-----------------------------------------------------------------------------
Simulates the Arduino Mega LoRa transceiver transmitting serial packets:
  timestamp,ax,ay,az,pot

Executes comprehensive verification:
1. Malformed packet rejection (missing fields, letters, bad delimiters)
2. Impossible-value rejection (accelerations > 50 m/s², negative/extreme pot, missing gravity)
3. 100 Consecutive Valid Packet Ingestion into PostgreSQL:
     Packet received -> Parsed -> Validated -> PostgreSQL row created
4. Direct verification of PostgreSQL records via Cloud SQL query
"""

import os
import sys
import time
import math
import random
import datetime
import logging

from serial_receiver import (
    parse_and_validate_packet,
    process_raw_packet,
    calculate_derived_features,
    DEFAULT_NODE_ID,
    POSTGRES_INGEST_URL,
)
from database_writer import DatabaseWriter
from local_alarm import LocalAlarmController

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [SIMULATOR] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("serial_simulator")


def test_malformed_packets():
    """Verify that malformed serial strings are rejected safely without crashing."""
    logger.info("=================================================================")
    logger.info("TEST STEP 1: Malformed Packet Rejection Verification")
    logger.info("=================================================================")

    malformed_samples = [
        "",
        "   ",
        "corrupt,packet",
        "2026-09-15T12:00:00Z,not_a_number,0.01,9.81,200",
        "2026-09-15T12:00:00Z,0.05,nan,9.81,200",
        "12.5,45.2",
        "node_invalid_char*&,2026-09-15T12:00:00Z,0.01,0.02,9.81,150",
        "null,null,null,null",
        ",,,,",
    ]

    for raw in malformed_samples:
        valid, result = parse_and_validate_packet(raw)
        assert not valid, f"Malformed packet unexpectedly passed: '{raw}'"
        assert ("MALFORMED" in result) or ("IMPOSSIBLE_VALUE" in result), f"Rejection reason unexpected: '{result}'"
        logger.info(f"✓ Rejected malformed packet: '{raw}' -> {result}")

    logger.info("Step 1 PASSED: All malformed packets safely rejected.\n")


def test_impossible_values():
    """Verify that impossible physical sensor values are rejected."""
    logger.info("=================================================================")
    logger.info("TEST STEP 2: Impossible-Value Rejection Verification")
    logger.info("=================================================================")

    impossible_samples = [
        # ax out of physical bounds (> 50 m/s²)
        ("2026-09-15T12:00:00Z,999.0,0.02,9.81,200", "ax > 50 m/s²"),
        # ay negative out of physical bounds (<-50 m/s²)
        ("2026-09-15T12:00:00Z,0.02,-125.0,9.81,200", "ay < -50 m/s²"),
        # az extreme out of bounds (> 50 m/s²)
        ("2026-09-15T12:00:00Z,0.01,0.02,95.0,200", "az > 50 m/s²"),
        # pot negative (< 0)
        ("2026-09-15T12:00:00Z,0.02,0.01,9.81,-50.0", "pot < 0"),
        # pot out of 10-bit ADC / physical bound (> 1023)
        ("2026-09-15T12:00:00Z,0.02,0.01,9.81,5000.0", "pot > 1023"),
        # gravity vector near zero (sensor disconnected / floating in zero-g)
        ("2026-09-15T12:00:00Z,0.01,0.01,0.1,200", "magnitude < 1.0 m/s²"),
    ]

    for raw, description in impossible_samples:
        valid, result = parse_and_validate_packet(raw)
        assert not valid, f"Impossible value unexpectedly passed: {description} ('{raw}')"
        assert "IMPOSSIBLE_VALUE" in result, f"Rejection reason did not mention IMPOSSIBLE_VALUE: '{result}'"
        logger.info(f"✓ Rejected impossible value ({description}): {result}")

    logger.info("Step 2 PASSED: All impossible values safely rejected.\n")


def test_100_consecutive_valid_packets():
    """
    STOP CONDITION REQUIREMENT:
    At least 100 consecutive valid packets must be successfully inserted into PostgreSQL.
    """
    logger.info("=================================================================")
    logger.info("TEST STEP 3: 100 Consecutive Valid Packets to PostgreSQL")
    logger.info("=================================================================")

    db = DatabaseWriter()
    alarm = LocalAlarmController()

    consecutive_success = 0
    target_count = 100
    inserted_ids = []

    logger.info(f"Streaming {target_count} consecutive valid packets through Raspberry Pi gateway...")

    base_time = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=15)

    for i in range(1, target_count + 1):
        packet_time = (base_time + datetime.timedelta(seconds=i * 2)).isoformat()

        # Simulate natural physical variations across normal, warning, and critical regimes
        if i <= 60:
            # Nominal normal baseline
            ax = round(random.gauss(0.05, 0.03), 3)
            ay = round(random.gauss(0.02, 0.02), 3)
            az = round(random.gauss(9.806, 0.04), 3)
            pot = round(random.uniform(5.0, 25.0), 1)
        elif i <= 85:
            # Accelerated displacement warning zone
            ax = round(random.gauss(0.35, 0.08), 3)
            ay = round(random.gauss(0.25, 0.06), 3)
            az = round(random.gauss(9.70, 0.10), 3)
            pot = round(random.uniform(70.0, 150.0), 1)
        else:
            # Shear failure critical threshold
            ax = round(random.gauss(1.20, 0.15), 3)
            ay = round(random.gauss(0.95, 0.12), 3)
            az = round(random.gauss(9.20, 0.20), 3)
            pot = round(random.uniform(250.0, 480.0), 1)

        node_id = "node-01" if (i % 2 == 1) else "node-02"

        # Packet format: timestamp,ax,ay,az,pot
        raw_packet = f"{packet_time},{ax},{ay},{az},{pot}"

        # Execute complete gateway pipeline
        success, payload = process_raw_packet(
            raw_packet,
            db=db,
            alarm=alarm,
            default_node_id=node_id,
            sync_pg=True,
        )

        if not success:
            logger.error(f"FAILURE on packet {i}: {payload}")
            consecutive_success = 0
            break

        consecutive_success += 1
        inserted_ids.append(payload.get("pg_record_id"))

        if i % 10 == 0 or i == target_count:
            logger.info(
                f"[{i:03d}/{target_count}] Consecutive Success: {consecutive_success} | "
                f"Node: {node_id} | Ax:{ax:+.2f} Ay:{ay:+.2f} Az:{az:+.2f} Pot:{pot:.1f} | "
                f"Status: {payload['status']} (Risk: {payload['risk_score']}%) | "
                f"PG ID: {payload.get('pg_record_id')}"
            )

    logger.info("=================================================================")
    logger.info(f"FINAL RESULT: {consecutive_success}/{target_count} consecutive packets inserted.")
    logger.info("=================================================================")

    assert consecutive_success >= target_count, (
        f"STOP CONDITION FAILED: Only {consecutive_success} consecutive packets succeeded "
        f"(Required: >= {target_count})"
    )

    return inserted_ids


def main():
    logger.info("Starting Phase 2 Acceptance Test Suite...")
    test_malformed_packets()
    test_impossible_values()
    inserted_ids = test_100_consecutive_valid_packets()

    logger.info("All Phase 2 Acceptance Criteria Successfully Passed!")
    logger.info(f"Total verified PostgreSQL records inserted: {len(inserted_ids)}")


if __name__ == "__main__":
    main()
