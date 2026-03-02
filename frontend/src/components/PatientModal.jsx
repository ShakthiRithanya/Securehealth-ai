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
                setEditForm({
                    age: data.age,
                    ward: data.ward,
                    risk_score: data.risk_score,
                    scheme_eligible: Array.isArray(data.scheme_eligible) ? data.scheme_eligible.join(', ') : ''
                })
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
            const payload = {
                ...editForm,
                scheme_eligible: editForm.scheme_eligible
                    ? editForm.scheme_eligible.split(',').map(s => s.trim()).filter(Boolean)
                    : []
            }
            if (isNurse) {
                delete payload.ward
                delete payload.risk_score
                delete payload.scheme_eligible
            }
            const { data } = await api.patch(`/patients/${patientId}`, payload)
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
                {}
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
                        {}
                        {toast && (
                            <div className="bg-emerald-900/40 border border-emerald-700/50 text-emerald-400 text-sm px-4 py-2.5 rounded-lg">
                                ✓ {toast}
                            </div>
                        )}
                        {}
                        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-xl shrink-0">
                                🏥
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-bold text-lg leading-tight">{patient.name}</h3>
                                <p className="text-slate-400 text-sm mt-0.5">ID #{patient.id} · Age {patient.age} · {patient.ward}</p>
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
                        {}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                                <h4 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Primary Diagnosis</h4>
                                <p className="text-white font-bold text-base">{patient.diagnosis || 'Pending Assessment'}</p>
                                <div className="mt-3 flex flex-col gap-1">
                                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-tight">Clinical Note</p>
                                    <p className="text-slate-400 text-xs leading-relaxed italic">
                                        "{patient.medical_records?.last_assessment || 'No recent clinical notes available.'}"
                                    </p>
                                </div>
                            </div>
                            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                                <h4 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Latest Vitals</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-slate-500 text-[10px] uppercase">Blood Pressure</p>
                                        <p className="text-indigo-300 font-bold text-sm">{patient.medical_records?.vital_signs?.bp || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-[10px] uppercase">Heart Rate</p>
                                        <p className="text-rose-400 font-bold text-sm">{patient.medical_records?.vital_signs?.hr || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-[10px] uppercase">Temperature</p>
                                        <p className="text-orange-400 font-bold text-sm">{patient.medical_records?.vital_signs?.temp || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-[10px] uppercase">SpO2</p>
                                        <p className="text-emerald-400 font-bold text-sm">{patient.medical_records?.vital_signs?.spo2 || '98%'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                                <h4 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Current Medications
                                </h4>
                                <div className="flex flex-col gap-2">
                                    {(patient.medical_records?.medications || []).map((med, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-blue-500/5 border border-blue-500/10 px-3 py-2 rounded-lg">
                                            <span className="text-slate-300 text-xs font-medium">{med}</span>
                                            <span className="text-slate-500 text-[10px]">Oral</span>
                                        </div>
                                    ))}
                                    {(!patient.medical_records?.medications?.length) && <p className="text-slate-600 text-xs italic">No active prescriptions</p>}
                                </div>
                            </div>
                            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                                <h4 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Procedures & Scans
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {(patient.medical_records?.treatments || []).map((tr, idx) => (
                                        <span key={idx} className="bg-slate-700/50 text-slate-300 px-3 py-1.5 rounded-full text-[10px] font-bold border border-slate-600">
                                            {tr.toUpperCase()}
                                        </span>
                                    ))}
                                    {(!patient.medical_records?.treatments?.length) && <p className="text-slate-600 text-xs italic">No pending procedures</p>}
                                </div>
                            </div>
                        </div>
                        {}
                        <div className="flex gap-3">
                            <button
                                onClick={handleExport}
                                disabled={exporting}
                                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-400 hover:text-indigo-300 text-sm font-semibold py-2.5 rounded-xl transition-all"
                            >
                                {exporting ? '⟳ Exporting…' : '⬇ Export Medical Summary'}
                            </button>
                            <button
                                onClick={() => setEditing(!editing)}
                                className={`flex-1 flex items-center justify-center gap-2 border text-sm font-semibold py-2.5 rounded-xl transition-all ${editing
                                    ? 'bg-amber-600/20 border-amber-500/40 text-amber-400'
                                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:text-white hover:border-slate-500'}`}
                            >
                                {editing ? '✕ Cancel' : '✏ Update Vitals'}
                            </button>
                        </div>
                        {}
                        {editing && (
                            <div className="bg-amber-900/10 border border-amber-700/30 rounded-xl p-5 flex flex-col gap-4">
                                <h4 className="text-amber-400 text-sm font-semibold uppercase tracking-wider">Update Patient Record</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-400 text-xs mb-1">Diagnosis</label>
                                        <input type="text" className="input-dark w-full" value={editForm.diagnosis || ''} onChange={(e) => setEditForm({ ...editForm, diagnosis: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-xs mb-1">Ward</label>
                                        <input
                                            type="text"
                                            className={`input-dark w-full ${isNurse ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            value={editForm.ward}
                                            disabled={isNurse}
                                        />
                                    </div>
                                </div>
                                <button onClick={handleSave} disabled={saving} className="btn-primary py-2.5">
                                    {saving ? 'Saving…' : '✓ Commit Update'}
                                </button>
                            </div>
                        )}
                        {}
                        <div>
                            <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Scheme Support</h4>
                            {patient.scheme_eligible?.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {patient.scheme_eligible.map((s) => (
                                        <span key={s} className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 text-[10px] px-3 py-1 rounded-lg font-bold">
                                            ✓ {s.toUpperCase()}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-600 text-sm italic">No insurance/scheme coverage found</p>
                            )}
                        </div>
                        {}
                        <div className="bg-slate-800/20 border border-slate-700/30 rounded-xl p-4">
                            <h4 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">Staff Assignment</h4>
                            <div className="flex flex-wrap gap-6">
                                <div>
                                    <p className="text-slate-500 text-[10px] uppercase">Assigned Doctor</p>
                                    <p className="text-slate-300 text-xs font-bold">{patient.assigned_doctor}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-[10px] uppercase">Registered on</p>
                                    <p className="text-slate-300 text-xs font-bold">{new Date(patient.created_at).toLocaleDateString('en-IN')}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-[10px] uppercase">Ward Unit</p>
                                    <p className="text-slate-300 text-xs font-bold">{patient.ward}</p>
                                </div>
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
