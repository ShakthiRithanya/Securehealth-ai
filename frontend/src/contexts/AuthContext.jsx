import React, { createContext, useContext, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const storedUser = JSON.parse(localStorage.getItem('securehealth_user') || 'null')
    const storedToken = localStorage.getItem('securehealth_token') || null

    const [user, setUser] = useState(storedUser)
    const [token, setToken] = useState(storedToken)

    const login = async (email, password) => {
        const form = new FormData()
        form.append('username', email)
        form.append('password', password)

        const { data } = await api.post('/auth/login', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })

        const info = {
            id: data.user_id,
            name: data.name,
            role: data.role,
            department: data.department,
        }

        localStorage.setItem('securehealth_token', data.access_token)
        localStorage.setItem('securehealth_user', JSON.stringify(info))
        setToken(data.access_token)
        setUser(info)
        return info
    }

    const logout = () => {
        localStorage.removeItem('securehealth_token')
        localStorage.removeItem('securehealth_user')
        setUser(null)
        setToken(null)
    }

    const isAdmin = () => user?.role === 'admin'
    const isDoctor = () => user?.role === 'doctor'
    const isNurse = () => user?.role === 'nurse'

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAdmin, isDoctor, isNurse }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
