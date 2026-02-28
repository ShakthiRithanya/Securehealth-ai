import React, { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import LogTable from '../components/LogTable'
import api from '../api/client'

const ACTIONS = ['', 'VIEW', 'EDIT', 'EXPORT', 'LOGIN', 'LOGOUT']

function toCSV(rows) {
    const headers = ['id', 'user_id', 'patient_id', 'action', 'resource', 'ip_address', 'timestamp', 'anomaly_score', 'flagged']
    const lines = [headers.join(',')]
    for (const r of rows) {
        lines.push(headers.map((h) => JSON.stringify(r[h] ?? '')).join(','))
    }
    return lines.join('\n')
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

export default function AuditLogPage() {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(false)
    const [userId, setUserId] = useState('')
    const [action, setAction] = useState('')
    const [flaggedOnly, setFlaggedOnly] = useState(false)
    const [fromDt, setFromDt] = useState('')
    const [toDt, setToDt] = useState('')
    const [limit, setLimit] = useState('100')
    const [resourceFilter, setResourceFilter] = useState('')
    const [ipFilter, setIpFilter] = useState('')

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (userId) params.append('user_id', userId)
            if (action) params.append('action', action)
            if (flaggedOnly) params.append('flagged', '1')
            if (fromDt) params.append('from_dt', fromDt)
            if (toDt) params.append('to_dt', toDt)
            params.append('limit', limit)
            const { data } = await api.get(`/logs/?${params.toString()}`)
            setLogs(data)
        } catch {
            setLogs([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchLogs() }, [userId, action, flaggedOnly, fromDt, toDt, limit])

    const filteredLogs = logs.filter((l) => {
        const matchResource = !resourceFilter || (l.resource || '').toLowerCase().includes(resourceFilter.toLowerCase())
        const matchIp = !ipFilter || (l.ip_address || '').toLowerCase().includes(ipFilter.toLowerCase())
        return matchResource && matchIp
    })

    return (
        <div className="min-h-screen bg-surface-900">
            <Navbar />
            <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
                        <p className="text-slate-400 text-sm mt-1">Full access history with anomaly scores</p>
                    </div>
                    <button
                        onClick={() => downloadCSV(toCSV(logs), `audit_logs_${Date.now()}.csv`)}
                        className="btn-ghost text-sm flex items-center gap-2"
                    >
                        ⬇ Export CSV
                    </button>
                </div>

                <div className="card flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-slate-400 text-xs font-semibold mb-1">User ID</label>
                        <input
                            className="input-dark w-28"
                            type="number"
                            placeholder="All"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs font-semibold mb-1">Action</label>
                        <select
                            className="input-dark"
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                        >
                            {ACTIONS.map((a) => <option key={a} value={a}>{a || 'All'}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs font-semibold mb-1">From</label>
                        <input
                            className="input-dark"
                            type="datetime-local"
                            value={fromDt}
                            onChange={(e) => setFromDt(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs font-semibold mb-1">To</label>
                        <input
                            className="input-dark"
                            type="datetime-local"
                            value={toDt}
                            onChange={(e) => setToDt(e.target.value)}
                        />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pb-1">
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded accent-indigo-500"
                            checked={flaggedOnly}
                            onChange={(e) => setFlaggedOnly(e.target.checked)}
                        />
                        <span className="text-slate-300 text-sm">Flagged only</span>
                    </label>
                    <div className="flex items-center gap-4 border-t border-slate-700/50 pt-4 mt-2 w-full">
                        <div>
                            <label className="block text-slate-400 text-xs font-semibold mb-1">Resource</label>
                            <input
                                className="input-dark w-40"
                                placeholder="e.g. patient_record"
                                value={resourceFilter}
                                onChange={(e) => setResourceFilter(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs font-semibold mb-1">IP Address</label>
                            <input
                                className="input-dark w-40"
                                placeholder="127.0.0.1"
                                value={ipFilter}
                                onChange={(e) => setIpFilter(e.target.value)}
                            />
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <label className="text-slate-400 text-xs font-semibold">Show</label>
                            <select
                                className="input-dark w-24"
                                value={limit}
                                onChange={(e) => setLimit(e.target.value)}
                            >
                                <option value="50">50</option>
                                <option value="100">100</option>
                                <option value="200">200</option>
                                <option value="500">500</option>
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-slate-500">Loading query results…</div>
                ) : (
                    <LogTable logs={filteredLogs} />
                )}
            </div>
        </div>
    )
}
