import React, { useState } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { MonitoringProvider, useMonitoring } from '../context/MonitoringContext';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { OverviewView } from '../components/overview/OverviewView';
import { SensorAnalyticsView } from '../components/analytics/SensorAnalyticsView';
import { AIPredictionView } from '../components/ai/AIPredictionView';
import { GrafanaView } from '../components/grafana/GrafanaView';
import { NodesGatewayView } from '../components/gateway/NodesGatewayView';
import { AlertsView } from '../components/alerts/AlertsView';
import { PipelineSystemView } from '../components/pipeline/PipelineSystemView';
import { MiniMapView } from '../components/map/MiniMapView';
import { NodeDetailsModal } from '../components/nodes/NodeDetailsModal';

const MainContent: React.FC = () => {
  const { activePage, inspectModalNode, setInspectModalNodeId } = useMonitoring();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const theme = 'emerald';

  const renderActiveView = () => {
    switch (activePage) {
      case 'overview':
        return <OverviewView />;
      case 'analytics':
        return <SensorAnalyticsView />;
      case 'ai':
        return <AIPredictionView />;
      case 'grafana':
        return <GrafanaView />;
      case 'nodes':
      case 'status':
      case 'gateway':
        return <NodesGatewayView />;
      case 'alerts':
        return <AlertsView />;
      case 'pipeline':
      case 'system':
        return <PipelineSystemView />;
      case 'map':
        return <MiniMapView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div
      data-theme={theme}
      className="flex h-full min-h-screen bg-[#070b09] text-slate-100 font-sans relative overflow-hidden bg-grid-pattern selection:bg-emerald-500 selection:text-black transition-colors duration-200"
    >
      {/* Subtle emerald scientific ambient glow */}
      <div className="pointer-events-none fixed -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px]" />
      <div className="pointer-events-none fixed -bottom-40 left-1/3 w-96 h-96 bg-emerald-700/8 rounded-full blur-[140px]" />

      {/* Primary Sidebar */}
      <Sidebar
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onOpenMobile={() => setMobileNavOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Node Telemetry Modal */}
      {inspectModalNode && (
        <NodeDetailsModal
          node={inspectModalNode}
          onClose={() => setInspectModalNodeId(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MonitoringProvider>
        <MainContent />
      </MonitoringProvider>
    </AuthProvider>
  );
}
