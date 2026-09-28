#!/usr/bin/env python3
"""
BHU-DRISHTI — Raspberry Pi Local SQLite Storage Engine (Offline-First)
"""

import sqlite3
import os
import threading

DEFAULT_DB_PATH = os.environ.get("LOCAL_DB_PATH", os.path.expanduser("~/bhu_drishti/local_telemetry.db"))

class DatabaseWriter:
    def __init__(self, db_path=DEFAULT_DB_PATH):
        self.db_path = db_path
        os.makedirs(os.path.dirname(os.path.abspath(self.db_path)), exist_ok=True)
        self.lock = threading.Lock()
        self._init_db()

    def _init_db(self):
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS telemetry (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    node_id TEXT NOT NULL,
                    ax REAL NOT NULL,
                    ay REAL NOT NULL,
                    az REAL NOT NULL,
                    pot REAL NOT NULL,
                    disp_mm REAL NOT NULL,
                    mag REAL NOT NULL,
                    dev REAL NOT NULL,
                    status TEXT NOT NULL,
                    risk_score REAL NOT NULL,
                    synced INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_synced ON telemetry (synced)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_timestamp ON telemetry (timestamp)")
            conn.commit()
            conn.close()

    def log_reading(self, timestamp, node_id, ax, ay, az, pot, disp_mm, mag, dev, status, score):
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO telemetry 
                (timestamp, node_id, ax, ay, az, pot, disp_mm, mag, dev, status, risk_score, synced)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
            """, (timestamp, node_id, ax, ay, az, pot, disp_mm, mag, dev, status, score))
            row_id = cursor.lastrowid
            conn.commit()
            conn.close()
            return row_id

    def get_unsynced(self, limit=100):
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, timestamp, node_id, ax, ay, az, pot, disp_mm, mag, dev, status, risk_score
                FROM telemetry
                WHERE synced = 0
                ORDER BY id ASC
                LIMIT ?
            """, (limit,))
            rows = [dict(row) for row in cursor.fetchall()]
            conn.close()
            return rows

    def mark_synced(self, ids):
        if not ids:
            return
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            placeholders = ",".join("?" for _ in ids)
            cursor.execute(f"UPDATE telemetry SET synced = 1 WHERE id IN ({placeholders})", ids)
            conn.commit()
            conn.close()

    def get_queue_size(self):
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM telemetry WHERE synced = 0")
            count = cursor.fetchone()[0]
            conn.close()
            return count
