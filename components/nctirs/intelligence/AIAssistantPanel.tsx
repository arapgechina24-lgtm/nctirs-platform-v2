'use client';

import React, { useState } from 'react';
import { DesignSystem } from '@/lib/nctirs/designSystem';
import { Bot, Send } from 'lucide-react';

const AIAssistantPanel: React.FC = () => {
    const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
        { role: 'ai', content: 'NSSPIP AI Core Online. Ready to assist with threat mitigation strategies.' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Live AI inference via Serverless Python API
    const generateResponse = async (prompt: string) => {
        setIsTyping(true);
        let fullResponse = '';

        try {
            const res = await fetch(`/api/ai/analyze/sentiment?text=${encodeURIComponent(prompt)}`, {
                method: 'POST'
            });
            if (res.ok) {
                const data = await res.json();
                fullResponse = `[NSSPIP LIVE NLP ENGINE]\n\nVOLATILITY SCORE: ${data.sentiment} (Score: ${data.score})\nCONTEXT: "${data.text_preview}..."\n\nAI RECOMMENDATION: ${data.sentiment === 'NEGATIVE' ? 'ELEVATED THREAT DETECTED. ADVISE DEPLOYMENT OF COUNTERMEASURES.' : 'MAINTAIN OBSERVATION. NO IMMEDIATE THREAT IDENTIFIED.'}`;
            } else {
                fullResponse = "ERROR: UNABLE TO CONTACT SERVERLESS AI ENGINE.";
            }
        } catch (e) {
            fullResponse = "CRITICAL FAILURE: AI ENDPOINT UNREACHABLE.";
        }

        // Typing effect simulation
        let currentText = '';
        const interval = setInterval(() => {
            if (currentText.length < fullResponse.length) {
                currentText += fullResponse[currentText.length];
                setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg.role === 'ai') {
                        return [...prev.slice(0, -1), { role: 'ai', content: currentText }];
                    } else {
                        return [...prev, { role: 'ai', content: currentText }];
                    }
                });
            } else {
                clearInterval(interval);
                setIsTyping(false);
            }
        }, 15);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        setMessages(prev => [...prev, { role: 'user', content: input }]);
        const currentInput = input;
        setInput('');

        // Small delay before AI starts typing
        setTimeout(() => generateResponse(currentInput), 600);
    };

    return (
        <div className={`flex flex-col h-full border border-[#003b00] bg-black/90 ${DesignSystem.layout.cardShadow} rounded-md overflow-hidden`}>
            <div className="flex items-center justify-between p-3 border-b border-[#003b00] bg-[#001000]">
                <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-purple-400" />
                    <h2 className={`font-bold text-sm ${DesignSystem.layout.terminalText} text-purple-400`}>AI STRATEGIC ADVISOR</h2>
                </div>
                <div className="text-[10px] text-gray-500 font-mono">MODEL: GPT-4o-SOVEREIGN</div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded p-3 text-sm font-mono whitespace-pre-wrap ${msg.role === 'user'
                            ? 'bg-[#003b00/50] border border-[#005500] text-[#00ff41]'
                            : 'bg-black border border-purple-900/50 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.1)]'
                            }`}>
                            {msg.role === 'ai' && <span className="opacity-50 text-[10px] block mb-1"> SYSTEM_RESPONSE //</span>}
                            {msg.content}
                            {msg.role === 'ai' && idx === messages.length - 1 && isTyping && <span className="animate-pulse">_</span>}
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="p-3 border-t border-[#003b00] bg-[#000500] flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask AI for mitigation strategy..."
                    className="flex-1 bg-black border border-[#003b00] rounded px-3 py-2 text-sm text-[#00ff41] focus:outline-none focus:border-[#00ff41] font-mono placeholder-gray-700"
                />
                <button
                    type="submit"
                    disabled={isTyping}
                    className="bg-[#003b00] hover:bg-[#005500] text-[#00ff41] p-2 rounded border border-[#00ff41] transition-colors disabled:opacity-50"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
};

export default AIAssistantPanel;
