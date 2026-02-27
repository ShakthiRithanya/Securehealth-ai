import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const roleMeta = {
    admin: { label: 'Admin', cls: 'bg-purple-500/20 text-purple-400' },
    doctor: { label: 'Doctor', cls: 'bg-blue-500/20 text-blue-400' },
    nurse: { label: 'Nurse', cls: 'bg-teal-500/20 text-teal-400' },
}

const linkCls = 'text-slate-400 hover:text-white text-sm font-medium transition-colors duration-150'

export default function Navbar() {
    const { user, logout, isAdmin, isDoctor, isNurse } = useAuth()
    const nav = useNavigate()

    const handleLogout = () => {
        logout()
        nav('/')
    }

    const meta = roleMeta[user?.role] || { label: user?.role, cls: 'bg-slate-700 text-slate-300' }

    return (
        <nav className="bg-slate-900/95 backdrop-blur border-b border-slate-700/60 px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-10">
                <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🛡️</span>
                    <span className="text-white font-bold text-base tracking-tight">
                        Secure<span className="text-indigo-400">Health</span> AI
                    </span>
                </div>
                <div className="flex items-center gap-6">
                    {isAdmin() && (
                        <>
                            <Link to="/admin" className={linkCls}>Dashboard</Link>
                            <Link to="/admin/threat-hunter" className={linkCls}>Threat Hunter</Link>
                            <Link to="/admin/audit-logs" className={linkCls}>Audit Logs</Link>
                        </>
                    )}
                    {isDoctor() && (
                        <>
                            <Link to="/doctor" className={linkCls}>Dashboard</Link>
                            <Link to="/doctor/query" className={linkCls}>Privacy Query</Link>
                        </>
                    )}
                    {isNurse() && (
                        <Link to="/nurse" className={linkCls}>Dashboard</Link>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <span className="text-slate-300 text-sm font-medium">{user?.name}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.cls}`}>
                    {meta.label}
                </span>
                <button onClick={handleLogout} className="btn-ghost text-sm py-1.5 px-3">
                    Logout
                </button>
            </div>
        </nav>
    )
}
