import React from 'react'

const sevBadge = {
    low: 'badge-low',
    medium: 'badge-medium',
    high: 'badge-high',
    critical: 'badge-critical',
}

const sevBorder = {
    low: 'border-emerald-500/30',
    medium: 'border-amber-500/30',
    high: 'border-orange-500/30',
    critical: 'border-red-500/40',
}

function fmt(dt) {
    if (!dt) return '—'
    return new Date(dt).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

export default function ThreatCard({ alert, onResolve }) {
    const sev = alert.severity || 'medium'

    return (
        <div className={`bg-slate-800 border ${sevBorder[sev] || 'border-slate-700'} rounded-xl p-4 flex items-start justify-between gap-4`}>
            <div className="flex flex-col gap-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={sevBadge[sev] || 'badge-medium'}>{sev.toUpperCase()}</span>
                    <span className="text-white text-sm font-semibold capitalize">
                        {(alert.alert_type || 'anomaly').replace(/_/g, ' ')}
                    </span>
                    {alert.auto_locked === 1 && (
                        <span className="bg-red-900/40 text-red-400 text-xs font-medium px-2 py-0.5 rounded-full">
                            🔒 Auto-Locked
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400">
                    <span>User ID: <span className="text-slate-200 font-medium">{alert.user_id}</span></span>
                    <span>Alert ID: <span className="text-slate-200 font-medium">#{alert.id}</span></span>
                    <span>Time: <span className="text-slate-200">{fmt(alert.created_at)}</span></span>
                </div>
            </div>

            {onResolve && (
                <button
                    onClick={() => onResolve(alert.id)}
                    className="shrink-0 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                    Resolve
                </button>
            )}
        </div>
    )
}
