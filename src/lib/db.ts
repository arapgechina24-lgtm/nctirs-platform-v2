// Prisma Client singleton for NCTIRS Dashboard
// Demo-mode aware: returns null when DATABASE_URL is not configured

let prismaInstance: unknown = null
let initAttempted = false

// Lazy getter - only attempts initialization once
export const getPrismaClient = async () => {
    if (initAttempted) return prismaInstance
    initAttempted = true

    const url = process.env.DATABASE_URL
    
    // No database URL = demo mode, skip Prisma entirely
    if (!url) {
        console.warn('⚠️ No DATABASE_URL - running in DEMO mode')
        return null
    }

    try {
        // Dynamic import to avoid build-time issues
        const { PrismaClient } = await import('@prisma/client')
        
        // For Turso (libsql://)
        if (url.startsWith('libsql://') && process.env.TURSO_AUTH_TOKEN) {
            const { PrismaLibSql } = await import('@prisma/adapter-libsql')
            const adapter = new PrismaLibSql({
                url,
                authToken: process.env.TURSO_AUTH_TOKEN,
            })
            prismaInstance = new PrismaClient({ adapter })
        } else {
            // SQLite file or other
            prismaInstance = new PrismaClient()
        }
        
        return prismaInstance
    } catch (error) {
        console.error('Prisma initialization failed:', error)
        return null
    }
}

// Default export for backwards compatibility (will be null until getPrismaClient called)
export default null
