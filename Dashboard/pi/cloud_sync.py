#!/usr/bin/env python3
"""
BHU-DRISHTI — Raspberry Pi 3B Offline-First Cloud Synchronizer (Phase 3)
------------------------------------------------------------------------
Monitors local SQLite database queue. When PostgreSQL or the network drops,
records are buffered safely in SQLite. When the connection is restored,
records are replayed in strict FIFO chronological order (ORDER BY id ASC),
ensuring zero data loss and strict sequence preservation.
"""

import os
import sys
import time
import json
import logging
import urllib.request
import urllib.error
from database_writer import DatabaseWriter

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [CLOUD_SYNC] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("cloud_sync")

CLOUD_INGEST_URL = os.environ.get(
    "CLOUD_INGEST_URL", "http://localhost:3000/api/sensor-data?waitForDb=true"
)
SYNC_INTERVAL = float(os.environ.get("SYNC_INTERVAL_SEC", "2.0"))
BATCH_SIZE = int(os.environ.get("SYNC_BATCH_SIZE", "50"))


def sync_batch(db, url=CLOUD_INGEST_URL, batch_size=BATCH_SIZE):
    """
    Fetches the oldest unsynced records (FIFO ordered by id ASC),
    posts them to the backend PostgreSQL ingestion endpoint,
    and marks them synced upon confirmed 200/201 response.
    Returns (synced_count, remaining_count).
    """
    unsynced = db.get_unsynced(limit=batch_size)
    if not unsynced:
        return 0, 0

    synced_ids = []
    for record in unsynced:
        payload = {
            "id": f"{record['node_id']}-offline-{record['id']}-{int(time.time()*1000)}",
            "timestamp": record["timestamp"],
            "node_id": record["node_id"],
            "ax": record["ax"],
            "ay": record["ay"],
            "az": record["az"],
            "pot": record["pot"],
            "pot_unit": os.environ.get("POT_UNIT", "auto").lower(),
            "waitForDb": True,
            "is_synthetic": False,
        }

        body_data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=body_data,
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=5.0) as resp:
                if resp.status in (200, 201):
                    synced_ids.append(record["id"])
                else:
                    logger.warning(f"Cloud HTTP {resp.status} response during sync")
                    break
        except Exception as e:
            # Network or database remains unavailable
            logger.debug(f"Sync attempt paused: {e}")
            break

    if synced_ids:
        db.mark_synced(synced_ids)
        remaining = db.get_queue_size()
        logger.info(f"Replayed {len(synced_ids)} records to PostgreSQL. Remaining in queue: {remaining}")
        return len(synced_ids), remaining

    return 0, db.get_queue_size()


def replay_all_unsynced(db, url=CLOUD_INGEST_URL, batch_size=BATCH_SIZE):
    """
    Replays all unsynced records until the queue is completely drained.
    Returns total synced count.
    """
    total_synced = 0
    while True:
        synced, remaining = sync_batch(db, url=url, batch_size=batch_size)
        if synced == 0:
            break
        total_synced += synced
        if remaining == 0:
            break
    return total_synced


def main():
    logger.info("=" * 65)
    logger.info("BHU-DRISHTI — Raspberry Pi Offline-First Cloud Synchronizer")
    logger.info(f"Target Cloud Ingestion: {CLOUD_INGEST_URL}")
    logger.info(f"Sync Interval: {SYNC_INTERVAL}s | Batch Size: {BATCH_SIZE}")
    logger.info("=" * 65)

    db = DatabaseWriter()
    backoff = 2.0

    while True:
        try:
            queue_size = db.get_queue_size()
            if queue_size > 0:
                synced, remaining = sync_batch(db)
                if synced > 0:
                    backoff = 2.0
                else:
                    time.sleep(backoff)
                    backoff = min(30.0, backoff * 1.5)
            else:
                time.sleep(SYNC_INTERVAL)
        except KeyboardInterrupt:
            logger.info("Shutting down cloud synchronizer...")
            break
        except Exception as e:
            logger.error(f"Unexpected sync error: {e}")
            time.sleep(5.0)


if __name__ == "__main__":
    main()
