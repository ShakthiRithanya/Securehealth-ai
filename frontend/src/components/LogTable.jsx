import React, { useState } from 'react'

const COLS = [
    { key: 'timestamp', label: 'Timestamp' },
    { key: 'user_name', label: 'User' },
    { key: 'action', label: 'Action' },
    { key: 'resource', label: 'Resource' },
    { key: 'ip_address', label: 'IP' },
    { key: 'anomaly_score', label: 'Score' },
    { key: 'flagged', label: 'Flagged' },
]

const PAGE_SIZE = 50

function fmtDt(v) {
    if (!v) return '—'
    return new Date(v).toLocaleString('en-IN', {
        day: '2-digit', month: 'short',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
}

export default function LogTable({ logs = [] }) {
    const [sortKey, setSortKey] = useState('timestamp')
    const [sortAsc, setSortAsc] = useState(false)
    const [page, setPage] = useState(0)

    const sorted = [...logs].sort((a, b) => {
        let va = a[sortKey], vb = b[sortKey]
        if (sortKey === 'timestamp') {
            va = new Date(va).getTime()
            vb = new Date(vb).getTime()
        }
        if (va < vb) return sortAsc ? -1 : 1
        if (va > vb) return sortAsc ? 1 : -1
        return 0
    })

    const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
    const visible = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

    const handleSort = (key) => {
        if (key !== 'timestamp' && key !== 'anomaly_score') return
        if (sortKey === key) {
            setSortAsc(!sortAsc)
        } else {
            setSortKey(key)
            setSortAsc(false)
        }
        setPage(0)
    }

    const rowCls = (row) => {
        if (row.flagged === 1 && row.anomaly_score > 0.7) return 'bg-red-900/20 border-l-2 border-red-500'
        if (row.flagged === 1) return 'bg-amber-900/15 border-l-2 border-amber-500'
        if (row.anomaly_score > 0.7) return 'bg-orange-900/10'
        return ''
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="overflow-x-auto rounded-xl border border-slate-700">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-700 bg-slate-800/60">
                            {COLS.map((c) => (
                                <th
                                    key={c.key}
                                    onClick={() => handleSort(c.key)}
                                    className={`text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider ${c.key === 'timestamp' || c.key === 'anomaly_score'
                                        ? 'cursor-pointer hover:text-white select-none'
                                        : ''
                                        }`}
                                >
                                    {c.label}
                                    {sortKey === c.key && (
                                        <span className="ml-1 text-indigo-400">{sortAsc ? '↑' : '↓'}</span>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {visible.length === 0 && (
                            <tr>
                                <td colSpan={COLS.length} className="text-center text-slate-500 py-10">
                                    No logs found
                                </td>
                            </tr>
                        )}
                        {visible.map((row, i) => (
                            <tr key={row.id || i} className={`border-b border-slate-700/40 hover:bg-slate-700/20 transition-colors ${rowCls(row)}`}>
                                <td className="px-4 py-2.5 text-slate-300 whitespace-nowrap">{fmtDt(row.timestamp)}</td>
                                <td className="px-4 py-2.5 text-slate-300">{row.user_name || row.user_id}</td>
                                <td className="px-4 py-2.5">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${row.action === 'EXPORT' ? 'bg-red-500/20 text-red-400' :
                                        row.action === 'EDIT' ? 'bg-amber-500/20 text-amber-400' :
                                            'bg-slate-600/40 text-slate-300'
                                        }`}>{row.action}</span>
                                </td>
                                <td className="px-4 py-2.5 text-slate-400 text-xs">{row.resource}</td>
                                <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">{row.ip_address}</td>
                                <td className="px-4 py-2.5">
                                    <span className={`font-mono text-xs font-bold ${row.anomaly_score > 0.7 ? 'text-red-400' :
                                        row.anomaly_score > 0.4 ? 'text-amber-400' :
                                            'text-slate-400'
                                        }`}>{(row.anomaly_score || 0).toFixed(3)}</span>
                                </td>
                                <td className="px-4 py-2.5">
                                    {row.flagged === 1 ? (
                                        <span className="text-amber-400 font-bold text-xs">⚠ YES</span>
                                    ) : (
                                        <span className="text-slate-600 text-xs">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length} logs</span>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 0}
                            onClick={() => setPage(page - 1)}
                            className="btn-ghost text-xs px-3 py-1 disabled:opacity-40"
                        >← Prev</button>
                        <button
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(page + 1)}
                            className="btn-ghost text-xs px-3 py-1 disabled:opacity-40"
                        >Next →</button>
                    </div>
                </div>
            )}
        </div>
    )
}

