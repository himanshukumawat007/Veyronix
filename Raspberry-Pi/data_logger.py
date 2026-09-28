import os
import serial
import psycopg2
from datetime import datetime

# ==============================
# SERIAL CONNECTION
# ==============================

SERIAL_PORT = os.getenv("SERIAL_PORT", "/dev/ttyACM0")
BAUD_RATE = int(os.getenv("BAUD_RATE", "9600"))

ser = serial.Serial(
    SERIAL_PORT,
    BAUD_RATE,
    timeout=2
)

# ==============================
# POSTGRESQL CONNECTION
# ==============================

conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME", "mine_monitoring"),
    user=os.getenv("DB_USER", "mine_user"),
    password=os.getenv("DB_PASSWORD", ""),
    host=os.getenv("DB_HOST", "127.0.0.1"),
    port=os.getenv("DB_PORT", "5432")
)

cursor = conn.cursor()

# ==============================
# CSV FILE
# ==============================

csv_path = os.getenv(
    "CSV_PATH",
    os.path.expanduser("~/node_data.csv")
)

file = open(csv_path, "a")

print("================================")
print(" Mine Monitoring Data Logger")
print("================================")
print(f"Serial   : {SERIAL_PORT}")
print(f"Database : {os.getenv('DB_NAME', 'mine_monitoring')}")
print(f"Saving   : PostgreSQL + CSV")
print(f"CSV      : {csv_path}")
print("================================")
print("Waiting for sensor data...")
print()

while True:
    try:
        line = ser.readline().decode(
            "utf-8",
            errors="ignore"
        ).strip()

        if not line:
            continue

        if not (
            line.startswith("NODE1") or
            line.startswith("NODE2")
        ):
            continue

        print("RECEIVED:", line)

        parts = line.split(",")

        node_id = parts[0]
        values = {}

        for item in parts[1:]:
            if "=" not in item:
                continue

            key, value = item.split("=", 1)
            values[key] = value

        required = [
            "POT",
            "AX",
            "AY",
            "AZ",
            "TILT",
            "RSSI",
            "STATUS"
        ]

        if not all(key in values for key in required):
            print("Incomplete packet - skipped")
            print()
            continue

        pot_value = int(values["POT"])
        ax = int(values["AX"])
        ay = int(values["AY"])
        az = int(values["AZ"])
        tilt = float(values["TILT"])
        rssi = int(values["RSSI"])
        status = values["STATUS"]

        timestamp = datetime.now()
        timestamp_text = timestamp.strftime("%Y-%m-%d %H:%M:%S")

        csv_line = (
            timestamp_text + "," +
            node_id + "," +
            str(pot_value) + "," +
            str(ax) + "," +
            str(ay) + "," +
            str(az) + "," +
            str(tilt) + "," +
            str(rssi) + "," +
            status
        )

        file.write(csv_line + "\n")
        file.flush()

        cursor.execute(
            """
            INSERT INTO sensor_data
            (
                timestamp,
                node_id,
                pot_value,
                ax,
                ay,
                az,
                rssi,
                tilt,
                status
            )
            VALUES
            (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                timestamp,
                node_id,
                pot_value,
                ax,
                ay,
                az,
                rssi,
                tilt,
                status
            )
        )

        conn.commit()

        print(
            "SAVED:",
            node_id,
            "| POT:", pot_value,
            "| TILT:", tilt,
            "| RSSI:", rssi,
            "| STATUS:", status
        )
        print()

    except KeyboardInterrupt:
        print()
        print("Data Logger Stopped")
        break

    except Exception as e:
        print("Error:", e)

file.close()
cursor.close()
conn.close()
ser.close()
