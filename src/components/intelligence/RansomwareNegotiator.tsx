'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Timer, MessageSquare, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { DesignSystem } from '@/lib/designSystem';

interface Message {
    id: string;
    sender: 'user' | 'actor';
    text: string;
    timestamp: Date;
}

const INITIAL_MESSAGES: Message[] = [
    {
        id: '1',
        sender: 'actor',
        text: 'Your network has been compromised. All your sensitive data is encrypted. We have downloaded 4TB of private documents. If you want to see your data again, you must pay.',
        timestamp: new Date(Date.now() - 3600000),
    },
    {
        id: '2',
        sender: 'actor',
        text: 'Price is $5,000,000 USD in XMR. You have 72 hours.',
        timestamp: new Date(Date.now() - 3590000),
    }
];

export function RansomwareNegotiator() {
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg: Message = {
            id: uuidv4(),
            sender: 'user',
            text: inputValue,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        setTimeout(() => {
            const responseText = getBotResponse(inputValue);
            const botMsg: Message = {
                id: uuidv4(),
                sender: 'actor',
                text: responseText,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
            // eslint-disable-next-line react-hooks/purity
        }, 2000 + Math.random() * 3000);
    };

    const getBotResponse = (input: string): string => {
        const lowerInput = input.toLowerCase();

        if (lowerInput.includes('pay') || lowerInput.includes('money') || lowerInput.includes('price')) {
            return "The price is non-negotiable. $5M XMR. Tick tock.";
        }
        if (lowerInput.includes('proof') || lowerInput.includes('sample') || lowerInput.includes('decrypt')) {
            return "Upload 1 file (under 2MB) and we will decrypt it for free as proof. No databases.";
        }
        if (lowerInput.includes('time') || lowerInput.includes('extension')) {
            return "No extensions. If timer hits zero, price doubles. If you call police, we delete keys.";
        }
        if (lowerInput.includes('who') || lowerInput.includes('group')) {
            return "We are business people. We just want value for our penetration testing services.";
        }

        return "Do not waste our time. Payment or data leak. Your choice.";
    };

    return (
        <div className={`h-full flex flex-col ${DesignSystem.layout.cardShadow} bg-black/60 border border-red-900/50`}>
            {/* Header */}
            <div className="p-3 border-b border-red-900/30 bg-red-950/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-red-500" />
                    <h2 className="text-sm font-bold text-red-100 font-mono tracking-wider">
                        NEGOTIATION SIMULATOR
                    </h2>
                </div>
                <div className="flex items-center gap-2 px-2 py-1 bg-red-900/20 border border-red-700/30 rounded">
                    <Timer className="w-3 h-3 text-red-500 animate-pulse" />
                    <span className="text-xs text-red-400 font-mono">71:42:12 REMAINING</span>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'user'
                            ? 'bg-blue-900/30 border border-blue-700/50'
                            : 'bg-red-900/30 border border-red-700/50'
                            }`}>
                            {msg.sender === 'user' ? <User className="w-4 h-4 text-blue-400" /> : <Bot className="w-4 h-4 text-red-400" />}
                        </div>

                        <div className={`max-w-[80%] p-3 rounded border ${msg.sender === 'user'
                            ? 'bg-blue-950/20 border-blue-800/30 text-blue-100'
                            : 'bg-red-950/20 border-red-800/30 text-red-100'
                            }`}>
                            <p className="leading-relaxed">{msg.text}</p>
                            <span className="text-[9px] opacity-40 mt-1 block">
                                {msg.timestamp.toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-900/30 border border-red-700/50 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-red-400" />
                        </div>
                        <div className="p-3 rounded border bg-red-950/20 border-red-800/30 text-red-400/50">
                            typing...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-800 bg-black/40">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type message to threat actor..."
                        className="flex-1 bg-gray-900/50 border border-gray-700 rounded px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-red-500/50 font-mono"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="p-2 bg-red-900/20 border border-red-700/50 rounded hover:bg-red-900/40 text-red-400 disabled:opacity-50 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-600">
                    <AlertTriangle className="w-3 h-3" />
                    <span>TRAINING MODE: Responses are AI-simulated based on typical RaaS behavior.</span>
                </div>
            </form>
        </div>
    );
}
