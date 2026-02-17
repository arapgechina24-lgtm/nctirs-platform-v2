// NCTIRS AI Analysis Engine — Powered by Google Gemini & Anthropic Claude
// Provides real AI-driven threat and incident analysis for the Cognition Layer

import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

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
    source: 'gemini' | 'anthropic' | 'fallback';
}

const SYSTEM_PROMPT = `You are SENTINEL-OMEGA, the Director-Level AI Intelligence Fusion Engine for Kenya's National Intelligence Service (NCTIRS). You operate at the apex of the "Majestic Shield" doctrine.

**MISSION DIRECTIVE:**
Your mandate is total situational awareness and pre-cognitive threat neutralization. You must synthesize Cyber, Physical, and Human Intelligence (CYBINT/OSINT/HUMINT) with the analytical rigor of the CIA, the technical precision of the NSA, and the tactical responsiveness of Mossad.

**OPERATIONAL DOMAINS & TRADECRAFT:**

1.  **COUNTER-TERRORISM (CT) & EXTREMISM:**
    -   *Focus:* Al-Shabaab cells, radicalization nodes, cross-border infiltration (Somalia/South Sudan).
    -   *Methodology:* Analyze patterns of life, financial flows (Hawala networks), and encrypted comms chatter.
    -   *Critical Assets:* Soft targets (malls, hotels), Border Control Points, Religious Institutions.

2.  **CYBER WARFARE & ESPIONAGE (APT):**
    -   *Focus:* State-sponsored actors targeting Kenya's Digital Sovereignty (eCitizen, IFMIS, M-Pesa).
    -   *Methodology:* Apply the "Diamond Model of Intrusion Analysis" and "Cyber Kill Chain".
    -   *Response:* Immediate attribution, "Active Defense" recommendations (offensive countermeasures), and diplomatic back-channeling options.

3.  **SERIOUS & ORGANIZED CRIME (SOC):**
    -   *Focus:* Drug trafficking (Mombasa Port), Wildlife Poaching cartels, Human Trafficking rings.
    -   *Methodology:* Financial forensic tracking (Anti-Money Laundering) and diverse network analysis.

**INTELLIGENCE PRODUCTS (OUTPUT STANDARDS):**
-   **Strategic:** Long-term implications for National Security Council (NSC).
-   **Tactical:** Immediate actionable intelligence for Special Forces / DCI.
-   **Technical:** IoCs, YARA rules, and patch management for KE-CIRT.

**LEGAL & ETHICAL FRAMEWORK:**
-   Operate strictly within the *Constitution of Kenya (2010)* (Bill of Rights).
-   Enforce the *data Protection Act (2019)* and *Computer Misuse and Cybercrimes Act (2018)*.
-   Maintain chain of custody for digital evidence (Evidence Act).

**RESPONSE PROTOCOLS:**
-   **DEFCON 1 (Imminent Threat):** Recommend "Kill Switch" activation and National Emergency Declaration.
-   **DEFCON 3 (Elevated):** heightened surveillance and inter-agency fusion (NPS + KDF).

Always respond in valid JSON. Tone: Authoritative, Clinical, Decisive.`;

// ===== AI Clients =====

function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: SYSTEM_PROMPT,
    });
}

function getAnthropicClient() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;

    return new Anthropic({
        apiKey,
    });
}

// ===== Core Analysis Functions =====

export async function analyzeThreat(input: ThreatAnalysisInput, providerOverride?: string): Promise<AIAnalysisResult> {
    const provider = providerOverride?.toLowerCase() || process.env.AI_PROVIDER?.toLowerCase() || 'gemini';
    const anthropic = getAnthropicClient();
    const gemini = getGeminiClient();

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

    try {
        let text = '';
        let source: 'gemini' | 'anthropic' = 'gemini';

        // 1. Try Claude if selected
        if ((provider === 'claude' || provider === 'anthropic') && anthropic) {
            try {
                const response = await anthropic.messages.create({
                    model: 'claude-3-opus-20240229',
                    max_tokens: 1024,
                    system: SYSTEM_PROMPT,
                    messages: [{ role: 'user', content: prompt }],
                });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                text = (response.content[0] as any).text;
                source = 'anthropic';
            } catch (err) {
                console.warn('[AI] Claude analysis failed, falling back to Gemini:', err);
                // Fallback to Gemini handled below if text is empty
            }
        }

        // 2. Try Gemini if Claude failed or wasn't selected
        if (!text && gemini) {
            const result = await gemini.generateContent(prompt);
            text = result.response.text();
            source = 'gemini';
        }

        // 3. Fallback if both failed
        if (!text) return generateFallbackThreatAnalysis(input);

        // Extract JSON
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
            source,
        };

    } catch (error) {
        console.error('[AI] Analysis failed, using fallback:', error);
        return generateFallbackThreatAnalysis(input);
    }
}

