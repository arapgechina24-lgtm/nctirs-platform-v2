// NCTIRS AI Analysis Engine — Powered by Google Gemini
// Provides real AI-driven threat and incident analysis for the Cognition Layer

import { GoogleGenerativeAI } from '@google/generative-ai';

// ===== Types =====

export interface ThreatAnalysisInput {
    name: string;
    type: string;
    severity: string;
    description?: string;
    indicators?: string[];
    targetSector?: string;
    sourceIP?: string;
    targetSystem?: string;
}

export interface IncidentAnalysisInput {
    title: string;
    type: string;
    severity: string;
    description?: string;
    location?: string;
    region?: string;
    status?: string;
}

export interface AIAnalysisResult {
    summary: string;
    riskAssessment: {
        level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
        justification: string;
        confidenceScore: number;
    };
    attackVectorAnalysis: {
        likelyTechnique: string;
        mitreId: string;
        description: string;
    };
    recommendedActions: string[];
    kenyaContext: string;
    timestamp: string;
    source: 'gemini' | 'fallback';
}

// ===== System Prompt =====

const SYSTEM_PROMPT = `You are SENTINEL, the AI Threat Analyst for Kenya's National Cyber Threat Intelligence and Response System (NCTIRS). You operate within the Cognition Layer of a three-tier national security architecture (Perception → Cognition → Integrity).

Your role:
- Analyze cyber and physical threats targeting Kenyan critical infrastructure
- Provide assessments aligned with the Kenya Computer Misuse and Cybercrimes Act 2018 (CMCA)
- Reference MITRE ATT&CK techniques when applicable
- Consider Kenya-specific infrastructure: eCitizen, M-Pesa, KPLC grid, SGR, JKIA
- Recommend actions compliant with the Data Protection Act 2019
- Assess threats in context of regional dynamics (East African Community, Horn of Africa)

Always respond in valid JSON matching the requested schema. Be concise but thorough.`;

// ===== Gemini Client =====

function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: SYSTEM_PROMPT,
    });
}

// ===== Core Analysis Functions =====

export async function analyzeThreat(input: ThreatAnalysisInput): Promise<AIAnalysisResult> {
    const model = getGeminiClient();

    if (!model) {
        return generateFallbackThreatAnalysis(input);
    }

    try {
        const prompt = `Analyze this cyber threat and return a JSON object (no markdown, just raw JSON):

Threat: ${input.name}
Type: ${input.type}
Severity: ${input.severity}
${input.description ? `Description: ${input.description}` : ''}
${input.targetSector ? `Target Sector: ${input.targetSector}` : ''}
${input.sourceIP ? `Source IP: ${input.sourceIP}` : ''}
${input.targetSystem ? `Target System: ${input.targetSystem}` : ''}
${input.indicators?.length ? `Indicators: ${input.indicators.join(', ')}` : ''}

Return exactly this JSON structure:
{
  "summary": "2-3 sentence executive summary",
  "riskAssessment": {
    "level": "CRITICAL|HIGH|MEDIUM|LOW",
    "justification": "why this risk level",
    "confidenceScore": 0.0-1.0
  },
  "attackVectorAnalysis": {
    "likelyTechnique": "technique name",
    "mitreId": "T####",
    "description": "how the attack works"
  },
  "recommendedActions": ["action1", "action2", "action3", "action4"],
  "kenyaContext": "specific relevance to Kenyan infrastructure"
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Extract JSON from the response (handle potential markdown wrapping)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('[AI] Failed to extract JSON from response:', text);
            return generateFallbackThreatAnalysis(input);
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            summary: parsed.summary || 'Analysis completed.',
            riskAssessment: {
                level: parsed.riskAssessment?.level || input.severity as AIAnalysisResult['riskAssessment']['level'],
                justification: parsed.riskAssessment?.justification || 'Based on threat characteristics.',
                confidenceScore: parsed.riskAssessment?.confidenceScore || 0.75,
            },
            attackVectorAnalysis: {
                likelyTechnique: parsed.attackVectorAnalysis?.likelyTechnique || input.type,
                mitreId: parsed.attackVectorAnalysis?.mitreId || 'T1059',
                description: parsed.attackVectorAnalysis?.description || 'Standard attack vector.',
            },
            recommendedActions: parsed.recommendedActions || ['Investigate further', 'Monitor network traffic'],
            kenyaContext: parsed.kenyaContext || 'Assessment pending for local infrastructure impact.',
            timestamp: new Date().toISOString(),
            source: 'gemini',
        };
    } catch (error) {
        console.error('[AI] Gemini analysis failed, using fallback:', error);
        return generateFallbackThreatAnalysis(input);
    }
}

export async function analyzeIncident(input: IncidentAnalysisInput): Promise<AIAnalysisResult> {
    const model = getGeminiClient();

    if (!model) {
        return generateFallbackIncidentAnalysis(input);
    }

    try {
        const prompt = `Analyze this security incident and return a JSON object (no markdown, just raw JSON):

Incident: ${input.title}
Type: ${input.type}
Severity: ${input.severity}
Status: ${input.status || 'ACTIVE'}
${input.description ? `Description: ${input.description}` : ''}
${input.location ? `Location: ${input.location}` : ''}
${input.region ? `Region: ${input.region}` : ''}

Return exactly this JSON structure:
{
  "summary": "2-3 sentence intelligence briefing",
  "riskAssessment": {
    "level": "CRITICAL|HIGH|MEDIUM|LOW",
    "justification": "why this risk level",
    "confidenceScore": 0.0-1.0
  },
  "attackVectorAnalysis": {
    "likelyTechnique": "technique name",
    "mitreId": "T####",
    "description": "how the incident likely unfolded"
  },
  "recommendedActions": ["action1", "action2", "action3", "action4"],
  "kenyaContext": "specific relevance to Kenyan national security"
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('[AI] Failed to extract JSON from incident response:', text);
            return generateFallbackIncidentAnalysis(input);
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            summary: parsed.summary || 'Incident analysis completed.',
            riskAssessment: {
                level: parsed.riskAssessment?.level || input.severity as AIAnalysisResult['riskAssessment']['level'],
                justification: parsed.riskAssessment?.justification || 'Based on incident characteristics.',
                confidenceScore: parsed.riskAssessment?.confidenceScore || 0.70,
            },
            attackVectorAnalysis: {
                likelyTechnique: parsed.attackVectorAnalysis?.likelyTechnique || input.type,
                mitreId: parsed.attackVectorAnalysis?.mitreId || 'T1190',
                description: parsed.attackVectorAnalysis?.description || 'Standard incident pattern.',
            },
            recommendedActions: parsed.recommendedActions || ['Investigate further', 'Coordinate with local agencies'],
            kenyaContext: parsed.kenyaContext || 'Assessment pending for local context.',
            timestamp: new Date().toISOString(),
            source: 'gemini',
        };
    } catch (error) {
        console.error('[AI] Gemini incident analysis failed, using fallback:', error);
        return generateFallbackIncidentAnalysis(input);
    }
}

