'use client'

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

// Layout components
import { Header } from "@/components/nctirs/layout/Header"
// Threat components
import { ThreatAnalyticsChart } from "@/components/nctirs/threat/ThreatAnalyticsChart"
import { ThreatMap } from "@/components/nctirs/threat/ThreatMap"
import { ThreatMonitor } from "@/components/nctirs/threat/ThreatMonitor"
import { ThreatAnalyticsEngine } from "@/components/nctirs/threat/ThreatAnalyticsEngine"
import AdversarialDefensePanel from "@/components/nctirs/threat/AdversarialDefensePanel"
// Incident components
import { IncidentList } from "@/components/nctirs/incident/IncidentList"
import { IncidentTrendsChart } from "@/components/nctirs/incident/IncidentTrendsChart"
import EmergencyOverlay from "@/components/nctirs/incident/EmergencyOverlay"
import { AutomatedResponsePanel } from "@/components/nctirs/incident/AutomatedResponsePanel"
// Surveillance components
import { SurveillanceMonitor } from "@/components/nctirs/surveillance/SurveillanceMonitor"
import { CommunityReports } from "@/components/nctirs/surveillance/CommunityReports"
// Infrastructure components
import { DataLakeMonitor } from "@/components/nctirs/infrastructure/DataLakeMonitor"
import { SystemArchitecture } from "@/components/nctirs/infrastructure/SystemArchitecture"
import CNIHeatmap from "@/components/nctirs/infrastructure/CNIHeatmap"
// Intelligence components
import AIAssistantPanel from "@/components/nctirs/intelligence/AIAssistantPanel"
import FederatedLearningHub from "@/components/nctirs/intelligence/FederatedLearningHub"
import { XAIPanel } from "@/components/nctirs/intelligence/XAIPanel"
import SovereignAIStatusPanel from "@/components/nctirs/intelligence/SovereignAIStatusPanel"
// Compliance components
import KenyaContextPanel from "@/components/nctirs/compliance/KenyaContextPanel"
// Shared components
import MultiplayerSession from "@/components/nctirs/shared/MultiplayerSession"
import DemoModeController from "@/components/nctirs/shared/DemoModeController"
import { VoiceCommandPanel } from "@/components/nctirs/shared/VoiceCommandPanel"
// Ably Real-time
import { getAblyClient } from "@/lib/nctirs/ably"
import { toast } from "sonner"
// Analytics tracking
import { trackPageView, trackAction, trackPerformance } from "@/lib/nctirs/analytics"
// API Client for real data
import { fetchIncidents, fetchThreats } from "@/lib/nctirs/api"
// Types
import type {
    SecurityIncident,
    CyberRiskPrediction,
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
    Region,
    IncidentType,
    IncidentStatus,
    ThreatLevel,
} from "@/types"
// Mock data generators
import {
    generateMockIncidents,
    generateCyberRiskPredictions,
    generateSurveillanceFeeds,
    generateCommunityReports,
    generateThreatAnalytics,
    generateTimeSeriesData,
    generateDataLakeSources,
    generateCyberThreats,
} from "@/lib/nctirs/mockData"
import {
    generateNairobiTraffic,
    generateMpesaData,
    getCurrentNairobiWeather,
    TrafficNode,
    MpesaTransaction,
    WeatherLog
} from "@/lib/nctirs/kenyaContextData"
import {
    generateBorderLogs,
    generateWildlifeData,
    generateSocialSentiment,
    generateCyberAttribution,
    BorderLog,
    WildlifePing,
    SocialSentiment,
    ISPTrace
} from "@/lib/nctirs/kenyaExtendedData"
import { createNC4Report } from "@/lib/nctirs/soar-logic"

