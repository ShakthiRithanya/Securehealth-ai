import React, { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import StatWidget from '../components/StatWidget'
import api from '../api/client'

const riskBadge = (score) => {
    if (score >= 0.65) return 'badge-high'
    if (score >= 0.35) return 'badge-medium'
    return 'badge-low'
}

function fmtDt(v) {
    if (!v) return '—'
    return new Date(v).toLocaleString('en-IN', {
        day: '2-digit', month: 'short',
        hour: '2-digit', minute: '2-digit',
    })
}

export default function NurseDashboard() {
    const [patients, setPatients] = useState([])
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const [pr, lr] = await Promise.all([
                    api.get('/patients/'),
                    api.get('/logs/my?limit=20'),
                ])
                setPatients(pr.data)
                setLogs(lr.data)
            } catch {
                // silently degrade
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const highRisk = patients.filter((p) => p.risk_score >= 0.65).length

    return (
        <div className="min-h-screen bg-surface-900">
            <Navbar />
            <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Ward Dashboard</h1>
                    <p className="text-slate-400 text-sm mt-1">Your ward patients & recent activity</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <StatWidget label="Ward Patients" value={loading ? '…' : patients.length} accentColor="text-teal-400" />
                    <StatWidget label="High Risk" value={loading ? '…' : highRisk} accentColor="text-red-400" caption="score ≥ 0.65" />
                    <StatWidget label="Recent Actions" value={loading ? '…' : logs.length} accentColor="text-slate-400" />
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-white mb-4">Ward Patients</h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-700">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-700 bg-slate-800/60">
                                    <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Name</th>
                                    <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Ward</th>
                                    <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Age</th>
                                    <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Risk</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patients.map((p) => (
                                    <tr key={p.id} className="border-b border-slate-700/40 hover:bg-slate-700/20 transition-colors">
                                        <td className="px-4 py-3 text-slate-200 font-medium">{p.name}</td>
                                        <td className="px-4 py-3 text-slate-400">{p.ward}</td>
                                        <td className="px-4 py-3 text-slate-400">{p.age}</td>
                                        <td className="px-4 py-3">
                                            <span className={riskBadge(p.risk_score)}>{p.risk_score?.toFixed(2)}</span>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && patients.length === 0 && (
                                    <tr><td colSpan={4} className="text-center py-8 text-slate-500">No patients in your ward</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-white mb-4">My Recent Activity</h2>
                    {logs.length === 0 ? (
                        <p className="text-slate-500 text-sm">No recent activity</p>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-700">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-700 bg-slate-800/60">
                                        <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Time</th>
                                        <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Action</th>
                                        <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Resource</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((l, i) => (
                                        <tr key={l.id || i} className="border-b border-slate-700/40">
                                            <td className="px-4 py-2.5 text-slate-400 text-xs">{fmtDt(l.timestamp)}</td>
                                            <td className="px-4 py-2.5">
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${l.action === 'EXPORT' ? 'bg-red-500/20 text-red-400' :
                                                        l.action === 'EDIT' ? 'bg-amber-500/20 text-amber-400' :
                                                            'bg-slate-600/40 text-slate-300'
                                                    }`}>{l.action}</span>
                                            </td>
                                            <td className="px-4 py-2.5 text-slate-400 text-xs">{l.resource}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
