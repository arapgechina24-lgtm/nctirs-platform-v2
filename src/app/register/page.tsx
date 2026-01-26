'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Lock, Mail, User, Building2, AlertTriangle, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const AGENCIES = [
    { value: 'NIS', label: 'National Intelligence Service' },
    { value: 'DCI', label: 'Directorate of Criminal Investigations' },
    { value: 'KPS', label: 'Kenya Police Service' },
    { value: 'NCFC', label: 'National Cyber Fusion Centre' },
    { value: 'CAK', label: 'Communications Authority of Kenya' },
    { value: 'CBK', label: 'Central Bank of Kenya' },
    { value: 'OTHER', label: 'Other Agency' },
]

export default function RegisterPage() {
    const router = useRouter()
    const { register, isAuthenticated, isLoading: authLoading } = useAuth()

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        agency: '',
    })
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Redirect if already authenticated
    if (isAuthenticated && !authLoading) {
        router.push('/')
        return null
    }

    const validateForm = (): string | null => {
        if (!formData.name.trim()) return 'Name is required'
        if (!formData.email.trim()) return 'Email is required'
        if (!formData.email.includes('@')) return 'Invalid email format'
        if (formData.password.length < 6) return 'Password must be at least 6 characters'
        if (formData.password !== formData.confirmPassword) return 'Passwords do not match'
        if (!formData.agency) return 'Agency selection is required'
        return null
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)

        const validationError = validateForm()
        if (validationError) {
            setError(validationError)
            return
        }

        setIsLoading(true)

        try {
            const result = await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                agency: formData.agency,
            })

            if (result.success) {
                router.push('/')
            } else {
                setError(result.error || 'Registration failed. Please try again.')
            }
        } catch {
            setError('An unexpected error occurred. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword

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

            {/* Register Container */}
            <div className="relative w-full max-w-md">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-green-600/20 to-cyan-600/20 blur-xl" />

                <div className="relative bg-black border border-green-900/50 p-8">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="flex justify-center mb-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-cyan-500/30 blur-xl animate-pulse" />
                                <div className="relative p-4 bg-black border border-cyan-700/50">
                                    <Shield className="h-10 w-10 text-cyan-500" />
                                </div>
                            </div>
                        </div>
                        <h1 className="text-xl font-bold text-green-400 tracking-wider mb-1">
                            OPERATOR REGISTRATION
                        </h1>
                        <p className="text-[10px] text-green-800 tracking-widest">
                            REQUEST SECURE ACCESS CREDENTIALS
                        </p>
                    </div>

                    {/* Warning Banner */}
                    <div className="mb-6 p-3 bg-yellow-950/30 border border-yellow-900/50">
                        <div className="flex items-center gap-2 text-yellow-400 text-[10px]">
                            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                            <span>CLEARANCE SUBJECT TO VERIFICATION</span>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-950/50 border border-red-700/50 text-red-400 text-xs">
                            {error}
                        </div>
                    )}

                    {/* Registration Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name Field */}
                        <div>
                            <label className="block text-[10px] text-green-700 mb-1 tracking-wider">
                                FULL NAME
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-700" />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    required
                                    placeholder="John Mwangi"
                                    className="w-full bg-black border border-green-900/50 text-green-400 pl-10 pr-4 py-2.5 text-sm placeholder:text-green-900 focus:outline-none focus:border-green-700 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div>
                            <label className="block text-[10px] text-green-700 mb-1 tracking-wider">
                                OFFICIAL EMAIL
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-700" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => updateField('email', e.target.value)}
                                    required
                                    placeholder="operator@agency.go.ke"
                                    className="w-full bg-black border border-green-900/50 text-green-400 pl-10 pr-4 py-2.5 text-sm placeholder:text-green-900 focus:outline-none focus:border-green-700 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Agency Field */}
                        <div>
                            <label className="block text-[10px] text-green-700 mb-1 tracking-wider">
                                AGENCY
                            </label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-700" />
                                <select
                                    value={formData.agency}
                                    onChange={(e) => updateField('agency', e.target.value)}
                                    required
                                    className="w-full bg-black border border-green-900/50 text-green-400 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-green-700 transition-colors appearance-none cursor-pointer"
                                >
                                    <option value="" className="bg-black text-green-900">Select Agency...</option>
                                    {AGENCIES.map(agency => (
                                        <option key={agency.value} value={agency.value} className="bg-black">
                                            {agency.label}
                                        </option>
                                    ))}
                                </select>
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
                                    value={formData.password}
                                    onChange={(e) => updateField('password', e.target.value)}
                                    required
                                    minLength={6}
                                    placeholder="Min 6 characters"
                                    className="w-full bg-black border border-green-900/50 text-green-400 pl-10 pr-12 py-2.5 text-sm placeholder:text-green-900 focus:outline-none focus:border-green-700 transition-colors"
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

                        {/* Confirm Password Field */}
                        <div>
                            <label className="block text-[10px] text-green-700 mb-1 tracking-wider">
                                CONFIRM ACCESS CODE
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-700" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                                    required
                                    placeholder="Confirm password"
                                    className="w-full bg-black border border-green-900/50 text-green-400 pl-10 pr-12 py-2.5 text-sm placeholder:text-green-900 focus:outline-none focus:border-green-700 transition-colors"
                                />
                                {passwordsMatch && (
                                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-cyan-900/30 border border-cyan-700/50 text-cyan-400 text-sm font-bold tracking-wider hover:bg-cyan-900/50 hover:border-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                                    PROCESSING...
                                </>
                            ) : (
                                <>
                                    <Shield className="h-4 w-4" />
                                    REQUEST ACCESS CREDENTIALS
                                </>
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-[10px] text-green-800">
                            ALREADY REGISTERED?{' '}
                            <Link href="/login" className="text-green-500 hover:text-green-400 underline">
                                SECURE LOGIN
                            </Link>
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-center text-[8px] text-green-900">
                        DATA PROTECTION ACT 2019 COMPLIANT • ISO 27001
                    </div>
                </div>
            </div>
        </div>
    )
}
