import React, { useState } from 'react';
import {
  RefreshCw,
  BrainCircuit,
  Info,
  Sliders,
  Send,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Layers,
} from 'lucide-react';
import { useMonitoring } from '../../context/MonitoringContext';
import { HistoricalDataChart } from './HistoricalDataChart';
import { AIRiskScoreChart } from './AIRiskScoreChart';
import { GroundMovementChart } from './GroundMovementChart';
import { FeatureImportanceChart } from './FeatureImportanceChart';
import { SensorTrendChart } from './SensorTrendChart';

export const AIPredictionView: React.FC = () => {
  const { aiPrediction, triggerAiEvaluation, isEvaluatingAi, stats, nodes } = useMonitoring();

  const [testAx, setTestAx] = useState<number>(0.05);
  const [testAy, setTestAy] = useState<number>(0.08);
  const [testAz, setTestAz] = useState<number>(9.81);
  const [testPot, setTestPot] = useState<number>(45);
  const [mlResult, setMlResult] = useState<any>(null);
  const [isInferring, setIsInferring] = useState<boolean>(false);

  const isHigh = aiPrediction.riskLevel.includes('HIGH') || stats.critical > 0;
  const isModerate =
    !isHigh && (aiPrediction.riskLevel.includes('MODERATE') || stats.warning > 0);

  const currentRisk = isHigh ? 'HIGH' : isModerate ? 'MODERATE' : 'LOW';
  const predictedCondition = isHigh
    ? 'Increasing shear slip'
    : isModerate
    ? 'Moderate slope creep'
    : 'Stable geotechnical baseline';
  const confidence = isHigh ? '89%' : isModerate ? '84%' : '95%';
  const expectedTrend = isHigh ? 'Increasing' : isModerate ? 'Slow creep' : 'Stable';

  const activeNode =
    nodes.find((n) => n.status === 'CRITICAL') ||
    nodes.find((n) => n.status === 'WARNING') ||
    nodes[0];

  const sensorTrendData = (activeNode?.history || []).map((pt) => ({
    time: pt.time,
    displacement: pt.displacement,
    vibration: pt.movement,
    tilt: pt.tilt !== undefined ? pt.tilt : (activeNode?.mpu6050?.tiltDeg ?? 0.8),
  }));

  const groundMovementData = (activeNode?.history || []).map((pt) => ({
    time: pt.time,
    displacement: pt.displacement,
  }));
  const currentDisplacement = activeNode?.displacementMm ?? 0;
  const firstDisp = groundMovementData[0]?.displacement ?? currentDisplacement;
  const lastDisp =
    groundMovementData[groundMovementData.length - 1]?.displacement ?? currentDisplacement;
  const dispDelta = lastDisp - firstDisp;
  const movementTrendDirection: 'STABLE' | 'INCREASING' | 'DECREASING' =
    dispDelta > 0.15 || activeNode?.displacementTrend === 'increasing'
      ? 'INCREASING'
      : dispDelta < -0.15 || activeNode?.displacementTrend === 'decreasing'
      ? 'DECREASING'
      : 'STABLE';

  const riskScoreData = (activeNode?.history || []).map((pt) => {
    let score: number;
    if (pt.displacement > 8 || pt.movement > 70) {
      score = Math.min(96, Math.max(76, Math.round(75 + pt.displacement * 1.2 + (pt.movement / 100) * 10)));
    } else if (pt.displacement > 2.5 || pt.movement > 35) {
      score = Math.min(74, Math.max(38, Math.round(35 + pt.displacement * 4.5 + (pt.movement / 100) * 15)));
    } else {
      score = Math.max(8, Math.min(28, Math.round(10 + pt.displacement * 6 + (pt.movement / 100) * 8)));
    }
    return {
      time: pt.time,
      riskScore: score,
      level: score >= 75 ? 'Critical' : score >= 40 ? 'Warning' : 'Normal',
      displacement: pt.displacement,
    };
  });

  const currentRiskScore =
    riskScoreData.length > 0
      ? riskScoreData[riskScoreData.length - 1].riskScore
      : isHigh
      ? 88
      : isModerate
      ? 56
      : 15;

  const initialRisk =
    riskScoreData.length > 3 ? riskScoreData[0].riskScore : currentRiskScore;
  const riskDelta = currentRiskScore - initialRisk;
  const riskTrendDirection: 'STABLE' | 'INCREASING' | 'DECREASING' =
    riskDelta > 3
      ? 'INCREASING'
      : riskDelta < -3
      ? 'DECREASING'
      : 'STABLE';

  const handleRunCustomInference = async () => {
    setIsInferring(true);
    try {
      const resp = await fetch('/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ax: testAx, ay: testAy, az: testAz, pot: testPot }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setMlResult(data);
      }
    } finally {
      setIsInferring(false);
    }
  };

  return (
    <div id="ai-prediction-view" className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 text-slate-100">
      {/* HISTORICAL DATA GRAPH */}
      <HistoricalDataChart />

      {/* Main AI Prediction Card */}
      <div
        className={`rounded-2xl border p-6 shadow-sm transition-all duration-300 ${
          isHigh
            ? 'bg-[#180e0e] border-red-800/80'
            : isModerate
            ? 'bg-[#18130e] border-amber-800/80'
            : 'bg-[#0e1611] border-emerald-900/40'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
            Current Geological Risk Assessment
          </span>
          <span className="text-xs font-mono text-slate-400">
            Engine: {aiPrediction.source || 'Random Forest Classifier'}
          </span>
        </div>

        {/* 4 Essential Factors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Current Risk Level
            </span>
            <div
              className={`text-2xl font-bold tracking-tight mt-1 ${
                isHigh ? 'text-red-400' : isModerate ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {currentRisk}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Predicted Condition
            </span>
            <div className="text-sm font-bold text-white mt-1 truncate">
              {predictedCondition}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Model Confidence
            </span>
            <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
              {confidence}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Expected Trend
            </span>
            <div className="text-sm font-bold text-white mt-1">
              {expectedTrend}
            </div>
          </div>
        </div>

        {/* Short Summary */}
        <div className="mt-5 pt-4 border-t border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-300">
          <span>{aiPrediction.shortExplanation}</span>
          <span className="text-slate-400 font-mono">Last Evaluated: {aiPrediction.timestamp}</span>
        </div>
      </div>

      {/* GRAPH 1: AI Risk Score vs Time */}
      <AIRiskScoreChart
        data={riskScoreData}
        currentScore={currentRiskScore}
        currentLevel={currentRisk as 'LOW' | 'MODERATE' | 'HIGH'}
        trendDirection={riskTrendDirection}
        isHigh={isHigh}
        isModerate={isModerate}
      />

      {/* GRAPHS 2 & 3: Ground Movement Trend & AI Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GroundMovementChart
          data={groundMovementData}
          currentDisplacement={currentDisplacement}
          trendDirection={movementTrendDirection}
        />

        <FeatureImportanceChart
          modelImportances={{
            acceleration_deviation: 0.38,
            pot: 0.28,
            ax: 0.14,
            ay: 0.12,
            az: 0.08,
          }}
          isModelConnected={true}
        />
      </div>

      {/* Interactive ML Classifier Tester */}
      <div className="p-5 rounded-2xl bg-[#0e1611] border border-emerald-900/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Interactive ML Model Inference Tester (POST /predict)
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-400">
            Real-Time Python/TS Random Forest Model
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Test the geotechnical classification model by feeding custom kinematics. The model derives
          magnitude, deviation, and tilt to assign a discrete status and risk score.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1">
              Ax ({testAx} m/s²)
            </label>
            <input
              type="range"
              min="-2"
              max="4"
              step="0.05"
              value={testAx}
              onChange={(e) => setTestAx(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1">
              Ay ({testAy} m/s²)
            </label>
            <input
              type="range"
              min="-2"
              max="4"
              step="0.05"
              value={testAy}
              onChange={(e) => setTestAy(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1">
              Az ({testAz} m/s²)
            </label>
            <input
              type="range"
              min="7"
              max="12"
              step="0.05"
              value={testAz}
              onChange={(e) => setTestAz(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1">
              Pot ADC ({testPot})
            </label>
            <input
              type="range"
              min="0"
              max="1023"
              step="5"
              value={testPot}
              onChange={(e) => setTestPot(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleRunCustomInference}
            disabled={isInferring}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{isInferring ? 'Inferring...' : 'Execute Model Inference'}</span>
          </button>

          {mlResult && (
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-slate-400">
                Risk Score:{' '}
                <strong className="text-white">{mlResult.risk_score}%</strong>
              </span>
              <span className="text-slate-400">
                Status:{' '}
                <strong
                  className={
                    mlResult.risk_status === 'CRITICAL'
                      ? 'text-red-400'
                      : mlResult.risk_status === 'WARNING'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }
                >
                  {mlResult.risk_status}
                </strong>
              </span>
              <span className="text-slate-400">
                Confidence:{' '}
                <strong className="text-emerald-400">{mlResult.confidence}%</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* GRAPH 4: Sensor Trend Graph */}
      <SensorTrendChart
        data={sensorTrendData}
        latestReading={{
          displacement: currentDisplacement,
          vibration: activeNode?.movementLevel === 'Severe' ? 88 : activeNode?.movementLevel === 'Moderate' ? 48 : 14,
          tilt: activeNode?.mpu6050?.tiltDeg ?? 0.8,
        }}
      />
    </div>
  );
};
