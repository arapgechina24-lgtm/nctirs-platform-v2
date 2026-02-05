// Prisma Client singleton for NCTIRS Dashboard
// Prisma 7 requires adapter pattern for database connections
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// Create Prisma client with libsql adapter for Prisma 7
const createPrismaClient = () => {
    const url = process.env.DATABASE_URL
    const authToken = process.env.TURSO_AUTH_TOKEN

    // For Vercel production with Turso
    if (url && authToken && url.startsWith('libsql://')) {
        const adapter = new PrismaLibSql({
            url,
            authToken,
        })
        return new PrismaClient({ adapter })
    }

    // Development or demo mode - use SQLite file
    if (url && url.startsWith('file:')) {
        return new PrismaClient()
    }

    // Fallback for demo mode without database
    // Return a mock client that won't crash the app
    console.warn('⚠️ No DATABASE_URL configured - running in demo mode without persistence')
    return new PrismaClient()
}

// Lazy initialization to avoid build-time errors
let prismaInstance: PrismaClient | undefined

export const prisma = (() => {
    if (typeof window !== 'undefined') {
        // Client-side - return a dummy (won't be used)
        return null as unknown as PrismaClient
    }
    
    if (!prismaInstance) {
        try {
            prismaInstance = globalForPrisma.prisma ?? createPrismaClient()
            if (process.env.NODE_ENV !== 'production') {
                globalForPrisma.prisma = prismaInstance
            }
        } catch (error) {
            console.error('Failed to initialize Prisma client:', error)
            // Return a mock for build time
            return new Proxy({} as PrismaClient, {
                get: () => () => Promise.resolve([])
            })
        }
    }
    
    return prismaInstance
})()

export default prisma
