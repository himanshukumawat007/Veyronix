import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PlatformAuthProvider } from './platform/context/AuthContext';
import { LiveProvider } from './platform/context/LiveContext';
import { PublicLayout } from './platform/layouts/PublicLayout';
import { ConsoleLayout, RequireRole } from './platform/layouts/ConsoleLayout';
import { Loading } from './platform/components/ui';

// Public portal (small, loaded eagerly for fast first paint on mobile)
import HomePage from './platform/pages/public/HomePage';

const LiveMonitoringPage = lazy(() => import('./platform/pages/public/LiveMonitoringPage'));
const PublicAlertsPage = lazy(() => import('./platform/pages/public/PublicAlertsPage'));
const RegionsPage = lazy(() => import('./platform/pages/public/RegionsPage'));
const HowItWorksPage = lazy(() => import('./platform/pages/public/HowItWorksPage'));
const SafetyPage = lazy(() => import('./platform/pages/public/SafetyPage'));
const AboutPage = lazy(() => import('./platform/pages/public/AboutPage'));
const LoginPage = lazy(() => import('./platform/pages/public/LoginPage'));

// Authority
const AuthorityOverview = lazy(() => import('./platform/pages/authority/AuthorityOverview'));
const AuthorityMap = lazy(() => import('./platform/pages/authority/AuthorityMap'));
const RiskAnalysis = lazy(() => import('./platform/pages/authority/RiskAnalysis'));
const IncidentsPage = lazy(() => import('./platform/pages/authority/IncidentsPage'));
const AuthorityRegions = lazy(() => import('./platform/pages/authority/AuthorityRegions'));
const ZoneDetailPage = lazy(() => import('./platform/pages/authority/ZoneDetailPage'));

// Operator
const OperatorOverview = lazy(() => import('./platform/pages/operator/OperatorOverview'));
const MineSitesPage = lazy(() => import('./platform/pages/operator/MineSitesPage'));
const NodesPage = lazy(() => import('./platform/pages/operator/NodesPage'));
const NodeDetailPage = lazy(() => import('./platform/pages/operator/NodeDetailPage'));
const TelemetryPage = lazy(() => import('./platform/pages/operator/TelemetryPage'));
const OperatorPrediction = lazy(() => import('./platform/pages/operator/OperatorPrediction'));
const GatewayPage = lazy(() => import('./platform/pages/operator/GatewayPage'));
const GrafanaPage = lazy(() => import('./platform/pages/operator/GrafanaPage'));

// Shared staff pages
const AlertsManagementPage = lazy(() => import('./platform/pages/shared/AlertsManagementPage'));
const ReportsPage = lazy(() => import('./platform/pages/shared/ReportsPage'));
const SystemHealthPage = lazy(() => import('./platform/pages/shared/SystemHealthPage'));
const EmergencyView = lazy(() => import('./platform/pages/shared/EmergencyView'));

// Original prototype console (preserved, unchanged)
const LegacyApp = lazy(() => import('./legacy/LegacyApp'));

const LegacyConsole: React.FC = () => (
  <>
    <a
      href="/operator/dashboard"
      className="fixed bottom-4 left-4 z-[3000] rounded-full bg-[#18202b] border border-white/15 px-4 py-2 text-sm text-white shadow-xl"
    >
      ← Back to BHU-DRISHTI platform
    </a>
    <LegacyApp />
  </>
);

const S: React.FC<{ children: React.ReactNode }> = ({ children }) => <Suspense fallback={<Loading />}>{children}</Suspense>;

export default function App() {
  return (
    <BrowserRouter>
      <PlatformAuthProvider>
        <LiveProvider>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="live" element={<S><LiveMonitoringPage /></S>} />
              <Route path="alerts" element={<S><PublicAlertsPage /></S>} />
              <Route path="regions" element={<S><RegionsPage /></S>} />
              <Route path="how-it-works" element={<S><HowItWorksPage /></S>} />
              <Route path="safety" element={<S><SafetyPage /></S>} />
              <Route path="about" element={<S><AboutPage /></S>} />
              <Route path="login" element={<S><LoginPage /></S>} />
            </Route>

            <Route element={<RequireRole roles={['AUTHORITY']}><ConsoleLayout /></RequireRole>}>
              <Route path="authority" element={<Navigate to="/authority/dashboard" replace />} />
              <Route path="authority/dashboard" element={<S><AuthorityOverview /></S>} />
              <Route path="authority/map" element={<S><AuthorityMap /></S>} />
              <Route path="authority/risk" element={<S><RiskAnalysis /></S>} />
              <Route path="authority/alerts" element={<S><AlertsManagementPage /></S>} />
              <Route path="authority/incidents" element={<S><IncidentsPage /></S>} />
              <Route path="authority/regions" element={<S><AuthorityRegions /></S>} />
              <Route path="authority/reports" element={<S><ReportsPage /></S>} />
              <Route path="authority/zone/:zoneId" element={<S><ZoneDetailPage /></S>} />
            </Route>

            <Route element={<RequireRole roles={['MINE_OPERATOR']}><ConsoleLayout /></RequireRole>}>
              <Route path="operator" element={<Navigate to="/operator/dashboard" replace />} />
              <Route path="operator/dashboard" element={<S><OperatorOverview /></S>} />
              <Route path="operator/sites" element={<S><MineSitesPage /></S>} />
              <Route path="operator/nodes" element={<S><NodesPage /></S>} />
              <Route path="operator/node/:nodeId" element={<S><NodeDetailPage /></S>} />
              <Route path="operator/telemetry" element={<S><TelemetryPage /></S>} />
              <Route path="operator/prediction" element={<S><OperatorPrediction /></S>} />
              <Route path="operator/alerts" element={<S><AlertsManagementPage /></S>} />
              <Route path="operator/gateway" element={<S><GatewayPage /></S>} />
              <Route path="operator/grafana" element={<S><GrafanaPage /></S>} />
              <Route path="operator/reports" element={<S><ReportsPage /></S>} />
              <Route path="operator/zone/:zoneId" element={<S><ZoneDetailPage /></S>} />
            </Route>

            <Route element={<RequireRole roles={['AUTHORITY', 'MINE_OPERATOR']}><ConsoleLayout /></RequireRole>}>
              <Route path="system-health" element={<S><SystemHealthPage /></S>} />
            </Route>

            <Route path="emergency" element={<RequireRole roles={['AUTHORITY', 'MINE_OPERATOR']}><S><EmergencyView /></S></RequireRole>} />
            <Route path="operator/console" element={<RequireRole roles={['MINE_OPERATOR']}><S><LegacyConsole /></S></RequireRole>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LiveProvider>
      </PlatformAuthProvider>
    </BrowserRouter>
  );
}
