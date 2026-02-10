'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { User } from '@/lib/api' // Assuming User type is compatible or I need to adjust

interface AuthContextType {
    user: any | null // Relaxing type for now to match NextAuth session user
    token: string | null // NextAuth handles token, so this might be null or dummy
    isAuthenticated: boolean
    isLoading: boolean
    login: (credentials: any) => Promise<{ success: boolean; error?: string }>
    register: (data: any) => Promise<{ success: boolean; error?: string }>
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession()

    const login = async (credentials: any) => {
        try {
            const result = await signIn('credentials', {
                ...credentials,
                redirect: false
            }) as any

            if (result?.error) {
                return { success: false, error: 'Invalid credentials' }
            }
            return { success: true }
        } catch (error) {
            return { success: false, error: 'Login failed' }
        }
    }

    const register = async (data: any) => {
        // We still use the custom register API because NextAuth doesn't handle registration
        // But after register, we might want to auto-login
        try {
            // Re-implement apiRegister call or keep importing it
            // For now, let's assuming strict migration of just Login
            return { success: false, error: 'Registration not fully migrated yet' }
        } catch (error) {
            return { success: false, error: 'Registration failed' }
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user: session?.user || null,
                token: null, // Token is HTTP-only cookie now
                isAuthenticated: status === 'authenticated',
                isLoading: status === 'loading',
                login,
                register,
                logout: () => signOut({ callbackUrl: '/login' }),
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

// Legacy withAuth removed or adapted? 
// It's better to rely on Middleware for protection, but for specific components:
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
    return function ProtectedRoute(props: P) {
        const { isAuthenticated, isLoading } = useAuth()
        // ... same logic usually works
        if (isLoading) return null // or spinner
        if (!isAuthenticated) return null // handled by middleware usually
        return <Component {...props} />
    }
}

