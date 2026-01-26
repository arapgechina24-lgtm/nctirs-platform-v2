'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { login as apiLogin, register as apiRegister, User, LoginCredentials } from '@/lib/api'

interface AuthContextType {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>
    register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
    logout: () => void
}

interface RegisterData {
    email: string
    password: string
    name?: string
    agency?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'nctirs_auth'

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Load session from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            try {
                const { user, token } = JSON.parse(stored)
                setUser(user)
                setToken(token)
            } catch {
                localStorage.removeItem(STORAGE_KEY)
            }
        }
        setIsLoading(false)
    }, [])

    // Save session to localStorage
    const saveSession = useCallback((user: User, token: string) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }))
        setUser(user)
        setToken(token)
    }, [])

    // Clear session
    const clearSession = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY)
        setUser(null)
        setToken(null)
    }, [])

    // Login function
    const login = useCallback(async (credentials: LoginCredentials) => {
        try {
            const response = await apiLogin(credentials)
            saveSession(response.user, response.token)
            return { success: true }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Login failed'
            return { success: false, error: message }
        }
    }, [saveSession])

    // Register function
    const register = useCallback(async (data: RegisterData) => {
        try {
            const response = await apiRegister(data)
            // Auto-login after registration
            const loginResult = await apiLogin({ email: data.email, password: data.password })
            saveSession(loginResult.user, loginResult.token)
            return { success: true }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Registration failed'
            return { success: false, error: message }
        }
    }, [saveSession])

    // Logout function
    const logout = useCallback(() => {
        clearSession()
    }, [clearSession])

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

// HOC for protected routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
    return function ProtectedRoute(props: P) {
        const { isAuthenticated, isLoading } = useAuth()

        if (isLoading) {
            return (
                <div className="min-h-screen bg-black flex items-center justify-center">
                    <div className="text-green-500 font-mono animate-pulse">
                        AUTHENTICATING...
                    </div>
                </div>
            )
        }

        if (!isAuthenticated) {
            // Redirect to login
            if (typeof window !== 'undefined') {
                window.location.href = '/login'
            }
            return null
        }

        return <Component {...props} />
    }
}
