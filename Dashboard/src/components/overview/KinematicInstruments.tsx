import React from 'react';
import { Compass, Gauge, Activity, Radio, AlertCircle } from 'lucide-react';
import { SensorNode } from '../../types';

interface KinematicInstrumentsProps {
  node: SensorNode;
}

export const KinematicInstruments: React.FC<KinematicInstrumentsProps> = ({ node }) => {
  const ax = node.mpu6050.accX;
  const ay = node.mpu6050.accY;
  const az = node.mpu6050.accZ;

  // Calculate physical tilt angles
  // Pitch (along Y/thrust axis) and Roll (along X/shear axis) in degrees
  const pitchDeg = Math.atan2(ay, Math.sqrt(ax * ax + az * az)) * (180 / Math.PI);
  const rollDeg = Math.atan2(-ax, az) * (180 / Math.PI);
  const totalTiltDeg = node.mpu6050.tiltDeg || Math.sqrt(pitchDeg * pitchDeg + rollDeg * rollDeg);

  // Magnitude in G's (1g = 9.80665 m/s²)
  const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);
  const gForce = magnitude / 9.80665;
  const deviation = Math.abs(magnitude - 9.80665);

  // Inclinometer bubble offset (max 32px radius)
  const bubbleX = Math.max(-28, Math.min(28, rollDeg * 2.2));
  const bubbleY = Math.max(-28, Math.min(28, -pitchDeg * 2.2));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. MPU6050 3D BOREHOLE INCLINOMETER (ARTIFICIAL HORIZON / DIP GAUGE) */}
      <div className="p-4 rounded-2xl bg-[#0d1611] border border-emerald-900/40 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Borehole Inclinometer
              </h4>
              <p className="text-[10px] text-slate-300">Dip &amp; Strike Tilt Bubble</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400">
            {totalTiltDeg.toFixed(2)}° Dip
          </span>
        </div>

        {/* Circular Bubble Level Indicator */}
        <div className="flex items-center justify-center py-2">
          <div className="relative h-28 w-28 rounded-full bg-[#070e0a] border-2 border-emerald-800/60 shadow-inner flex items-center justify-center">
            {/* Concentric rings representing 5°, 10°, 15° dip */}
            <div className="absolute h-20 w-20 rounded-full border border-emerald-900/50" />
            <div className="absolute h-12 w-12 rounded-full border border-emerald-900/50" />
            {/* Crosshairs */}
            <div className="absolute h-full w-0.5 bg-emerald-900/40" />
            <div className="absolute w-full h-0.5 bg-emerald-900/40" />

            {/* Bubble representing inclination vector */}
            <div
              className={`absolute h-6 w-6 rounded-full border-2 transition-transform duration-300 flex items-center justify-center shadow-lg ${
                totalTiltDeg > 5
                  ? 'bg-red-500/80 border-white shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                  : totalTiltDeg > 2
                  ? 'bg-amber-500/80 border-white shadow-[0_0_12px_rgba(245,158,11,0.8)]'
                  : 'bg-emerald-500/80 border-white shadow-[0_0_12px_rgba(16,185,129,0.8)]'
              }`}
              style={{
                transform: `translate(${bubbleX}px, ${bubbleY}px)`,
              }}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-white" />
            </div>
          </div>
        </div>

        <div className="flex justify-between text-[11px] font-mono text-slate-300 px-2">
          <span>Pitch: {pitchDeg.toFixed(1)}°</span>
          <span>Roll: {rollDeg.toFixed(1)}°</span>
        </div>
      </div>

      {/* 2. DYNAMIC GRAVITY VECTOR & KINEMATIC ACCELERATION */}
      <div className="p-4 rounded-2xl bg-[#0d1611] border border-emerald-900/40 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
              <Gauge className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Gravitational Vector
              </h4>
              <p className="text-[10px] text-slate-300">Kinematic Resultant |a|</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-400">
            {gForce.toFixed(3)} G
          </span>
        </div>

        {/* Gauge bar */}
        <div className="space-y-2 py-3">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-300">Resultant Magnitude:</span>
            <span className="text-white font-bold">{magnitude.toFixed(2)} m/s²</span>
          </div>

          <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 flex">
            {/* Normal baseline range (approx 9.8 m/s²) */}
            <div
              className={`h-full transition-all duration-300 ${
                deviation > 0.3
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(10, (magnitude / 14) * 100))}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>0 m/s²</span>
            <span className="text-emerald-400 font-bold">1.0g (9.81)</span>
            <span>14 m/s²</span>
          </div>
        </div>

        <div className="flex justify-between text-[11px] font-mono text-slate-300 px-1 pt-1 border-t border-emerald-950">
          <span>Deviation (Δg):</span>
          <span className={deviation > 0.3 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
            ±{deviation.toFixed(3)} m/s²
          </span>
        </div>
      </div>

      {/* 3. MICRO-SEISMIC ACOUSTIC & TREMOR EMISSION */}
      <div className="p-4 rounded-2xl bg-[#0d1611] border border-emerald-900/40 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Micro-Tremor Trace
              </h4>
              <p className="text-[10px] text-slate-300">High-rate MPU acoustic pulse</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
            10 HZ LIVE
          </span>
        </div>

        {/* Real-time Oscilloscope Waveform Graphic */}
        <div className="h-20 w-full rounded-xl bg-[#050a07] border border-emerald-950 p-1 relative overflow-hidden flex items-center justify-center">
          <svg viewBox="0 0 300 60" className="w-full h-full">
            {/* Grid */}
            <line x1="0" y1="30" x2="300" y2="30" stroke="#162e20" strokeWidth="0.8" strokeDasharray="3 3" />
            <line x1="150" y1="0" x2="150" y2="60" stroke="#162e20" strokeWidth="0.8" strokeDasharray="3 3" />

            {/* Seismic wave trace */}
            <path
              d={
                node.status === 'CRITICAL'
                  ? 'M 0 30 Q 30 5 60 30 T 120 50 T 180 5 T 240 55 T 300 30'
                  : node.status === 'WARNING'
                  ? 'M 0 30 Q 30 18 60 30 T 120 40 T 180 20 T 240 38 T 300 30'
                  : 'M 0 30 Q 30 26 60 30 T 120 33 T 180 27 T 240 32 T 300 30'
              }
              fill="none"
              stroke={node.status === 'CRITICAL' ? '#f87171' : '#34d399'}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute top-1 right-2 text-[9px] font-mono text-emerald-500">
            SAMPLING ACTIVE
          </div>
        </div>

        <div className="flex justify-between text-[11px] font-mono text-slate-300 px-1">
          <span>Ax: {ax.toFixed(2)}</span>
          <span>Ay: {ay.toFixed(2)}</span>
          <span>Az: {az.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
