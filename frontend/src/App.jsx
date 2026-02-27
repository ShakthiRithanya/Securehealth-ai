import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import ThreatHunterPage from './pages/ThreatHunterPage'
import AuditLogPage from './pages/AuditLogPage'
import DoctorDashboard from './pages/DoctorDashboard'
import PrivacyQueryPage from './pages/PrivacyQueryPage'
import NurseDashboard from './pages/NurseDashboard'

function Guard({ children, roles }) {
    const { user } = useAuth()

    if (!user) return <Navigate to="/" replace />

    if (roles && !roles.includes(user.role)) {
        if (user.role === 'admin') return <Navigate to="/admin" replace />
        if (user.role === 'doctor') return <Navigate to="/doctor" replace />
        return <Navigate to="/nurse" replace />
    }

    return children
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Login />} />

            <Route
                path="/admin"
                element={<Guard roles={['admin']}><AdminDashboard /></Guard>}
            />
            <Route
                path="/admin/threat-hunter"
                element={<Guard roles={['admin']}><ThreatHunterPage /></Guard>}
            />
            <Route
                path="/admin/audit-logs"
                element={<Guard roles={['admin']}><AuditLogPage /></Guard>}
            />

            <Route
                path="/doctor"
                element={<Guard roles={['doctor', 'admin']}><DoctorDashboard /></Guard>}
            />
            <Route
                path="/doctor/query"
                element={<Guard roles={['doctor', 'admin']}><PrivacyQueryPage /></Guard>}
            />

            <Route
                path="/nurse"
                element={<Guard roles={['nurse']}><NurseDashboard /></Guard>}
            />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}
