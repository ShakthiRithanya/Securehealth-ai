import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import StatWidget from '../components/StatWidget'
import RiskChart from '../components/RiskChart'
import api from '../api/client'

const riskBadge = (score) => {
    if (score >= 0.65) return 'badge-high'
    if (score >= 0.35) return 'badge-medium'
    return 'badge-low'
}

export default function DoctorDashboard() {
    const [patients, setPatients] = useState([])
    const [summary, setSummary] = useState(null)
    const [loading, setLoading] = useState(true)
    const nav = useNavigate()

    useEffect(() => {
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
        load()
    }, [])

    const highRisk = patients.filter((p) => p.risk_score >= 0.65).length
    const schemeEligible = patients.filter((p) => p.scheme_eligible?.length > 0).length
    const avgRisk = summary ? summary.avg_risk : 0

    const chartData = summary?.buckets
        ? Object.entries(summary.buckets).map(([bucket, count]) => ({ bucket, count }))
        : []

    return (
        <div className="min-h-screen bg-surface-900">
            <Navbar />
            <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">
                <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-white">My Patients</h1>
                        <p className="text-slate-400 text-sm mt-1">Risk monitoring · Scheme eligibility · De-identified analytics</p>
                    </div>
                    <button
                        onClick={() => nav('/doctor/query')}
                        className="btn-primary flex items-center gap-2"
                    >
                        🤖 Privacy Query Agent
                    </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatWidget label="Total Patients" value={loading ? '…' : patients.length} accentColor="text-indigo-400" />
                    <StatWidget label="Avg Risk Score" value={loading ? '…' : avgRisk.toFixed(2)} accentColor="text-amber-400" />
                    <StatWidget label="High Risk" value={loading ? '…' : highRisk} accentColor="text-red-400" caption="score ≥ 0.65" />
                    <StatWidget label="Scheme Eligible" value={loading ? '…' : schemeEligible} accentColor="text-emerald-400" />
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="card">
                        <h2 className="text-slate-300 font-semibold mb-4">Risk Distribution</h2>
                        <RiskChart data={chartData} />
                    </div>

                    {summary?.scheme_counts && Object.keys(summary.scheme_counts).length > 0 && (
                        <div className="card">
                            <h2 className="text-slate-300 font-semibold mb-4">Scheme Eligibility</h2>
                            <ul className="flex flex-col gap-2">
                                {Object.entries(summary.scheme_counts).map(([name, count]) => (
                                    <li key={name} className="flex items-center justify-between">
                                        <span className="text-slate-400 text-sm">{name}</span>
                                        <span className="text-indigo-400 font-bold text-sm">{count}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {summary?.ward_counts && (
                        <div className="card">
                            <h2 className="text-slate-300 font-semibold mb-4">By Ward</h2>
                            <ul className="flex flex-col gap-2">
                                {Object.entries(summary.ward_counts).map(([ward, count]) => (
                                    <li key={ward} className="flex items-center justify-between">
                                        <span className="text-slate-400 text-sm">{ward}</span>
                                        <span className="text-slate-200 font-medium text-sm">{count}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-white mb-4">Patient List</h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-700">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-700 bg-slate-800/60">
                                    <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Name</th>
                                    <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Ward</th>
                                    <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">State</th>
                                    <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Risk</th>
                                    <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Schemes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patients.map((p) => (
                                    <tr key={p.id} className="border-b border-slate-700/40 hover:bg-slate-700/20 transition-colors">
                                        <td className="px-4 py-3 text-slate-200 font-medium">{p.name}</td>
                                        <td className="px-4 py-3 text-slate-400">{p.ward}</td>
                                        <td className="px-4 py-3 text-slate-400">{p.state}</td>
                                        <td className="px-4 py-3">
                                            <span className={riskBadge(p.risk_score)}>
                                                {p.risk_score?.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {(p.scheme_eligible || []).map((s) => (
                                                    <span key={s} className="bg-indigo-500/15 text-indigo-400 text-xs px-1.5 py-0.5 rounded">
                                                        {s}
                                                    </span>
                                                ))}
                                                {!p.scheme_eligible?.length && <span className="text-slate-600 text-xs">None</span>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && patients.length === 0 && (
                                    <tr><td colSpan={5} className="text-center py-8 text-slate-500">No patients assigned</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
