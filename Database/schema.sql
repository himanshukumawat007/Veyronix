-- Mine Subsidence Monitoring
-- PostgreSQL schema for the Arduino -> Gateway -> Raspberry Pi logger.

CREATE TABLE sensor_data (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    node_id VARCHAR(10),
    pot_value INTEGER,
    ax INTEGER,
    ay INTEGER,
    az INTEGER,
    rssi INTEGER
);

CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp
    ON sensor_data(timestamp);

CREATE INDEX IF NOT EXISTS idx_sensor_data_node_id
    ON sensor_data(node_id);
