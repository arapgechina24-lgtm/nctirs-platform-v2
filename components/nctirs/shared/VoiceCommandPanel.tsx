'use client'

import { useState, useCallback } from 'react'
import { Mic, MicOff, Volume2, VolumeX, HelpCircle, X, AlertTriangle } from 'lucide-react'
import { useVoiceCommands, useTextToSpeech, VOICE_COMMANDS, VoiceCommandIndicator } from '@/lib/nctirs/voiceCommands'
import { ViewType } from '@/components/nctirs/layout/Header'

interface VoiceCommandPanelProps {
    onNavigate: (view: ViewType) => void
    onEmergency: () => void
    onRefresh: () => void
}

export function VoiceCommandPanel({ onNavigate, onEmergency, onRefresh }: VoiceCommandPanelProps) {
    const [isEnabled, setIsEnabled] = useState(false)
    const [showHelp, setShowHelp] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const { speak, stop } = useTextToSpeech()

    const handleCommand = useCallback((action: string, transcript: string) => {
        // Provide audio feedback
        if (!isMuted) {
            speak(`Command received: ${transcript}`)
        }

        if (action.startsWith('navigate:')) {
            const view = action.replace('navigate:', '') as ViewType
            onNavigate(view)
            if (!isMuted) speak(`Navigating to ${view.replace('_', ' ').toLowerCase()}`)
        } else if (action === 'action:emergency') {
            onEmergency()
            if (!isMuted) speak('Emergency protocol activated')
        } else if (action === 'action:refresh') {
            onRefresh()
            if (!isMuted) speak('Refreshing data')
        } else if (action === 'action:help') {
            setShowHelp(true)
            if (!isMuted) speak('Displaying available voice commands')
        } else if (action === 'action:close') {
            setShowHelp(false)
            if (!isMuted) speak('Panel closed')
        }
    }, [onNavigate, onEmergency, onRefresh, isMuted, speak])

    const { isListening, transcript, isSupported, error } = useVoiceCommands(
        handleCommand,
        isEnabled
    )

    const handleToggle = () => {
        if (!isSupported) return
        setIsEnabled(!isEnabled)
        if (!isEnabled && !isMuted) {
            speak('Voice commands activated. Say help for available commands.')
        } else if (isEnabled && !isMuted) {
            speak('Voice commands deactivated')
        }
    }

    return (
        <>
            {/* Voice Command Button - Fixed Position */}
            <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2">
                {/* Help Button */}
                <button
                    onClick={() => setShowHelp(!showHelp)}
                    className="p-2 bg-black border border-green-900/50 text-green-600 hover:text-green-400 hover:border-green-700 transition-all"
                    title="Voice Commands Help"
                >
                    <HelpCircle className="h-4 w-4" />
                </button>

                {/* Mute Button */}
                <button
                    onClick={() => {
                        setIsMuted(!isMuted)
                        if (isMuted) stop()
                    }}
                    className={`p-2 bg-black border transition-all ${isMuted
                        ? 'border-yellow-700/50 text-yellow-600 hover:text-yellow-400'
                        : 'border-green-900/50 text-green-600 hover:text-green-400 hover:border-green-700'
                        }`}
                    title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>

                {/* Main Voice Button */}
                <button
                    onClick={handleToggle}
                    disabled={!isSupported}
                    className={`p-4 rounded-full transition-all ${!isSupported
                        ? 'bg-gray-900 border border-gray-700 text-gray-600 cursor-not-allowed opacity-50'
                        : isListening
                            ? 'bg-red-600 text-white animate-pulse shadow-[0_0_20px_rgba(255,0,0,0.5)]'
                            : isEnabled
                                ? 'bg-green-600 text-white shadow-[0_0_15px_rgba(0,255,0,0.3)]'
                                : 'bg-black border border-green-900/50 text-green-600 hover:text-green-400 hover:border-green-700'
                        }`}
                    title={!isSupported ? 'Voice commands not supported in this browser' : isListening ? 'Stop Listening' : 'Start Voice Commands'}
                >
                    {isListening ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                </button>

                {/* Status Indicator */}
                {isEnabled && (
                    <div className={`text-[9px] font-mono px-2 py-1 rounded ${isListening ? 'bg-red-950 text-red-400' : 'bg-green-950 text-green-400'
                        }`}>
                        {isListening ? 'LISTENING...' : 'READY'}
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="text-[9px] font-mono px-2 py-1 bg-red-950 text-red-400 max-w-32 truncate">
                        Error: {error}
                    </div>
                )}
            </div >

            {/* Voice Command Indicator */}
            < VoiceCommandIndicator isListening={isListening} transcript={transcript} />

            {/* Help Modal */}
            {
                showHelp && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <div className="bg-black border border-green-900/50 max-w-md w-full max-h-[80vh] overflow-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-green-900/50">
                                <div className="flex items-center gap-2">
                                    <Mic className="h-5 w-5 text-green-500" />
                                    <h2 className="text-green-400 font-bold tracking-wider">
                                        VOICE COMMANDS
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setShowHelp(false)}
                                    className="text-green-700 hover:text-green-400"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Emergency Section */}
                            <div className="p-4 bg-red-950/30 border-b border-red-900/50">
                                <div className="flex items-center gap-2 text-red-400 mb-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span className="text-xs font-bold">EMERGENCY COMMANDS</span>
                                </div>
                                <div className="text-[11px] text-red-300 font-mono">
                                    Say: &quot;Trigger emergency&quot;
                                </div>
                            </div>

                            {/* Command List */}
                            <div className="p-4">
                                <div className="text-[10px] text-green-700 mb-3 tracking-wider">
                                    AVAILABLE VOICE COMMANDS:
                                </div>
                                <div className="space-y-2">
                                    {Object.entries(VOICE_COMMANDS).map(([command, action]) => (
                                        <div
                                            key={command}
                                            className="flex items-center justify-between text-[11px] py-1.5 px-2 bg-green-950/20 border border-green-900/30"
                                        >
                                            <span className="text-green-300 font-mono">&quot;{command}&quot;</span>
                                            <span className="text-green-700 text-[9px]">
                                                {action.split(':')[1]?.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="p-4 border-t border-green-900/50 bg-green-950/10">
                                <div className="text-[10px] text-green-700 space-y-1">
                                    <p>• Click the microphone button to enable voice commands</p>
                                    <p>• Speak clearly and wait for confirmation</p>
                                    <p>• Say &quot;help&quot; anytime to see this panel</p>
                                    <p>• Works best with Chrome/Edge browsers</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    )
}
