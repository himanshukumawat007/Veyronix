/**
 * BHU-DRISHTI Grafana Cloud & Dashboard Configuration
 *
 * Implements the 10-panel analytical monitoring dashboard with native PostgreSQL queries
 * connected directly to the Cloud SQL PostgreSQL telemetry_records & sensor_nodes tables:
 * Panel 1: Ax / Ay / Az (3-axis vibration time-series)
 * Panel 2: Potentiometer (physical displacement sensor)
 * Panel 3: Acceleration Magnitude (scalar kinematic sum)
 * Panel 4: Acceleration Deviation (variation from 9.81 m/s^2)
 * Panel 5: Risk Score (0-100 gauge)
 * Panel 6: Risk Status (Normal / Warning / Critical discrete states)
 * Panel 7: Node Activity (Active sensor nodes count & status)
 * Panel 8: Data Ingestion Rate (Packets per minute throughput)
 * Panel 9: Historical Risk Trend (Time-series multi-hour progression)
 * Panel 10: System Health (End-to-end pipeline heartbeat)
 */

export function getGrafanaConfig() {
  const url = process.env.GRAFANA_URL || 'https://your-instance.grafana.net';
  const orgId = process.env.GRAFANA_ORG_ID || '1';
  const datasourceUid = process.env.GRAFANA_DATASOURCE_UID || 'postgres';
  const hasApiKey = Boolean(process.env.GRAFANA_API_KEY);

  const sqlHost = process.env.SQL_HOST;
  const sqlDb = process.env.SQL_DB_NAME || 'cloud_sql_development_database';
  const sqlUser = process.env.SQL_USER || 'ai_studio_app_user';
  const postgresConfigured = Boolean(sqlHost);

  return {
    configured: Boolean(process.env.GRAFANA_URL && hasApiKey),
    url,
    orgId,
    datasourceUid,
    hasApiKey,
    dashboardUid: 'bhu-drishti-telemetry',
    postgres: {
      configured: postgresConfigured,
      host: sqlHost ? 'Cloud SQL Auth Proxy' : 'localhost',
      database: sqlDb,
      user: sqlUser,
      table: 'telemetry_records',
    },
  };
}

