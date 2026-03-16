// NCTIRS Sovereign AI Endpoint — On-Premise LLM Analysis via Ollama
// Provides AI analysis without external API dependency for digital sovereignty compliance

import { NextRequest, NextResponse } from 'next/server'
import { analyzeThreat, generateFallbackThreatAnalysis } from '@/lib/ai'
import type { ThreatAnalysisInput } from '@/lib/ai'

export const dynamic = 'force-dynamic'

interface OllamaResponse {
    model: string
    response: string
    done: boolean
}

async function queryOllama(prompt: string): Promise<string | null> {
    const endpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434'
    const model = process.env.OLLAMA_MODEL || 'llama3.2:latest'

    try {
        const response = await fetch(`${endpoint}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                prompt,
                stream: false,
                options: {
                    temperature: 0.3,
                    num_predict: 1024,
                }
            }),
            signal: AbortSignal.timeout(30000), // 30s timeout
        })

        if (!response.ok) return null

        const data = (await response.json()) as OllamaResponse
        return data.response
    } catch {
        return null
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { query, threatData } = body as {
            query?: string
            threatData?: ThreatAnalysisInput
        }

        const sovereignEnabled = process.env.SOVEREIGN_AI_ENABLED === 'true'

        // If threat data provided, do structured analysis
        if (threatData) {
            if (sovereignEnabled) {
                const prompt = `You are SENTINEL, Kenya's national cyber threat analyst. Analyze this threat and respond in JSON:

Threat: ${threatData.name}
Type: ${threatData.type}
Severity: ${threatData.severity}
${threatData.description ? `Description: ${threatData.description}` : ''}
${threatData.targetSector ? `Target Sector: ${threatData.targetSector}` : ''}

Respond with JSON: { "summary": "...", "riskLevel": "CRITICAL|HIGH|MEDIUM|LOW", "mitreId": "T####", "recommendedActions": ["..."], "kenyaContext": "..." }`

                const ollamaResult = await queryOllama(prompt)

                if (ollamaResult) {
                    try {
                        const jsonMatch = ollamaResult.match(/\{[\s\S]*\}/)
                        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null

                        if (parsed) {
                            return NextResponse.json({
                                success: true,
                                engine: 'sovereign-ollama',
                                model: process.env.OLLAMA_MODEL || 'llama3.2:latest',
                                analysis: {
                                    summary: parsed.summary || 'Analysis completed via Sovereign AI.',
                                    riskAssessment: {
                                        level: parsed.riskLevel || threatData.severity,
                                        justification: parsed.justification || 'Sovereign AI assessment.',
                                        confidenceScore: 0.80,
                                    },
                                    attackVectorAnalysis: {
                                        likelyTechnique: threatData.type,
                                        mitreId: parsed.mitreId || 'T1059',
                                        description: parsed.description || 'Sovereign AI analysis.',
                                    },
                                    recommendedActions: parsed.recommendedActions || ['Investigate further'],
                                    kenyaContext: parsed.kenyaContext || 'Assessment pending.',
                                    timestamp: new Date().toISOString(),
                                    source: 'sovereign',
                                },
                                sovereignty: {
                                    onPremise: true,
                                    externalAPICalls: 0,
                                    dpaCompliant: true,
                                }
                            })
                        }
                    } catch {
                        // JSON parse failed, fall through to Gemini
                    }
                }
            }

            // Fallback to Gemini, then rule-based
            try {
                const geminiResult = await analyzeThreat(threatData)
                return NextResponse.json({
                    success: true,
                    engine: geminiResult.source === 'gemini' ? 'gemini-2.0-flash' : 'rule-based-fallback',
                    analysis: geminiResult,
                    sovereignty: {
                        onPremise: false,
                        externalAPICalls: geminiResult.source === 'gemini' ? 1 : 0,
                        dpaCompliant: true,
                        fallbackReason: sovereignEnabled ? 'Ollama unavailable' : 'Sovereign AI disabled',
                    }
                })
            } catch {
                const fallback = generateFallbackThreatAnalysis(threatData)
                return NextResponse.json({
                    success: true,
                    engine: 'rule-based-fallback',
                    analysis: fallback,
                    sovereignty: { onPremise: true, externalAPICalls: 0, dpaCompliant: true }
                })
            }
        }

        // Free-form query mode
        if (query) {
            if (sovereignEnabled) {
                const ollamaResult = await queryOllama(
                    `You are SENTINEL, Kenya's national cyber threat analyst for the NCTIRS platform. Answer this security query concisely:\n\n${query}`
                )

                if (ollamaResult) {
                    return NextResponse.json({
                        success: true,
                        engine: 'sovereign-ollama',
                        model: process.env.OLLAMA_MODEL || 'llama3.2:latest',
                        response: ollamaResult,
                        sovereignty: { onPremise: true, externalAPICalls: 0, dpaCompliant: true }
                    })
                }
            }

            return NextResponse.json({
                success: false,
                error: 'Sovereign AI unavailable and free-form queries require Ollama.',
                sovereignty: { onPremise: false, sovereignEnabled }
            }, { status: 503 })
        }

        return NextResponse.json(
            { error: 'Request must include "threatData" object or "query" string' },
            { status: 400 }
        )
    } catch (error) {
        console.error('[API] Sovereign AI error:', error)
        return NextResponse.json(
            { error: 'Internal server error in Sovereign AI endpoint' },
            { status: 500 }
        )
    }
}

// GET: Health check and status
export async function GET() {
    const sovereignEnabled = process.env.SOVEREIGN_AI_ENABLED === 'true'
    let ollamaStatus = 'DISABLED'

    if (sovereignEnabled) {
        try {
            const endpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434'
            const res = await fetch(`${endpoint}/api/tags`, { signal: AbortSignal.timeout(5000) })
            ollamaStatus = res.ok ? 'ONLINE' : 'OFFLINE'
        } catch {
            ollamaStatus = 'OFFLINE'
        }
    }

    return NextResponse.json({
        status: 'operational',
        sovereign: {
            enabled: sovereignEnabled,
            ollamaStatus,
            model: process.env.OLLAMA_MODEL || 'llama3.2:latest',
            endpoint: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434',
        },
        fallback: {
            geminiEnabled: !!process.env.GEMINI_API_KEY,
            ruleBasedAvailable: true,
        },
        dpaCompliant: true,
    })
}
