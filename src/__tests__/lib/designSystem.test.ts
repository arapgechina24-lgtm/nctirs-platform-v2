import { describe, it, expect } from 'vitest'
import { DesignSystem } from '@/lib/designSystem'

describe('DesignSystem', () => {
    it('should export a DesignSystem object', () => {
        expect(DesignSystem).toBeDefined()
        expect(typeof DesignSystem).toBe('object')
    })

    describe('colors', () => {
        it('should have background and foreground colors', () => {
            expect(DesignSystem.colors.background).toBe('#000000')
            expect(DesignSystem.colors.foreground).toBe('#00ff41')
        })

        it('should have primary and accent colors', () => {
            expect(DesignSystem.colors.primary).toBeDefined()
            expect(DesignSystem.colors.accent).toBeDefined()
        })

        it('should have matrix green variants', () => {
            expect(DesignSystem.colors.matrixGreen).toBe('#00ff41')
            expect(DesignSystem.colors.matrixGreenDim).toBeDefined()
            expect(DesignSystem.colors.matrixGreenDark).toBeDefined()
        })

        it('should have status colors for all severity levels', () => {
            expect(DesignSystem.colors.status.critical).toBeDefined()
            expect(DesignSystem.colors.status.high).toBeDefined()
            expect(DesignSystem.colors.status.medium).toBeDefined()
            expect(DesignSystem.colors.status.low).toBeDefined()
        })

        it('should use red for critical', () => {
            expect(DesignSystem.colors.status.critical).toBe('#ff0000')
        })

        it('should use green for low', () => {
            expect(DesignSystem.colors.status.low).toBe('#00ff41')
        })
    })

    describe('statusColors', () => {
        it('should have CSS class strings for all levels', () => {
            expect(DesignSystem.statusColors.CRITICAL).toContain('text-')
            expect(DesignSystem.statusColors.HIGH).toContain('text-')
            expect(DesignSystem.statusColors.MEDIUM).toContain('text-')
            expect(DesignSystem.statusColors.LOW).toContain('text-')
        })

        it('should include glow effects', () => {
            expect(DesignSystem.statusColors.CRITICAL).toContain('glow-red')
            expect(DesignSystem.statusColors.LOW).toContain('glow-green')
        })
    })

    describe('layout', () => {
        it('should have layout class names', () => {
            expect(DesignSystem.layout.scanline).toBe('scan-line')
            expect(DesignSystem.layout.cardShadow).toBe('card-shadow')
            expect(DesignSystem.layout.terminalText).toBe('terminal-text')
        })
    })
})