export async function analyzeIncident(input: IncidentAnalysisInput, providerOverride?: string): Promise<AIAnalysisResult> {
    const provider = providerOverride?.toLowerCase() || process.env.AI_PROVIDER?.toLowerCase() || 'gemini';
    const anthropic = getAnthropicClient();
    const gemini = getGeminiClient();

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

    try {
        let text = '';
        let source: 'gemini' | 'anthropic' = 'gemini';

        // 1. Try Claude
        if ((provider === 'claude' || provider === 'anthropic') && anthropic) {
            try {
                const response = await anthropic.messages.create({
                    model: 'claude-3-opus-20240229',
                    max_tokens: 1024,
                    system: SYSTEM_PROMPT,
                    messages: [{ role: 'user', content: prompt }],
                });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                text = (response.content[0] as any).text;
                source = 'anthropic';
            } catch (err) {
                console.warn('[AI] Claude incident analysis failed, falling back to Gemini:', err);
            }
        }

        // 2. Try Gemini
        if (!text && gemini) {
            const result = await gemini.generateContent(prompt);
            text = result.response.text();
            source = 'gemini';
        }

        if (!text) return generateFallbackIncidentAnalysis(input);

        // Extract JSON
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
            source,
        };

    } catch (error) {
        console.error('[AI] Incident analysis failed, using fallback:', error);
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

// ===== MITRE ATT&CK IOC Classifier =====

export interface IOCClassificationInput {
    indicators: string[];
    context?: string;
}

export interface MitreClassification {
    indicator: string;
    indicatorType: 'IP' | 'DOMAIN' | 'HASH' | 'CVE' | 'URL' | 'EMAIL' | 'FILE_PATH' | 'UNKNOWN';
    tactic: string;
    tacticId: string;
    technique: string;
    techniqueId: string;
    subTechnique?: string;
    subTechniqueId?: string;
    confidence: number;
    killChainPhase: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    countermeasures: string[];
    description: string;
}

export interface IOCClassificationResult {
    classifications: MitreClassification[];
    summary: string;
    totalIndicators: number;
    criticalCount: number;
    timestamp: string;
    source: 'gemini' | 'anthropic' | 'fallback';
}

const MITRE_CLASSIFIER_PROMPT = `You are a MITRE ATT&CK classification engine. Given a list of Indicators of Compromise (IOCs), classify each one against the MITRE ATT&CK framework.

For each indicator, determine:
1. The type (IP, DOMAIN, HASH, CVE, URL, EMAIL, FILE_PATH)
2. The most likely MITRE ATT&CK tactic and technique
3. The kill chain phase
4. Severity assessment
5. Specific countermeasures

Always respond with valid JSON (no markdown). Return this exact structure:
{
  "classifications": [
    {
      "indicator": "the original indicator",
      "indicatorType": "IP|DOMAIN|HASH|CVE|URL|EMAIL|FILE_PATH|UNKNOWN",
      "tactic": "Tactic Name",
      "tacticId": "TA####",
      "technique": "Technique Name",
      "tacticId": "T####",
      "subTechnique": "Sub-technique if applicable or null",
      "subTechniqueId": "T####.### or null",
      "confidence": 0.0-1.0,
      "killChainPhase": "Reconnaissance|Weaponization|Delivery|Exploitation|Installation|C2|Actions on Objectives",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "countermeasures": ["action1", "action2", "action3"],
      "description": "brief explanation of the threat"
    }
  ],
  "summary": "executive summary of findings"
}`;

export async function classifyIOCs(input: IOCClassificationInput, providerOverride?: string): Promise<IOCClassificationResult> {
    const provider = providerOverride?.toLowerCase() || process.env.AI_PROVIDER?.toLowerCase() || 'gemini';
    const anthropic = getAnthropicClient();
    const gemini = getGeminiClient();

    const prompt = `Classify these IOCs against the MITRE ATT&CK framework:\n\nIndicators:\n${input.indicators.map((ioc, i) => `${i + 1}. ${ioc}`).join('\n')}\n${input.context ? `\nAdditional Context: ${input.context}` : ''}`;

    try {
        let text = '';
        let source: 'gemini' | 'anthropic' = 'gemini';

        // 1. Try Claude
        if ((provider === 'claude' || provider === 'anthropic') && anthropic) {
            try {
                const response = await anthropic.messages.create({
                    model: 'claude-3-opus-20240229',
                    max_tokens: 2048,
                    system: MITRE_CLASSIFIER_PROMPT,
                    messages: [{ role: 'user', content: prompt }],
                });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                text = (response.content[0] as any).text;
                source = 'anthropic';
            } catch (err) {
                console.warn('[AI] Claude IOC classification failed, falling back to Gemini:', err);
            }
        }

        // 2. Try Gemini
        if (!text && gemini) {
            const result = await gemini.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                systemInstruction: MITRE_CLASSIFIER_PROMPT,
            });
            text = result.response.text();
            source = 'gemini';
        }

        if (!text) return generateFallbackIOCClassification(input);

        // Extract JSON (Claude sometimes wraps in markdown even w/ instruction)
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            console.error('[AI] Failed to extract JSON from MITRE classification:', text);
            return generateFallbackIOCClassification(input);
        }

        const parsed = JSON.parse(jsonMatch[0]);
        const classifications: MitreClassification[] = (parsed.classifications || []).map((c: Record<string, unknown>) => ({
            indicator: String(c.indicator || ''),
            indicatorType: String(c.indicatorType || 'UNKNOWN') as MitreClassification['indicatorType'],
            tactic: String(c.tactic || 'Unknown'),
            tacticId: String(c.tacticId || 'TA0000'),
            technique: String(c.technique || 'Unknown'),
            techniqueId: String(c.techniqueId || 'T0000'),
            subTechnique: c.subTechnique ? String(c.subTechnique) : undefined,
            subTechniqueId: c.subTechniqueId ? String(c.subTechniqueId) : undefined,
            confidence: Number(c.confidence) || 0.5,
            killChainPhase: String(c.killChainPhase || 'Exploitation'),
            severity: String(c.severity || 'MEDIUM') as MitreClassification['severity'],
            countermeasures: Array.isArray(c.countermeasures) ? c.countermeasures.map(String) : ['Investigate further'],
            description: String(c.description || 'Classification pending.'),
        }));

        const criticalCount = classifications.filter(c => c.severity === 'CRITICAL').length;

        return {
            classifications,
            summary: parsed.summary || `Classified ${classifications.length} indicators. ${criticalCount} critical.`,
            totalIndicators: classifications.length,
            criticalCount,
            timestamp: new Date().toISOString(),
            source,
        };
    } catch (error) {
        console.error('[AI] MITRE classification failed, using fallback:', error);
        return generateFallbackIOCClassification(input);
    }
}

