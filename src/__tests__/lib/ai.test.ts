import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    analyzeThreat,
    analyzeIncident,
    generateFallbackThreatAnalysis,
    generateFallbackIncidentAnalysis,
    type ThreatAnalysisInput,
    type IncidentAnalysisInput,
    type AIAnalysisResult,
} from '@/lib/ai'

// Mock the Google Generative AI SDK
vi.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
        getGenerativeModel: vi.fn().mockReturnValue({
            generateContent: vi.fn().mockResolvedValue({
                response: {
                    text: () => JSON.stringify({
                        summary: 'AI-generated test summary',
                        riskAssessment: {
                            level: 'HIGH',
                            justification: 'Test justification',
                            confidenceScore: 0.85,
                        },
                        attackVectorAnalysis: {
                            likelyTechnique: 'Test Technique',
                            mitreId: 'T1234',
                            description: 'Test attack description',
                        },
                        recommendedActions: ['Action 1', 'Action 2'],
                        kenyaContext: 'Test Kenya context',
                    }),
                },
            }),
        }),
    })),
}))

// ===== Fallback Analysis Tests =====

describe('generateFallbackThreatAnalysis', () => {
    const baseThreat: ThreatAnalysisInput = {
        name: 'Test APT Attack',
        type: 'APT',
        severity: 'CRITICAL',
        description: 'A test APT attack',
        targetSector: 'GOVERNMENT',
    }

    it('should return correct structure', () => {
        const result = generateFallbackThreatAnalysis(baseThreat)

        expect(result).toHaveProperty('summary')
        expect(result).toHaveProperty('riskAssessment')
        expect(result).toHaveProperty('attackVectorAnalysis')
        expect(result).toHaveProperty('recommendedActions')
        expect(result).toHaveProperty('kenyaContext')
        expect(result).toHaveProperty('timestamp')
        expect(result).toHaveProperty('source')
    })

    it('should set source as fallback', () => {
        const result = generateFallbackThreatAnalysis(baseThreat)
        expect(result.source).toBe('fallback')
    })

    it('should map APT threat to MITRE T1071', () => {
        const result = generateFallbackThreatAnalysis(baseThreat)
        expect(result.attackVectorAnalysis.mitreId).toBe('T1071')
        expect(result.attackVectorAnalysis.likelyTechnique).toBe('Advanced Persistent Threat')
    })

    it('should map RANSOMWARE to MITRE T1486', () => {
        const result = generateFallbackThreatAnalysis({ ...baseThreat, type: 'RANSOMWARE' })
        expect(result.attackVectorAnalysis.mitreId).toBe('T1486')
    })

    it('should map DDOS to MITRE T1498', () => {
        const result = generateFallbackThreatAnalysis({ ...baseThreat, type: 'DDOS' })
        expect(result.attackVectorAnalysis.mitreId).toBe('T1498')
    })

    it('should map PHISHING to MITRE T1566', () => {
        const result = generateFallbackThreatAnalysis({ ...baseThreat, type: 'PHISHING' })
        expect(result.attackVectorAnalysis.mitreId).toBe('T1566')
    })

    it('should include Kenya context for GOVERNMENT sector', () => {
        const result = generateFallbackThreatAnalysis(baseThreat)
        expect(result.kenyaContext).toContain('eCitizen')
        expect(result.kenyaContext).toContain('CMCA 2018')
    })

    it('should include Kenya context for FINANCIAL sector', () => {
        const result = generateFallbackThreatAnalysis({ ...baseThreat, targetSector: 'FINANCIAL' })
        expect(result.kenyaContext).toContain('M-Pesa')
        expect(result.kenyaContext).toContain('CBK')
    })

    it('should provide CRITICAL-level actions for CRITICAL severity', () => {
        const result = generateFallbackThreatAnalysis(baseThreat)
        expect(result.recommendedActions.length).toBeGreaterThanOrEqual(4)
        expect(result.recommendedActions[0]).toContain('IMMEDIATE')
    })

    it('should provide fewer actions for LOW severity', () => {
        const result = generateFallbackThreatAnalysis({ ...baseThreat, severity: 'LOW' })
        expect(result.recommendedActions.length).toBeLessThanOrEqual(3)
    })

    it('should preserve the input severity level', () => {
        const result = generateFallbackThreatAnalysis(baseThreat)
        expect(result.riskAssessment.level).toBe('CRITICAL')
    })

    it('should set confidence score at 0.65 for fallback', () => {
        const result = generateFallbackThreatAnalysis(baseThreat)
        expect(result.riskAssessment.confidenceScore).toBe(0.65)
    })

    it('should include valid ISO timestamp', () => {
        const result = generateFallbackThreatAnalysis(baseThreat)
        expect(() => new Date(result.timestamp)).not.toThrow()
        expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp)
    })

    it('should handle unknown threat types gracefully', () => {
        const result = generateFallbackThreatAnalysis({ ...baseThreat, type: 'UNKNOWN_TYPE' })
        expect(result.attackVectorAnalysis.mitreId).toBe('T1059') // default fallback
    })

    it('should handle missing targetSector', () => {
        const result = generateFallbackThreatAnalysis({
            name: 'Test',
            type: 'APT',
            severity: 'HIGH',
        })
        expect(result.kenyaContext).toContain('Multi-agency coordination')
    })
})

