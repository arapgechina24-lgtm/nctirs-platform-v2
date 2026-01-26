// Prisma Client singleton for NCTIRS Dashboard
// Prisma 7 requires adapter pattern for database connections
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// Create Prisma client with libsql adapter for Prisma 7
const createPrismaClient = () => {
    // PrismaLibSql takes a config object with url
    const adapter = new PrismaLibSql({
        url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
    })
    return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
