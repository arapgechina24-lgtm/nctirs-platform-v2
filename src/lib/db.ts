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

    if (process.env.NODE_ENV === 'production') {
        if (!url || !authToken) {
            throw new Error('DATABASE_URL and TURSO_AUTH_TOKEN must be set in production')
        }

        const adapter = new PrismaLibSql({
            url,
            authToken,
        })
        return new PrismaClient({ adapter })
    }

    // Development fallback
    return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
