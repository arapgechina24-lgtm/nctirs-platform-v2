'use client'

import { useState, useEffect } from "react"
import { Header, ViewType } from "@/components/Header"
import { StatCard } from "@/components/StatCard"
import { IncidentList } from "@/components/IncidentList"
import { CrimePredictionList } from "@/components/CrimePredictionList"
import { SurveillanceMonitor } from "@/components/SurveillanceMonitor"
import { CommunityReports } from "@/components/CommunityReports"
import { EmergencyResponseList } from "@/components/EmergencyResponseList"
import { ThreatAnalyticsChart } from "@/components/ThreatAnalyticsChart"
import { ThreatMap } from "@/components/ThreatMap"
import { IncidentTrendsChart } from "@/components/IncidentTrendsChart"
// NCTIRS Unified Components
import { DataLakeMonitor } from "@/components/DataLakeMonitor"
import { ThreatAnalyticsEngine } from "@/components/ThreatAnalyticsEngine"
import { AutomatedResponsePanel } from "@/components/AutomatedResponsePanel"
import { BlockchainLedger } from "@/components/BlockchainLedger"
import { SystemArchitecture } from "@/components/SystemArchitecture"
// NEW Components
import DigitalTwinMonitor from "@/components/DigitalTwinMonitor"
import CNIHeatmap from "@/components/CNIHeatmap"
import AIAssistantPanel from "@/components/AIAssistantPanel"
import MultiplayerSession from "@/components/MultiplayerSession"
import { DataProtectionMonitor } from "@/components/DataProtectionMonitor"
import { ContainmentPanel } from "@/components/SOAR/ContainmentPanel"
import { NC4ReportPanel } from "@/components/NC4ReportPanel"
import EmergencyOverlay from "@/components/EmergencyOverlay"
import { ThreatMonitor } from "@/components/ThreatMonitor"
import DemoModeController from "@/components/DemoModeController"
// 4 WINNING PILLARS: MAJESTIC SHIELD
import AdversarialDefensePanel from "@/components/AdversarialDefensePanel"
import FederatedLearningHub from "@/components/FederatedLearningHub"
import ExplainableAIPanel from "@/components/ExplainableAIPanel"
import SovereignAIStatusPanel from "@/components/SovereignAIStatusPanel"

