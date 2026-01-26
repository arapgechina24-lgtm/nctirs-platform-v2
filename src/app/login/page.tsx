'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Lock, Mail, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
    const router = useRouter()
    const { login, isAuthenticated, isLoading: authLoading } = useAuth()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Redirect if already authenticated
    if (isAuthenticated && !authLoading) {
        router.push('/')
        return null
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            const result = await login({ email, password })
            if (result.success) {
                router.push('/')
            } else {
                setError(result.error || 'Login failed. Please check your credentials.')
            }
        } catch {
            setError('An unexpected error occurred. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 font-mono">
            {/* Background grid effect */}
            <div className="fixed inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: `linear-gradient(rgba(0, 255, 0, 0.1) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(0, 255, 0, 0.1) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }} />
            </div>

            {/* Login Container */}
            <div className="relative w-full max-w-md">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-green-600/20 to-cyan-600/20 blur-xl" />

                <div className="relative bg-black border border-green-900/50 p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-green-500/30 blur-xl animate-pulse" />
                                <div className="relative p-4 bg-black border border-green-700/50">
                                    <Shield className="h-10 w-10 text-green-500" />
                                </div>
                            </div>
                        </div>
                        <h1 className="text-xl font-bold text-green-400 tracking-wider mb-1">
                            NCTIRS SECURE ACCESS
                        </h1>
                        <p className="text-[10px] text-green-800 tracking-widest">
                            NATIONAL CYBER COMMAND • LEVEL 4 CLEARANCE REQUIRED
                        </p>
                    </div>

                    {/* Warning Banner */}
                    <div className="mb-6 p-3 bg-red-950/30 border border-red-900/50">
                        <div className="flex items-center gap-2 text-red-400 text-[10px]">
                            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                            <span>UNAUTHORIZED ACCESS IS A FEDERAL OFFENSE</span>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-950/50 border border-red-700/50 text-red-400 text-xs">
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email Field */}
                        <div>
                            <label className="block text-[10px] text-green-700 mb-1 tracking-wider">
                                OPERATOR EMAIL
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-700" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="operator@nis.go.ke"
                                    className="w-full bg-black border border-green-900/50 text-green-400 pl-10 pr-4 py-3 text-sm placeholder:text-green-900 focus:outline-none focus:border-green-700 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-[10px] text-green-700 mb-1 tracking-wider">
                                ACCESS CODE
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-700" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-black border border-green-900/50 text-green-400 pl-10 pr-12 py-3 text-sm placeholder:text-green-900 focus:outline-none focus:border-green-700 transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-green-700 hover:text-green-500 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="remember"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 bg-black border border-green-900/50 accent-green-600"
                            />
                            <label htmlFor="remember" className="text-[10px] text-green-700">
                                MAINTAIN SESSION
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-green-900/30 border border-green-700/50 text-green-400 text-sm font-bold tracking-wider hover:bg-green-900/50 hover:border-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                                    AUTHENTICATING...
                                </>
                            ) : (
                                <>
                                    <Lock className="h-4 w-4" />
                                    INITIATE SECURE ACCESS
                                </>
                            )}
                        </button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-6 text-center">
                        <p className="text-[10px] text-green-800">
                            NEW OPERATOR?{' '}
                            <Link href="/register" className="text-green-500 hover:text-green-400 underline">
                                REQUEST ACCESS
                            </Link>
                        </p>
                    </div>

                    {/* Demo Credentials */}
                    <div className="mt-6 p-3 bg-cyan-950/20 border border-cyan-900/30">
                        <div className="text-[9px] text-cyan-600 mb-2">DEMO CREDENTIALS:</div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                                <span className="text-green-800">Admin:</span>
                                <span className="text-green-500 ml-1">admin@nis.go.ke</span>
                            </div>
                            <div>
                                <span className="text-green-800">Pass:</span>
                                <span className="text-green-500 ml-1">admin123</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-center text-[8px] text-green-900">
                        ENCRYPTED CONNECTION • TLS 1.3 • SHA-256
                    </div>
                </div>
            </div>
        </div>
    )
}
