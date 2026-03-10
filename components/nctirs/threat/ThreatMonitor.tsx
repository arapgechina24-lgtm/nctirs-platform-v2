'use client';

import { useEffect } from 'react';
import { SecurityIncident, CyberThreat } from '@/lib/nctirs/mockData';

interface ThreatMonitorProps {
    incidents: SecurityIncident[];
    cyberThreats: CyberThreat[];
    onAlert: () => void;
}

export const ThreatMonitor: React.FC<ThreatMonitorProps> = ({ incidents, cyberThreats, onAlert }) => {
    useEffect(() => {
        // Logic: If there are more than 3 critical incidents OR any critical cyber threat
        const criticalIncidents = incidents.filter(i => i.threatLevel === 'CRITICAL').length;
        const criticalThreats = cyberThreats.filter(t => t.severity === 'CRITICAL').length;

        // Monitoring logic simulation
        // We only trigger if thresholds are exceeded significantly to avoid constant alerts in this demo
        // For manual trigger, we rely on the parent or specific conditions

        // checks
        if (criticalIncidents > 5 || criticalThreats > 2) {
            // Auto-trigger disabled for now to prevent annoyance, 
            // but this is where the layout would react
            // onAlert(); 
        }
    }, [incidents, cyberThreats, onAlert]);

    return null; // Headless component
};
