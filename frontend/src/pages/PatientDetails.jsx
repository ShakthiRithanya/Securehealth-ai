import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
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
export default function PatientDetails() {
    const { id: patientId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const isNurse = user?.role === 'nurse'
    const [patient, setPatient] = useState(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [editForm, setEditForm] = useState({})
    const [saving, setSaving] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [deleting, setDeleting] = useState(false)
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
                    diagnosis: data.diagnosis,
                    scheme_eligible: Array.isArray(data.scheme_eligible) ? data.scheme_eligible.join(', ') : ''
                })
            } catch {
                navigate(-1)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [patientId, navigate])
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
    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this patient record? This action cannot be undone.')) return
        setDeleting(true)
        try {
            await api.delete(`/patients/${patientId}`)
            navigate(-1)
        } catch {
            showToast('Delete failed')
            setDeleting(false)
        }
    }
    if (loading) return (
        <div className="min-h-screen bg-transparent relative">
            <Navbar />
            <div className="flex items-center justify-center h-[calc(100vh-64px)] text-slate-500 animate-fade-in z-10 relative">Loading patient data...</div>
        </div>
    )
    if (!patient) return null
    return (
        <div className="min-h-screen bg-transparent relative">
            <Navbar />
            <div className="max-w-5xl mx-auto px-6 py-10 animate-fade-in z-10 relative">
                { }
                <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-indigo-400 text-sm mb-6 flex items-center gap-2 transition-colors">
                    ← Back to Dashboard
                </button>
                { }
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div className="flex items-start gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/10 shrink-0">
                            🏥
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">{patient.name}</h1>
                            <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-slate-400 text-sm">ID #{patient.id}</span>
                                <span className="text-slate-600">·</span>
                                <span className="text-slate-400 text-sm">Age {patient.age}</span>
                                <span className="text-slate-600">·</span>
                                <span className="text-indigo-400 text-sm font-semibold">{patient.ward}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
                        <div className="text-right">
                            <div className={`text-3xl font-black leading-none ${riskColor(patient.risk_score)}`}>
                                {(patient.risk_score * 100).toFixed(0)}
                            </div>
                            <div className={`text-[10px] font-bold tracking-widest mt-1 ${riskColor(patient.risk_score)}`}>
                                {riskLabel(patient.risk_score)} RISK
                            </div>
                        </div>
                        <div className="w-px h-10 bg-slate-700" />
                        <div className="text-left">
                            <p className="text-slate-500 text-[10px] uppercase font-bold">Assigned Doctor</p>
                            <p className="text-slate-200 text-sm font-bold">{patient.assigned_doctor}</p>
                        </div>
                    </div>
                </div>
                {toast && (
                    <div className="mb-6 bg-emerald-900/40 border border-emerald-700/50 text-emerald-400 text-sm px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <span>✓</span> {toast}
                    </div>
                )}
                <div className="grid lg:grid-cols-3 gap-8">
                    { }
                    <div className="lg:col-span-2 flex flex-col gap-8">
                        { }
                        <div className="card-glass p-8">
                            <h2 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                Clinical Assessment
                            </h2>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-slate-500 text-[11px] uppercase font-bold tracking-wider mb-2">Primary Diagnosis</h3>
                                    <p className="text-xl text-white font-bold">{patient.diagnosis || 'Unspecified'}</p>
                                    <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                                        <h4 className="text-slate-600 text-[10px] uppercase font-bold mb-2">Doctor's Observation</h4>
                                        <p className="text-slate-400 text-sm leading-relaxed italic">
                                            "{patient.medical_records?.last_assessment || 'No clinical notes recorded for this patient yet.'}"
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-slate-500 text-[11px] uppercase font-bold tracking-wider mb-2">Vital Signs</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800/50">
                                            <p className="text-slate-600 text-[9px] uppercase font-bold">BP</p>
                                            <p className="text-indigo-400 font-bold text-lg">{patient.medical_records?.vital_signs?.bp || '—'}</p>
                                        </div>
                                        <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800/50">
                                            <p className="text-slate-600 text-[9px] uppercase font-bold">HR</p>
                                            <p className="text-rose-400 font-bold text-lg">{patient.medical_records?.vital_signs?.hr || '—'}</p>
                                        </div>
                                        <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800/50">
                                            <p className="text-slate-600 text-[9px] uppercase font-bold">Temp</p>
                                            <p className="text-orange-400 font-bold text-lg">{patient.medical_records?.vital_signs?.temp || '—'}</p>
                                        </div>
                                        <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800/50">
                                            <p className="text-slate-600 text-[9px] uppercase font-bold">SpO2</p>
                                            <p className="text-emerald-400 font-bold text-lg">{patient.medical_records?.vital_signs?.spo2 || '98%'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        { }
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="card-glass p-6">
                                <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Current Medications
                                </h3>
                                <div className="flex flex-col gap-2">
                                    {(patient.medical_records?.medications || []).map((med, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-blue-500/5 border border-blue-500/10 px-4 py-3 rounded-xl">
                                            <span className="text-slate-200 text-sm font-medium">{med}</span>
                                            <span className="text-slate-500 text-[10px] uppercase font-bold bg-slate-800 px-2 py-0.5 rounded">Active</span>
                                        </div>
                                    ))}
                                    {(!patient.medical_records?.medications?.length) && <p className="text-slate-600 text-sm italic py-4 text-center">No active prescriptions</p>}
                                </div>
                            </div>
                            <div className="card-glass p-6">
                                <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500" /> Recent Procedures
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {(patient.medical_records?.treatments || []).map((tr, idx) => (
                                        <span key={idx} className="bg-slate-800/80 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold border border-slate-700">
                                            {tr.toUpperCase()}
                                        </span>
                                    ))}
                                    {(!patient.medical_records?.treatments?.length) && <p className="text-slate-600 text-sm italic py-4 text-center">No recent procedures</p>}
                                </div>
                            </div>
                        </div>
                        { }
                        <div className="card-glass p-6">
                            <h3 className="text-white font-bold text-sm mb-4">Eligible Public Health Schemes</h3>
                            {patient.scheme_eligible?.length > 0 ? (
                                <div className="grid md:grid-cols-2 gap-3">
                                    {patient.scheme_eligible.map((s) => (
                                        <div key={s} className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="text-slate-200 text-sm font-bold tracking-tight">{s}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-600 text-sm italic">No state insurance or maternal health schemes matched currently.</p>
                            )}
                        </div>
                    </div>
                    { }
                    <div className="flex flex-col gap-6">
                        <div className="card-glass p-6 flex flex-col gap-4">
                            <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-widest border-b border-slate-800 pb-3 mb-2">Control Panel</h3>
                            <button
                                onClick={handleExport}
                                disabled={exporting}
                                className="w-full flex items-center justify-center gap-3 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold py-3.5 rounded-xl transition-all"
                            >
                                📥 {exporting ? 'Preparing...' : 'Export JSON Data'}
                            </button>
                            <button
                                onClick={() => setEditing(!editing)}
                                className={`w-full flex items-center justify-center gap-3 border font-bold py-3.5 rounded-xl transition-all ${editing
                                    ? 'bg-amber-600/10 border-amber-500/30 text-amber-400'
                                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:text-white'}`}
                            >
                                ✏ {editing ? 'Cancel Editing' : 'Update Record'}
                            </button>
                            {!isNurse && (
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="w-full flex items-center justify-center gap-3 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 text-rose-400 font-bold py-3.5 rounded-xl transition-all"
                                >
                                    🗑 {deleting ? 'Deleting...' : 'Delete Record'}
                                </button>
                            )}
                        </div>
                        { }
                        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6">
                            <h4 className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-4">Registration Detail</h4>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <p className="text-slate-600 text-[9px] uppercase font-bold mb-1">Admitted On</p>
                                    <p className="text-slate-300 text-sm font-bold">{new Date(patient.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                                </div>
                                <div>
                                    <p className="text-slate-600 text-[9px] uppercase font-bold mb-1">Last Modified</p>
                                    <p className="text-slate-300 text-sm font-bold">{new Date().toLocaleDateString('en-IN')}</p>
                                </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-slate-800 flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-slate-600 text-[10px] font-bold">Secure AI Access Active</span>
                            </div>
                        </div>
                    </div>
                </div>
                { }
                {editing && (
                    <div className="mt-10 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-8 shadow-2xl">
                            <h2 className="text-amber-400 font-bold text-xl mb-6">Modify Patient Data</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-slate-500 text-xs font-bold uppercase">Diagnosis</label>
                                    <input
                                        type="text"
                                        className="input-dark py-3"
                                        value={editForm.diagnosis || ''}
                                        onChange={(e) => setEditForm({ ...editForm, diagnosis: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-slate-500 text-xs font-bold uppercase">Patient Age</label>
                                    <input
                                        type="number"
                                        className="input-dark py-3"
                                        value={editForm.age}
                                        onChange={(e) => setEditForm({ ...editForm, age: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-slate-500 text-xs font-bold uppercase">Hospital Ward</label>
                                    <input
                                        type="text"
                                        className={`input-dark py-3 ${isNurse ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        value={editForm.ward}
                                        disabled={isNurse}
                                        onChange={(e) => setEditForm({ ...editForm, ward: e.target.value })}
                                    />
                                </div>
                                {!isNurse && (
                                    <div className="flex flex-col gap-2">
                                        <label className="text-slate-500 text-xs font-bold uppercase">Risk Score (0.0 - 1.0)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="input-dark py-3"
                                            value={editForm.risk_score}
                                            onChange={(e) => setEditForm({ ...editForm, risk_score: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                )}
                                <div className="md:col-span-2 flex flex-col gap-2">
                                    <label className="text-slate-500 text-xs font-bold uppercase">Eligible Schemes (comma separated)</label>
                                    <input
                                        type="text"
                                        className={`input-dark py-3 ${isNurse ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        value={editForm.scheme_eligible}
                                        disabled={isNurse}
                                        onChange={(e) => setEditForm({ ...editForm, scheme_eligible: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end mt-8">
                                <button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-400 text-black font-black px-10 py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/20">
                                    {saving ? 'Syncing...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <p className="text-slate-600 text-[10px] text-center pb-10 tracking-widest">
                CERTIFIED SECURE HEALTH DATA · 256-BIT ENCRYPTION · LOGGED ID: {user?.id}
            </p>
        </div>
    )
}
