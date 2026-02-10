import { describe, it, expect } from 'vitest'
import { generateNC4Report } from '@/lib/nc4Report'

describe('generateNC4Report', () => {
    it('should generate a valid report with required fields', () => {
        const report = generateNC4Report('INC-001', 'FINANCE')

        expect(report).toHaveProperty('timestamp')
        expect(report).toHaveProperty('incidentId', 'INC-001')
        expect(report).toHaveProperty('assetCategory', 'FINANCE')
        expect(report).toHaveProperty('mitreTechnique')
        expect(report).toHaveProperty('piiAccessed')
        expect(report).toHaveProperty('complianceStatus')
        expect(report).toHaveProperty('narrative')
    })

    it('should flag PII access for FINANCE assets', () => {
        const report = generateNC4Report('INC-002', 'FINANCE')
        expect(report.piiAccessed).toBe(true)
        expect(report.complianceStatus).toBe('UNDER_REVIEW')
    })

    it('should flag PII access for GOVERNMENT assets', () => {
        const report = generateNC4Report('INC-003', 'GOVERNMENT')
        expect(report.piiAccessed).toBe(true)
        expect(report.complianceStatus).toBe('UNDER_REVIEW')
    })

    it('should flag PII access for TELECOMMUNICATIONS assets', () => {
        const report = generateNC4Report('INC-004', 'TELECOMMUNICATIONS')
        expect(report.piiAccessed).toBe(true)
        expect(report.complianceStatus).toBe('UNDER_REVIEW')
    })

    it('should NOT flag PII for ELECTRICITY assets', () => {
        const report = generateNC4Report('INC-005', 'ELECTRICITY')
        expect(report.piiAccessed).toBe(false)
        expect(report.complianceStatus).toBe('COMPLIANT')
    })

    it('should NOT flag PII for WATER assets', () => {
        const report = generateNC4Report('INC-006', 'WATER')
        expect(report.piiAccessed).toBe(false)
        expect(report.complianceStatus).toBe('COMPLIANT')
    })

    it('should use T1078 technique for ELECTRICITY assets', () => {
        const report = generateNC4Report('INC-007', 'ELECTRICITY')
        expect(report.mitreTechnique).toBe('T1078 - Valid Accounts')
    })

    it('should use T1190 technique for non-ELECTRICITY assets', () => {
        const report = generateNC4Report('INC-008', 'FINANCE')
        expect(report.mitreTechnique).toBe('T1190 - Exploit Public-Facing Application')
    })

    it('should generate ISO timestamp', () => {
        const report = generateNC4Report('INC-009', 'FINANCE')
        expect(() => new Date(report.timestamp)).not.toThrow()
        expect(new Date(report.timestamp).toISOString()).toBe(report.timestamp)
    })

    it('should include PII warning in narrative for high-risk assets', () => {
        const report = generateNC4Report('INC-010', 'GOVERNMENT')
        expect(report.narrative).toContain('POTENTIAL PII EXPOSURE DETECTED')
        expect(report.narrative).toContain('ODPC NOTIFICATION REQUIRED')
    })

    it('should include safe narrative for low-risk assets', () => {
        const report = generateNC4Report('INC-011', 'WATER')
        expect(report.narrative).toContain('No PII indicators found')
    })

    it('should reference the Cybercrime Act in narrative', () => {
        const report = generateNC4Report('INC-012', 'FINANCE')
        expect(report.narrative).toContain('Kenya Computer Misuse and Cybercrime Act (2018)')
    })
})
