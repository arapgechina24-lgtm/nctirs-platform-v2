'use client'

import { useState, useEffect } from "react"
import { Header } from "@/components/Header"
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
} from "@/lib/mockData"
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
}

export default function Home() {
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
    })
    setMounted(true)
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

  return (
    <div className="min-h-screen bg-black border-t-2 border-green-950">
      <Header />

      <main className="p-6 space-y-6 relative z-10">
        {/* System Architecture - Three Layer Overview */}
        <SystemArchitecture
          perception={perceptionLayer}
          cognition={cognitionLayer}
          integrity={integrityLayer}
        />

        {/* Key Metrics Overview - Extended */}
        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <StatCard
            title="Active Incidents"
            value={activeIncidents}
            change="+12%"
            changeType="negative"
            icon={AlertTriangle}
            iconColor="bg-red-950/50 text-red-400"
          />
          <StatCard
            title="High Threats"
            value={highThreatCount}
            change="-8%"
            changeType="positive"
            icon={Shield}
            iconColor="bg-orange-950/50 text-orange-400"
          />
          <StatCard
            title="Critical Cyber"
            value={criticalCyber}
            change="+3"
            changeType="negative"
            icon={Zap}
            iconColor="bg-cyan-950/50 text-cyan-400"
          />
          <StatCard
            title="Coordinated"
            value={activeCoordinated}
            change="ALERT"
            changeType="negative"
            icon={Brain}
            iconColor="bg-purple-950/50 text-purple-400"
          />
          <StatCard
            title="Surveillance"
            value={activeSurveillance}
            change="100%"
            changeType="positive"
            icon={Camera}
            iconColor="bg-green-950/50 text-green-400"
          />
          <StatCard
            title="Data Sources"
            value={dataLakeSources.length}
            change="ACTIVE"
            changeType="positive"
            icon={Database}
            iconColor="bg-blue-950/50 text-blue-400"
          />
          <StatCard
            title="Auto Response"
            value={autoResponsesActive}
            change="EXEC"
            changeType="neutral"
            icon={Activity}
            iconColor="bg-yellow-950/50 text-yellow-400"
          />
          <StatCard
            title="Reports Verified"
            value={verifiedReports}
            change="+24%"
            changeType="neutral"
            icon={Users}
            iconColor="bg-amber-950/50 text-amber-400"
          />
        </section>

        {/* Data Lake Monitor */}
        <section>
          <DataLakeMonitor sources={dataLakeSources} />
        </section>

        {/* AI Analytics & Automated Response */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ThreatAnalyticsEngine
            cyberThreats={cyberThreats}
            coordinatedAttacks={coordinatedAttacks}
          />
          <AutomatedResponsePanel responses={automatedResponses} />
        </section>

        {/* Threat Intelligence Map */}
        <section>
          <ThreatMap
            incidents={incidents}
            predictions={predictions}
            surveillance={surveillanceFeeds}
          />
        </section>

        {/* Analytics Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IncidentTrendsChart data={timeSeriesData} />
          <ThreatAnalyticsChart analytics={threatAnalytics} />
        </section>

        {/* Main Intelligence Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <IncidentList incidents={incidents} maxItems={6} />
            <CommunityReports reports={communityReports} maxItems={5} />
          </div>

          {/* Middle Column */}
          <div className="space-y-6">
            <CrimePredictionList predictions={predictions} maxItems={5} />
            <EmergencyResponseList responses={emergencyResponses} maxItems={5} />
          </div>

          {/* Right Column - Blockchain Ledger */}
          <div>
            <BlockchainLedger entries={blockchainLedger} maxItems={10} />
          </div>
        </section>

        {/* Surveillance Network */}
        <section>
          <SurveillanceMonitor feeds={surveillanceFeeds} maxItems={16} />
        </section>
      </main>
    </div>
  );
}
