import React, { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import StatWidget from '../components/StatWidget'
import ThreatCard from '../components/ThreatCard'
import ActivityFeed from '../components/ActivityFeed'
import api from '../api/client'
import useWebSocket from '../hooks/useWebSocket'

const WS_URL = `ws://${window.location.host}/ws/alerts`

export default function AdminDashboard() {
    const [users, setUsers] = useState([])
    const [alerts, setAlerts] = useState([])
    const [todayLogs, setTodayLogs] = useState(0)
    const [loading, setLoading] = useState(true)
    const [activityFeed, setActivityFeed] = useState([])

    useEffect(() => {
        const load = async () => {
            try {
                const [ur, ar, lr] = await Promise.all([
                    api.get('/users/'),
                    api.get('/alerts/'),
                    api.get('/logs/?limit=200'),
                ])
                setUsers(ur.data)
                setAlerts(ar.data)
                const today = new Date().toDateString()
                setTodayLogs(lr.data.filter((l) => new Date(l.timestamp).toDateString() === today).length)
            } catch {
                // fetch error — silently degrade
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const handleWsMessage = useCallback((msg) => {
        if (msg.event === 'new_alert' || msg.event === 'user_locked') {
            const synthetic = {
                id: msg.alert_id,
                user_id: msg.user_id,
                user_name: msg.user_name || null,
                severity: msg.severity,
                alert_type: msg.event === 'user_locked' ? 'manual_lock' : 'anomaly_detected',
                auto_locked: msg.auto_locked || (msg.event === 'user_locked' ? 1 : 0),
                created_at: msg.created_at,
                resolved: 0,
            }
            setAlerts((prev) => [synthetic, ...prev])
        }
        if (msg.event === 'patient_action') {
            setActivityFeed((prev) => [msg, ...prev].slice(0, 50))
            setTodayLogs((n) => n + 1)
        }
    }, [])

    const { connected } = useWebSocket(WS_URL, handleWsMessage)

    const handleResolve = async (id) => {
        try {
            await api.post(`/alerts/${id}/resolve`)
            setAlerts((prev) => prev.filter((a) => a.id !== id))
        } catch {
            // ignore
        }
    }

    const admins = users.filter((u) => u.role === 'admin').length
    const doctors = users.filter((u) => u.role === 'doctor').length

    return (
        <div className="min-h-screen bg-surface-900">
            <Navbar />
            <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                        <p className="text-slate-400 text-sm mt-1">System overview & live security feed</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                        <span className="text-slate-400">{connected ? 'Live' : 'Reconnecting…'}</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatWidget label="Total Staff" value={users.length} accentColor="text-indigo-400" caption={`${admins} admins`} />
                    <StatWidget label="Doctors" value={doctors} accentColor="text-blue-400" />
                    <StatWidget label="Open Alerts" value={alerts.length} accentColor={alerts.length > 0 ? 'text-red-400' : 'text-emerald-400'} caption="Unresolved" />
                    <StatWidget label="Logs Today" value={todayLogs} accentColor="text-amber-400" />
                </div>

                {/* Twin panels */}
                <div className="grid lg:grid-cols-2 gap-6">

                    {/* Security Alerts */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">
                                Security Alerts
                                {alerts.length > 0 && (
                                    <span className="ml-2 bg-red-500/20 text-red-400 text-sm font-bold px-2 py-0.5 rounded-full">
                                        {alerts.length}
                                    </span>
                                )}
                            </h2>
                            <a href="/admin/threat-hunter" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                                View Threat Hunter →
                            </a>
                        </div>
                        {loading ? (
                            <p className="text-slate-500 text-sm">Loading…</p>
                        ) : alerts.length === 0 ? (
                            <div className="card text-center text-slate-500 py-8">
                                <p className="text-2xl mb-2">✅</p>
                                <p>No open alerts — system is healthy</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
                                {alerts.slice(0, 8).map((a) => (
                                    <ThreatCard key={a.id} alert={a} onResolve={handleResolve} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Live Patient Activity */}
                    <div className="card">
                        <ActivityFeed
                            events={activityFeed}
                            title="Patient Data Activity"
                            maxItems={15}
                        />
                        {activityFeed.length === 0 && !loading && (
                            <p className="text-xs text-slate-600 mt-4 text-center">
                                Actions by doctors and nurses on patient records will appear here in real-time
                            </p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
