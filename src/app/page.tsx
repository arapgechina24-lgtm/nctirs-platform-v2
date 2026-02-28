'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
// Layout components
import { Header } from "@/components/layout/Header"
// Threat components
import { ThreatAnalyticsChart } from "@/components/threat/ThreatAnalyticsChart"
import { ThreatMap } from "@/components/threat/ThreatMap"
import { ThreatMonitor } from "@/components/threat/ThreatMonitor"
import { ThreatAnalyticsEngine } from "@/components/threat/ThreatAnalyticsEngine"
import AdversarialDefensePanel from "@/components/threat/AdversarialDefensePanel"
// Incident components
import { IncidentList } from "@/components/incident/IncidentList"
import { IncidentTrendsChart } from "@/components/incident/IncidentTrendsChart"
import EmergencyOverlay from "@/components/incident/EmergencyOverlay"
import { AutomatedResponsePanel } from "@/components/incident/AutomatedResponsePanel"
// Surveillance components
import { SurveillanceMonitor } from "@/components/surveillance/SurveillanceMonitor"
import { CommunityReports } from "@/components/surveillance/CommunityReports"
// Infrastructure components
import { DataLakeMonitor } from "@/components/infrastructure/DataLakeMonitor"
import { SystemArchitecture } from "@/components/infrastructure/SystemArchitecture"
import CNIHeatmap from "@/components/infrastructure/CNIHeatmap"
// Intelligence components
import AIAssistantPanel from "@/components/intelligence/AIAssistantPanel"
import FederatedLearningHub from "@/components/intelligence/FederatedLearningHub"
import { XAIPanel } from "@/components/intelligence/XAIPanel"
import SovereignAIStatusPanel from "@/components/intelligence/SovereignAIStatusPanel"
// Compliance components
import KenyaContextPanel from "@/components/compliance/KenyaContextPanel"
// Shared components
import MultiplayerSession from "@/components/shared/MultiplayerSession"
import DemoModeController from "@/components/shared/DemoModeController"
import { VoiceCommandPanel } from "@/components/shared/VoiceCommandPanel"
// Analytics tracking
import { trackPageView, trackAction, trackPerformance } from "@/lib/analytics"
// API Client for real data
import { fetchIncidents, fetchThreats } from "@/lib/api"
// Types
import type {
  SecurityIncident,
  CrimePrediction,
  SurveillanceFeed,
  CommunityReport,
  EmergencyResponse,
  ThreatAnalytics,
  TimeSeriesData,
  CyberThreat,
  DataLakeSource,
  BlockchainLedgerEntry,
  CoordinatedAttack,
  AutomatedResponse,
  PerceptionLayerStatus,
  CognitionLayerStatus,
  IntegrityLayerStatus,
  AdversarialMetrics,
  FederatedLearningStatus,
  XAIExplanation,
  SovereignAIStatus,
} from "@/types"
// Mock data generators
import {
  generateCrimePredictions,
  generateSurveillanceFeeds,
  generateCommunityReports,
  generateEmergencyResponses,
  generateThreatAnalytics,
  generateTimeSeriesData,
  generateDataLakeSources,
  generateBlockchainLedger,
  generateCoordinatedAttacks,
  generateAutomatedResponses,
  generatePerceptionLayerStatus,
  generateCognitionLayerStatus,
  generateIntegrityLayerStatus,
  generateAdversarialMetrics,
  generateFederatedNodes,
  generateXAIExplanations,
  generateSovereignAIStatus,
} from "@/lib/mockData"
import {
  generateNairobiTraffic,
  generateMpesaData,
  getCurrentNairobiWeather,
  TrafficNode,
  MpesaTransaction,
  WeatherLog
} from "@/lib/kenyaContextData"
import {
  generateBorderLogs,
  generateWildlifeData,
  generateSocialSentiment,
  generateCyberAttribution,
  BorderLog,
  WildlifePing,
  SocialSentiment,
  ISPTrace
} from "@/lib/kenyaExtendedData"
import { createNC4Report } from "@/lib/soar-logic"

interface DashboardData {
  incidents: SecurityIncident[];
  predictions: CrimePrediction[];
  surveillanceFeeds: SurveillanceFeed[];
  communityReports: CommunityReport[];
  emergencyResponses: EmergencyResponse[];
  threatAnalytics: ThreatAnalytics[];
  timeSeriesData: TimeSeriesData[];
  // NCTIRS data
  cyberThreats: CyberThreat[];
  dataLakeSources: DataLakeSource[];
  blockchainLedger: BlockchainLedgerEntry[];
  coordinatedAttacks: CoordinatedAttack[];
  automatedResponses: AutomatedResponse[];
  perceptionLayer: PerceptionLayerStatus;
  cognitionLayer: CognitionLayerStatus;
  integrityLayer: IntegrityLayerStatus;
  // 4 WINNING PILLARS
  adversarialMetrics: AdversarialMetrics;
  federatedStatus: FederatedLearningStatus;
  xaiExplanations: XAIExplanation[];
  sovereignAIStatus: SovereignAIStatus;
  // Kenya Context "Golden Data"
  kenyaWeather: WeatherLog;
  kenyaTraffic: TrafficNode[];
  mpesaTransactions: MpesaTransaction[];
  // Extended Metadata
  borderLogs: BorderLog[];
  wildlife: WildlifePing[];
  sentiment: SocialSentiment[];
  cyberTraces: ISPTrace[];
}

