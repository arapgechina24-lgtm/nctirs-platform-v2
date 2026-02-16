import React, { useState, useEffect, useCallback, useRef } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */

// === TYPES ===
// Extend Window interface for Web Speech API
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export const VOICE_COMMANDS: Record<string, string> = {
    'navigate to command center': 'navigate:COMMAND_CENTER',
    'go to command center': 'navigate:COMMAND_CENTER',
    'show command center': 'navigate:COMMAND_CENTER',

    'navigate to fusion center': 'navigate:FUSION_CENTER',
    'go to fusion center': 'navigate:FUSION_CENTER',
    'show fusion center': 'navigate:FUSION_CENTER',

    'navigate to threat matrix': 'navigate:THREAT_MATRIX',
    'go to threat matrix': 'navigate:THREAT_MATRIX',
    'show threat matrix': 'navigate:THREAT_MATRIX',

    'navigate to analytics': 'navigate:ANALYTICS',
    'show analytics': 'navigate:ANALYTICS',
    'go to analytics': 'navigate:ANALYTICS',

    'navigate to operations': 'navigate:OPERATIONS',
    'show operations': 'navigate:OPERATIONS',
    'go to operations': 'navigate:OPERATIONS',

    'trigger emergency': 'action:emergency',
    'simulate breach': 'action:emergency',
    'refresh data': 'action:refresh',
    'reload': 'action:refresh',

    'help': 'action:help',
    'show help': 'action:help',
    'close': 'action:close',
    'stop': 'action:close',
};

// === HOOK: Text to Speech ===
export function useTextToSpeech() {
    const speak = useCallback((text: string) => {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            // Try to find a "computer" sounding voice
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v =>
                v.name.includes('Google US English') ||
                v.name.includes('Samantha') ||
                v.lang === 'en-US'
            );
            if (preferredVoice) utterance.voice = preferredVoice;

            window.speechSynthesis.speak(utterance);
        }
    }, []);

    const stop = useCallback(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }, []);

    return { speak, stop };
}

// === HOOK: Voice Recognition ===
export function useVoiceCommands(
    onCommand: (action: string, transcript: string) => void,
    isEnabled: boolean
) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState(false);

    const recognitionRef = useRef<any>(null);

    // Initialize Recognition
    useEffect(() => {
        if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsSupported(true);
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true; // Keep listening
            recognitionRef.current.interimResults = true; // Show words as spoken
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onstart = () => setIsListening(true);
            recognitionRef.current.onend = () => {
                // Auto-restart if it stops but should be enabled
                if (isEnabled) {
                    try {
                        recognitionRef.current?.start();
                    } catch {
                        setIsListening(false);
                    }
                } else {
                    setIsListening(false);
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                if (event.error === 'not-allowed') {
                    setError('Microphone blocked');
                    setIsListening(false);
                } else {
                    setError(event.error);
                }
            };

            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                // Update UI state
                const currentText = finalTranscript || interimTranscript;
                setTranscript(currentText);

                // Check for commands in final transcript
                if (finalTranscript) {
                    const normalizedText = finalTranscript.trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
                    console.log("Heard:", normalizedText);

                    // Direct match check
                    if (VOICE_COMMANDS[normalizedText]) {
                        onCommand(VOICE_COMMANDS[normalizedText], normalizedText);
                        setTranscript(''); // Clear after success
                    } else {
                        // Fuzzy search or partial match could go here
                        // For now, clear quickly to be ready for next
                        setTimeout(() => setTranscript(''), 2000);
                    }
                }
            };
        } else {
            setError('Browser not supported');
        }
    }, [isEnabled, onCommand]);

    // Toggle Listening
    useEffect(() => {
        if (!recognitionRef.current) return;

        if (isEnabled) {
            try {
                recognitionRef.current.start();
            } catch {
                // Already started or busy
            }
        } else {
            recognitionRef.current.stop();
        }
    }, [isEnabled]);

    return { isListening, transcript, isSupported, error };
}

// === COMPONENT: Visual Indicator ===
export function VoiceCommandIndicator({ isListening, transcript }: { isListening: boolean, transcript: string }) {
    if (!isListening && !transcript) return null;

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-50 flex flex-col items-center gap-2" >
            {/* Waveform Animation */}
            {
                isListening && (
                    <div className="flex items-center gap-1 h-8" >
                        {
                            [...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-1 bg-green-500 rounded-full animate-voice-wave"
                                    style={{
                                        height: '100%',
                                        animationDelay: `${i * 0.1}s`,
                                        opacity: transcript ? 1 : 0.5
                                    }}
                                />
                            ))
                        }
                    </div>
                )
            }

            {/* Transcript Display */}
            {
                transcript && (
                    <div className="bg-black/80 backdrop-blur border border-green-500/50 px-4 py-2 rounded-full text-green-400 font-mono text-sm shadow-[0_0_20px_rgba(0,255,0,0.2)]" >
                        &quot;{transcript}&quot;
                    </div>
                )
            }
        </div>
    );
}
