import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn (class name utility)', () => {
    it('should merge single class name', () => {
        expect(cn('text-red-500')).toBe('text-red-500')
    })

    it('should merge multiple class names', () => {
        const result = cn('text-red-500', 'bg-black')
        expect(result).toContain('text-red-500')
        expect(result).toContain('bg-black')
    })

    it('should handle conditional classes', () => {
        const isActive = true
        const result = cn('base', isActive && 'active')
        expect(result).toContain('base')
        expect(result).toContain('active')
    })

    it('should filter out falsy values', () => {
        const result = cn('base', false && 'hidden', undefined, null)
        expect(result).toBe('base')
    })

    it('should merge conflicting Tailwind classes (last wins)', () => {
        const result = cn('text-red-500', 'text-blue-500')
        expect(result).toBe('text-blue-500')
    })

    it('should merge conflicting padding classes', () => {
        const result = cn('p-4', 'p-8')
        expect(result).toBe('p-8')
    })

    it('should handle empty input', () => {
        expect(cn()).toBe('')
    })

    it('should handle object syntax from clsx', () => {
        const result = cn({ 'text-red-500': true, 'bg-black': false })
        expect(result).toBe('text-red-500')
    })

    it('should handle array syntax', () => {
        const result = cn(['base', 'extra'])
        expect(result).toContain('base')
        expect(result).toContain('extra')
    })
})
