import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
export default function Login() {
    const { login } = useAuth()
    const nav = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [err, setErr] = useState('')
    const [busy, setBusy] = useState(false)
    const handleSubmit = async (e) => {
        e.preventDefault()
        setErr('')
        setBusy(true)
        try {
            const user = await login(email, password)
            if (user.role === 'admin') nav('/admin')
            else if (user.role === 'doctor') nav('/doctor')
            else nav('/nurse')
        } catch {
            setErr('Invalid credentials or account locked')
        } finally {
            setBusy(false)
        }
    }
    return (
        <div className="min-h-screen flex items-center justify-center bg-transparent relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1e1b4b_0%,_#050510_70%)] -z-10"></div>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse pointer-events-none"></div>

            <div className="w-full max-w-md px-4 animate-fade-in z-10">
                <div className="text-center mb-10">
                    <div className="text-6xl mb-4 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">🛡️</div>
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tight drop-shadow-sm">SecureHealth AI</h1>
                    <p className="text-slate-400 mt-2 text-sm font-medium tracking-wide">Hospital Security & Access Control</p>
                </div>
                <form onSubmit={handleSubmit} className="card flex flex-col gap-4 shadow-2xl shadow-black/40">
                    <div>
                        <label className="block text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1.5">
                            Email
                        </label>
                        <input
                            id="login-email"
                            type="email"
                            className="input-dark"
                            placeholder="doctor@securehealth.in"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1.5">
                            Password
                        </label>
                        <input
                            id="login-password"
                            type="password"
                            className="input-dark"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {err && (
                        <p className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
                            {err}
                        </p>
                    )}
                    <button type="submit" disabled={busy} className="btn-primary mt-1 py-3 text-base">
                        {busy ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>
                <p className="text-center text-slate-600 text-xs mt-5">
                    Admin: admin1@securehealth.in · Admin@123
                </p>
                <p className="text-center text-slate-600 text-xs mt-1">
                    Doctor: doctor1@securehealth.in · Doctor@123 &nbsp;|&nbsp; Nurse: nurse1@securehealth.in · Nurse@123
                </p>
            </div>
        </div>
    )
}
