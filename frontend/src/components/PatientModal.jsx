import React, { useState, useEffect } from 'react'
import api from '../api/client'
import { useAuth } from '../contexts/AuthContext'

const riskColor = (s) => {
    if (s >= 0.65) return 'text-red-400'
    if (s >= 0.35) return 'text-amber-400'
    return 'text-emerald-400'
}

const riskLabel = (s) => {
    if (s >= 0.65) return 'HIGH'
    if (s >= 0.35) return 'MEDIUM'
    return 'LOW'
}

export default function PatientModal({ patientId, onClose }) {
    const { user } = useAuth()
    const isNurse = user?.role === 'nurse'

    const [patient, setPatient] = useState(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [editForm, setEditForm] = useState({})
    const [saving, setSaving] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [toast, setToast] = useState('')

    const showToast = (msg) => {
        setToast(msg)
        setTimeout(() => setToast(''), 3000)
    }

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await api.get(`/patients/${patientId}`)
                setPatient(data)
                setEditForm({ age: data.age, ward: data.ward, state: data.state, risk_score: data.risk_score })
            } catch {
                onClose()
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [patientId])

    const handleExport = async () => {
        setExporting(true)
        try {
            const { data } = await api.post(`/patients/${patientId}/export`)
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `patient_${data.name.replace(/\s+/g, '_')}.json`
            a.click()
            URL.revokeObjectURL(url)
            showToast('Patient data exported successfully')
        } catch {
            showToast('Export failed')
        } finally {
            setExporting(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { data } = await api.patch(`/patients/${patientId}`, editForm)
            setPatient(data)
            setEditing(false)
            showToast('Patient record updated')
        } catch {
            showToast('Update failed')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="relative h-full w-full max-w-xl bg-slate-900 border-l border-slate-700 shadow-2xl overflow-y-auto flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-slate-900/95 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Patient Record</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Full medical data · Logged access</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-xl leading-none">✕</button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-slate-500">Loading…</div>
                ) : patient ? (
                    <div className="flex-1 flex flex-col gap-6 p-6">

                        {/* Toast */}
                        {toast && (
                            <div className="bg-emerald-900/40 border border-emerald-700/50 text-emerald-400 text-sm px-4 py-2.5 rounded-lg">
                                ✓ {toast}
                            </div>
                        )}

                        {/* Identity Card */}
                        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-xl shrink-0">
                                🏥
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-bold text-lg leading-tight">{patient.name}</h3>
                                <p className="text-slate-400 text-sm mt-0.5">ID #{patient.id} · Age {patient.age} · {patient.ward}</p>
                                <p className="text-slate-500 text-xs mt-1">State: {patient.state || '—'}</p>
                                {patient.assigned_doctor && (
                                    <p className="text-indigo-400 text-xs mt-1">👨‍⚕️ {patient.assigned_doctor}</p>
                                )}
                            </div>
                            <div className="text-right shrink-0">
                                <div className={`text-2xl font-black ${riskColor(patient.risk_score)}`}>
                                    {(patient.risk_score * 100).toFixed(0)}
                                </div>
                                <div className={`text-xs font-bold ${riskColor(patient.risk_score)}`}>
                                    {riskLabel(patient.risk_score)} RISK
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleExport}
                                disabled={exporting}
                                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-400 hover:text-indigo-300 text-sm font-semibold py-2.5 rounded-xl transition-all"
                            >
                                {exporting ? '⟳ Exporting…' : '⬇ Export Data'}
                            </button>
                            <button
                                onClick={() => setEditing(!editing)}
                                className={`flex-1 flex items-center justify-center gap-2 border text-sm font-semibold py-2.5 rounded-xl transition-all ${editing
                                    ? 'bg-amber-600/20 border-amber-500/40 text-amber-400'
                                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:text-white hover:border-slate-500'}`}
                            >
                                {editing ? '✕ Cancel Edit' : '✏ Edit Record'}
                            </button>
                        </div>

                        {/* Edit Form */}
                        {editing && (
                            <div className="bg-amber-900/10 border border-amber-700/30 rounded-xl p-5 flex flex-col gap-4">
                                <h4 className="text-amber-400 text-sm font-semibold uppercase tracking-wider">Edit Patient Record</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-400 text-xs mb-1">Age</label>
                                        <input type="number" className="input-dark w-full" value={editForm.age || ''} onChange={(e) => setEditForm({ ...editForm, age: parseInt(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-xs mb-1">Ward</label>
                                        <input
                                            type="text"
                                            className={`input-dark w-full ${isNurse ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            value={editForm.ward || ''}
                                            onChange={(e) => !isNurse && setEditForm({ ...editForm, ward: e.target.value })}
                                            disabled={isNurse}
                                            title={isNurse ? "Nurses cannot edit ward" : ""}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-xs mb-1">State</label>
                                        <input type="text" className="input-dark w-full" value={editForm.state || ''} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-xs mb-1">Risk Score (0–1)</label>
                                        <input
                                            type="number" step="0.01" min="0" max="1"
                                            className={`input-dark w-full ${isNurse ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            value={editForm.risk_score || ''}
                                            onChange={(e) => !isNurse && setEditForm({ ...editForm, risk_score: parseFloat(e.target.value) })}
                                            disabled={isNurse}
                                            title={isNurse ? "Nurses cannot edit risk score" : ""}
                                        />
                                    </div>
                                </div>
                                <button onClick={handleSave} disabled={saving} className="btn-primary py-2.5">
                                    {saving ? 'Saving…' : '✓ Save Changes'}
                                </button>
                            </div>
                        )}

                        {/* Scheme Eligibility */}
                        <div>
                            <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Scheme Eligibility</h4>
                            {patient.scheme_eligible?.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {patient.scheme_eligible.map((s) => (
                                        <span key={s} className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 text-xs px-3 py-1.5 rounded-lg font-medium">
                                            ✓ {s}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-600 text-sm">No schemes applicable</p>
                            )}
                        </div>

                        {/* Risk Meter */}
                        <div>
                            <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Risk Assessment</h4>
                            <div className="bg-slate-800 rounded-full h-3 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${patient.risk_score >= 0.65 ? 'bg-red-500' : patient.risk_score >= 0.35 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${(patient.risk_score * 100).toFixed(0)}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-1 text-xs text-slate-500">
                                <span>Low</span>
                                <span className={`font-semibold ${riskColor(patient.risk_score)}`}>{(patient.risk_score * 100).toFixed(1)}%</span>
                                <span>High</span>
                            </div>
                        </div>

                        {/* Medical Details */}
                        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
                            <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">Medical Record</h4>
                            <div className="grid grid-cols-2 gap-y-4">
                                {[
                                    ['Patient Name', patient.name],
                                    ['Age', `${patient.age} years`],
                                    ['Ward', patient.ward],
                                    ['State', patient.state || '—'],
                                    ['Risk Score', `${(patient.risk_score * 100).toFixed(1)}%`],
                                    ['Registered', new Date(patient.created_at).toLocaleDateString('en-IN')],
                                ].map(([label, value]) => (
                                    <div key={label}>
                                        <p className="text-slate-500 text-xs">{label}</p>
                                        <p className="text-slate-200 text-sm font-medium mt-0.5">{value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p className="text-slate-600 text-xs text-center">
                            🔒 This access has been logged · SecureHealth AI
                        </p>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
