import React from 'react'

export default function StatWidget({ label, value, accentColor = 'text-indigo-400', caption }) {
    return (
        <div className="card flex flex-col gap-1.5">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">{label}</p>
            <p className={`text-4xl font-bold ${accentColor}`}>{value}</p>
            {caption && <p className="text-slate-500 text-xs">{caption}</p>}
        </div>
    )
}
