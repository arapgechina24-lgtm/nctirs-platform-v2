// Database seed script for NCTIRS Dashboard
// Run with: npx tsx scripts/seed.ts
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'

// Prisma 7 requires adapter pattern
const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
})
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🌱 Seeding database...')

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@nis.go.ke' },
        update: {},
        create: {
            email: 'admin@nis.go.ke',
            name: 'System Administrator',
            password: adminPassword,
            role: 'L4',
            agency: 'NIS',
            department: 'Cyber Division',
            clearanceLevel: 4,
        },
    })
    console.log(`✅ Created admin user: ${admin.email}`)

    // Create analyst users
    const analystPassword = await bcrypt.hash('analyst123', 12)
    const analysts = [
        { email: 'analyst1@nis.go.ke', name: 'John Mwangi', agency: 'NIS', role: 'L1' },
        { email: 'analyst2@dci.go.ke', name: 'Jane Wanjiku', agency: 'DCI', role: 'L1' },
        { email: 'supervisor@kps.go.ke', name: 'Peter Omondi', agency: 'KPS', role: 'L2' },
        { email: 'director@ncfc.go.ke', name: 'Sarah Kamau', agency: 'NCFC', role: 'L3' },
    ]

    for (const analyst of analysts) {
        await prisma.user.upsert({
            where: { email: analyst.email },
            update: {},
            create: {
                ...analyst,
                password: analystPassword,
                department: 'Cyber Intelligence',
                clearanceLevel: parseInt(analyst.role[1]),
            },
        })
    }
    console.log(`✅ Created ${analysts.length} analyst users`)

    // Create sample incidents
    const incidents = [
        {
            title: 'SEACOM Cable Intrusion Attempt',
            description: 'Detected unauthorized access attempt on SEACOM submarine cable landing station in Mombasa.',
            type: 'CYBER_ATTACK',
            severity: 'CRITICAL',
            status: 'ACTIVE',
            location: 'Mombasa, Kenya',
            latitude: -4.0435,
            longitude: 39.6682,
            county: 'Mombasa',
            targetAsset: 'SEACOM Landing Station',
            attackVector: 'T1078 - Valid Accounts',
        },
        {
            title: 'DDoS Attack on M-Pesa API',
            description: 'Distributed denial of service attack targeting Safaricom M-Pesa payment infrastructure.',
            type: 'DDOS',
            severity: 'HIGH',
            status: 'INVESTIGATING',
            location: 'Nairobi, Kenya',
            latitude: -1.2921,
            longitude: 36.8219,
            county: 'Nairobi',
            targetAsset: 'M-Pesa API Gateway',
            attackVector: 'T1498 - Network Denial of Service',
        },
        {
            title: 'Phishing Campaign - Government Emails',
            description: 'Coordinated phishing campaign targeting government officials with fake eCitizen emails.',
            type: 'PHISHING',
            severity: 'MEDIUM',
            status: 'CONTAINED',
            location: 'Nationwide',
            county: 'Nairobi',
            targetAsset: 'Government Email Systems',
            attackVector: 'T1566 - Phishing',
        },
    ]

    for (const incident of incidents) {
        await prisma.incident.create({
            data: {
                ...incident,
                createdById: admin.id,
            },
        })
    }
    console.log(`✅ Created ${incidents.length} sample incidents`)

    // Create sample threats
    const threats = [
        { name: 'APT-KE-01', type: 'APT', severity: 'CRITICAL', source: 'Unknown', targetSector: 'CRITICAL_INFRASTRUCTURE', confidence: 0.89, mitreId: 'G0001' },
        { name: 'RansomKenya', type: 'RANSOMWARE', severity: 'HIGH', source: 'Eastern Europe', targetSector: 'FINANCE', confidence: 0.75, mitreId: 'S0500' },
        { name: 'KE-Phisher', type: 'PHISHING', severity: 'MEDIUM', source: 'Nigeria', targetSector: 'GOVERNMENT', confidence: 0.82, mitreId: 'T1566' },
    ]

    for (const threat of threats) {
        await prisma.threat.create({ data: threat })
    }
    console.log(`✅ Created ${threats.length} sample threats`)

    // Create sample surveillance feeds
    const feeds = [
        { location: 'JKIA Terminal 1', type: 'CCTV', status: 'ACTIVE', latitude: -1.3192, longitude: 36.9275 },
        { location: 'Mombasa Port Gate', type: 'ANPR', status: 'ACTIVE', latitude: -4.0435, longitude: 39.6682 },
        { location: 'Nairobi CBD', type: 'CCTV', status: 'ACTIVE', latitude: -1.2864, longitude: 36.8172 },
        { location: 'Wilson Airport', type: 'DRONE', status: 'STANDBY', latitude: -1.3214, longitude: 36.8147 },
    ]

    for (const feed of feeds) {
        await prisma.surveillanceFeed.create({ data: feed })
    }
    console.log(`✅ Created ${feeds.length} surveillance feeds`)

    console.log('✅ Seed completed successfully!')
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
