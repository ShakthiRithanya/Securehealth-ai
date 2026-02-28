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
    const [stateFilter, setStateFilter] = useState('')
    const [ageFilter, setAgeFilter] = useState('')
    const [riskFilter, setRiskFilter] = useState('')
    const [schemeFilter, setSchemeFilter] = useState('')
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
            // Only show events for this nurse's assigned wards
            if (assignedWards.length === 0 || assignedWards.includes(msg.patient_ward)) {
                setActivityFeed((prev) => [msg, ...prev].slice(0, 50))
            }
        }
    }, [assignedWards])

    const { connected } = useWebSocket(WS_URL, handleWsMessage)

    const wards = [...new Set(patients.map((p) => p.ward))].sort()
    const states = [...new Set(patients.map((p) => p.state))].filter(Boolean).sort()

    const filtered = patients.filter((p) => {
        const matchName = !search || p.name.toLowerCase().includes(search.toLowerCase())
        const matchWard = !wardFilter || p.ward === wardFilter
        const matchState = !stateFilter || p.state === stateFilter

        let matchAge = true
        if (ageFilter === '<30') matchAge = p.age < 30
        if (ageFilter === '30-50') matchAge = p.age >= 30 && p.age <= 50
        if (ageFilter === '>50') matchAge = p.age > 50

        let matchRisk = true
        if (riskFilter === 'High') matchRisk = p.risk_score >= 0.65
        if (riskFilter === 'Medium') matchRisk = p.risk_score >= 0.35 && p.risk_score < 0.65
        if (riskFilter === 'Low') matchRisk = p.risk_score < 0.35

        let matchScheme = true
        if (schemeFilter === 'Eligible') matchScheme = p.scheme_eligible?.length > 0
        if (schemeFilter === 'Not Eligible') matchScheme = !p.scheme_eligible || p.scheme_eligible.length === 0

        return matchName && matchWard && matchState && matchAge && matchRisk && matchScheme
    })

    const highRisk = patients.filter((p) => p.risk_score >= 0.65).length
    const schemeEligible = patients.filter((p) => p.scheme_eligible?.length > 0).length

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
                    <StatWidget label="Scheme Eligible" value={loading ? '…' : schemeEligible} accentColor="text-indigo-400" />
                    <StatWidget label="Live Events" value={activityFeed.length} accentColor="text-emerald-400" />
                </div>

                {/* Patient Table + Activity Feed */}
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        {/* Filters — ward dropdown scoped to nurse's 2 wards */}
                        <div className="flex flex-wrap gap-3 items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                            <h2 className="text-lg font-semibold text-white mr-auto">Patients in Your Wards</h2>
                            <input
                                className="input-dark w-40 text-sm"
                                placeholder="Search by name…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <select
                                className="input-dark text-sm w-32"
                                value={wardFilter}
                                onChange={(e) => setWardFilter(e.target.value)}
                            >
                                <option value="">All My Wards</option>
                                {assignedWards.map((w) => <option key={w} value={w}>{w}</option>)}
                            </select>
                            <select
                                className="input-dark text-sm w-32"
                                value={stateFilter}
                                onChange={(e) => setStateFilter(e.target.value)}
                            >
                                <option value="">All States</option>
                                {states.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <select className="input-dark text-sm w-28" value={ageFilter} onChange={(e) => setAgeFilter(e.target.value)}>
                                <option value="">All Ages</option>
                                <option value="<30">Under 30</option>
                                <option value="30-50">30 - 50</option>
                                <option value=">50">Over 50</option>
                            </select>
                            <select className="input-dark text-sm w-28" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
                                <option value="">All Risks</option>
                                <option value="High">High Risk</option>
                                <option value="Medium">Medium Risk</option>
                                <option value="Low">Low Risk</option>
                            </select>
                            <select className="input-dark text-sm w-36" value={schemeFilter} onChange={(e) => setSchemeFilter(e.target.value)}>
                                <option value="">All Schemes</option>
                                <option value="Eligible">Eligible Schemes</option>
                                <option value="Not Eligible">Not Eligible</option>
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
