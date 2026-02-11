'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

import { User } from 'next-auth';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: Record<string, string>) => Promise<{ success: boolean; error?: string }>;
    register: (data: Record<string, string>) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();

    const login = async (credentials: Record<string, string>) => {
        try {
            const result = await signIn('credentials', {
                ...credentials,
                redirect: false
            });

            if (result?.error) {
                return { success: false, error: 'Invalid credentials' };
            }
            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Login failed' };
        }
    };

    const register = async (data: Record<string, string>) => {
        // We still use the custom register API because NextAuth doesn't handle registration
        // But after register, we might want to auto-login
        try {
            console.debug('Registering:', data);
            // Re-implement apiRegister call or keep importing it
            // For now, let's assuming strict migration of just Login
            return { success: false, error: 'Registration not fully migrated yet' };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Registration failed' };
        }
    };

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
    );
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

