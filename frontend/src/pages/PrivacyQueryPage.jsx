import React, { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import VoiceInput from '../components/VoiceInput'
import QueryChat from '../components/QueryChat'
import api from '../api/client'

export default function PrivacyQueryPage() {
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        api.get('/agents/commands').then(({ data }) => {
            const history = data
                .filter((c) => c.agent === 'privacy_query')
                .slice(0, 6)
                .reverse()
                .flatMap((c) => [
                    { role: 'user', text: c.command_text },
                    { role: 'agent', text: c.result_summary || '…' },
                ])
            if (history.length > 0) setMessages(history)
        }).catch(() => { })
    }, [])

    const sendQuestion = async (question) => {
        setMessages((prev) => [...prev, { role: 'user', text: question }])
        setLoading(true)
        try {
            const { data } = await api.post('/agents/privacy-query/ask', { question })
            setMessages((prev) => [...prev, { role: 'agent', text: data.answer }])
        } catch {
            setMessages((prev) => [...prev, { role: 'agent', text: 'Unable to process — please try again.' }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-surface-900 flex flex-col">
            <Navbar />
            <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col flex-1 gap-6 w-full">
                <div>
                    <h1 className="text-2xl font-bold text-white">Privacy Query Agent</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Ask questions about your patients · De-identified · Role-scoped · Gemini-powered
                    </p>
                </div>

                <div className="card flex items-center gap-4">
                    <VoiceInput
                        onTranscript={sendQuestion}
                        label="Ask by voice"
                    />
                    <div className="hidden sm:block w-px h-8 bg-slate-700" />
                    <p className="text-slate-500 text-xs leading-relaxed hidden sm:block">
                        Try: "Show risk distribution" · "How many qualify for PMMVY?" · "Any high-risk patients in Ward D?"
                    </p>
                </div>

                <div className="card flex-1 flex flex-col min-h-[28rem]">
                    <QueryChat messages={messages} onSend={sendQuestion} loading={loading} />
                </div>
            </div>
        </div>
    )
}
