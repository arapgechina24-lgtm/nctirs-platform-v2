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
import {
  generateMockIncidents,
  generateCrimePredictions,
  generateSurveillanceFeeds,
  generateCommunityReports,
  generateEmergencyResponses,
  generateThreatAnalytics,
  generateTimeSeriesData,
  SecurityIncident,
  CrimePrediction,
  SurveillanceFeed,
  CommunityReport,
  EmergencyResponse,
  ThreatAnalytics,
  TimeSeriesData,
} from "@/lib/mockData"
import { AlertTriangle, Shield, Camera, Users, Activity } from "lucide-react"

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState<{
    incidents: SecurityIncident[];
    predictions: CrimePrediction[];
    surveillanceFeeds: SurveillanceFeed[];
    communityReports: CommunityReport[];
    emergencyResponses: EmergencyResponse[];
    threatAnalytics: ThreatAnalytics[];
    timeSeriesData: TimeSeriesData[];
  } | null>(null)

  useEffect(() => {
    // Generate mock data only on client
    const incidents = generateMockIncidents(30);
    const predictions = generateCrimePredictions(15);
    const surveillanceFeeds = generateSurveillanceFeeds(40);
    const communityReports = generateCommunityReports(25);
    const emergencyResponses = generateEmergencyResponses(12);
    const threatAnalytics = generateThreatAnalytics();
    const timeSeriesData = generateTimeSeriesData(30);

    /* eslint-disable react-hooks/set-state-in-effect */
    setData({
      incidents,
      predictions,
      surveillanceFeeds,
      communityReports,
      emergencyResponses,
      threatAnalytics,
      timeSeriesData
    })
    setMounted(true)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  if (!mounted || !data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-green-500">
        <div className="animate-pulse">INITIALIZING_SECURE_CONNECTION...</div>
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
    timeSeriesData
  } = data

  // Calculate stats
  const activeIncidents = incidents.filter(i => i.status === 'ACTIVE').length;
  const highThreatCount = incidents.filter(i => i.threatLevel === 'CRITICAL' || i.threatLevel === 'HIGH').length;
  const activeSurveillance = surveillanceFeeds.filter(f => f.status === 'ACTIVE').length;
  const verifiedReports = communityReports.filter(r => r.verified).length;
  const activeResponses = emergencyResponses.filter(r => r.status !== 'RESOLVED').length;

  return (
    <div className="min-h-screen bg-black border-t-2 border-green-950">
      <Header />

      <main className="p-6 space-y-6 relative z-10">
        {/* Key Metrics Overview */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            title="Surveillance Active"
            value={activeSurveillance}
            change="100%"
            changeType="positive"
            icon={Camera}
            iconColor="bg-purple-950/50 text-purple-400"
          />
          <StatCard
            title="Verified Reports"
            value={verifiedReports}
            change="+24%"
            changeType="neutral"
            icon={Users}
            iconColor="bg-cyan-950/50 text-cyan-400"
          />
          <StatCard
            title="Active Responses"
            value={activeResponses}
            change="+3 Units"
            changeType="neutral"
            icon={Activity}
            iconColor="bg-green-950/50 text-green-400"
          />
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
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <IncidentList incidents={incidents} maxItems={8} />
            <CommunityReports reports={communityReports} maxItems={6} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <CrimePredictionList predictions={predictions} maxItems={6} />
            <EmergencyResponseList responses={emergencyResponses} maxItems={5} />
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
