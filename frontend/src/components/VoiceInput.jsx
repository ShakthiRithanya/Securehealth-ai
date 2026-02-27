import React from 'react'
import useVoice from '../hooks/useVoice'

export default function VoiceInput({ onTranscript, label = 'Voice Command' }) {
    const { listening, supported, startListening, stopListening } = useVoice()

    const toggle = () => {
        if (listening) {
            stopListening()
        } else {
            startListening((text) => {
                onTranscript(text)
            })
        }
    }

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={toggle}
                disabled={!supported}
                className={`relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 ${listening
                        ? 'bg-red-500 ring-4 ring-red-500/30 animate-pulse'
                        : supported
                            ? 'bg-indigo-600 hover:bg-indigo-500 ring-2 ring-indigo-500/20'
                            : 'bg-slate-700 cursor-not-allowed opacity-50'
                    }`}
                title={supported ? (listening ? 'Stop listening' : 'Start voice input') : 'Voice not supported'}
            >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm-1-9a1 1 0 012 0v6a1 1 0 01-2 0V6zm6.91 6c-.49 3.33-3.33 5.81-6.91 5.81S6.58 15.33 6.09 12H4c.49 4.28 3.87 7.54 8 7.93V22h2v-2.07c4.13-.39 7.51-3.65 8-7.93h-2.09z" />
                </svg>
            </button>
            <div>
                <p className="text-slate-300 text-sm font-medium">{label}</p>
                <p className="text-xs text-slate-500">
                    {!supported ? 'Voice not available' : listening ? '🔴 Listening…' : 'Click mic to speak'}
                </p>
            </div>
        </div>
    )
}