interface DashboardData {
    incidents: SecurityIncident[];
    predictions: CyberRiskPrediction[];
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
            <div className="glass-panel p-3 text-center border-emerald-500/20 bg-slate-900/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-emerald-500/20 hover:border-emerald-500/50">
                <div className="text-[10px] text-emerald-500/70 tracking-widest font-mono">CYBER PULSE</div>
                <div className={`text-lg font-bold font-mono ${metrics.threatLevel === 'CRITICAL' ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                    {metrics.threatLevel}
                </div>
            </div>
            <div className="glass-panel p-3 text-center border-blue-500/20 bg-slate-900/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-blue-500/20 hover:border-blue-500/50">
                <div className="text-[10px] text-blue-500/70 tracking-widest font-mono">ACTIVE SIGINT</div>
                <div className="text-lg font-bold text-blue-400 font-mono">{metrics.activeIncidents}</div>
            </div>
            <div className="glass-panel p-3 text-center border-cyan-500/20 bg-slate-900/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-cyan-500/20 hover:border-cyan-500/50">
                <div className="text-[10px] text-cyan-500/70 tracking-widest font-mono">AURA RELIABILITY</div>
                <div className="text-lg font-bold text-cyan-400 font-mono">{metrics.aiConfidence}%</div>
            </div>
            <div className="glass-panel p-3 text-center border-amber-500/20 bg-slate-900/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-amber-500/20 hover:border-amber-500/50">
                <div className="text-[10px] text-amber-500/70 tracking-widest font-mono">NEURAL LOAD</div>
                <div className="text-lg font-bold text-amber-500 font-mono">{metrics.systemLoad}%</div>
            </div>
            <div className="glass-panel p-3 text-center border-indigo-500/20 bg-slate-900/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/20 hover:border-indigo-500/50">
                <div className="text-[10px] text-indigo-500/70 tracking-widest font-mono">TRAFFIC FLOW</div>
                <div className="text-lg font-bold text-indigo-400 font-mono">{metrics.networkTraffic}</div>
            </div>
            <div className="glass-panel p-3 text-center border-violet-500/20 bg-slate-900/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-violet-500/20 hover:border-violet-500/50">
                <div className="text-[10px] text-violet-500/70 tracking-widest font-mono">AUTO-MITIGATION</div>
                <div className="text-lg font-bold text-violet-400 font-mono">{metrics.responsesActive}</div>
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
    const [strategicAdvice, setStrategicAdvice] = useState<{
        containment_strategy: string[];
        geopolitical_impact: string;
        advisory_code: string;
    } | null>(null)

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

    // ABLY REAL-TIME AI INTEGRATION
    useEffect(() => {
        if (!mounted) return;

        const ably = getAblyClient();
        if (!ably) return;

        const channel = ably.channels.get('nctirs-alerts');

        channel.subscribe((message) => {
            console.log("Cyber AI Pulse Received:", message.name, message.data);
            
            if (message.name === 'elite-threat-detected') {
                toast.critical("🛑 NATION-STATE THREAT DETECTED", {
                    description: `Attribution: ${message.data.attribution}. Impact Score: ${message.data.score.toFixed(1)}. Strategic containment initiated.`,
                    duration: 10000,
                });
                
                setData(prev => {
                    if (!prev) return prev;
                    const newIncident: SecurityIncident = {
                        id: `ELITE-AI-${Date.now()}`,
                        title: `TACTICAL ALERT: ${message.data.attribution}`,
                        description: `Nation-state activity detected. Impact: ${message.data.score}. Tactical attribution confirmed via AURA engine.`,
                        type: "APT",
                        threatLevel: message.data.level as any,
                        status: "DETECTED",
                        timestamp: new Date(),
                        location: { name: "MOMBASA_EDGE_SUBMARINE", region: "MOMBASA_EDGE", coordinates: [-4.0435, 39.6682] },
                        networkContext: {
                            sourceIp: "Masked (Attributor: AURA)",
                            targetIp: "National Fiber Backbone",
                            protocol: "HTTPS",
                            attackVector: "Nation-State Multi-Stage Breaching"
                        },
                        aiConfidence: 98,
                        sources: ["AURA_ATTRIBUTION_ENGINE", "NEURAL_CORE_V3"],
                        affectedSystems: 124
                    };
                    return { ...prev, incidents: [newIncident, ...prev.incidents] };
                });
            }

            if (message.name === 'cyber-risk-high') {
                toast.error("⚠️ HIGH RISK TELEMETRY", {
                    description: `AI Model flags anomaly. Score: ${message.data.score.toFixed(1)}. Vector: ${message.data.factors?.exfiltration ? 'Exfiltration' : 'Brute Force'}`,
                });
            }
        });

        return () => {
            channel.unsubscribe();
        };
    }, [mounted]);

    useEffect(() => {
        // Async function to load data from API + mock generators
        async function loadData() {
            const startTime = performance.now()

            try {
                // Fetch from API (with fallback to mock data)
                const incidents = await fetchIncidents({ limit: 30 });
                const cyberThreats = await generateCyberThreats(20); // Fallback until API is ready

                // Generate remaining mock data for components without API yet
                const predictions = generateCyberRiskPredictions(15);

                // Fetch real AI prediction from python backend
                try {
                    const res = await fetch('http://localhost:8000/api/predict/cyber-risk', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            port_activity: 0.85,
                            failed_logins: 0.6,
                            traffic_entropy: 0.72,
                            payload_size: 0.4,
                            actor_persistence: 0.95,
                            infra_criticality: 0.9,
                            geopolitical_tension: 0.82,
                            is_business_hours: 1
                        })
                    });
                    if (res.ok) {
                        const pyData = await res.json();
                        if (pyData.impact_score) {
                            predictions.unshift({
                                id: 'LIVE-ELITE-AI',
                                targetSystem: 'National Infrastructure (Live)',
                                riskProbability: pyData.impact_score,
                                riskFactors: [
                                    `Attribution: ${pyData.attribution}`,
                                    `Strategic Advice: ${pyData.strategic_advice}`
                                ],
                                predictedVector: "APT",
                                recommendedMitigation: [pyData.strategic_advice]
                            });

                            // Fetch strategic advice if high impact
                            if (pyData.impact_score > 60) {
                                const adviseRes = await fetch(`http://localhost:8000/api/strategic/advise?threat_id=CORE-${Date.now()}`);
                                if (adviseRes.ok) {
                                    const advice = await adviseRes.json();
                                    setStrategicAdvice(advice);
                                }
                            }
                        }
                    }
                } catch {
                    console.log("Cyber AI backend not reachable for live predictions.");
                }

                const surveillanceFeeds = generateSurveillanceFeeds(40);
                const communityReports = generateCommunityReports(25);
                const threatAnalytics = generateThreatAnalytics();
                const timeSeriesData = generateTimeSeriesData(30);
                const dataLakeSources = generateDataLakeSources();
                const cyberThreats = generateCyberThreats(20);

                // NCTIRS static/fallback data for winning pillars
                const perceptionLayer = { status: 'OPTIMAL', score: 98, lastUpdate: new Date(), latency: 12, precision: 0.99 };
                const cognitionLayer = { status: 'OPTIMAL', reasoningUnits: 154, throughput: 2400, modelVersion: 'NCTIRS-COG-v4' };
                const integrityLayer = { status: 'SECURE', encryptionLevel: 'AES-GCM-256', blockchainSync: true, authAnomalies: 0 };
                const adversarialMetrics = { robustness: 0.95, evasionRate: 0.02, detectionDrift: 0.01, attackAttempts: 4500 };
                const federatedStatus = { nodesActive: 24, syncStatus: 'STABLE', globalRound: 452 };
                const xaiExplanations = [];
                const sovereignAIStatus = { localExecution: true, offlineMode: false, dataSovereignty: 1.0 };

                setData({
                    incidents,
                    predictions,
                    surveillanceFeeds,
                    communityReports,
                    emergencyResponses: [],
                    threatAnalytics,
                    timeSeriesData,
                    cyberThreats,
                    dataLakeSources,
                    blockchainLedger: [],
                    coordinatedAttacks: [],
                    automatedResponses: [],
                    perceptionLayer: perceptionLayer as any,
                    cognitionLayer: cognitionLayer as any,
                    integrityLayer: integrityLayer as any,
                    adversarialMetrics,
                    federatedStatus: federatedStatus as any,
                    xaiExplanations,
                    sovereignAIStatus,
                    kenyaWeather: getCurrentNairobiWeather(),
                    kenyaTraffic: [],
                    mpesaTransactions: [],
                    borderLogs: [],
                    wildlife: [],
                    sentiment: [],
                    cyberTraces: []
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

    if (!mounted) return null
    if (!data) return <div className="h-screen w-screen bg-black flex items-center justify-center font-mono text-emerald-500">INITIALIZING SHADOW-CORE...</div>

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
            const { addAuditLog } = await import('@/lib/nctirs/actions/audit');
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
        highThreatCount,
        activeResponses,
        criticalCyber,
        activeCoordinated
    } = {
        highThreatCount: data.incidents.filter(i => i.threatLevel === 'CRITICAL' || i.threatLevel === 'HIGH').length,
        activeResponses: data.emergencyResponses.filter(r => r.status !== 'RESOLVED').length,
        criticalCyber: data.cyberThreats.filter(t => t.severity === 'CRITICAL').length,
        activeCoordinated: data.coordinatedAttacks.filter(a => a.status !== 'RESOLVED').length
    };

    return (

        <div className={`min-h-screen bg-background text-green-500 font-mono selection:bg-green-900 selection:text-white`}>
            <div className="fixed inset-0 pointer-events-none z-50 bg-[url('/scanline.png')] opacity-10 mix-blend-overlay"></div>
            <div className="fixed inset-0 pointer-events-none z-50 bg-gradient-to-b from-transparent via-green-900/5 to-green-900/10"></div>

            <Header currentView={currentView} onViewChange={setCurrentView} />

            <main className="p-6 relative z-0">
                <MultiplayerSession />

                {/* View Routing */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentView}
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.98 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="w-full"
                    >
                        {currentView === 'COMMAND_CENTER' && (
                            <div className="flex flex-col gap-4 overflow-y-auto" style={{ height: 'calc(100vh - 9rem)' }}>

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

                                {/* MAIN CONTENT: 3-Column Grid */}
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
                                            <div className="glass-panel !border-red-500/30 p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-red-500/20">
                                                <div className="text-[9px] text-red-500 uppercase tracking-wider mb-1">Critical Threats</div>
                                                <div className="text-2xl font-bold text-red-400">{criticalCyber}</div>
                                            </div>
                                            <div className="glass-panel !border-purple-500/30 p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-purple-500/20">
                                                <div className="text-[9px] text-purple-500 uppercase tracking-wider mb-1">Attacks Blocked</div>
                                                <div className="text-2xl font-bold text-purple-400">14.2K</div>
                                            </div>
                                        </div>

                                        {/* Main Map */}
                                        <div className="h-64 border border-green-900/30 overflow-hidden rounded-xl shadow-inner">
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
                                        <CommunityReports reports={data.communityReports} maxItems={5} />

                                        <AIAssistantPanel />
                                    </div>

                                </div>

                                {/* FULL WIDTH: Surveillance Network */}
                                <div className="flex flex-col gap-4">
                                    <SurveillanceMonitor feeds={data.surveillanceFeeds} maxItems={12} />
                                </div>
                            </div>
                        )}

                        {currentView === 'FUSION_CENTER' && (
                            <div className="grid grid-cols-12 gap-4 h-[calc(100vh-10rem)]">
                                {/* LEFT - Main Content */}
                                <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
                                    <div className="flex-1 min-h-[300px] rounded-xl overflow-hidden border border-green-900/40">
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
                                    <div className="mb-6">
                        <motion.h1 
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="text-4xl font-black text-white tracking-tighter mb-1 font-mono"
                        >
                            NCTIRS <span className="text-emerald-500">SHADOW-CORE</span>
                        </motion.h1>
                        <p className="text-slate-500 text-xs uppercase tracking-[0.3em] font-mono">
                            Elite Cyber Intelligence & Automated Universal Risk Attribution (AURA)
                        </p>
                    </div>
                                    {/* Elite Strategic Advisory Terminal */}
                                    <div className="glass-panel border-emerald-500/30 p-4 bg-slate-900/90 shadow-lg shadow-emerald-500/10">
                                        <div className="flex items-center justify-between mb-4 border-b border-emerald-500/20 pb-2">
                                            <h2 className="text-xs font-black text-emerald-400 uppercase tracking-widest font-mono">Strategic Advisory</h2>
                                            <span className="text-[10px] font-mono text-emerald-600 animate-pulse">{strategicAdvice?.advisory_code || 'AWAITING_SIGINT'}</span>
                                        </div>
                                        {strategicAdvice ? (
                                            <div className="space-y-4 font-mono">
                                                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded">
                                                    <div className="text-[10px] text-emerald-700 mb-1">GEOPOLITICAL IMPACT</div>
                                                    <div className="text-xs text-emerald-200">{strategicAdvice.geopolitical_impact}</div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="text-[10px] text-emerald-700 uppercase">Containment Protcols</div>
                                                    {strategicAdvice.containment_strategy.map((s, i) => (
                                                        <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                                                            <span className="text-emerald-500">▶</span>
                                                            {s}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-32 flex items-center justify-center">
                                                <div className="text-[10px] text-slate-600 font-mono italic animate-pulse">Scanning Neural Pulse for nation-state signatures...</div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="glass-panel border-emerald-900/50 p-6">
                                        <h2 className="text-sm font-bold text-emerald-400 mb-3 border-b border-emerald-900/50 pb-2 uppercase tracking-wider font-mono">
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
                                    <div className="flex-1 glass-panel border-red-900/30 p-2 relative min-h-[300px]">
                                        <div className="absolute top-2 right-2 bg-red-900/30 text-red-500 text-[9px] px-2 py-1 font-bold uppercase tracking-wider z-10">
                                            Live Attack Vectors
                                        </div>
                                        <div className="absolute inset-0 rounded-xl overflow-hidden m-2">
                                            <ThreatMap
                                                incidents={data.incidents}
                                                predictions={data.predictions}
                                                surveillance={data.surveillanceFeeds}
                                            />
                                        </div>
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
                                    <div className="glass-panel border-blue-900/50 p-5 flex-1">
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
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

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
