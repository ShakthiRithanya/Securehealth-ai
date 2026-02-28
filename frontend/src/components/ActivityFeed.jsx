import React from 'react'

const actionStyle = {
    VIEW: 'bg-slate-600/40 text-slate-300',
    EXPORT: 'bg-red-500/20 text-red-400',
    EDIT: 'bg-amber-500/20 text-amber-400',
    LOGIN: 'bg-emerald-500/20 text-emerald-400',
    LOGOUT: 'bg-slate-600/30 text-slate-400',
}

const roleIcon = { admin: '🛡️', doctor: '👨‍⚕️', nurse: '👩‍⚕️' }

function fmtTime(v) {
    if (!v) return '—'
    return new Date(v).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function ActivityFeed({ events = [], maxItems = 15, title = 'Live Activity' }) {
    const visible = events.slice(0, maxItems)

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-white font-semibold text-sm">{title}</h3>
                {events.length > 0 && (
                    <span className="ml-auto text-xs text-slate-500">{events.length} event{events.length !== 1 ? 's' : ''}</span>
                )}
            </div>

            {visible.length === 0 ? (
                <div className="text-center py-8 text-slate-600 text-sm">
                    <p className="text-2xl mb-2">📋</p>
                    <p>No activity yet — actions on patient data will appear here live</p>
                </div>
            ) : (
                <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto pr-1">
                    {visible.map((e, i) => (
                        <div
                            key={e.log_id || i}
                            className="flex items-start gap-3 bg-slate-800/50 border border-slate-700/40 rounded-lg px-3 py-2.5 hover:bg-slate-800 transition-colors"
                        >
                            <span className="text-base mt-0.5 shrink-0">{roleIcon[e.user_role] || '👤'}</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-slate-200 text-xs font-semibold">{e.user_name}</span>
                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${actionStyle[e.action] || actionStyle.VIEW}`}>
                                        {e.action}
                                    </span>
                                    <span className="text-slate-400 text-xs truncate">{e.patient_name}</span>
                                </div>
                                <p className="text-slate-500 text-xs mt-0.5">{e.resource?.replace(/_/g, ' ')} · {fmtTime(e.timestamp)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
