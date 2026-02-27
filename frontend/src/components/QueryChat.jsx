import React, { useRef, useEffect } from 'react'

export default function QueryChat({ messages = [], onSend, loading = false }) {
    const [text, setTextState] = React.useState('')
    const bottomRef = useRef(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    const submit = () => {
        const trimmed = text.trim()
        if (!trimmed || loading) return
        onSend(trimmed)
        setTextState('')
    }

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
        }
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 px-1 py-2 min-h-0">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm gap-1">
                        <span className="text-3xl">🔒</span>
                        <p>Ask about your patients' risk levels, scheme eligibility, or ward stats.</p>
                        <p className="text-xs">All responses are de-identified.</p>
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-br-sm'
                                    : 'bg-slate-700 text-slate-100 rounded-bl-sm border border-slate-600'
                                }`}
                        >
                            {m.role === 'agent' && (
                                <p className="text-xs text-indigo-400 font-semibold mb-1">🤖 Privacy Agent</p>
                            )}
                            {m.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-700 border border-slate-600 text-slate-400 text-sm px-4 py-3 rounded-2xl rounded-bl-sm">
                            <span className="animate-pulse">Agent is thinking…</span>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-700 mt-3">
                <input
                    className="input-dark flex-1"
                    placeholder="Ask about patient risks, scheme eligibility, ward stats…"
                    value={text}
                    onChange={(e) => setTextState(e.target.value)}
                    onKeyDown={handleKey}
                    disabled={loading}
                />
                <button
                    onClick={submit}
                    disabled={!text.trim() || loading}
                    className="btn-primary px-5"
                >
                    Send
                </button>
            </div>
        </div>
    )
}