import {
  generateMockIncidents,
  generateCrimePredictions,
  generateSurveillanceFeeds,
  generateCommunityReports,
  generateEmergencyResponses,
  generateThreatAnalytics,
  generateTimeSeriesData,
  // NCTIRS generators
  generateCyberThreats,
  generateDataLakeSources,
  generateBlockchainLedger,
  generateCoordinatedAttacks,
  generateAutomatedResponses,
  generatePerceptionLayerStatus,
  generateCognitionLayerStatus,
  generateIntegrityLayerStatus,
  // 4 WINNING PILLARS generators
  generateAdversarialMetrics,
  generateFederatedNodes,
  generateXAIExplanations,
  generateSovereignAIStatus,
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
  // 4 WINNING PILLARS types
  AdversarialMetrics,
  FederatedLearningStatus,
  XAIExplanation,
  SovereignAIStatus,
} from "@/lib/mockData"
import { createNC4Report } from "@/lib/soar-logic"
import { AlertTriangle, Shield, Camera, Users, Activity, Zap, Database, Brain } from "lucide-react"

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
  const [currentView, setCurrentView] = useState<ViewType>('COMMAND_CENTER')
  const [isEmergency, setIsEmergency] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    // Generate all mock data on client
    const incidents = generateMockIncidents(30);
    const predictions = generateCrimePredictions(15);
    const surveillanceFeeds = generateSurveillanceFeeds(40);
    const communityReports = generateCommunityReports(25);
    const emergencyResponses = generateEmergencyResponses(12);
    const threatAnalytics = generateThreatAnalytics();
    const timeSeriesData = generateTimeSeriesData(30);
    // NCTIRS data
    const cyberThreats = generateCyberThreats(20);
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

    // Use setTimeout to avoid synchronous setState warning
    const timer = setTimeout(() => {
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
      })
      setMounted(true)
    }, 0)

    return () => clearTimeout(timer);
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

  const {
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
  } = data

  // Calculate stats
  const activeIncidents = incidents.filter(i => i.status === 'ACTIVE').length;
  const highThreatCount = incidents.filter(i => i.threatLevel === 'CRITICAL' || i.threatLevel === 'HIGH').length;
  const activeSurveillance = surveillanceFeeds.filter(f => f.status === 'ACTIVE').length;
  const verifiedReports = communityReports.filter(r => r.verified).length;
  const activeResponses = emergencyResponses.filter(r => r.status !== 'RESOLVED').length;
  // NCTIRS stats
  const criticalCyber = cyberThreats.filter(t => t.severity === 'CRITICAL').length;
  const activeCoordinated = coordinatedAttacks.filter(a => a.status !== 'RESOLVED').length;
  const autoResponsesActive = automatedResponses.filter(r => r.status === 'EXECUTING').length;

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

  return (

    <div className={`min-h-screen bg-black text-green-500 font-mono selection:bg-green-900 selection:text-white`}>
      <div className="fixed inset-0 pointer-events-none z-50 bg-[url('/scanline.png')] opacity-10 mix-blend-overlay"></div>
      <div className="fixed inset-0 pointer-events-none z-50 bg-gradient-to-b from-transparent via-green-900/5 to-green-900/10"></div>

      <Header currentView={currentView} onViewChange={setCurrentView} />

      <main className="p-6 relative z-0">
        <MultiplayerSession />

        {/* View Routing */}
        {currentView === 'COMMAND_CENTER' && (
          <div className="flex flex-col gap-5 h-[calc(100vh-11rem)]">

            {/* TOP ROW: Metrics Bar with Emergency Button */}
            <div className="flex items-stretch gap-5 shrink-0">
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

            {/* MAIN CONTENT: Equal 3-Column Grid */}
            <div className="grid grid-cols-12 gap-5 flex-1 min-h-0 overflow-hidden">

              {/* COLUMN 1: Infrastructure Status */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1">
                <div className="text-[9px] text-green-600 uppercase tracking-widest font-bold px-1 flex items-center gap-2 shrink-0">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Infrastructure Status
                </div>
                <div className="flex-1 flex flex-col gap-4 min-h-0">
                  <CNIHeatmap />
                  <SystemArchitecture
                    perception={data.perceptionLayer}
                    cognition={data.cognitionLayer}
                    integrity={data.integrityLayer}
                  />
                  <DataLakeMonitor sources={data.dataLakeSources} />
                </div>
              </div>

              {/* COLUMN 2: Threat Visualization */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
                <div className="text-[9px] text-green-600 uppercase tracking-widest font-bold px-1 flex items-center gap-2 shrink-0">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  Threat Visualization
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 shrink-0">
                  <div className="bg-black border border-red-900/60 p-3">
                    <div className="text-[8px] text-red-500 uppercase tracking-wider mb-1">Critical Threats</div>
                    <div className="text-2xl font-bold text-red-400">{criticalCyber}</div>
                  </div>
                  <div className="bg-black border border-purple-900/60 p-3">
                    <div className="text-[8px] text-purple-500 uppercase tracking-wider mb-1">Attacks Blocked</div>
                    <div className="text-2xl font-bold text-purple-400">14.2K</div>
                  </div>
                </div>

                {/* Main Map - Takes available space */}
                <div className="flex-1 min-h-[180px] border border-green-900/30 overflow-hidden">
                  <ThreatMap
                    incidents={data.incidents}
                    predictions={data.predictions}
                    surveillance={data.surveillanceFeeds}
                  />
                </div>

                {/* Charts - Fixed height */}
                <div className="grid grid-cols-2 gap-4 h-28 shrink-0">
                  <ThreatAnalyticsChart analytics={data.threatAnalytics} />
                  <IncidentTrendsChart data={data.timeSeriesData} />
                </div>
              </div>

              {/* COLUMN 3: Intelligence & Response */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-hidden">
                <div className="text-[9px] text-green-600 uppercase tracking-widest font-bold px-1 flex items-center gap-2 shrink-0">
                  <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                  Intelligence Feed
                </div>

                <div className="shrink-0">
                  <ThreatAnalyticsEngine
                    cyberThreats={data.cyberThreats}
                    coordinatedAttacks={data.coordinatedAttacks}
                  />
                </div>

                <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1 min-h-0">
                  <IncidentList incidents={data.incidents} maxItems={5} />
                  <SurveillanceMonitor feeds={data.surveillanceFeeds} maxItems={4} />
                  <CommunityReports reports={data.communityReports} maxItems={3} />
                </div>

                <div className="shrink-0">
                  <AIAssistantPanel />
                </div>
              </div>

            </div>
          </div>
        )}

        {currentView === 'FUSION_CENTER' && (
          <div className="grid grid-cols-12 gap-4 h-[calc(100vh-10rem)]">
            {/* LEFT - Main Content */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
              <div className="flex-1 min-h-[300px]">
                <ThreatMap
                  incidents={data.incidents}
                  predictions={data.predictions}
                  surveillance={data.surveillanceFeeds}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <CNIHeatmap />
                <DataLakeMonitor sources={data.dataLakeSources} />
              </div>
            </div>
            {/* RIGHT - Intel Sidebar */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-y-auto">
              <div className="bg-black border border-green-900/50 p-4">
                <h2 className="text-sm font-bold text-green-400 mb-3 border-b border-green-900/50 pb-2 uppercase tracking-wider">
                  Inter-Agency Comms
                </h2>
                <AIAssistantPanel />
              </div>
              <CommunityReports reports={data.communityReports} maxItems={8} />
              <SurveillanceMonitor feeds={data.surveillanceFeeds} maxItems={5} />
            </div>
          </div>
        )}

        {currentView === 'THREAT_MATRIX' && (
          <div className="grid grid-cols-12 gap-4 h-[calc(100vh-10rem)]">
            {/* LEFT - Threat List */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1">
              <IncidentList incidents={data.incidents} maxItems={15} />
              <ThreatAnalyticsEngine
                cyberThreats={data.cyberThreats}
                coordinatedAttacks={data.coordinatedAttacks}
              />
            </div>
            {/* RIGHT - Map & Metrics */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
              <KeyMetrics metrics={{
                threatLevel: 'CRITICAL',
                activeIncidents: 42,
                aiConfidence: 89.5,
                systemLoad: 65,
                responsesActive: 12,
                networkTraffic: '12 TB/s'
              }} />
              <div className="flex-1 bg-black border border-red-900/30 p-2 relative min-h-[300px]">
                <div className="absolute top-2 right-2 bg-red-900/30 text-red-500 text-[9px] px-2 py-1 font-bold uppercase tracking-wider z-10">
                  Live Attack Vectors
                </div>
                <ThreatMap
                  incidents={data.incidents}
                  predictions={data.predictions}
                  surveillance={data.surveillanceFeeds}
                />
              </div>
            </div>
          </div>
        )}

        {currentView === 'ANALYTICS' && (
          <div className="grid grid-cols-12 gap-4 h-[calc(100vh-10rem)]">
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
                  {data.predictions.slice(0, 5).map((p, i) => (
                    <div key={i} className="flex justify-between items-center text-xs border-b border-blue-900/20 pb-2">
                      <span className="text-gray-400 truncate mr-2">{p.crimeTypes.join(', ')}</span>
                      <span className="text-blue-400 font-mono">{(p.probability * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'OPERATIONS' && (
          <div className="flex flex-col gap-4 h-[calc(100vh-10rem)]">
            {/* 4 PILLARS HEADER */}
            <div className="flex items-center justify-between px-1">
              <div className="text-[9px] text-green-600 uppercase tracking-widest font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                MAJESTIC SHIELD: 4 Winning Pillars
              </div>
              <div className="text-[8px] text-gray-600">
                National Security Gold Standard
              </div>
            </div>

            {/* TOP ROW: Adversarial + Federated Learning */}
            <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
              {/* COLUMN 1: Adversarial Defense */}
              <div className="col-span-12 lg:col-span-4 overflow-y-auto">
                <AdversarialDefensePanel metrics={data.adversarialMetrics} />
              </div>

              {/* COLUMN 2: Federated Learning + Sovereign AI */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-y-auto">
                <FederatedLearningHub status={data.federatedStatus} />
                <SovereignAIStatusPanel status={data.sovereignAIStatus} />
              </div>

              {/* COLUMN 3: Explainable AI + Response */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-y-auto">
                <ExplainableAIPanel explanations={data.xaiExplanations} />
                <AutomatedResponsePanel responses={data.automatedResponses} />
              </div>
            </div>
          </div>
        )}

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

      <DemoModeController onTriggerEmergency={() => setIsEmergency(true)} />
    </div>
  );
}
