'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
    children: ReactNode
    fallback?: ReactNode
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void
    componentName?: string
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

// Error fallback UI component
export function ErrorFallback({
    error,
    resetError,
    componentName,
}: {
    error?: Error | null
    resetError?: () => void
    componentName?: string
}) {
    return (
        <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4 flex flex-col items-center justify-center min-h-[120px]">
            <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-red-400 text-sm font-medium mb-1">
                {componentName ? `${componentName} Error` : 'Something went wrong'}
            </p>
            <p className="text-red-500/70 text-xs text-center mb-3 max-w-xs">
                {error?.message || 'An unexpected error occurred'}
            </p>
            {resetError && (
                <button
                    onClick={resetError}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded text-xs transition-colors"
                >
                    <RefreshCw className="h-3 w-3" />
                    Try Again
                </button>
            )}
        </div>
    )
}

// Class-based Error Boundary (required for React error boundaries)
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error for debugging
        console.error(`[ErrorBoundary${this.props.componentName ? `: ${this.props.componentName}` : ''}]`, error, errorInfo)

        // Call optional error handler
        this.props.onError?.(error, errorInfo)
    }

    resetError = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError) {
            // Use custom fallback or default ErrorFallback
            if (this.props.fallback) {
                return this.props.fallback
            }
            return (
                <ErrorFallback
                    error={this.state.error}
                    resetError={this.resetError}
                    componentName={this.props.componentName}
                />
            )
        }

        return this.props.children
    }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    componentName?: string
) {
    return function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary componentName={componentName}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        )
    }
}

// Inline error boundary hook (for functional component error display)
export function useErrorHandler() {
    const [error, setError] = React.useState<Error | null>(null)

    const handleError = React.useCallback((error: Error) => {
        console.error('[useErrorHandler]', error)
        setError(error)
    }, [])

    const resetError = React.useCallback(() => {
        setError(null)
    }, [])

    const ErrorDisplay = React.useCallback(() => {
        if (!error) return null
        return <ErrorFallback error={error} resetError={resetError} />
    }, [error, resetError])

    return { error, handleError, resetError, ErrorDisplay }
}
