import React, { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import VoiceInput from '../components/VoiceInput'
import ThreatCard from '../components/ThreatCard'
import api from '../api/client'
import useWebSocket from '../hooks/useWebSocket'

const WS_URL = `ws://${window.location.host}/ws/alerts`

export default function ThreatHunterPage() {
    const [alerts, setAlerts] = useState([])
    const [scanStatus, setScanStatus] = useState('')
    const [scanning, setScanning] = useState(false)
    const [lastTranscript, setLastTranscript] = useState('')

    useEffect(() => {
        api.get('/alerts/').then((r) => setAlerts(r.data)).catch(() => { })
    }, [])

    const handleWsMessage = useCallback((msg) => {
        if (msg.event === 'new_alert' || msg.event === 'user_locked') {
            setAlerts((prev) => [{
                id: msg.alert_id,
                user_id: msg.user_id,
                severity: msg.severity,
                alert_type: msg.event === 'user_locked' ? 'manual_lock' : 'anomaly_detected',
                auto_locked: msg.auto_locked || (msg.event === 'user_locked' ? 1 : 0),
                created_at: msg.created_at,
                resolved: 0,
            }, ...prev])
        }
    }, [])

    const { connected } = useWebSocket(WS_URL, handleWsMessage)

    const runScan = async (body = {}) => {
        setScanning(true)
        setScanStatus('Scanning…')
        try {
            const { data } = await api.post('/agents/threat-hunter/scan', body)
            setScanStatus(data.summary || `Done — ${data.alerts_created} alerts, ${data.users_locked} locked`)
        } catch {
            setScanStatus('Scan failed')
        } finally {
            setScanning(false)
        }
    }

    const handleVoice = async (transcript) => {
        setLastTranscript(transcript)
        setScanning(true)
        setScanStatus(`Command: "${transcript}"`)
        try {
            const { data } = await api.post('/agents/threat-hunter/voice', { transcript })
            setScanStatus(data.result?.summary || 'Command processed')
        } catch {
            setScanStatus('Voice command failed')
        } finally {
            setScanning(false)
        }
    }

    const handleResolve = async (id) => {
        try {
            await api.post(`/alerts/${id}/resolve`)
            setAlerts((prev) => prev.filter((a) => a.id !== id))
        } catch {
            // ignore
        }
    }

    return (
        <div className="min-h-screen bg-surface-900">
            <Navbar />
            <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Threat Hunter Agent</h1>
                        <p className="text-slate-400 text-sm mt-1">24/7 anomaly detection · ML-powered · Voice-activated</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                        <span className="text-slate-400">{connected ? 'Live feed active' : 'Reconnecting…'}</span>
                    </div>
                </div>

                <div className="card flex flex-col gap-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <VoiceInput
                            onTranscript={handleVoice}
                            label='Say "Hunter, scan ward D" or "Hunter, full scan"'
                        />
                        <div className="sm:ml-auto">
                            <button
                                onClick={() => runScan({})}
                                disabled={scanning}
                                className="btn-primary flex items-center gap-2"
                            >
                                {scanning ? (
                                    <span className="animate-spin text-lg">⟳</span>
                                ) : (
                                    <span>🔍</span>
                                )}
                                {scanning ? 'Scanning…' : 'Run Full Scan'}
                            </button>
                        </div>
                    </div>

                    {(scanStatus || lastTranscript) && (
                        <div className="bg-slate-900/60 border border-slate-700 rounded-lg px-4 py-3 flex flex-col gap-1">
                            {lastTranscript && (
                                <p className="text-xs text-indigo-400 font-medium">
                                    🎤 Heard: "{lastTranscript}"
                                </p>
                            )}
                            {scanStatus && (
                                <p className="text-sm text-slate-300">{scanStatus}</p>
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white">
                            Active Alerts
                            {alerts.length > 0 && (
                                <span className="ml-2 bg-red-500/20 text-red-400 text-sm font-bold px-2 py-0.5 rounded-full">
                                    {alerts.length}
                                </span>
                            )}
                        </h2>
                    </div>
                    {alerts.length === 0 ? (
                        <div className="card text-center text-slate-500 py-10">
                            <p className="text-3xl mb-2">✅</p>
                            <p>No active threats detected</p>
                            <p className="text-xs mt-1">Run a scan or wait for live detection</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {alerts.map((a) => (
                                <ThreatCard key={a.id} alert={a} onResolve={handleResolve} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