export function generateGrafanaDashboardJson(): object {
  const dsUid = process.env.GRAFANA_DATASOURCE_UID || 'postgres';

  return {
    annotations: { list: [] },
    editable: true,
    fiscalYearStartMonth: 0,
    graphTooltip: 1,
    id: null,
    links: [],
    liveNow: true,
    panels: [
      // Row 1: Key State Gauges & System Health
      {
        id: 5,
        gridPos: { h: 6, w: 6, x: 0, y: 0 },
        type: 'gauge',
        title: 'Panel 5: Current Geotechnical Risk Score',
        datasource: { type: 'postgres', uid: dsUid },
        targets: [
          {
            datasource: { type: 'postgres', uid: dsUid },
            rawSql: 'SELECT risk_score FROM telemetry_records ORDER BY timestamp DESC LIMIT 1;',
            format: 'table',
          },
        ],
        fieldConfig: {
          defaults: {
            min: 0,
            max: 100,
            unit: 'percent',
            thresholds: {
              mode: 'absolute',
              steps: [
                { color: '#10b981', value: null },
                { color: '#f59e0b', value: 32 },
                { color: '#ef4444', value: 68 },
              ],
            },
          },
        },
      },
      {
        id: 6,
        gridPos: { h: 6, w: 6, x: 6, y: 0 },
        type: 'stat',
        title: 'Panel 6: Geotechnical Risk Status',
        datasource: { type: 'postgres', uid: dsUid },
        targets: [
          {
            datasource: { type: 'postgres', uid: dsUid },
            rawSql: 'SELECT risk_status FROM telemetry_records ORDER BY timestamp DESC LIMIT 1;',
            format: 'table',
          },
        ],
      },
      {
        id: 7,
        gridPos: { h: 6, w: 6, x: 12, y: 0 },
        type: 'stat',
        title: 'Panel 7: Node Activity & Online Sensors',
        datasource: { type: 'postgres', uid: dsUid },
        targets: [
          {
            datasource: { type: 'postgres', uid: dsUid },
            rawSql: "SELECT COUNT(DISTINCT node_id) as online_nodes FROM telemetry_records WHERE timestamp >= NOW() - INTERVAL '5 minutes';",
            format: 'table',
          },
        ],
      },
      {
        id: 8,
        gridPos: { h: 6, w: 6, x: 18, y: 0 },
        type: 'timeseries',
        title: 'Panel 8: Data Ingestion Rate (pkt/min)',
        datasource: { type: 'postgres', uid: dsUid },
        targets: [
          {
            datasource: { type: 'postgres', uid: dsUid },
            rawSql: "SELECT date_trunc('minute', timestamp) as time, COUNT(*) as packets FROM telemetry_records WHERE $__timeFilter(timestamp) GROUP BY 1 ORDER BY 1 ASC;",
            format: 'time_series',
          },
        ],
      },

      // Row 2: 3-Axis Accelerometer (Ax, Ay, Az)
      {
        id: 1,
        gridPos: { h: 9, w: 12, x: 0, y: 6 },
        type: 'timeseries',
        title: 'Panel 1: Ax / Ay / Az Telemetry (MPU6050 Accelerometer)',
        datasource: { type: 'postgres', uid: dsUid },
        targets: [
          {
            datasource: { type: 'postgres', uid: dsUid },
            rawSql: 'SELECT timestamp as time, ax as "Ax (m/s²)", ay as "Ay (m/s²)", az as "Az (m/s²)" FROM telemetry_records WHERE $__timeFilter(timestamp) ORDER BY timestamp ASC;',
            format: 'time_series',
          },
        ],
        fieldConfig: {
          defaults: {
            custom: { lineWidth: 2, fillOpacity: 10 },
            unit: 'accMS2',
          },
        },
      },

      // Row 2: Potentiometer (Displacement Sensor)
      {
        id: 2,
        gridPos: { h: 9, w: 12, x: 12, y: 6 },
        type: 'timeseries',
        title: 'Panel 2: Potentiometer Physical Shear Displacement',
        datasource: { type: 'postgres', uid: dsUid },
        targets: [
          {
            datasource: { type: 'postgres', uid: dsUid },
            rawSql: 'SELECT timestamp as time, displacement_mm as "Displacement (mm)" FROM telemetry_records WHERE $__timeFilter(timestamp) ORDER BY timestamp ASC;',
            format: 'time_series',
          },
        ],
        fieldConfig: {
          defaults: {
            custom: { lineWidth: 2, fillOpacity: 15 },
            unit: 'lengthmm',
          },
        },
      },

      // Row 3: Kinematic Derived Acceleration (Magnitude & Deviation)
      {
        id: 3,
        gridPos: { h: 8, w: 12, x: 0, y: 15 },
        type: 'timeseries',
        title: 'Panel 3: Acceleration Magnitude |a| = √(Ax² + Ay² + Az²)',
        datasource: { type: 'postgres', uid: dsUid },
        targets: [
          {
            datasource: { type: 'postgres', uid: dsUid },
            rawSql: 'SELECT timestamp as time, acceleration_magnitude as "|a| (m/s²)" FROM telemetry_records WHERE $__timeFilter(timestamp) ORDER BY timestamp ASC;',
            format: 'time_series',
          },
        ],
      },
      {
        id: 4,
        gridPos: { h: 8, w: 12, x: 12, y: 15 },
        type: 'timeseries',
        title: 'Panel 4: Acceleration Deviation | |a| - 9.806 m/s² |',
        datasource: { type: 'postgres', uid: dsUid },
        targets: [
          {
            datasource: { type: 'postgres', uid: dsUid },
            rawSql: 'SELECT timestamp as time, acceleration_deviation as "Deviation (m/s²)" FROM telemetry_records WHERE $__timeFilter(timestamp) ORDER BY timestamp ASC;',
            format: 'time_series',
          },
        ],
      },

      // Row 4: Historical Risk Trend & System Health
      {
        id: 9,
        gridPos: { h: 8, w: 16, x: 0, y: 23 },
        type: 'timeseries',
        title: 'Panel 9: Historical Risk Score & Trend Timeline',
        datasource: { type: 'postgres', uid: dsUid },
        targets: [
          {
            datasource: { type: 'postgres', uid: dsUid },
            rawSql: 'SELECT timestamp as time, risk_score as "Risk Score (%)" FROM telemetry_records WHERE $__timeFilter(timestamp) ORDER BY timestamp ASC;',
            format: 'time_series',
          },
        ],
      },
      {
        id: 10,
        gridPos: { h: 8, w: 8, x: 16, y: 23 },
        type: 'stat',
        title: 'Panel 10: End-to-End System Health',
        datasource: { type: 'postgres', uid: dsUid },
        targets: [
          {
            datasource: { type: 'postgres', uid: dsUid },
            rawSql: "SELECT COUNT(*) as packets_last_minute FROM telemetry_records WHERE timestamp >= NOW() - INTERVAL '1 minute';",
            format: 'table',
          },
        ],
      },
    ],
    refresh: '5s',
    schemaVersion: 38,
    style: 'dark',
    tags: ['bhu-drishti', 'geotechnical', 'lora', 'iot', 'postgresql'],
    time: { from: 'now-1h', to: 'now' },
    timepicker: {
      refresh_intervals: ['1s', '5s', '10s', '30s', '1m'],
    },
    timezone: 'browser',
    title: 'BHU-DRISHTI — Geotechnical Ground Monitoring System (PostgreSQL)',
    uid: 'bhu-drishti-telemetry',
    version: 2,
  };
}
