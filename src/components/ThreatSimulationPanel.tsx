'use client';

import { useState } from 'react';

interface ThreatScenario {
  id: string;
  name: string;
  description: string;
  type: string;
  target: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  indicators: {
    source_ip?: string;
    domain?: string;
    payload?: string;
  };
}

const SCENARIOS: ThreatScenario[] = [
  {
    id: 'apt-ecitizen',
    name: 'APT Attack on eCitizen',
    description: 'Simulates a state-sponsored APT campaign targeting the eCitizen portal with SQL injection and data exfiltration.',
    type: 'APT',
    target: 'eCitizen Portal',
    severity: 'CRITICAL',
    indicators: {
      source_ip: '185.234.72.100',
      domain: 'ecitizen-verify.ke',
      payload: "SELECT * FROM citizens WHERE id=1 UNION SELECT password FROM admin--"
    }
  },
  {
    id: 'ransomware-kra',
    name: 'Ransomware Attack on KRA',
    description: 'Simulates a ransomware deployment targeting KRA iTax systems with file encryption.',
    type: 'Ransomware',
    target: 'KRA iTax',
    severity: 'CRITICAL',
    indicators: {
      source_ip: '45.33.32.156',
      domain: 'payment-kra.com',
      payload: "powershell.exe -encodedCommand [ENCRYPTED_PAYLOAD] -File *.encrypted"
    }
  },
  {
    id: 'ddos-mpesa',
    name: 'DDoS on M-Pesa',
    description: 'Simulates a large-scale DDoS attack on M-Pesa API endpoints.',
    type: 'DDoS',
    target: 'M-Pesa API',
    severity: 'HIGH',
    indicators: {
      source_ip: '103.224.182.0/24',
      payload: "SYN flood detected - 500,000 requests/second from botnet"
    }
  },
  {
    id: 'phishing-gov',
    name: 'Government Phishing Campaign',
    description: 'Simulates a spearphishing campaign targeting government officials.',
    type: 'Phishing',
    target: 'Government Email',
    severity: 'HIGH',
    indicators: {
      domain: 'gov-ke-secure.com',
      payload: "Subject: URGENT: Password Reset Required - President's Office"
    }
  },
  {
    id: 'cable-intrusion',
    name: 'SEACOM Cable Intrusion',
    description: 'Simulates an intrusion attempt on SEACOM submarine cable infrastructure.',
    type: 'Infrastructure Attack',
    target: 'SEACOM Cable',
    severity: 'CRITICAL',
    indicators: {
      source_ip: '212.58.244.71',
      domain: 'seacom-admin.net',
      payload: "Unauthorized SSH connection attempt with valid credentials"
    }
  }
];

interface AnalysisResult {
  threat_id: string;
  classification: {
    type: string;
    severity: string;
    confidence: number;
  };
  mitre_mapping: Array<{
    technique_id: string;
    technique_name: string;
    tactic: string;
  }>;
  threat_actor: {
    suspected_group: string;
    confidence: number;
    motivation: string;
  };
  recommended_actions: string[];
  kenya_context: {
    targeted_asset: string;
    sector_impact: string;
    regulatory_implications: string[];
  };
  ai_analysis: {
    summary: string;
    key_findings: string[];
  };
}