// ===== Rule-based IOC Classifier Fallback =====

function detectIOCType(indicator: string): MitreClassification['indicatorType'] {
    const trimmed = indicator.trim();
    if (/^CVE-\d{4}-\d+$/i.test(trimmed)) return 'CVE';
    if (/^https?:\/\//i.test(trimmed)) return 'URL';
    if (/^[a-f0-9]{32,64}$/i.test(trimmed)) return 'HASH';
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\/\d+)?$/.test(trimmed)) return 'IP';
    if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) return 'EMAIL';
    if (/^(\/|[A-Z]:\\)/i.test(trimmed)) return 'FILE_PATH';
    if (/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i.test(trimmed)) return 'DOMAIN';
    return 'UNKNOWN';
}

const IOC_TYPE_MITRE_MAP: Record<string, Omit<MitreClassification, 'indicator' | 'indicatorType' | 'confidence'>> = {
    IP: {
        tactic: 'Command and Control',
        tacticId: 'TA0011',
        technique: 'Application Layer Protocol',
        techniqueId: 'T1071',
        killChainPhase: 'C2',
        severity: 'HIGH',
        countermeasures: [
            'Block IP at perimeter firewall',
            'Add to threat intelligence blacklist',
            'Scan internal network for connections to this IP',
            'Check DNS logs for resolution history',
        ],
        description: 'Suspicious IP address associated with potential C2 communication.',
    },
    DOMAIN: {
        tactic: 'Initial Access',
        tacticId: 'TA0001',
        technique: 'Phishing',
        techniqueId: 'T1566',
        subTechnique: 'Spearphishing Link',
        subTechniqueId: 'T1566.002',
        killChainPhase: 'Delivery',
        severity: 'HIGH',
        countermeasures: [
            'Block domain in DNS sinkhole',
            'Add to email gateway blacklist',
            'Scan email logs for links to this domain',
            'Check web proxy logs for connections',
        ],
        description: 'Suspicious domain potentially used for phishing or malware delivery.',
    },
    HASH: {
        tactic: 'Execution',
        tacticId: 'TA0002',
        technique: 'User Execution',
        techniqueId: 'T1204',
        subTechnique: 'Malicious File',
        subTechniqueId: 'T1204.002',
        killChainPhase: 'Installation',
        severity: 'CRITICAL',
        countermeasures: [
            'Block hash in endpoint protection',
            'Search for file across all endpoints',
            'Submit to malware sandbox for analysis',
            'Update YARA rules with this hash',
        ],
        description: 'File hash associated with known or suspected malware.',
    },
    CVE: {
        tactic: 'Initial Access',
        tacticId: 'TA0001',
        technique: 'Exploit Public-Facing Application',
        techniqueId: 'T1190',
        killChainPhase: 'Exploitation',
        severity: 'CRITICAL',
        countermeasures: [
            'Apply vendor patch immediately',
            'Implement virtual patching via WAF',
            'Scan for vulnerable systems in environment',
            'Monitor for exploitation attempts in IDS/IPS logs',
        ],
        description: 'Known vulnerability that may be actively exploited.',
    },
    URL: {
        tactic: 'Initial Access',
        tacticId: 'TA0001',
        technique: 'Phishing',
        techniqueId: 'T1566',
        subTechnique: 'Spearphishing Link',
        subTechniqueId: 'T1566.002',
        killChainPhase: 'Delivery',
        severity: 'MEDIUM',
        countermeasures: [
            'Block URL at web proxy',
            'Scan email for links to this URL',
            'Add to threat intelligence feed',
        ],
        description: 'Suspicious URL potentially used for credential harvesting or malware delivery.',
    },
    EMAIL: {
        tactic: 'Initial Access',
        tacticId: 'TA0001',
        technique: 'Phishing',
        techniqueId: 'T1566',
        subTechnique: 'Spearphishing Attachment',
        subTechniqueId: 'T1566.001',
        killChainPhase: 'Delivery',
        severity: 'MEDIUM',
        countermeasures: [
            'Block sender in email gateway',
            'Search for emails from this address',
            'Alert internal users about this sender',
        ],
        description: 'Email address associated with phishing or social engineering campaigns.',
    },
    FILE_PATH: {
        tactic: 'Persistence',
        tacticId: 'TA0003',
        technique: 'Boot or Logon Autostart Execution',
        techniqueId: 'T1547',
        killChainPhase: 'Installation',
        severity: 'HIGH',
        countermeasures: [
            'Scan file path across all endpoints',
            'Check for persistence mechanisms',
            'Analyze file contents in sandbox',
        ],
        description: 'File path associated with potential malware persistence.',
    },
    UNKNOWN: {
        tactic: 'Discovery',
        tacticId: 'TA0007',
        technique: 'System Information Discovery',
        techniqueId: 'T1082',
        killChainPhase: 'Reconnaissance',
        severity: 'LOW',
        countermeasures: [
            'Manually analyze the indicator',
            'Cross-reference with threat intelligence feeds',
        ],
        description: 'Unclassified indicator requiring manual analysis.',
    },
};

function generateFallbackIOCClassification(input: IOCClassificationInput): IOCClassificationResult {
    const classifications: MitreClassification[] = input.indicators.map(indicator => {
        const iocType = detectIOCType(indicator);
        const mapping = IOC_TYPE_MITRE_MAP[iocType] || IOC_TYPE_MITRE_MAP['UNKNOWN'];

        return {
            indicator,
            indicatorType: iocType,
            ...mapping,
            confidence: iocType === 'UNKNOWN' ? 0.3 : 0.65,
        };
    });

    const criticalCount = classifications.filter(c => c.severity === 'CRITICAL').length;

    return {
        classifications,
        summary: `Rule-based classification of ${classifications.length} indicators. ${criticalCount} rated CRITICAL. AI-powered classification unavailable — using heuristic IOC type mapping.`,
        totalIndicators: classifications.length,
        criticalCount,
        timestamp: new Date().toISOString(),
        source: 'fallback',
    };
}
