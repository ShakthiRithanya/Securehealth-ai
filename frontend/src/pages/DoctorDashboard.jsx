import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import StatWidget from '../components/StatWidget'
import RiskChart from '../components/RiskChart'
import PatientModal from '../components/PatientModal'
import ActivityFeed from '../components/ActivityFeed'
import api from '../api/client'
import useWebSocket from '../hooks/useWebSocket'

const WS_URL = `ws://${window.location.host}/ws/alerts`

const riskBadge = (score) => {
    if (score >= 0.65) return 'badge-high'
    if (score >= 0.35) return 'badge-medium'
    return 'badge-low'
}

export default function DoctorDashboard() {
    const [patients, setPatients] = useState([])
    const [summary, setSummary] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selectedId, setSelectedId] = useState(null)
    const [search, setSearch] = useState('')
    const [wardFilter, setWardFilter] = useState('')
    const [activityFeed, setActivityFeed] = useState([])
    const nav = useNavigate()

    const load = async () => {
        try {
            const [pr, sr] = await Promise.all([
                api.get('/patients/'),
                api.get('/patients/risk-summary'),
            ])
            setPatients(pr.data)
            setSummary(sr.data)
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
    const schemeEligible = patients.filter((p) => p.scheme_eligible?.length > 0).length
    const avgRisk = summary ? summary.avg_risk : 0

    const chartData = summary?.buckets
        ? Object.entries(summary.buckets).map(([bucket, count]) => ({ bucket, count }))
        : []

    return (
        <div className="min-h-screen bg-surface-900">
            <Navbar />
            <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">

                {/* Header */}
                <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Patient Directory</h1>
                        <p className="text-slate-400 text-sm mt-1">View, export or update patient records · All actions are logged</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`flex items-center gap-1.5 text-xs ${connected ? 'text-emerald-400' : 'text-slate-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                            {connected ? 'Live' : 'Reconnecting…'}
                        </span>
                        <button onClick={() => nav('/doctor/query')} className="btn-primary flex items-center gap-2">
                            🤖 Privacy Query Agent
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatWidget label="Total Patients" value={loading ? '…' : patients.length} accentColor="text-indigo-400" />
                    <StatWidget label="Avg Risk Score" value={loading ? '…' : avgRisk.toFixed(2)} accentColor="text-amber-400" />
                    <StatWidget label="High Risk" value={loading ? '…' : highRisk} accentColor="text-red-400" caption="score ≥ 0.65" />
                    <StatWidget label="Scheme Eligible" value={loading ? '…' : schemeEligible} accentColor="text-emerald-400" />
                </div>

                {/* Charts row */}
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="card">
                        <h2 className="text-slate-300 font-semibold mb-4">Risk Distribution</h2>
                        <RiskChart data={chartData} />
                    </div>

                    {summary?.scheme_counts && Object.keys(summary.scheme_counts).length > 0 && (
                        <div className="card">
                            <h2 className="text-slate-300 font-semibold mb-4">Scheme Eligibility</h2>
                            <ul className="flex flex-col gap-2">
                                {Object.entries(summary.scheme_counts).slice(0, 6).map(([name, count]) => (
                                    <li key={name} className="flex items-center justify-between">
                                        <span className="text-slate-400 text-sm truncate">{name}</span>
                                        <span className="text-indigo-400 font-bold text-sm ml-2">{count}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="card">
                        <ActivityFeed events={activityFeed} title="Live Activity" maxItems={8} />
                    </div>
                </div>

                {/* Patient Table */}
                <div>
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <h2 className="text-lg font-semibold text-white flex-1">Patient List</h2>
                        <input
                            className="input-dark w-48 text-sm"
                            placeholder="Search by name…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <select
                            className="input-dark text-sm"
                            value={wardFilter}
                            onChange={(e) => setWardFilter(e.target.value)}
                        >
                            <option value="">All Wards</option>
                            {wards.map((w) => <option key={w} value={w}>{w}</option>)}
                        </select>
                        <span className="text-slate-500 text-xs">{filtered.length} patient{filtered.length !== 1 ? 's' : ''}</span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-700">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-700 bg-slate-800/60">
                                    <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Name</th>
                                    <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Age</th>
                                    <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Ward</th>
                                    <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">State</th>
                                    <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Risk</th>
                                    <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Schemes</th>
                                    <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Actions</th>
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
                                        <td className="px-4 py-3 text-slate-400">{p.state}</td>
                                        <td className="px-4 py-3">
                                            <span className={riskBadge(p.risk_score)}>{p.risk_score?.toFixed(2)}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {(p.scheme_eligible || []).slice(0, 2).map((s) => (
                                                    <span key={s} className="bg-indigo-500/15 text-indigo-400 text-xs px-1.5 py-0.5 rounded">{s}</span>
                                                ))}
                                                {(p.scheme_eligible?.length || 0) > 2 && (
                                                    <span className="text-slate-500 text-xs">+{p.scheme_eligible.length - 2}</span>
                                                )}
                                                {!p.scheme_eligible?.length && <span className="text-slate-600 text-xs">None</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedId(p.id) }}
                                                className="text-xs bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 px-2.5 py-1 rounded-lg transition-colors"
                                            >
                                                Open →
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && filtered.length === 0 && (
                                    <tr><td colSpan={7} className="text-center py-8 text-slate-500">No patients found</td></tr>
                                )}
                            </tbody>
                        </table>
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
