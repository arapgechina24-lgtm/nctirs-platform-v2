// Voice Commands utility using Web Speech API
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// Type declarations for Web Speech API (not included in standard TypeScript lib)
interface SpeechRecognitionAlternative {
    transcript: string
    confidence: number
}

interface SpeechRecognitionResult {
    isFinal: boolean
    length: number
    [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionResultList {
    length: number
    [index: number]: SpeechRecognitionResult
}

// Removed unused SpeechRecognitionEventMap

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList
    resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string
    message: string
}

interface ISpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    start(): void
    stop(): void
    abort(): void
    onstart: ((this: ISpeechRecognition, ev: Event) => void) | null
    onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
    onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null
    onend: ((this: ISpeechRecognition, ev: Event) => void) | null
}

interface ISpeechRecognitionConstructor {
    new(): ISpeechRecognition
}

declare global {
    interface Window {
        SpeechRecognition?: ISpeechRecognitionConstructor
        webkitSpeechRecognition?: ISpeechRecognitionConstructor
    }
}

// Voice command definitions
export const VOICE_COMMANDS = {
    'go to command center': 'navigate:COMMAND_CENTER',
    'go to fusion center': 'navigate:FUSION_CENTER',
    'go to threat matrix': 'navigate:THREAT_MATRIX',
    'go to analytics': 'navigate:ANALYTICS',
    'go to operations': 'navigate:OPERATIONS',
    'show incidents': 'action:show_incidents',
    'show threats': 'action:show_threats',
    'trigger emergency': 'action:emergency',
    'refresh data': 'action:refresh',
    'generate report': 'action:generate_report',
    'close': 'action:close',
    'help': 'action:help',
} as const

type VoiceCommand = keyof typeof VOICE_COMMANDS
type VoiceAction = typeof VOICE_COMMANDS[VoiceCommand]

interface VoiceRecognitionState {
    isListening: boolean
    transcript: string
    confidence: number
    error: string | null
    isSupported: boolean
}

// Check for Web Speech API support
const isSpeechRecognitionSupported = () => {
    if (typeof window === 'undefined') return false
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
}

// Create speech recognition instance
const createRecognition = (): ISpeechRecognition | null => {
    if (!isSpeechRecognitionSupported()) return null

    const SpeechRecognitionCtor = window.webkitSpeechRecognition || window.SpeechRecognition
    if (!SpeechRecognitionCtor) return null

    const recognition = new SpeechRecognitionCtor()

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    return recognition
}

// Voice commands hook
export function useVoiceCommands(
    onCommand: (action: VoiceAction, transcript: string) => void,
    enabled: boolean = false
) {
    const [state, setState] = useState<VoiceRecognitionState>({
        isListening: false,
        transcript: '',
        confidence: 0,
        error: null,
        isSupported: false, // Will be updated on mount
    })

    const recognitionRef = useRef<ISpeechRecognition | null>(null)
    const isListeningRef = useRef(false)

    // Check support on mount
    useEffect(() => {
        setState(prev => ({ ...prev, isSupported: isSpeechRecognitionSupported() }))
    }, [])

    const startListening = useCallback(() => {
        // Prevent multiple starts
        if (isListeningRef.current) return

        if (!isSpeechRecognitionSupported()) {
            setState(prev => ({ ...prev, error: 'Speech recognition not supported' }))
            return
        }

        const recognition = createRecognition()
        if (!recognition) return

        recognitionRef.current = recognition

        recognition.onstart = () => {
            isListeningRef.current = true
            setState(prev => ({ ...prev, isListening: true, error: null }))
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const result = event.results[event.results.length - 1]
            const transcript = result[0].transcript.toLowerCase().trim()
            const confidence = result[0].confidence

            setState(prev => ({ ...prev, transcript, confidence }))

            // Check if transcript matches any command
            if (result.isFinal) {
                for (const [command, action] of Object.entries(VOICE_COMMANDS)) {
                    if (transcript.includes(command)) {
                        onCommand(action as VoiceAction, transcript)
                        break
                    }
                }
            }
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            // Ignore "no-speech" errors as they are common
            if (event.error !== 'no-speech') {
                setState(prev => ({ ...prev, error: event.error }))
            }
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                isListeningRef.current = false
                setState(prev => ({ ...prev, isListening: false }))
            }
        }

        recognition.onend = () => {
            // If we are supposed to be listening (and didn't stop manually), restart
            // This mimics 'continuous' beyond the browser's session limit
            if (enabled && isListeningRef.current) {
                try {
                    recognition.start()
                } catch {
                    isListeningRef.current = false
                    setState(prev => ({ ...prev, isListening: false }))
                }
            } else {
                isListeningRef.current = false
                setState(prev => ({ ...prev, isListening: false }))
            }
        }

        try {
            recognition.start()
        } catch {
            // Ignore start errors
        }
    }, [enabled, onCommand])

    const stopListening = useCallback(() => {
        isListeningRef.current = false
        if (recognitionRef.current) {
            recognitionRef.current.stop()
        }
        setState(prev => ({ ...prev, isListening: false }))
    }, [])

    const toggleListening = useCallback(() => {
        if (state.isListening) {
            stopListening()
        } else {
            startListening()
        }
    }, [state.isListening, startListening, stopListening])

    // Handle enabled prop changes
    useEffect(() => {
        if (enabled && !state.isListening) {
            startListening()
        } else if (!enabled && state.isListening) {
            stopListening()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled]) // Only trigger when enabled changes

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isListeningRef.current = false
            recognitionRef.current?.stop()
        }
    }, [])

    return {
        ...state,
        startListening,
        stopListening,
        toggleListening,
    }
}

// Text-to-speech for announcements
export function useTextToSpeech() {
    const speak = useCallback((text: string, options?: SpeechSynthesisUtterance) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            console.warn('Text-to-speech not supported')
            return
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = options?.rate || 1
        utterance.pitch = options?.pitch || 1
        utterance.volume = options?.volume || 1
        utterance.lang = 'en-US'

        window.speechSynthesis.speak(utterance)
    }, [])

    const stop = useCallback(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel()
        }
    }, [])

    return { speak, stop }
}

// Voice command indicator component
export function VoiceCommandIndicator({
    isListening,
    transcript,
}: {
    isListening: boolean
    transcript: string
}) {
    if (!isListening) return null

    return (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-900/90 border border-green-500 rounded-lg px-6 py-3 flex items-center gap-3 z-50">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm font-mono">
                {transcript || 'Listening...'}
            </span>
        </div>
    )
}
