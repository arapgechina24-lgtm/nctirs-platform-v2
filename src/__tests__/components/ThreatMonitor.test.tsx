import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ThreatMonitor } from '@/components/threat/ThreatMonitor'
import { SecurityIncident, CyberThreat } from '@/lib/mockData'

// Minimal mock data
const makeIncident = (overrides: Partial<SecurityIncident> = {}): SecurityIncident => ({
    id: 'INC-001',
    title: 'Test Incident',
    description: 'Test description',
    type: 'CYBER',
    threatLevel: 'MEDIUM',
    status: 'ACTIVE',
    priority: 5,
    source: 'AUTOMATED',
    county: 'Nairobi',
    coordinates: [-1.286389, 36.817223],
    timestamp: new Date().toISOString(),
    agency: 'NIS',
    indicators: [],
    ...overrides,
} as SecurityIncident)

const makeThreat = (overrides: Partial<CyberThreat> = {}): CyberThreat => ({
    id: 'THR-001',
    name: 'Test Threat',
    type: 'MALWARE',
    severity: 'MEDIUM',
    source: 'OSINT',
    targetSector: 'GOVERNMENT',
    confidence: 80,
    mitreId: 'T1234',
    timestamp: new Date().toISOString(),
    ...overrides,
} as CyberThreat)

describe('ThreatMonitor', () => {
    it('should render without crashing', () => {
        const onAlert = vi.fn()
        const { container } = render(
            <ThreatMonitor
                incidents={[]}
                cyberThreats={[]}
                onAlert={onAlert}
            />
        )
        // ThreatMonitor is a headless component, renders null
        expect(container.innerHTML).toBe('')
    })

    it('should not call onAlert when below threshold', () => {
        const onAlert = vi.fn()
        const incidents = [makeIncident({ threatLevel: 'CRITICAL' })]
        const threats = [makeThreat({ severity: 'CRITICAL' })]

        render(
            <ThreatMonitor
                incidents={incidents}
                cyberThreats={threats}
                onAlert={onAlert}
            />
        )

        // With only 1 critical incident and 1 critical threat, thresholds not met
        expect(onAlert).not.toHaveBeenCalled()
    })

    it('should render as null (headless component)', () => {
        const onAlert = vi.fn()
        const { container } = render(
            <ThreatMonitor
                incidents={[makeIncident()]}
                cyberThreats={[makeThreat()]}
                onAlert={onAlert}
            />
        )
        expect(container.firstChild).toBeNull()
    })

    it('should accept empty arrays without error', () => {
        const onAlert = vi.fn()
        expect(() => {
            render(
                <ThreatMonitor
                    incidents={[]}
                    cyberThreats={[]}
                    onAlert={onAlert}
                />
            )
        }).not.toThrow()
    })

    it('should handle large numbers of incidents', () => {
        const onAlert = vi.fn()
        const incidents = Array.from({ length: 20 }, (_, i) =>
            makeIncident({ id: `INC-${i}`, threatLevel: 'LOW' })
        )

        expect(() => {
            render(
                <ThreatMonitor
                    incidents={incidents}
                    cyberThreats={[]}
                    onAlert={onAlert}
                />
            )
        }).not.toThrow()
    })
})