// KeyMetrics Component
interface KeyMetricsProps {
  metrics: {
    threatLevel: string;
    activeIncidents: number;
    aiConfidence: number;
    systemLoad: number;
    networkTraffic: string;
    responsesActive: number;
  }
}

function KeyMetrics({ metrics }: KeyMetricsProps) {
  return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
      <div className="bg-black border border-green-900/50 p-2 text-center">
        <div className="text-[10px] text-green-800">THREAT LEVEL</div>
        <div className={`text-lg font-bold ${metrics.threatLevel === 'CRITICAL' ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
          {metrics.threatLevel}
        </div>
      </div>
      <div className="bg-black border border-green-900/50 p-2 text-center">
        <div className="text-[10px] text-green-800">ACTIVE CASES</div>
        <div className="text-lg font-bold text-green-400">{metrics.activeIncidents}</div>
      </div>
      <div className="bg-black border border-green-900/50 p-2 text-center">
        <div className="text-[10px] text-green-800">AI CONFIDENCE</div>
        <div className="text-lg font-bold text-cyan-400">{metrics.aiConfidence}%</div>
      </div>
      <div className="bg-black border border-green-900/50 p-2 text-center">
        <div className="text-[10px] text-green-800">SYSTEM LOAD</div>
        <div className="text-lg font-bold text-yellow-500">{metrics.systemLoad}%</div>
      </div>
      <div className="bg-black border border-green-900/50 p-2 text-center">
        <div className="text-[10px] text-green-800">NET TRAFFIC</div>
        <div className="text-lg font-bold text-blue-400">{metrics.networkTraffic}</div>
      </div>
      <div className="bg-black border border-green-900/50 p-2 text-center">
        <div className="text-[10px] text-green-800">AUTO-RESPONSE</div>
        <div className="text-lg font-bold text-purple-400">{metrics.responsesActive}</div>
      </div>
    </div>
  )
}

export default function Home() {
  /* 
   * View State
   */
  const [currentView, setCurrentView] = useState<'COMMAND_CENTER' | 'FUSION_CENTER' | 'THREAT_MATRIX' | 'ANALYTICS' | 'OPERATIONS'>('COMMAND_CENTER')
  const [isEmergency, setIsEmergency] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState<DashboardData | null>(null)

  // Track page views and view changes
  useEffect(() => {
    trackPageView('NCTIRS Dashboard', { initialView: 'COMMAND_CENTER' })
    const startTime = performance.now()

    return () => {
      const loadTime = performance.now() - startTime
      trackPerformance('session_duration', { loadTime })
    }
  }, [])

  // Track view changes
  useEffect(() => {
    if (mounted) {
      trackAction('view_change', { view: currentView })
    }
  }, [currentView, mounted])

  useEffect(() => {
    // Async function to load data from API + mock generators
    async function loadData() {
      const startTime = performance.now()

      try {
        // Fetch from API (with fallback to mock data)
        const [incidents, cyberThreats] = await Promise.all([
          fetchIncidents({ limit: 30 }),
          fetchThreats({ limit: 20 }),
        ])

        // Generate remaining mock data for components without API yet
        const predictions = generateCrimePredictions(15);
        const surveillanceFeeds = generateSurveillanceFeeds(40);
        const communityReports = generateCommunityReports(25);
        const emergencyResponses = generateEmergencyResponses(12);
        const threatAnalytics = generateThreatAnalytics();
        const timeSeriesData = generateTimeSeriesData(30);
        // NCTIRS data (mock for now)
        const dataLakeSources = generateDataLakeSources();
        const blockchainLedger = generateBlockchainLedger(25);
        const coordinatedAttacks = generateCoordinatedAttacks(5);
        const automatedResponses = generateAutomatedResponses(15);
        const perceptionLayer = generatePerceptionLayerStatus();
        const cognitionLayer = generateCognitionLayerStatus();
        const integrityLayer = generateIntegrityLayerStatus();
        // 4 WINNING PILLARS data
        const adversarialMetrics = generateAdversarialMetrics();
        const federatedStatus = generateFederatedNodes();
        const xaiExplanations = generateXAIExplanations(8);
        const sovereignAIStatus = generateSovereignAIStatus();

        // Kenya 'Golden Data'
        const kenyaWeather = getCurrentNairobiWeather();
        const kenyaTraffic = generateNairobiTraffic(30);
        const mpesaTransactions = generateMpesaData(40);
        const borderLogs = generateBorderLogs();
        const wildlife = generateWildlifeData();
        const sentiment = generateSocialSentiment();
        const cyberTraces = generateCyberAttribution();

        setData({
          incidents,
          predictions,
          surveillanceFeeds,
          communityReports,
          emergencyResponses,
          threatAnalytics,
          timeSeriesData,
          cyberThreats,
          dataLakeSources,
          blockchainLedger,
          coordinatedAttacks,
          automatedResponses,
          perceptionLayer,
          cognitionLayer,
          integrityLayer,
          // 4 WINNING PILLARS
          adversarialMetrics,
          federatedStatus,
          xaiExplanations,
          sovereignAIStatus,
          kenyaWeather,
          kenyaTraffic,
          mpesaTransactions,
          borderLogs,
          wildlife,
          sentiment,
          cyberTraces
        })
      } catch (error) {
        console.error('Critical Error loading dashboard data:', error);
        // Fallback to entirely mock data if critical failure (though individual fetches should handle this)
      } finally {
        setMounted(true)
        // Track render performance
        const renderTime = performance.now() - startTime
        trackPerformance('initial_render', { renderTime })
      }
    }

    loadData()
  }, [])

  if (!mounted || !data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-green-500">
        <div className="text-center">
          <div className="animate-pulse text-xl mb-2">NCTIRS</div>
          <div className="text-sm text-green-800">INITIALIZING_SECURE_CONNECTION...</div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-ping" />
            <div className="h-2 w-2 bg-green-500 rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
            <div className="h-2 w-2 bg-green-500 rounded-full animate-ping" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
    )
  }

  // Calculate stats logic was removed here

  const handleMitigation = async () => {
    // 1. Orchestration: Simulate Air-Gap
    console.log("⚡ INITIATING EMERGENCY AIR-GAP PROTOCOL...");

    // 2. Response: Generate NC4 Report
    const report = createNC4Report(
      "SEACOM SUBMARINE CABLE - MOMBASA",
      "CRITICAL",
      "T1098.004", // SSH Authorized Keys or similar technique
      "Mombasa"
    );

    // 2b. PERSISTENCE: Save to "Real" Database (JSON File)
    // This proves backend integration
    try {
      const { addAuditLog } = await import('@/lib/actions/audit');
      await addAuditLog({
        assetName: report.incident_details.target_asset,
        sector: "Telecommunications (Mombasa)",
        action: report.actions_taken.protocol_executed,
        severity: "CRITICAL",
        notifiedNC4: true,
        receiptId: `NC4-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
      });
      console.log("💾 AUDIT LOG PERSISTED TO SECURE STORAGE");
    } catch (e) {
      console.error("Failed to persist log", e);
    }

    console.log("📄 NC4 COMPLIANCE REPORT GENERATED:", report);
    console.log("📡 TRANSMITTING TO KE-CIRT/CC...");

    // 3. Return report for visualization
    return report;
  };

  const {
    highThreatCount = 0,
    activeResponses = 0,
    criticalCyber = 0,
    activeCoordinated = 0
  } = {
    // Recalculating these cheaply for display since we removed the vars before
    highThreatCount: data.incidents.filter(i => i.threatLevel === 'CRITICAL' || i.threatLevel === 'HIGH').length,
    activeResponses: data.emergencyResponses.filter(r => r.status !== 'RESOLVED').length,
    criticalCyber: data.cyberThreats.filter(t => t.severity === 'CRITICAL').length,
    activeCoordinated: data.coordinatedAttacks.filter(a => a.status !== 'RESOLVED').length
  };

  return (

    <div className={`min-h-screen bg-black text-green-500 font-mono selection:bg-green-900 selection:text-white`}>
      <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20 mix-blend-overlay"></div>
      <div className="fixed inset-0 pointer-events-none z-50 bg-gradient-to-b from-transparent via-green-900/5 to-green-900/10"></div>

      <Header currentView={currentView} onViewChange={setCurrentView} />

      <main className="p-6 relative z-0">
        <MultiplayerSession />

        {/* View Routing */}
        <div className="flex flex-col gap-4 overflow-y-auto relative z-10" style={{ height: 'calc(100vh - 9rem)' }}>
          {currentView === 'COMMAND_CENTER' && <CommandCenterView data={data} setIsEmergency={setIsEmergency} activeCoordinated={activeCoordinated} highThreatCount={highThreatCount} activeResponses={activeResponses} criticalCyber={criticalCyber} />}
          {currentView === 'FUSION_CENTER' && <FusionCenterView data={data} />}
          {currentView === 'THREAT_MATRIX' && <ThreatMatrixView data={data} />}
          {currentView === 'ANALYTICS' && <AnalyticsView data={data} />}
          {currentView === 'OPERATIONS' && <OperationsView data={data} />}
        </div>

      </main>

      <ThreatMonitor
        incidents={data?.incidents || []}
        cyberThreats={data?.cyberThreats || []}
        onAlert={() => setIsEmergency(true)}
      />

      <EmergencyOverlay
        isActive={isEmergency}
        targetAsset="SEACOM SUBMARINE CABLE - MOMBASA"
        onMitigate={handleMitigation}
        onDismiss={() => setIsEmergency(false)}
      />

      <VoiceCommandPanel
        onNavigate={setCurrentView}
        onEmergency={() => setIsEmergency(true)}
        onRefresh={() => window.location.reload()}
      />

      <DemoModeController onTriggerEmergency={() => setIsEmergency(true)} />
    </div>
  );
}
function CommandCenterView({ data, setIsEmergency, activeCoordinated, highThreatCount, activeResponses, criticalCyber }: { data: DashboardData, setIsEmergency: (val: boolean) => void, activeCoordinated: number, highThreatCount: number, activeResponses: number, criticalCyber: number }) {
  return (
    <div className="flex flex-col gap-4">
      {/* TOP ROW: Metrics Bar with Emergency Button */}
      <div className="flex items-stretch gap-4 shrink-0">
        <div className="flex-1">
          <KeyMetrics metrics={{
            threatLevel: activeCoordinated > 0 ? 'CRITICAL' : highThreatCount > 5 ? 'HIGH' : 'MEDIUM',
            activeIncidents: data.incidents.length,
            aiConfidence: 94.2,
            systemLoad: 78,
            responsesActive: activeResponses,
            networkTraffic: '45.2 TB/s'
          }} />
        </div>
        <button
          onClick={() => setIsEmergency(true)}
          className="bg-red-950/50 text-red-400 text-xs border-2 border-red-800 px-5 hover:bg-red-900/60 uppercase font-bold transition-all flex items-center gap-2 shrink-0"
        >
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          SIMULATE BREACH
        </button>
      </div>

      {/* MAIN CONTENT: 12-Column Grid */}
      <div className="grid grid-cols-12 gap-6">

        {/* LEFT WING: Infrastructure Status (col-3) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="col-span-12 md:col-span-6 xl:col-span-3 flex flex-col gap-5"
        >
          <div className="text-xs text-green-500 uppercase tracking-widest font-bold px-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            System Infrastructure
          </div>
          <CNIHeatmap />
          <SystemArchitecture
            perception={data.perceptionLayer}
            cognition={data.cognitionLayer}
            integrity={data.integrityLayer}
          />
          <KenyaContextPanel
            weather={data.kenyaWeather}
            traffic={data.kenyaTraffic}
            transactions={data.mpesaTransactions}
            borderLogs={data.borderLogs}
            wildlife={data.wildlife}
            sentiment={data.sentiment}
            cyberTraces={data.cyberTraces}
          />
          <DataLakeMonitor sources={data.dataLakeSources} />
        </motion.div>

        {/* CENTER FOCAL POINT: Threat Visualization (col-6) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="col-span-12 xl:col-span-6 order-first xl:order-none flex flex-col gap-5"
        >
          <div className="text-xs text-green-500 uppercase tracking-widest font-bold px-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            Cyber Threat Visualization
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black border border-red-900/60 p-3">
              <div className="text-[9px] text-red-500 uppercase tracking-wider mb-1">Critical Threats</div>
              <div className="text-2xl font-bold text-red-400">{criticalCyber}</div>
            </div>
            <div className="bg-black border border-purple-900/60 p-3">
              <div className="text-[9px] text-purple-500 uppercase tracking-wider mb-1">Attacks Blocked</div>
              <div className="text-2xl font-bold text-purple-400">14.2K</div>
            </div>
          </div>

          {/* Main Map - Large and Prominent */}
          <div className="h-[420px] border border-green-900/30 rounded-lg overflow-hidden shadow-lg shadow-green-900/10">
            <ThreatMap
              incidents={data.incidents}
              predictions={data.predictions}
              surveillance={data.surveillanceFeeds}
            />
          </div>

          {/* Charts - Full Width Stacked */}
          <ThreatAnalyticsChart analytics={data.threatAnalytics} />
          <IncidentTrendsChart data={data.timeSeriesData} />
        </motion.div>

        {/* RIGHT WING: Intelligence & Response (col-3) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="col-span-12 md:col-span-6 xl:col-span-3 flex flex-col gap-5"
        >
          <div className="text-xs text-green-500 uppercase tracking-widest font-bold px-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-500 rounded-full" />
            Cyber Intelligence Feed
          </div>

          <ThreatAnalyticsEngine
            cyberThreats={data.cyberThreats}
            coordinatedAttacks={data.coordinatedAttacks}
          />

          <IncidentList incidents={data.incidents} maxItems={8} />
          <CommunityReports reports={data.communityReports} maxItems={5} />

          <AIAssistantPanel />
        </motion.div>

      </div >

      {/* FULL WIDTH: Surveillance Network */}
      < div className="flex flex-col gap-4" >
        <SurveillanceMonitor feeds={data.surveillanceFeeds} maxItems={12} />
      </div >
    </div >
  );
}

