'use client'

import { useState, useEffect, useCallback } from "react"
import dynamic from 'next/dynamic'
import { Header, ViewType } from "@/components/Header"
import { IncidentList } from "@/components/IncidentList"
import { SurveillanceMonitor } from "@/components/SurveillanceMonitor"
import { CommunityReports } from "@/components/CommunityReports"
import { ThreatAnalyticsChart } from "@/components/ThreatAnalyticsChart"
import { IncidentTrendsChart } from "@/components/IncidentTrendsChart"
// NCTIRS Unified Components
import { DataLakeMonitor } from "@/components/DataLakeMonitor"
import { ThreatAnalyticsEngine } from "@/components/ThreatAnalyticsEngine"
import { AutomatedResponsePanel } from "@/components/AutomatedResponsePanel"
import { SystemArchitecture } from "@/components/SystemArchitecture"
// NEW Components - Lazy loaded for performance
const CNIHeatmap = dynamic(() => import("@/components/CNIHeatmap"), { 
  ssr: false,
  loading: () => <div className="h-64 bg-black border border-green-900/30 animate-pulse flex items-center justify-center text-green-800 text-xs">Loading CNI Heatmap...</div>
})
const ThreatMap = dynamic(() => import("@/components/ThreatMap").then(mod => ({ default: mod.ThreatMap })), { 
  ssr: false,
  loading: () => <div className="h-64 bg-black border border-green-900/30 animate-pulse flex items-center justify-center text-green-800 text-xs">Loading Threat Map...</div>
})
import AIAssistantPanel from "@/components/AIAssistantPanel"
import MultiplayerSession from "@/components/MultiplayerSession"
import EmergencyOverlay from "@/components/EmergencyOverlay"
import { ThreatMonitor } from "@/components/ThreatMonitor"
import DemoModeController from "@/components/DemoModeController"
import { VoiceCommandPanel } from "@/components/VoiceCommandPanel"
// 4 WINNING PILLARS: MAJESTIC SHIELD
import AdversarialDefensePanel from "@/components/AdversarialDefensePanel"
import FederatedLearningHub from "@/components/FederatedLearningHub"
import ExplainableAIPanel from "@/components/ExplainableAIPanel"
import SovereignAIStatusPanel from "@/components/SovereignAIStatusPanel"
import KenyaContextPanel from "@/components/KenyaContextPanel"
// Demo Mode Banner
import DemoModeBanner from "@/components/DemoModeBanner"
// Threat Simulation
import ThreatSimulationPanel from "@/components/ThreatSimulationPanel"
// Analytics tracking
import { trackPageView, trackAction, trackPerformance } from "@/lib/analytics"
// API Client for real data
import { fetchIncidents, fetchThreats } from "@/lib/api"

