import { describe, it, expect } from 'vitest'
import { createNC4Report } from '@/lib/soar-logic'

describe('createNC4Report', () => {
    it('should create a report with required structure', () => {
        const report = createNC4Report('SEACOM Cable', 'CRITICAL', 'T1498')

        expect(report).toHaveProperty('reporting_entity')
        expect(report).toHaveProperty('incident_details')
        expect(report).toHaveProperty('actions_taken')
        expect(report).toHaveProperty('compliance')
    })

    it('should set reporting entity as NCTIRS-FUSION-CENTER', () => {
        const report = createNC4Report('Test Asset', 'HIGH', 'T1234')

        expect(report.reporting_entity.name).toBe('NCTIRS-FUSION-CENTER')
        expect(report.reporting_entity.agency_type).toBe('GOVERNMENT')
    })

    it('should default county to Nairobi', () => {
        const report = createNC4Report('Test Asset', 'MEDIUM', 'T1234')
        expect(report.reporting_entity.county).toBe('Nairobi')
    })

    it('should allow custom county', () => {
        const report = createNC4Report('Test Asset', 'LOW', 'T1234', 'Mombasa')
        expect(report.reporting_entity.county).toBe('Mombasa')
    })

    it('should set correct incident details', () => {
        const report = createNC4Report('Safaricom Data Center', 'CRITICAL', 'T1190')

        expect(report.incident_details.incident_type).toBe('CRITICAL_INFRASTRUCTURE_ATTACK')
        expect(report.incident_details.severity).toBe('CRITICAL')
        expect(report.incident_details.target_asset).toBe('Safaricom Data Center')
        expect(report.incident_details.mitre_technique_id).toBe('T1190')
    })

    it('should include valid ISO timestamp', () => {
        const report = createNC4Report('Test', 'HIGH', 'T1234')
        const timestamp = report.incident_details.timestamp_utc
        expect(() => new Date(timestamp)).not.toThrow()
        expect(new Date(timestamp).toISOString()).toBe(timestamp)
    })

    it('should set air_gap_status to true', () => {
        const report = createNC4Report('Test', 'CRITICAL', 'T1234')
        expect(report.actions_taken.air_gap_status).toBe(true)
    })

    it('should set protocol to AUTO_CONTAINMENT_ALPHA', () => {
        const report = createNC4Report('Test', 'HIGH', 'T1234')
        expect(report.actions_taken.protocol_executed).toBe('AUTO_CONTAINMENT_ALPHA')
    })

    it('should generate containment time between 100-600ms', () => {
        const report = createNC4Report('Test', 'HIGH', 'T1234')
        expect(report.actions_taken.containment_time_ms).toBeGreaterThanOrEqual(100)
        expect(report.actions_taken.containment_time_ms).toBeLessThan(600)
    })

    it('should reference CMCA 2018 Section 11 in compliance', () => {
        const report = createNC4Report('Test', 'MEDIUM', 'T1234')
        expect(report.compliance.act_reference).toBe('CMCA_2018_SECTION_11')
    })

    it('should set data_protection_notified to true', () => {
        const report = createNC4Report('Test', 'LOW', 'T1234')
        expect(report.compliance.data_protection_notified).toBe(true)
    })

    it('should handle all severity levels', () => {
        const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
        for (const severity of severities) {
            const report = createNC4Report('Test', severity, 'T1234')
            expect(report.incident_details.severity).toBe(severity)
        }
    })
})