// ===== Fallback Analysis (Rule-Based) =====

const MITRE_MAP: Record<string, { technique: string; id: string; description: string }> = {
    APT: { technique: 'Advanced Persistent Threat', id: 'T1071', description: 'Sustained access via application layer protocol exploitation.' },
    ZERO_DAY: { technique: 'Exploitation of Zero-Day', id: 'T1190', description: 'Exploitation of unknown vulnerability in public-facing application.' },
    DDOS: { technique: 'Network Denial of Service', id: 'T1498', description: 'Volumetric or application-layer denial of service attack.' },
    RANSOMWARE: { technique: 'Data Encrypted for Impact', id: 'T1486', description: 'Data encryption to extort victims for decryption keys.' },
    PHISHING: { technique: 'Spearphishing Attachment', id: 'T1566', description: 'Targeted email with malicious attachment or link.' },
    DATA_BREACH: { technique: 'Data Exfiltration', id: 'T1041', description: 'Unauthorized transfer of data over C2 channel.' },
    MALWARE: { technique: 'User Execution of Malware', id: 'T1204', description: 'Malicious code execution via user interaction.' },
    SQL_INJECTION: { technique: 'Exploitation via SQL Injection', id: 'T1190', description: 'SQL injection to manipulate or extract database content.' },
    CYBER_ATTACK: { technique: 'Multi-Vector Cyber Attack', id: 'T1059', description: 'Combined exploitation techniques targeting system integrity.' },
    TERRORISM: { technique: 'Physical Threat Correlated', id: 'T1200', description: 'Hardware-based or physically proximate threat vector.' },
    ORGANIZED_CRIME: { technique: 'Organized Criminal Activity', id: 'T1078', description: 'Use of valid credentials obtained through criminal networks.' },
    VIOLENT_CRIME: { technique: 'Physical Security Threat', id: 'T1200', description: 'Direct physical threat requiring law enforcement response.' },
    TRAFFICKING: { technique: 'Illicit Supply Chain', id: 'T1195', description: 'Exploitation via compromised supply chain or trafficking routes.' },
};