export default function ThreatSimulationPanel() {
  const [selectedScenario, setSelectedScenario] = useState<ThreatScenario | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async (scenario: ThreatScenario) => {
    setSelectedScenario(scenario);
    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          indicators: scenario.indicators,
          context: `Simulated ${scenario.type} attack on ${scenario.target}`
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setResult(data.analysis);
    } catch (err) {
      setError('Failed to analyze threat. Please try again.');
      console.error('Simulation error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-black border border-purple-900/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-purple-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          Threat Simulation Lab
        </h3>
        <span className="text-[9px] text-purple-600 bg-purple-950/50 px-2 py-1 rounded">
          AI-Powered Analysis
        </span>
      </div>

      {/* Scenario Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
        {SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => runSimulation(scenario)}
            disabled={isAnalyzing}
            className={`text-left p-3 border transition-all ${
              selectedScenario?.id === scenario.id
                ? 'border-purple-500 bg-purple-950/30'
                : 'border-purple-900/30 hover:border-purple-700/50 hover:bg-purple-950/20'
            } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                scenario.severity === 'CRITICAL' ? 'bg-red-900/50 text-red-400' :
                scenario.severity === 'HIGH' ? 'bg-orange-900/50 text-orange-400' :
                'bg-yellow-900/50 text-yellow-400'
              }`}>
                {scenario.severity}
              </span>
              <span className="text-[9px] text-purple-600">{scenario.type}</span>
            </div>
            <div className="text-xs font-bold text-purple-300 mb-1">{scenario.name}</div>
            <div className="text-[10px] text-gray-500">{scenario.target}</div>
          </button>
        ))}
      </div>

      {/* Analysis Loading */}
      {isAnalyzing && (
        <div className="border border-purple-900/50 p-6 text-center">
          <div className="inline-flex items-center gap-3 text-purple-400">
            <div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full" />
            <span className="text-sm">Analyzing threat with ATAE AI Engine...</span>
          </div>
          <div className="mt-2 text-[10px] text-purple-600">
            Running MITRE ATT&CK mapping • Identifying threat actor • Generating recommendations
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="border border-red-900/50 bg-red-950/20 p-4 text-center">
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      {/* Analysis Results */}
      {result && !isAnalyzing && (
        <div className="border border-green-900/50 bg-green-950/10 p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-green-900/30">
            <div>
              <span className="text-green-400 font-bold text-sm">Analysis Complete</span>
              <span className="text-green-600 text-xs ml-2">{result.threat_id}</span>
            </div>
            <span className={`px-2 py-1 text-xs font-bold rounded ${
              result.classification.severity === 'CRITICAL' ? 'bg-red-900/50 text-red-400' :
              result.classification.severity === 'HIGH' ? 'bg-orange-900/50 text-orange-400' :
              'bg-yellow-900/50 text-yellow-400'
            }`}>
              {result.classification.severity} • {result.classification.confidence}% Confidence
            </span>
          </div>

          {/* AI Summary */}
          <div className="bg-black/50 p-3 border border-cyan-900/30">
            <div className="text-[9px] text-cyan-600 uppercase tracking-wider mb-1">AI Analysis Summary</div>
            <p className="text-xs text-cyan-300">{result.ai_analysis.summary}</p>
          </div>

          {/* Key Findings */}
          {result.ai_analysis.key_findings.length > 0 && (
            <div>
              <div className="text-[9px] text-green-600 uppercase tracking-wider mb-2">Key Findings</div>
              <ul className="space-y-1">
                {result.ai_analysis.key_findings.map((finding, i) => (
                  <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">▸</span>
                    {finding}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* MITRE ATT&CK */}
          <div>
            <div className="text-[9px] text-orange-600 uppercase tracking-wider mb-2">MITRE ATT&CK Mapping</div>
            <div className="flex flex-wrap gap-2">
              {result.mitre_mapping.map((technique, i) => (
                <div key={i} className="bg-orange-950/30 border border-orange-900/50 px-2 py-1">
                  <div className="text-[10px] font-mono text-orange-400">{technique.technique_id}</div>
                  <div className="text-[9px] text-orange-300">{technique.technique_name}</div>
                  <div className="text-[8px] text-orange-600">{technique.tactic}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Threat Actor */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-950/20 border border-red-900/30 p-2">
              <div className="text-[9px] text-red-600 uppercase tracking-wider">Suspected Actor</div>
              <div className="text-xs text-red-400 font-bold">{result.threat_actor.suspected_group}</div>
              <div className="text-[10px] text-gray-500">{result.threat_actor.motivation}</div>
              <div className="text-[9px] text-red-600 mt-1">{result.threat_actor.confidence}% confidence</div>
            </div>
            <div className="bg-blue-950/20 border border-blue-900/30 p-2">
              <div className="text-[9px] text-blue-600 uppercase tracking-wider">Kenya Context</div>
              <div className="text-xs text-blue-400 font-bold">{result.kenya_context.targeted_asset}</div>
              <div className="text-[10px] text-gray-500">{result.kenya_context.sector_impact}</div>
            </div>
          </div>

          {/* Recommended Actions */}
          <div>
            <div className="text-[9px] text-yellow-600 uppercase tracking-wider mb-2">Recommended Actions</div>
            <div className="grid grid-cols-1 gap-1">
              {result.recommended_actions.slice(0, 5).map((action, i) => (
                <div key={i} className={`text-[10px] px-2 py-1 flex items-start gap-2 ${
                  i === 0 ? 'bg-red-950/30 text-red-300 border border-red-900/30' : 'text-gray-400'
                }`}>
                  <span className={i === 0 ? 'text-red-500' : 'text-gray-600'}>{i + 1}.</span>
                  {action}
                </div>
              ))}
            </div>
          </div>

          {/* Regulatory */}
          <div className="pt-2 border-t border-green-900/30">
            <div className="text-[9px] text-green-600 uppercase tracking-wider mb-1">Regulatory Implications</div>
            <div className="flex flex-wrap gap-1">
              {result.kenya_context.regulatory_implications.map((reg, i) => (
                <span key={i} className="text-[9px] bg-green-950/30 text-green-500 px-2 py-0.5 border border-green-900/30">
                  {reg}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!selectedScenario && !isAnalyzing && (
        <div className="text-center text-gray-600 py-4">
          <p className="text-xs">Select a threat scenario above to run AI-powered analysis</p>
          <p className="text-[10px] mt-1">Each simulation demonstrates NCTIRS threat detection capabilities</p>
        </div>
      )}
    </div>
  );
}