import {
  generateCrimePredictions,
  generateSurveillanceFeeds,
  generateCommunityReports,
  generateEmergencyResponses,
  generateThreatAnalytics,
  generateTimeSeriesData,
  // NCTIRS generators
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

// Loading Skeleton with timeout fallback
function LoadingSkeleton({ onTimeout }: { onTimeout: () => void }) {
  const [dots, setDots] = useState('');
  const [loadTime, setLoadTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
      setLoadTime(prev => prev + 0.5);
    }, 500);

    // Timeout fallback - load demo data after 3 seconds
    const timeout = setTimeout(() => {
      onTimeout();
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onTimeout]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center font-mono text-green-500">
      <div className="text-center max-w-md px-4">
        {/* Logo */}
        <div className="mb-6">
          <div className="text-4xl font-black tracking-tight text-green-400 animate-pulse">
            NCTIRS
          </div>
          <div className="text-xs text-green-700 mt-1">
            National Cyber Threat Intelligence & Response System
          </div>
        </div>

        {/* Status */}
        <div className="bg-black border border-green-900/50 p-4 mb-4">
          <div className="text-sm text-green-600 mb-2">
            INITIALIZING SECURE CONNECTION{dots}
          </div>
          <div className="w-full bg-green-950 h-2 rounded overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${Math.min(loadTime / 3 * 100, 95)}%` }}
            />
          </div>
          <div className="text-[10px] text-green-800 mt-2">
            {loadTime < 1 ? 'Authenticating...' : loadTime < 2 ? 'Loading threat data...' : 'Establishing secure channel...'}
          </div>
        </div>

        {/* Loading Indicators */}
        <div className="flex items-center justify-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-ping" />
          <div className="h-2 w-2 bg-green-500 rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
          <div className="h-2 w-2 bg-green-500 rounded-full animate-ping" style={{ animationDelay: '0.4s' }} />
        </div>

        {/* Skip Button */}
        <button
          onClick={onTimeout}
          className="mt-6 text-xs text-green-700 hover:text-green-500 transition-colors underline"
        >
          Load Demo Mode →
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('COMMAND_CENTER')
  const [isEmergency, setIsEmergency] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState<DashboardData | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [showDemoBanner, setShowDemoBanner] = useState(true)

  // Generate mock data immediately for fallback
  const generateMockData = useCallback((): DashboardData => {
    const predictions = generateCrimePredictions(15);
    const surveillanceFeeds = generateSurveillanceFeeds(40);
    const communityReports = generateCommunityReports(25);
    const emergencyResponses = generateEmergencyResponses(12);
    const threatAnalytics = generateThreatAnalytics();
    const timeSeriesData = generateTimeSeriesData(30);
    const dataLakeSources = generateDataLakeSources();
    const blockchainLedger = generateBlockchainLedger(25);
    const coordinatedAttacks = generateCoordinatedAttacks(5);
    const automatedResponses = generateAutomatedResponses(15);
    const perceptionLayer = generatePerceptionLayerStatus();
    const cognitionLayer = generateCognitionLayerStatus();
    const integrityLayer = generateIntegrityLayerStatus();
    const adversarialMetrics = generateAdversarialMetrics();
    const federatedStatus = generateFederatedNodes();
    const xaiExplanations = generateXAIExplanations(8);
    const sovereignAIStatus = generateSovereignAIStatus();
    const kenyaWeather = getCurrentNairobiWeather();
    const kenyaTraffic = generateNairobiTraffic(30);
    const mpesaTransactions = generateMpesaData(40);
    const borderLogs = generateBorderLogs();
    const wildlife = generateWildlifeData();
    const sentiment = generateSocialSentiment();
    const cyberTraces = generateCyberAttribution();

    // Generate mock incidents and threats
    const incidents: SecurityIncident[] = Array.from({ length: 20 }, (_, i) => ({
      id: `INC-${1000 + i}`,
      type: ['CYBER_ATTACK', 'TERRORISM', 'ORGANIZED_CRIME', 'TRAFFICKING'][Math.floor(Math.random() * 4)] as SecurityIncident['type'],
      title: ['APT Campaign Detected', 'Suspicious Activity', 'Network Intrusion', 'Data Exfiltration Attempt'][Math.floor(Math.random() * 4)],
      description: 'Automated threat detection triggered',
      location: {
        name: ['Nairobi CBD', 'Mombasa Port', 'JKIA', 'Kisumu', 'Nakuru'][Math.floor(Math.random() * 5)],
        region: 'NAIROBI' as const,
        coordinates: [-1.286389 + Math.random() * 0.1, 36.817223 + Math.random() * 0.1] as [number, number]
      },
      threatLevel: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'][Math.floor(Math.random() * 4)] as SecurityIncident['threatLevel'],
      status: ['ACTIVE', 'INVESTIGATING', 'MONITORING'][Math.floor(Math.random() * 3)] as SecurityIncident['status'],
      timestamp: new Date(Date.now() - Math.random() * 86400000),
      affectedArea: Math.floor(Math.random() * 100),
      aiConfidence: 70 + Math.random() * 30,
      sources: ['OSINT', 'HUMINT', 'SIGINT']
    }));

    const cyberThreats: CyberThreat[] = Array.from({ length: 15 }, (_, i) => ({
      id: `THR-${2000 + i}`,
      name: ['Lazarus Group', 'APT-29', 'Charming Kitten', 'Sandworm'][Math.floor(Math.random() * 4)],
      type: ['APT', 'RANSOMWARE', 'DDOS', 'PHISHING'][Math.floor(Math.random() * 4)] as CyberThreat['type'],
      severity: ['CRITICAL', 'HIGH', 'MEDIUM'][Math.floor(Math.random() * 3)] as CyberThreat['severity'],
      targetSector: ['GOVERNMENT', 'FINANCIAL', 'TELECOM'][Math.floor(Math.random() * 3)] as CyberThreat['targetSector'],
      targetSystem: ['eCitizen', 'M-Pesa', 'KRA iTax', 'Banking Sector'][Math.floor(Math.random() * 4)],
      status: ['DETECTED', 'ANALYZING', 'CONTAINED'][Math.floor(Math.random() * 3)] as CyberThreat['status'],
      aiConfidence: 80 + Math.random() * 20,
      timestamp: new Date(Date.now() - Math.random() * 86400000),
      sourceIP: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      aptSignature: 'T1566.001',
      iocIndicators: ['malicious-domain.com', '192.168.1.100'],
      description: 'Sophisticated attack campaign targeting critical infrastructure'
    }));

    return {
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
    };
  }, []);

  // Handle timeout - load demo data
  const handleLoadTimeout = useCallback(() => {
    console.log('⚡ Loading demo data (timeout or user request)');
    setIsDemoMode(true);
    setData(generateMockData());
    setMounted(true);
  }, [generateMockData]);

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
        const dataLakeSources = generateDataLakeSources();
        const blockchainLedger = generateBlockchainLedger(25);
        const coordinatedAttacks = generateCoordinatedAttacks(5);
        const automatedResponses = generateAutomatedResponses(15);
        const perceptionLayer = generatePerceptionLayerStatus();
        const cognitionLayer = generateCognitionLayerStatus();
        const integrityLayer = generateIntegrityLayerStatus();
        const adversarialMetrics = generateAdversarialMetrics();
        const federatedStatus = generateFederatedNodes();
        const xaiExplanations = generateXAIExplanations(8);
        const sovereignAIStatus = generateSovereignAIStatus();
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
        setMounted(true)

        // Track render performance
        const renderTime = performance.now() - startTime
        trackPerformance('initial_render', { renderTime })
      } catch (error) {
        console.error('Failed to load data from API, using demo data:', error)
        handleLoadTimeout()
      }
    }

    loadData()
  }, [handleLoadTimeout])

  // Auto-start demo after inactivity
  useEffect(() => {
    if (!mounted || !data) return;

    let inactivityTimer: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        // Auto-trigger demo after 30 seconds of inactivity
        if (!isEmergency) {
          setShowDemoBanner(true);
        }
      }, 30000);
    };

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [mounted, data, isEmergency]);

  if (!mounted || !data) {
    return <LoadingSkeleton onTimeout={handleLoadTimeout} />;
  }

  const handleMitigation = async () => {
    console.log("⚡ INITIATING EMERGENCY AIR-GAP PROTOCOL...");

    const report = createNC4Report(
      "SEACOM SUBMARINE CABLE - MOMBASA",
      "CRITICAL",
      "T1098.004",
      "Mombasa"
    );

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

    return report;
  };

  const {
    highThreatCount = 0,
    activeResponses = 0,
    criticalCyber = 0,
    activeCoordinated = 0
  } = {
    highThreatCount: data.incidents.filter(i => i.threatLevel === 'CRITICAL' || i.threatLevel === 'HIGH').length,
    activeResponses: data.emergencyResponses.filter(r => r.status !== 'RESOLVED').length,
    criticalCyber: data.cyberThreats.filter(t => t.severity === 'CRITICAL').length,
    activeCoordinated: data.coordinatedAttacks.filter(a => a.status !== 'RESOLVED').length
  };

  const startDemo = () => {
    setIsEmergency(true);
    setShowDemoBanner(false);
  };

  return (
    <div className={`min-h-screen bg-black text-green-500 font-mono selection:bg-green-900 selection:text-white`}>
      <div className="fixed inset-0 pointer-events-none z-50 bg-[url('/scanline.png')] opacity-10 mix-blend-overlay"></div>
      <div className="fixed inset-0 pointer-events-none z-50 bg-gradient-to-b from-transparent via-green-900/5 to-green-900/10"></div>

      {/* Demo Mode Banner */}
      {showDemoBanner && (
        <DemoModeBanner 
          isDemoMode={isDemoMode} 
          onStartDemo={startDemo}
          onDismiss={() => setShowDemoBanner(false)}
        />
      )}

      <Header currentView={currentView} onViewChange={setCurrentView} />

      <main className="p-4 md:p-6 relative z-0">
        <MultiplayerSession />

        {/* View Routing */}
        {currentView === 'COMMAND_CENTER' && (
          <div className="flex flex-col gap-4 overflow-y-auto" style={{ height: 'calc(100vh - 9rem)' }}>

            {/* TOP ROW: Metrics Bar with Emergency Button */}
            <div className="flex flex-col md:flex-row items-stretch gap-4 shrink-0">
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
                className="bg-red-950/50 text-red-400 text-xs border-2 border-red-800 px-5 py-3 md:py-0 hover:bg-red-900/60 uppercase font-bold transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                SIMULATE BREACH
              </button>
            </div>

            {/* MAIN CONTENT: 3-Column Grid - Responsive */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* COLUMN 1: Infrastructure Status */}
              <div className="flex flex-col gap-4">
                <div className="text-xs text-green-500 uppercase tracking-widest font-bold px-1 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  Infrastructure Status
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
              </div>

              {/* COLUMN 2: Threat Visualization */}
              <div className="flex flex-col gap-4">
                <div className="text-xs text-green-500 uppercase tracking-widest font-bold px-1 flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  Threat Visualization
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

                {/* Main Map */}
                <div className="h-64 border border-green-900/30 overflow-hidden">
                  <ThreatMap
                    incidents={data.incidents}
                    predictions={data.predictions}
                    surveillance={data.surveillanceFeeds}
                  />
                </div>

                {/* Charts - Full Width Stacked */}
                <ThreatAnalyticsChart analytics={data.threatAnalytics} />
                <IncidentTrendsChart data={data.timeSeriesData} />
              </div>

              {/* COLUMN 3: Intelligence & Response */}
              <div className="flex flex-col gap-4">
                <div className="text-xs text-green-500 uppercase tracking-widest font-bold px-1 flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full" />
                  Intelligence Feed
                </div>

                <ThreatAnalyticsEngine
                  cyberThreats={data.cyberThreats}
                  coordinatedAttacks={data.coordinatedAttacks}
                />

                <IncidentList incidents={data.incidents} maxItems={8} />
                <SurveillanceMonitor feeds={data.surveillanceFeeds} maxItems={6} />
                <CommunityReports reports={data.communityReports} maxItems={5} />

                <AIAssistantPanel />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="flex flex-col gap-4 overflow-y-auto" style={{ height: 'calc(100vh - 9rem)' }}>
            {/* 4 PILLARS HEADER */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-1 shrink-0 gap-2">
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
              <ExplainableAIPanel explanations={data.xaiExplanations} />

              {/* Pillar 4: Sovereign AI */}
              <SovereignAIStatusPanel status={data.sovereignAIStatus} />
            </div>

            {/* Threat Simulation Lab - AI-Powered */}
            <div className="shrink-0">
              <ThreatSimulationPanel />
            </div>

            {/* Response Panel - Full Width */}
            <div className="shrink-0">
              <AutomatedResponsePanel responses={data.automatedResponses} />
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

      <VoiceCommandPanel
        onNavigate={setCurrentView}
        onEmergency={() => setIsEmergency(true)}
        onRefresh={() => window.location.reload()}
      />

      <DemoModeController onTriggerEmergency={() => setIsEmergency(true)} />
    </div>
  );
}
