/**
 * Demo topology for the BHU-DRISHTI platform.
 *
 * IMPORTANT: every zone below except the hardware prototype rig is SIMULATED demo data.
 * Locations are approximate coalfield areas chosen only to make the demo map realistic —
 * they are not real deployments, and no real mine or government data is represented.
 */
import type { Region, Zone } from './types';

export const REGIONS: Region[] = [
  { id: 'jharkhand', name: 'Jharkhand', state: 'Jharkhand' },
  { id: 'chhattisgarh', name: 'Chhattisgarh', state: 'Chhattisgarh' },
  { id: 'odisha', name: 'Odisha', state: 'Odisha' },
  { id: 'west-bengal', name: 'West Bengal', state: 'West Bengal' },
  { id: 'prototype', name: 'Hardware Prototype', state: 'Lab test rig' },
];

const T = { warningScore: 32, criticalScore: 68 };

export interface ZoneSeed extends Zone {
  publicVisible: boolean;
  nodeCount: number;
}

export const ZONES: ZoneSeed[] = [
  {
    id: 'jh-jharia-a', name: 'Zone A', siteName: 'Jharia Coalfield Demo Site', regionId: 'jharkhand',
    lat: 23.745, lng: 86.415, gatewayId: 'BD-GW-001', monitoringEnabled: true, thresholds: { ...T },
    description: 'Residential fringe above old workings', dataSource: 'DEMO', publicVisible: true, nodeCount: 4,
  },
  {
    id: 'jh-jharia-b', name: 'Zone B', siteName: 'Jharia Coalfield Demo Site', regionId: 'jharkhand',
    lat: 23.772, lng: 86.372, gatewayId: 'BD-GW-002', monitoringEnabled: true, thresholds: { ...T },
    description: 'Road corridor and market area', dataSource: 'DEMO', publicVisible: true, nodeCount: 4,
  },
  {
    id: 'jh-bokaro', name: 'Zone C', siteName: 'East Bokaro Demo Site', regionId: 'jharkhand',
    lat: 23.785, lng: 85.955, gatewayId: 'BD-GW-003', monitoringEnabled: true, thresholds: { ...T },
    description: 'Village settlement near underground panel', dataSource: 'DEMO', publicVisible: true, nodeCount: 4,
  },
  {
    id: 'cg-korba-a', name: 'Zone A', siteName: 'Korba Coalfield Demo Site', regionId: 'chhattisgarh',
    lat: 22.352, lng: 82.684, gatewayId: 'BD-GW-004', monitoringEnabled: true, thresholds: { ...T },
    description: 'Agricultural land above workings', dataSource: 'DEMO', publicVisible: true, nodeCount: 4,
  },
  {
    id: 'cg-korba-b', name: 'Zone B', siteName: 'Korba Coalfield Demo Site', regionId: 'chhattisgarh',
    lat: 22.331, lng: 82.735, gatewayId: 'BD-GW-005', monitoringEnabled: true, thresholds: { ...T },
    description: 'School and village road', dataSource: 'DEMO', publicVisible: true, nodeCount: 4,
  },
  {
    id: 'od-talcher', name: 'Zone A', siteName: 'Talcher Coalfield Demo Site', regionId: 'odisha',
    lat: 20.948, lng: 85.205, gatewayId: 'BD-GW-006', monitoringEnabled: true, thresholds: { ...T },
    description: 'Township boundary', dataSource: 'DEMO', publicVisible: true, nodeCount: 4,
  },
  {
    id: 'od-ib-valley', name: 'Zone B', siteName: 'Ib Valley Demo Site', regionId: 'odisha',
    lat: 21.832, lng: 83.921, gatewayId: 'BD-GW-007', monitoringEnabled: true, thresholds: { ...T },
    description: 'Railway siding and approach road', dataSource: 'DEMO', publicVisible: true, nodeCount: 4,
  },
  {
    id: 'wb-raniganj-a', name: 'Zone A', siteName: 'Raniganj Coalfield Demo Site', regionId: 'west-bengal',
    lat: 23.618, lng: 87.103, gatewayId: 'BD-GW-008', monitoringEnabled: true, thresholds: { ...T },
    description: 'Housing colony above abandoned galleries', dataSource: 'DEMO', publicVisible: true, nodeCount: 4,
  },
  {
    id: 'wb-raniganj-b', name: 'Zone B', siteName: 'Raniganj Coalfield Demo Site', regionId: 'west-bengal',
    lat: 23.662, lng: 87.162, gatewayId: 'BD-GW-009', monitoringEnabled: true, thresholds: { ...T },
    description: 'Highway stretch and village cluster', dataSource: 'DEMO', publicVisible: true, nodeCount: 4,
  },
  {
    id: 'proto-rig', name: 'Test Rig', siteName: 'BHU-DRISHTI Hardware Prototype', regionId: 'prototype',
    lat: 0, lng: 0, gatewayId: 'pi3b-gateway-01', monitoringEnabled: true, thresholds: { ...T },
    description: 'Physical sand/coal ground model with Arduino nodes, LoRa and Raspberry Pi gateway',
    dataSource: 'LIVE', publicVisible: false, nodeCount: 0,
  },
];

/** Scenario targets: which zone reacts to each demo scenario. */
export const SCENARIO_TARGETS = {
  warningZone: 'cg-korba-b',
  criticalZone: 'wb-raniganj-b',
  sensorFaultZone: 'jh-jharia-a',
  sensorFaultNode: 'NODE-002',
  permanentlyOfflineNode: 'NODE-027',
};

/** Historical incidents shown in the incident log (demo history, clearly flagged isDemo). */
export const HISTORICAL_INCIDENTS: Array<{
  zoneId: string; severity: 'WARNING' | 'CRITICAL'; trigger: string; daysAgo: number; durationMin: number;
}> = [
  { zoneId: 'wb-raniganj-a', severity: 'WARNING', trigger: 'Correlated tilt + displacement increase after heavy rainfall', daysAgo: 0.2, durationMin: 95 },
  { zoneId: 'jh-jharia-b', severity: 'CRITICAL', trigger: 'Rapid crack widening with vibration spike (3 of 4 nodes)', daysAgo: 3, durationMin: 240 },
  { zoneId: 'cg-korba-a', severity: 'WARNING', trigger: 'Gradual settlement trend detected by AI trend model', daysAgo: 5, durationMin: 180 },
  { zoneId: 'od-talcher', severity: 'WARNING', trigger: 'Displacement creep on two adjacent nodes', daysAgo: 8, durationMin: 130 },
  { zoneId: 'wb-raniganj-b', severity: 'CRITICAL', trigger: 'Multi-sensor subsidence signature near highway', daysAgo: 12, durationMin: 360 },
  { zoneId: 'jh-bokaro', severity: 'WARNING', trigger: 'Tilt increase near village road', daysAgo: 17, durationMin: 70 },
  { zoneId: 'od-ib-valley', severity: 'WARNING', trigger: 'Vibration + displacement after nearby blasting', daysAgo: 22, durationMin: 45 },
  { zoneId: 'jh-jharia-a', severity: 'CRITICAL', trigger: 'Correlated ground movement across residential fringe', daysAgo: 27, durationMin: 300 },
];
