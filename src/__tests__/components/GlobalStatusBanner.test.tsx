import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import GlobalStatusBanner from '@/components/layout/GlobalStatusBanner'

describe('GlobalStatusBanner', () => {
    it('should render without crashing', () => {
        const { container } = render(<GlobalStatusBanner />)
        expect(container.firstChild).not.toBeNull()
    })

    it('should display the current security level text', () => {
        render(<GlobalStatusBanner />)
        // Default level is 3 (Amber)
        expect(screen.getByText(/ACTIVE SECTORAL THREATS DETECTED/i)).toBeDefined()
    })

    it('should display LEVEL 3 indicator', () => {
        render(<GlobalStatusBanner />)
        expect(screen.getByText(/LEVEL 3/i)).toBeDefined()
    })

    it('should have amber background for level 3', () => {
        const { container } = render(<GlobalStatusBanner />)
        const banner = container.firstChild as HTMLElement
        expect(banner.className).toContain('bg-amber-600')
    })

    it('should have border styling', () => {
        const { container } = render(<GlobalStatusBanner />)
        const banner = container.firstChild as HTMLElement
        expect(banner.className).toContain('border-b-4')
    })

    it('should contain an icon element', () => {
        const { container } = render(<GlobalStatusBanner />)
        const svg = container.querySelector('svg')
        expect(svg).not.toBeNull()
    })

    it('should have uppercase tracking-widest text', () => {
        const { container } = render(<GlobalStatusBanner />)
        const textDiv = container.querySelector('.tracking-widest')
        expect(textDiv).not.toBeNull()
    })
})
