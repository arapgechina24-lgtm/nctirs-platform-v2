import { describe, it, expect } from 'vitest'
import { KENYA_CNI_ASSETS } from '@/lib/cni-sim'

describe('CNI Simulation Data', () => {
    it('should export KENYA_CNI_ASSETS array', () => {
        expect(Array.isArray(KENYA_CNI_ASSETS)).toBe(true)
        expect(KENYA_CNI_ASSETS.length).toBeGreaterThan(0)
    })

    it('should have 3 CNI assets', () => {
        expect(KENYA_CNI_ASSETS).toHaveLength(3)
    })

    it('each asset should have all required fields', () => {
        for (const asset of KENYA_CNI_ASSETS) {
            expect(asset).toHaveProperty('id')
            expect(asset).toHaveProperty('name')
            expect(asset).toHaveProperty('type')
            expect(asset).toHaveProperty('status')
            expect(asset).toHaveProperty('coordinates')
            expect(asset).toHaveProperty('currentThreatLevel')
        }
    })

    it('should have valid asset type values', () => {
        const validTypes = ['ENERGY', 'TELECOM', 'SUBMARINE_CABLE']
        for (const asset of KENYA_CNI_ASSETS) {
            expect(validTypes).toContain(asset.type)
        }
    })

    it('should have valid status values', () => {
        const validStatuses = ['OPERATIONAL', 'DEGRADED', 'OUTAGE']
        for (const asset of KENYA_CNI_ASSETS) {
            expect(validStatuses).toContain(asset.status)
        }
    })

    it('should have valid coordinates (lat/lng for Kenya)', () => {
        for (const asset of KENYA_CNI_ASSETS) {
            const [lat, lng] = asset.coordinates
            // Kenya roughly: lat -5 to 5, lng 33 to 42
            expect(lat).toBeGreaterThanOrEqual(-5)
            expect(lat).toBeLessThanOrEqual(5)
            expect(lng).toBeGreaterThanOrEqual(33)
            expect(lng).toBeLessThanOrEqual(42)
        }
    })

    it('should have threat levels between 0 and 100', () => {
        for (const asset of KENYA_CNI_ASSETS) {
            expect(asset.currentThreatLevel).toBeGreaterThanOrEqual(0)
            expect(asset.currentThreatLevel).toBeLessThanOrEqual(100)
        }
    })

    it('should have unique IDs', () => {
        const ids = KENYA_CNI_ASSETS.map(a => a.id)
        expect(new Set(ids).size).toBe(ids.length)
    })

    it('should include KPLC, SEACOM, and Safaricom assets', () => {
        const ids = KENYA_CNI_ASSETS.map(a => a.id)
        expect(ids).toContain('KPLC_ROYSAMBU')
        expect(ids).toContain('SEACOM_MSA')
        expect(ids).toContain('SAF_DATA_NBO')
    })

    it('should include all three infrastructure types', () => {
        const types = KENYA_CNI_ASSETS.map(a => a.type)
        expect(types).toContain('ENERGY')
        expect(types).toContain('SUBMARINE_CABLE')
        expect(types).toContain('TELECOM')
    })
})
