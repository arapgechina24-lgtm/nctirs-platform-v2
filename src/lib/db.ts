import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'


const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
    // 1. Production (Turso / LibSQL Remote)
    if (process.env.NODE_ENV === 'production') {
        const url = process.env.DATABASE_URL
        const authToken = process.env.TURSO_AUTH_TOKEN

        if (!url || !authToken) {
            console.warn('⚠️  DATABASE_URL or TURSO_AUTH_TOKEN missing in production. Proceeding with in-memory SQLite for build/static generation.')
            // Return a valid client connected to an empty in-memory DB to satisfy build requirements
            const adapter = new PrismaLibSql({
                url: 'file::memory:',
            })
            return new PrismaClient({ adapter })
        }

        const adapter = new PrismaLibSql({
            url,
            authToken,
        })
        return new PrismaClient({ adapter })
    }

    // 2. Development (Local LibSQL / SQLite)
    // Using file:dev.db relative path
    const url = process.env.DATABASE_URL || "file:dev.db"

    // Ensure we strip ./ if present as it seemed potential cause of URL_INVALID
    const cleanUrl = url.replace("file:./", "file:")

    try {
        const adapter = new PrismaLibSql({
            url: cleanUrl,
        })
        return new PrismaClient({ adapter })
    } catch (e) {
        console.error("Failed to initialize database client:", e);
        throw e;
    }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