const KENYA_CONTEXT_MAP: Record<string, string> = {
    GOVERNMENT: 'Potential impact on eCitizen, Huduma Namba, and IFMIS government services. CMCA 2018 Section 11 CII protections apply.',
    FINANCIAL: 'Critical risk to M-Pesa, CBK core banking, and NSE infrastructure. CBK Guidance Note on Cybersecurity applies.',
    INFRASTRUCTURE: 'Risk to KPLC national grid, water treatment SCADA, and Kenya Ports Authority operations.',
    HEALTHCARE: 'Threat to NHIF database and Kenyatta National Hospital EHR systems. Data Protection Act 2019 breach notification required.',
    TELECOM: 'Risk to Safaricom core network and national fiber backbone. CA Kenya reporting obligations triggered.',
    ENERGY: 'Geothermal plant SCADA and oil pipeline monitoring at risk. EPRA emergency protocols may apply.',
    TRANSPORT: 'JKIA control systems, SGR operations, and Kenya Airways affected. KCAA and KRC coordination required.',
};

export function generateFallbackThreatAnalysis(input: ThreatAnalysisInput): AIAnalysisResult {
    const mitre = MITRE_MAP[input.type] || MITRE_MAP['CYBER_ATTACK'];
    const kenyaCtx = input.targetSector
        ? KENYA_CONTEXT_MAP[input.targetSector] || `Threat to Kenyan ${input.targetSector.toLowerCase()} sector infrastructure. Standard NCTIRS response protocols apply.`
        : 'Cross-sector threat assessment pending. Multi-agency coordination recommended under NCTIRS framework.';

    const severityActions: Record<string, string[]> = {
        CRITICAL: [
            'IMMEDIATE: Activate NCTIRS Fusion Center emergency protocols',
            'Isolate affected systems and initiate network segmentation',
            'Deploy forensic team and preserve digital evidence chain',
            'Notify NC4 and activate inter-agency coordination',
            'Brief Cabinet Secretary for Interior and NSAC',
        ],
        HIGH: [
            'Escalate to NCTIRS Tier-2 response team within 30 minutes',
            'Enable enhanced monitoring on affected network segments',
            'Initiate malware containment and remediation procedures',
            'Coordinate with KE-CIRT for threat intelligence sharing',
        ],
        MEDIUM: [
            'Assign to SOC analyst for detailed investigation',
            'Monitor for indicators of compromise (IoCs) on related systems',
            'Update threat detection signatures and firewall rules',
        ],
        LOW: [
            'Log and track for pattern analysis',
            'Update threat intelligence feed with new indicators',
        ],
    };

    return {
        summary: `Rule-based analysis of ${input.name}: ${input.type.replace(/_/g, ' ')} threat classified as ${input.severity}. ${input.description || `Automated detection of ${input.type.toLowerCase().replace(/_/g, ' ')} activity targeting ${input.targetSector?.toLowerCase() || 'national'} infrastructure.`}`,
        riskAssessment: {
            level: input.severity as AIAnalysisResult['riskAssessment']['level'],
            justification: `Classified based on threat type (${input.type}), severity indicators, and target sector risk profile.`,
            confidenceScore: 0.65,
        },
        attackVectorAnalysis: {
            likelyTechnique: mitre.technique,
            mitreId: mitre.id,
            description: mitre.description,
        },
        recommendedActions: severityActions[input.severity] || severityActions['MEDIUM'],
        kenyaContext: kenyaCtx,
        timestamp: new Date().toISOString(),
        source: 'fallback',
    };
}

export function generateFallbackIncidentAnalysis(input: IncidentAnalysisInput): AIAnalysisResult {
    const mitre = MITRE_MAP[input.type] || MITRE_MAP['CYBER_ATTACK'];

    return {
        summary: `Rule-based briefing: ${input.title}. ${input.type.replace(/_/g, ' ')} incident in ${input.region || 'Kenya'} at ${input.severity} severity. Status: ${input.status || 'ACTIVE'}.`,
        riskAssessment: {
            level: input.severity as AIAnalysisResult['riskAssessment']['level'],
            justification: `Based on incident type (${input.type}), location (${input.region || 'undetermined'}), and current status.`,
            confidenceScore: 0.60,
        },
        attackVectorAnalysis: {
            likelyTechnique: mitre.technique,
            mitreId: mitre.id,
            description: mitre.description,
        },
        recommendedActions: [
            `Deploy response team to ${input.location || input.region || 'incident location'}`,
            'Coordinate with county security committee',
            'Activate inter-agency communication channels',
            'Initiate evidence collection and chain-of-custody protocols',
        ],
        kenyaContext: `Incident in ${input.region || 'Kenya'} requires coordination with county security apparatus and National Police Service. CMCA 2018 and Data Protection Act 2019 compliance mandatory.`,
        timestamp: new Date().toISOString(),
        source: 'fallback',
    };
}
