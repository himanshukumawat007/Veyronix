import { upsertSensorNode, upsertGatewayStatus } from './telemetry.ts';

export async function initializeDatabase() {
  console.log('[DB-INIT] Initializing base PostgreSQL sensor nodes and gateway status...');
  
  // 1. Ensure primary sensor nodes exist
  await upsertSensorNode({
    id: 'node-01',
    name: 'Node 01 (Ridge Crest)',
    zone: 'Zone A — Upper Crest',
    elevationMeters: 412.5,
    zoneLabel: 'Zone A',
    status: 'NORMAL',
    batteryPct: 98,
    rssi: -58,
  });

  await upsertSensorNode({
    id: 'node-02',
    name: 'Node 02 (Middle Slope)',
    zone: 'Zone B — Toe Embankment',
    elevationMeters: 388.0,
    zoneLabel: 'Zone B',
    status: 'NORMAL',
    batteryPct: 94,
    rssi: -64,
  });

  // 2. Ensure gateway status record exists
  await upsertGatewayStatus({
    id: 'pi3b-gateway-01',
    status: 'ONLINE',
    serialPort: '/dev/ttyACM0',
    baudRate: 115200,
    bufferBacklog: 0,
    uptimeSeconds: 3600,
    systemInfo: 'Raspberry Pi 3B (Linux 6.1 Debian 12 Bookworm)',
  });

  console.log('[DB-INIT] Database initialized successfully.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[DB-INIT] Initialization error:', err);
      process.exit(1);
    });
}