describe('generateFallbackIncidentAnalysis', () => {
    const baseIncident: IncidentAnalysisInput = {
        title: 'Government System Breach',
        type: 'CYBER_ATTACK',
        severity: 'HIGH',
        location: 'Nairobi CBD',
        region: 'NAIROBI',
        status: 'ACTIVE',
    }

    it('should return correct structure', () => {
        const result = generateFallbackIncidentAnalysis(baseIncident)

        expect(result).toHaveProperty('summary')
        expect(result).toHaveProperty('riskAssessment')
        expect(result).toHaveProperty('attackVectorAnalysis')
        expect(result).toHaveProperty('recommendedActions')
        expect(result).toHaveProperty('kenyaContext')
        expect(result).toHaveProperty('timestamp')
        expect(result.source).toBe('fallback')
    })

    it('should include location in recommended actions', () => {
        const result = generateFallbackIncidentAnalysis(baseIncident)
        expect(result.recommendedActions[0]).toContain('Nairobi CBD')
    })

    it('should include region in Kenya context', () => {
        const result = generateFallbackIncidentAnalysis(baseIncident)
        expect(result.kenyaContext).toContain('NAIROBI')
    })

    it('should handle missing location gracefully', () => {
        const result = generateFallbackIncidentAnalysis({
            title: 'Test Incident',
            type: 'CYBER_ATTACK',
            severity: 'MEDIUM',
        })
        expect(result.recommendedActions[0]).toContain('incident location')
    })

    it('should set confidence at 0.60 for fallback', () => {
        const result = generateFallbackIncidentAnalysis(baseIncident)
        expect(result.riskAssessment.confidenceScore).toBe(0.60)
    })
})

// ===== Live Analysis Tests (with mocked SDK) =====

describe('analyzeThreat', () => {
    beforeEach(() => {
        vi.stubEnv('GEMINI_API_KEY', '')
    })

    it('should return fallback when no API key is set', async () => {
        const result = await analyzeThreat({
            name: 'Test Threat',
            type: 'MALWARE',
            severity: 'HIGH',
        })

        expect(result.source).toBe('fallback')
        expect(result.attackVectorAnalysis.mitreId).toBe('T1204')
    })

    it('should return valid analysis shape even in fallback', async () => {
        const result = await analyzeThreat({
            name: 'DDoS Attack',
            type: 'DDOS',
            severity: 'CRITICAL',
            targetSector: 'TELECOM',
        })

        expectValidAnalysisShape(result)
    })
})

describe('analyzeIncident', () => {
    beforeEach(() => {
        vi.stubEnv('GEMINI_API_KEY', '')
    })

    it('should return fallback when no API key is set', async () => {
        const result = await analyzeIncident({
            title: 'Test Incident',
            type: 'TERRORISM',
            severity: 'CRITICAL',
            region: 'GARISSA',
        })

        expect(result.source).toBe('fallback')
    })

    it('should return valid analysis shape even in fallback', async () => {
        const result = await analyzeIncident({
            title: 'Armed Robbery',
            type: 'VIOLENT_CRIME',
            severity: 'HIGH',
            location: 'Eastleigh',
            region: 'NAIROBI',
        })

        expectValidAnalysisShape(result)
    })
})

// ===== Helpers =====

function expectValidAnalysisShape(result: AIAnalysisResult) {
    expect(typeof result.summary).toBe('string')
    expect(result.summary.length).toBeGreaterThan(0)

    expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(result.riskAssessment.level)
    expect(typeof result.riskAssessment.justification).toBe('string')
    expect(result.riskAssessment.confidenceScore).toBeGreaterThanOrEqual(0)
    expect(result.riskAssessment.confidenceScore).toBeLessThanOrEqual(1)

    expect(typeof result.attackVectorAnalysis.likelyTechnique).toBe('string')
    expect(result.attackVectorAnalysis.mitreId).toMatch(/^T\d+$/)
    expect(typeof result.attackVectorAnalysis.description).toBe('string')

    expect(Array.isArray(result.recommendedActions)).toBe(true)
    expect(result.recommendedActions.length).toBeGreaterThan(0)

    expect(typeof result.kenyaContext).toBe('string')
    expect(['gemini', 'fallback']).toContain(result.source)
    expect(() => new Date(result.timestamp)).not.toThrow()
}
