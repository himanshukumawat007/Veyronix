import React, { useState } from 'react';
import {
  Radio,
  Cpu,
  Database,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Battery,
  Wifi,
  Clock,
  Layers,
  Activity,
  Sliders,
} from 'lucide-react';
import { useMonitoring } from '../../context/MonitoringContext';
import { SensorNode } from '../../types';

export const NodesGatewayView: React.FC = () => {
  const {
    nodes,
    gateway,
    silenceAlarmBuzzer,
    openNodeTelemetry,
    stats,
    dataSourceMode,
  } = useMonitoring();

  const alarmColor = gateway.alarmState?.color || 'GREEN';
  const isBuzzerSounding = gateway.alarmState?.buzzerActive;

  return (
    <div id="nodes-gateway-view" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0e1611] border border-emerald-900/40">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Nodes Inventory & Raspberry Pi 3B Gateway
          </h2>
          <p className="text-xs text-slate-400">
            Physical edge hardware topology: Arduino Nano field transceivers → Arduino Mega → Raspberry Pi 3B
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-mono font-bold">
            GATEWAY: ONLINE
          </span>
        </div>
      </div>

      {/* Gateway & Hardware Alarm Double Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Raspberry Pi 3B Gateway Status */}
        <div className="p-5 rounded-2xl bg-[#0e1611] border border-emerald-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Cpu className="h-5 w-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Raspberry Pi 3B Edge Gateway
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              ARMv7 • Linux 6.1
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Serial Interface</span>
              <span className="text-white font-bold">{gateway.serialPort}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Baud Rate</span>
              <span className="text-white font-bold">{gateway.baudRate} bps</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Local SQLite DB</span>
              <span className="text-emerald-400 font-bold">CONNECTED</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Sync Backlog</span>
              <span className="text-white font-bold">{gateway.localQueueSize} packets</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#080d0a] border border-emerald-950 text-xs font-mono space-y-1 text-slate-400">
            <div className="flex justify-between">
              <span>LoRa Receiver Hardware:</span>
              <span className="text-slate-200">Arduino Mega 2560</span>
            </div>
            <div className="flex justify-between">
              <span>Radio Frequency:</span>
              <span className="text-slate-200">SX1278 @ 433 MHz</span>
            </div>
            <div className="flex justify-between">
              <span>Packet Checksum:</span>
              <span className="text-emerald-400">Valid (CRC OK)</span>
            </div>
          </div>
        </div>

        {/* Physical GPIO Hardware Alarm */}
        <div className="p-5 rounded-2xl bg-[#0e1611] border border-emerald-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Volume2 className="h-5 w-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Raspberry Pi Physical GPIO Alarm
              </h3>
            </div>
            {isBuzzerSounding ? (
              <button
                onClick={silenceAlarmBuzzer}
                className="px-3 py-1 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-500 cursor-pointer flex items-center gap-1.5 animate-pulse"
              >
                <VolumeX className="h-4 w-4" /> MUTE BUZZER
              </button>
            ) : (
              <span className="text-xs font-mono text-emerald-400">Buzzer Silent</span>
            )}
          </div>

          {/* LED Visualizer */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-around">
            {/* Green LED */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full border-2 transition-all ${
                  alarmColor === 'GREEN'
                    ? 'bg-emerald-500 border-white shadow-[0_0_16px_rgba(16,185,129,0.9)] scale-110'
                    : 'bg-emerald-950/40 border-emerald-900/60 opacity-40'
                }`}
              />
              <span className="text-[11px] font-mono font-bold text-slate-300">
                GREEN (Pin 17)
              </span>
              <span className="text-[10px] text-slate-400">Normal</span>
            </div>

            {/* Yellow LED */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full border-2 transition-all ${
                  alarmColor === 'YELLOW'
                    ? 'bg-amber-500 border-white shadow-[0_0_16px_rgba(245,158,11,0.9)] scale-110'
                    : 'bg-amber-950/40 border-amber-900/60 opacity-40'
                }`}
              />
              <span className="text-[11px] font-mono font-bold text-slate-300">
                YELLOW (Pin 27)
              </span>
              <span className="text-[10px] text-slate-400">Warning</span>
            </div>

            {/* Red LED */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full border-2 transition-all ${
                  alarmColor === 'RED'
                    ? 'bg-red-500 border-white shadow-[0_0_16px_rgba(239,68,68,0.9)] scale-110 animate-pulse'
                    : 'bg-red-950/40 border-red-900/60 opacity-40'
                }`}
              />
              <span className="text-[11px] font-mono font-bold text-slate-300">
                RED (Pin 22)
              </span>
              <span className="text-[10px] text-slate-400">Critical</span>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Active Alarm Rule: Buzzer sounds <strong>only</strong> when system reaches RED (Critical).
            Triggers at displacement &ge; 7.5 mm or deviation &ge; 1.0 m/s².
          </div>
        </div>
      </div>

      {/* Monitored Sensor Nodes Table */}
      <div className="p-5 rounded-2xl bg-[#0e1611] border border-emerald-900/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Monitored Field Sensor Nodes (Arduino Nano + MPU6050 + Potentiometer)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {nodes.length} Nodes in Array
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-emerald-900/40 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Node ID</th>
                <th className="py-2.5 px-3">Zone / Location</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Potentiometer</th>
                <th className="py-2.5 px-3">3-Axis MPU (Ax / Ay / Az)</th>
                <th className="py-2.5 px-3">RSSI / Signal</th>
                <th className="py-2.5 px-3">Battery</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/20 text-slate-200">
              {nodes.map((node) => (
                <tr key={node.id} className="hover:bg-emerald-950/20 transition-colors">
                  <td className="py-3 px-3 font-bold text-white">
                    {node.name} ({node.id})
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {node.zone}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        node.status === 'CRITICAL'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : node.status === 'WARNING'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {node.status}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-emerald-400">
                      {node.displacementMm.toFixed(2)} mm
                    </span>
                    <span className="text-slate-400 text-[10px] block">
                      ADC: {node.potValue}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {node.mpu6050.accX} / {node.mpu6050.accY} / {node.mpu6050.accZ} m/s²
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {node.rssi} dBm
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-emerald-400 font-bold">{node.batteryPct}%</span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => openNodeTelemetry(node.id)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/60 text-emerald-300 text-xs font-semibold cursor-pointer"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