function FusionCenterView({ data }: { data: DashboardData }) {
  const criticalReports = data.communityReports.filter(r => r.urgency === 'CRITICAL' || r.urgency === 'HIGH').length;
  const activeFeeds = data.surveillanceFeeds.filter(f => f.status === 'ACTIVE').length;
  const alertFeeds = data.surveillanceFeeds.filter(f => f.status === 'ALERT').length;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      className="flex flex-col gap-5"
    >
      {/* ROW 1: Fusion Status Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3"
      >
        {[
          { label: 'FUSION STATUS', value: 'ONLINE', color: 'text-green-400', glow: 'shadow-[0_0_12px_rgba(0,255,65,0.3)]' },
          { label: 'INTEL REPORTS', value: data.communityReports.length, color: 'text-cyan-400', glow: '' },
          { label: 'CRITICAL SIGS', value: criticalReports, color: criticalReports > 0 ? 'text-red-400' : 'text-green-400', glow: criticalReports > 0 ? 'shadow-[0_0_12px_rgba(239,68,68,0.3)]' : '' },
          { label: 'SURV FEEDS', value: `${activeFeeds}/${data.surveillanceFeeds.length}`, color: 'text-green-400', glow: '' },
          { label: 'ALERT FEEDS', value: alertFeeds, color: alertFeeds > 0 ? 'text-amber-400 animate-pulse' : 'text-green-400', glow: alertFeeds > 0 ? 'shadow-[0_0_12px_rgba(245,158,11,0.3)]' : '' },
          { label: 'DATA LAKE', value: `${data.dataLakeSources.length} SRC`, color: 'text-purple-400', glow: '' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 * i, type: 'spring', stiffness: 300 }}
            className={`bg-black/80 border border-green-900/40 p-3 text-center backdrop-blur-sm ${stat.glow}`}
          >
            <div className="text-[9px] text-green-800 uppercase tracking-widest font-bold mb-1">{stat.label}</div>
            <div className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ROW 2: Main Content — Map + Intel Sidebar */}
      <div className="grid grid-cols-12 gap-5">

        {/* LEFT: Dominant Map + CNI */}
        <motion.div
          initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
          className="col-span-12 xl:col-span-8 flex flex-col gap-4"
        >
          {/* Map */}
          <div className="relative border border-green-900/30 rounded-sm overflow-hidden shadow-lg shadow-green-900/10">
            <div className="absolute top-3 left-3 z-10 bg-black/80 border border-green-500/30 px-3 py-1.5 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(0,255,65,0.6)]" />
                <span className="text-[10px] text-green-400 font-mono uppercase tracking-widest font-bold">Multi-Agency Fusion View — Live</span>
              </div>
            </div>
            <div className="h-[420px]">
              <ThreatMap
                incidents={data.incidents}
                predictions={data.predictions}
                surveillance={data.surveillanceFeeds}
              />
            </div>
          </div>

          {/* Sub-widgets under map */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            >
              <CNIHeatmap />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            >
              <DataLakeMonitor sources={data.dataLakeSources} />
            </motion.div>
          </div>
        </motion.div>

        {/* RIGHT: Intel Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25, duration: 0.5 }}
          className="col-span-12 xl:col-span-4 flex flex-col gap-4 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1 custom-scrollbar"
        >
          {/* Inter-Agency AI Comms */}
          <div className="bg-black/80 border border-cyan-900/40 p-4 backdrop-blur-sm shadow-[0_0_15px_rgba(0,200,255,0.05)]">
            <div className="flex items-center gap-2 mb-3 border-b border-cyan-900/30 pb-2">
              <span className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_6px_rgba(0,200,255,0.5)]" />
              <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Inter-Agency Comms</h2>
              <span className="ml-auto text-[8px] text-cyan-700 font-mono uppercase">Encrypted</span>
            </div>
            <AIAssistantPanel />
          </div>

          {/* Intelligence Field Reports — with staggered animation */}
          <div className="bg-black/80 border border-green-900/40 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3 border-b border-green-900/30 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <h2 className="text-sm font-bold text-green-400 uppercase tracking-wider">Intel Reports</h2>
              </div>
              <span className="text-[9px] text-green-700 font-mono">{data.communityReports.filter(r => r.verified).length} VERIFIED</span>
            </div>
            <div className="space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
              {data.communityReports.slice(0, 6).map((report, i) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  whileHover={{ scale: 1.01, borderColor: 'rgba(0,255,65,0.5)' }}
                  className="border border-green-900/30 bg-black/60 p-3 cursor-pointer transition-shadow hover:shadow-[0_0_15px_rgba(0,255,65,0.1)]"
                >
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 uppercase tracking-wider ${report.urgency === 'CRITICAL' ? 'bg-red-900/50 text-red-400 border border-red-700/50' :
                      report.urgency === 'HIGH' ? 'bg-amber-900/50 text-amber-400 border border-amber-700/50' :
                        'bg-green-900/50 text-green-400 border border-green-700/50'
                      }`}>{report.urgency}</span>
                    <span className="text-[8px] font-mono text-cyan-600 uppercase">{report.type.replace(/_/g, ' ')}</span>
                    {report.verified && <span className="text-[7px] text-green-500 font-mono">✓ VER</span>}
                  </div>
                  <p className="text-[10px] text-green-400/80 font-mono leading-relaxed mb-1.5 line-clamp-2">{report.description}</p>
                  <div className="text-[8px] text-green-900 font-mono uppercase">{report.location.name}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Surveillance Quick View */}
          <div className="bg-black/80 border border-amber-900/30 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3 border-b border-amber-900/30 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Surv Network</h2>
              </div>
              <span className="text-[9px] text-amber-700 font-mono">{alertFeeds} ALERT</span>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
              {data.surveillanceFeeds.slice(0, 8).map((feed, i) => (
                <motion.div
                  key={feed.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.06 }}
                  className={`flex items-center justify-between p-2 text-[10px] font-mono border ${feed.status === 'ALERT' ? 'border-red-900/50 bg-red-950/20' : 'border-green-900/20 bg-black/40'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${feed.status === 'ALERT' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                    <span className="text-green-400 uppercase truncate max-w-[120px]">{feed.location}</span>
                  </div>
                  <span className={`uppercase font-bold ${feed.status === 'ALERT' ? 'text-red-400' : 'text-green-700'}`}>{feed.status}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}

function ThreatMatrixView({ data }: { data: DashboardData }) {
  const [selectedThreat, setSelectedThreat] = useState<string | null>(null);
  const criticalCount = data.incidents.filter(i => i.threatLevel === 'CRITICAL').length;
  const highCount = data.incidents.filter(i => i.threatLevel === 'HIGH').length;
  const activeCount = data.incidents.filter(i => i.status === 'ACTIVE' || i.status === 'INVESTIGATING').length;
  const containedCount = data.cyberThreats.filter(t => t.status === 'CONTAINED' || t.status === 'NEUTRALIZED').length;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      className="flex flex-col gap-5"
    >
      {/* ROW 1: Threat Severity Counters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3"
      >
        {[
          { label: 'MATRIX STATUS', value: 'TRACKING', color: 'text-red-400', border: 'border-red-900/50', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.2)]', pulse: true },
          { label: 'CRITICAL', value: criticalCount, color: 'text-red-500', border: 'border-red-900/50', glow: criticalCount > 0 ? 'shadow-[0_0_15px_rgba(239,68,68,0.4)]' : '', pulse: criticalCount > 0 },
          { label: 'HIGH', value: highCount, color: 'text-amber-400', border: 'border-amber-900/40', glow: '', pulse: false },
          { label: 'ACTIVE NOW', value: activeCount, color: 'text-cyan-400', border: 'border-cyan-900/40', glow: '', pulse: false },
          { label: 'CONTAINED', value: containedCount, color: 'text-green-400', border: 'border-green-900/40', glow: '', pulse: false },
          { label: 'TOTAL THREATS', value: data.incidents.length + data.cyberThreats.length, color: 'text-purple-400', border: 'border-purple-900/40', glow: '', pulse: false },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 * i, type: 'spring', stiffness: 300 }}
            className={`bg-black/80 border ${stat.border} p-3 text-center backdrop-blur-sm ${stat.glow}`}
          >
            <div className="text-[9px] text-green-800 uppercase tracking-widest font-bold mb-1">{stat.label}</div>
            <div className={`text-lg font-bold font-mono ${stat.color} ${stat.pulse ? 'animate-pulse' : ''}`}>{stat.value}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ROW 2: Main Content */}
      <div className="grid grid-cols-12 gap-5">

        {/* LEFT: Threat List with clickable rows */}
        <motion.div
          initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
          className="col-span-12 xl:col-span-5 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
              <span className="text-xs text-red-400 font-mono uppercase tracking-widest font-bold">Live Threat Feed</span>
            </div>
            <span className="text-[9px] text-green-800 font-mono">{data.incidents.length} EVENTS</span>
          </div>

          <div className="space-y-2 max-h-[calc(100vh-18rem)] overflow-y-auto pr-1 custom-scrollbar">
            {data.incidents.slice(0, 12).map((incident, i) => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedThreat(selectedThreat === incident.id ? null : incident.id)}
                className={`cursor-pointer border p-3 transition-all ${selectedThreat === incident.id
                    ? 'border-red-500/60 bg-red-950/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                    : 'border-green-900/30 bg-black/60 hover:border-green-500/40 hover:shadow-[0_0_10px_rgba(0,255,65,0.05)]'
                  }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 uppercase tracking-wider ${incident.threatLevel === 'CRITICAL' ? 'bg-red-900/60 text-red-400 border border-red-700/50' :
                        incident.threatLevel === 'HIGH' ? 'bg-amber-900/60 text-amber-400 border border-amber-700/50' :
                          incident.threatLevel === 'MEDIUM' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700/50' :
                            'bg-green-900/50 text-green-400 border border-green-700/50'
                      }`}>{incident.threatLevel}</span>
                    <span className={`text-[8px] font-mono px-1.5 py-0.5 uppercase ${incident.status === 'ACTIVE' ? 'bg-red-950/50 text-red-400 border border-red-900/50' :
                        incident.status === 'INVESTIGATING' ? 'bg-cyan-950/50 text-cyan-400 border border-cyan-900/50' :
                          'bg-green-950/50 text-green-400 border border-green-900/50'
                      }`}>{incident.status}</span>
                    <span className="text-[8px] font-mono text-purple-500 uppercase">{incident.type.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="text-[8px] font-mono text-green-700">{incident.aiConfidence}% AI</span>
                </div>

                <h4 className="text-[11px] text-green-300 font-mono font-bold truncate mb-1">{incident.title}</h4>

                <div className="flex items-center gap-3 text-[8px] text-green-900 font-mono uppercase">
                  <span>{incident.location.name}</span>
                  {incident.mitreAttackId && <span className="text-purple-500">{incident.mitreAttackId}</span>}
                </div>

                {selectedThreat === incident.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 pt-3 border-t border-green-900/30 space-y-2"
                  >
                    <p className="text-[10px] text-green-400/80 font-mono leading-relaxed">{incident.description}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-black/60 border border-green-900/20 p-2">
                        <div className="text-[7px] text-green-800 uppercase mb-0.5">Region</div>
                        <div className="text-[10px] text-green-400 font-mono">{incident.location.region}</div>
                      </div>
                      <div className="bg-black/60 border border-green-900/20 p-2">
                        <div className="text-[7px] text-green-800 uppercase mb-0.5">Data Impact</div>
                        <div className="text-[10px] text-amber-400 font-mono">{incident.dataProtectionImpact.replace(/_/g, ' ')}</div>
                      </div>
                      <div className="bg-black/60 border border-green-900/20 p-2">
                        <div className="text-[7px] text-green-800 uppercase mb-0.5">AI Confidence</div>
                        <div className={`text-[10px] font-mono font-bold ${incident.aiConfidence > 80 ? 'text-green-400' : 'text-amber-400'}`}>{incident.aiConfidence}%</div>
                      </div>
                      <div className="bg-black/60 border border-green-900/20 p-2">
                        <div className="text-[7px] text-green-800 uppercase mb-0.5">Affected Area</div>
                        <div className="text-[10px] text-cyan-400 font-mono">{incident.affectedArea} km²</div>
                      </div>
                    </div>
                    {incident.mitreAttackId && (
                      <div className="bg-purple-950/20 border border-purple-900/30 p-2">
                        <div className="text-[7px] text-purple-500 uppercase mb-0.5">MITRE ATT&CK</div>
                        <div className="text-[10px] text-purple-400 font-mono font-bold">{incident.mitreAttackId}</div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {incident.sources.map((src, idx) => (
                        <span key={idx} className="text-[7px] font-mono bg-green-950/30 text-green-600 border border-green-900/30 px-1.5 py-0.5 uppercase">{src}</span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* RIGHT: Map + Cyber Threats + Coordinated Attacks */}
        <motion.div
          initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25, duration: 0.5 }}
          className="col-span-12 xl:col-span-7 flex flex-col gap-4"
        >
          {/* Live Attack Map */}
          <div className="relative border border-red-900/30 rounded-sm overflow-hidden shadow-lg shadow-red-900/10">
            <div className="absolute top-3 left-3 z-10 bg-black/80 border border-red-500/30 px-3 py-1.5 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                <span className="text-[10px] text-red-400 font-mono uppercase tracking-widest font-bold">Live Attack Vectors</span>
              </div>
            </div>
            <div className="absolute top-3 right-3 z-10 bg-red-900/30 text-red-400 text-[9px] px-2 py-1 font-bold uppercase tracking-wider font-mono border border-red-800/50">
              {activeCount} Active
            </div>
            <div className="h-[350px]">
              <ThreatMap
                incidents={data.incidents}
                predictions={data.predictions}
                surveillance={data.surveillanceFeeds}
              />
            </div>
          </div>

          {/* Cyber Threats Detail */}
          <div className="bg-black/80 border border-red-900/30 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3 border-b border-red-900/30 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider">Cyber Threat Intelligence</h2>
              </div>
              <span className="text-[9px] text-green-700 font-mono">{data.cyberThreats.length} TRACKED</span>
            </div>
            <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
              {data.cyberThreats.slice(0, 8).map((threat, i) => (
                <motion.div
                  key={threat.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                  className={`border p-3 ${threat.status === 'DETECTED' ? 'border-red-900/40 bg-red-950/10' :
                      threat.status === 'ANALYZING' ? 'border-amber-900/40 bg-amber-950/10' :
                        'border-green-900/30 bg-black/40'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 uppercase ${threat.severity === 'CRITICAL' ? 'bg-red-900/60 text-red-400 border border-red-700/50' :
                          threat.severity === 'HIGH' ? 'bg-amber-900/60 text-amber-400 border border-amber-700/50' :
                            'bg-green-900/50 text-green-400 border border-green-700/50'
                        }`}>{threat.severity}</span>
                      <span className="text-[8px] font-mono text-cyan-500 uppercase">{threat.type.replace(/_/g, ' ')}</span>
                      <span className={`text-[8px] font-mono uppercase font-bold ${threat.status === 'DETECTED' ? 'text-red-400' :
                          threat.status === 'ANALYZING' ? 'text-amber-400' :
                            threat.status === 'CONTAINED' ? 'text-blue-400' : 'text-green-400'
                        }`}>{threat.status}</span>
                    </div>
                    <span className="text-[8px] font-mono text-green-700">{threat.aiConfidence}% CONF</span>
                  </div>
                  <h4 className="text-[11px] text-green-300 font-mono font-bold mb-1">{threat.name}</h4>
                  <p className="text-[9px] text-green-600 font-mono leading-relaxed mb-1.5 line-clamp-2">{threat.description}</p>
                  <div className="flex items-center gap-3 text-[8px] font-mono flex-wrap">
                    <span className="text-purple-500">{threat.targetSector}</span>
                    <span className="text-cyan-600">{threat.targetSystem}</span>
                    {threat.sourceIP && <span className="text-red-500">{threat.sourceIP}</span>}
                    {threat.aptSignature && <span className="text-amber-500">{threat.aptSignature}</span>}
                  </div>
                  {threat.iocIndicators.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {threat.iocIndicators.slice(0, 3).map((ioc, idx) => (
                        <span key={idx} className="text-[7px] font-mono bg-red-950/30 text-red-500 border border-red-900/30 px-1.5 py-0.5 truncate max-w-[200px]">{ioc}</span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Coordinated Attacks */}
          {data.coordinatedAttacks.length > 0 && (
            <div className="bg-black/80 border border-amber-900/30 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3 border-b border-amber-900/30 pb-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Coordinated Attacks</h2>
                <span className="ml-auto text-[9px] text-amber-700 font-mono">{data.coordinatedAttacks.length} DETECTED</span>
              </div>
              <div className="space-y-2">
                {data.coordinatedAttacks.slice(0, 4).map((attack, i) => (
                  <motion.div
                    key={attack.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 + i * 0.08 }}
                    className="flex items-center justify-between p-2 border border-amber-900/20 bg-black/40 text-[10px] font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${attack.status === 'DETECTED' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                      <span className="text-amber-400 uppercase">{attack.attackVector}</span>
                    </div>
                    <span className="text-green-600 truncate max-w-[120px]">{attack.targetFacility}</span>
                    <span className="text-cyan-500">{(attack.correlationScore * 100).toFixed(0)}%</span>
                    <span className={`uppercase font-bold ${attack.status === 'DETECTED' ? 'text-red-400' : attack.status === 'RESPONDING' ? 'text-amber-400' : 'text-green-400'
                      }`}>{attack.status}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

      </div>
    </motion.div>
  );
}

function AnalyticsView({ data }: { data: DashboardData }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      className="grid grid-cols-12 gap-4 min-h-[calc(100vh-10rem)]"
    >
      {/* LEFT - Charts */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
        <div className="h-80">
          <ThreatAnalyticsChart analytics={data.threatAnalytics} />
        </div>
        <div className="h-80">
          <IncidentTrendsChart data={data.timeSeriesData} />
        </div>
      </div>
      {/* RIGHT - Sidebar */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
        <ThreatAnalyticsEngine
          cyberThreats={data.cyberThreats}
          coordinatedAttacks={data.coordinatedAttacks}
        />
        <DataLakeMonitor sources={data.dataLakeSources} />
        <div className="bg-black border border-blue-900/50 p-4 flex-1">
          <h3 className="text-blue-400 font-bold mb-3 text-sm uppercase tracking-wider">Predictive Models</h3>
          <div className="space-y-3">
            {data.predictions.slice(0, 5).map((p: CrimePrediction, i: number) => (
              <div key={i} className="flex justify-between items-center text-xs border-b border-blue-900/20 pb-2">
                <span className="text-gray-400 truncate mr-2">{p.crimeTypes.join(', ')}</span>
                <span className="text-blue-400 font-mono">{(p.probability * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function OperationsView({ data }: { data: DashboardData }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      className="flex flex-col gap-4"
    >
      {/* 4 PILLARS HEADER */}
      <div className="flex items-center justify-between px-1 shrink-0">
        <div className="text-xs text-green-500 uppercase tracking-widest font-bold flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          MAJESTIC SHIELD: 4 Winning Pillars
        </div>
        <div className="text-[10px] text-gray-500">
          National Security Gold Standard
        </div>
      </div>

      {/* 2x2 Grid Layout for better visibility */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pillar 1: Adversarial Defense */}
        <AdversarialDefensePanel metrics={data.adversarialMetrics} />

        {/* Pillar 2: Federated Learning */}
        <FederatedLearningHub status={data.federatedStatus} />

        {/* Pillar 3: Explainable AI */}
        <XAIPanel />

        {/* Pillar 4: Sovereign AI */}
        <SovereignAIStatusPanel status={data.sovereignAIStatus} />
      </div>

      {/* Response Panel - Full Width */}
      <div className="shrink-0">
        <AutomatedResponsePanel responses={data.automatedResponses} />
      </div>
    </motion.div>
  );
}
