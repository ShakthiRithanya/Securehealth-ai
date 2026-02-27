import { useState, useRef } from 'react'

const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition

export default function useVoice() {
    const [listening, setListening] = useState(false)
    const recogRef = useRef(null)
    const supported = !!SpeechRec

    const startListening = (onResult) => {
        if (!supported) return

        const rec = new SpeechRec()
        rec.lang = 'en-IN'
        rec.continuous = false
        rec.interimResults = false

        rec.onresult = (e) => {
            const text = Array.from(e.results)
                .filter((r) => r.isFinal)
                .map((r) => r[0].transcript)
                .join(' ')
                .trim()
            if (text) onResult(text)
        }

        rec.onend = () => setListening(false)
        rec.onerror = () => setListening(false)

        rec.start()
        recogRef.current = rec
        setListening(true)
    }

    const stopListening = () => {
        if (recogRef.current) {
            recogRef.current.stop()
            recogRef.current = null
        }
        setListening(false)
    }

    return { listening, supported, startListening, stopListening }
}
