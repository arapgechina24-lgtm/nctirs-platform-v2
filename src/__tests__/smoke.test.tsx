import { describe, it, expect } from 'vitest'


describe('NCTIRS Dashboard Sanity Check', () => {
  it('should be running the correct Node environment', () => {
    expect(process.env.NODE_ENV).toBeDefined()
  })

  it('should pass basic math (sanity check)', () => {
    expect(1 + 1).toBe(2)
  })
})
