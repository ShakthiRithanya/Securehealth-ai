import React, { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import StatWidget from '../components/StatWidget'
import PatientModal from '../components/PatientModal'
import ActivityFeed from '../components/ActivityFeed'
import api from '../api/client'
import useWebSocket from '../hooks/useWebSocket'
import { useAuth } from '../contexts/AuthContext'

const WS_URL = `ws://${window.location.host}/ws/alerts`

const riskBadge = (score) => {
    if (score >= 0.65) return 'badge-high'
    if (score >= 0.35) return 'badge-medium'
    return 'badge-low'
}

export default function NurseDashboard() {
    const { user } = useAuth()
    const assignedWards = user?.department
        ? user.department.split(',').map((w) => w.trim()).filter(Boolean)
        : []

    const [patients, setPatients] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedId, setSelectedId] = useState(null)
    const [search, setSearch] = useState('')
    const [wardFilter, setWardFilter] = useState('')
    const [activityFeed, setActivityFeed] = useState([])

    const load = async () => {
        try {
            const { data } = await api.get('/patients/')
            setPatients(data)
        } catch {
            // silently degrade
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const handleWsMessage = useCallback((msg) => {
        if (msg.event === 'patient_action') {
            setActivityFeed((prev) => [msg, ...prev].slice(0, 50))
        }
    }, [])

    const { connected } = useWebSocket(WS_URL, handleWsMessage)

    const wards = [...new Set(patients.map((p) => p.ward))].sort()

    const filtered = patients.filter((p) => {
        const matchName = !search || p.name.toLowerCase().includes(search.toLowerCase())
        const matchWard = !wardFilter || p.ward === wardFilter
        return matchName && matchWard
    })

    const highRisk = patients.filter((p) => p.risk_score >= 0.65).length

    return (
        <div className="min-h-screen bg-surface-900">
            <Navbar />
            <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">

                {/* Header */}
                <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Ward Dashboard</h1>
                        <p className="text-slate-400 text-sm mt-1">View, export or update patient records · All actions are logged</p>
                        {/* Assigned Wards badges */}
                        <div className="flex items-center gap-2 mt-3">
                            <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Your wards:</span>
                            {assignedWards.map((w) => (
                                <span key={w} className="bg-teal-500/15 text-teal-400 border border-teal-500/25 text-xs font-semibold px-3 py-1 rounded-full">
                                    🏥 {w}
                                </span>
                            ))}
                            <span className="text-slate-600 text-xs ml-1">· Restricted access</span>
                        </div>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs ${connected ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                        {connected ? 'Live feed active' : 'Reconnecting…'}
                    </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatWidget label="Total Patients" value={loading ? '…' : patients.length} accentColor="text-teal-400" />
                    <StatWidget label="High Risk" value={loading ? '…' : highRisk} accentColor="text-red-400" caption="score ≥ 0.65" />
                    <StatWidget label="Wards" value={loading ? '…' : wards.length} accentColor="text-indigo-400" />
                    <StatWidget label="Live Events" value={activityFeed.length} accentColor="text-emerald-400" />
                </div>

                {/* Patient Table + Activity Feed */}
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        {/* Filters — ward dropdown scoped to nurse's 2 wards */}
                        <div className="flex flex-wrap gap-3 items-center">
                            <h2 className="text-lg font-semibold text-white flex-1">Patients in Your Wards</h2>
                            <input
                                className="input-dark w-44 text-sm"
                                placeholder="Search by name…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <select
                                className="input-dark text-sm"
                                value={wardFilter}
                                onChange={(e) => setWardFilter(e.target.value)}
                            >
                                <option value="">All My Wards</option>
                                {assignedWards.map((w) => <option key={w} value={w}>{w}</option>)}
                            </select>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-700">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-700 bg-slate-800/60">
                                        <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Name</th>
                                        <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Age</th>
                                        <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Ward</th>
                                        <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Risk</th>
                                        <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((p) => (
                                        <tr
                                            key={p.id}
                                            className="border-b border-slate-700/40 hover:bg-slate-700/20 transition-colors cursor-pointer"
                                            onClick={() => setSelectedId(p.id)}
                                        >
                                            <td className="px-4 py-3 text-slate-200 font-medium">{p.name}</td>
                                            <td className="px-4 py-3 text-slate-400">{p.age}</td>
                                            <td className="px-4 py-3 text-slate-400">{p.ward}</td>
                                            <td className="px-4 py-3">
                                                <span className={riskBadge(p.risk_score)}>{p.risk_score?.toFixed(2)}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedId(p.id) }}
                                                    className="text-xs bg-teal-600/20 hover:bg-teal-600/40 text-teal-400 px-2.5 py-1 rounded-lg transition-colors"
                                                >
                                                    Open →
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {!loading && filtered.length === 0 && (
                                        <tr><td colSpan={5} className="text-center py-8 text-slate-500">No patients found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Live Activity Feed */}
                    <div className="card">
                        <ActivityFeed events={activityFeed} title="Live Activity" maxItems={12} />
                    </div>
                </div>
            </div>

            {/* Patient Modal */}
            {selectedId && (
                <PatientModal
                    patientId={selectedId}
                    onClose={() => setSelectedId(null)}
                />
            )}
        </div>
    )
}
