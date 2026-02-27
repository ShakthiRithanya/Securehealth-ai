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
        <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_#1e1b4b_0%,_#0a0f1e_60%)]">
            <div className="w-full max-w-md px-4">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🛡️</div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">SecureHealth AI</h1>
                    <p className="text-slate-400 mt-2 text-sm">Hospital Security & Access Control</p>
                    <p className="text-xs text-indigo-400/70 mt-1">Powered by AI Agents · Indian Healthcare</p>
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
                    Demo: admin1@securehealth.in · Doctor@123
                </p>
            </div>
        </div>
    )
}
