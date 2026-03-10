import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

// Mock Encryption Function (In production, use AES-256)
function mockEncrypt(data: any): string {
    return `ENCRYPTED_Blob_${Buffer.from(JSON.stringify(data)).toString('base64')}`
}

async function main() {
    console.log('🌱 Starting sanitized seeding for Nairobi context...')

    // 1. Create default admin/officer if not exists
    const adminEmail = 'admin@nss.go.ke'
    let admin = await prisma.user.findUnique({ where: { email: adminEmail } })

    if (!admin) {
        admin = await prisma.user.create({
            data: {
                name: 'System Administrator',
                email: adminEmail,
                role: 'ADMIN',
                encryptedDetails: mockEncrypt({ phone: '+254700000000', nationalId: '12345678' }),
            },
        })
        console.log('👤 Administrator created.')
    }

    // 2. Clear existing incidents (optional, for clean state)
    // await prisma.incident.deleteMany()

    // 3. Generate 50 Synthetic Incidents in Nairobi
    // Nairobi Bounding Box: Lat -1.2 to -1.4, Lng 36.6 to 37.1
    const INCIDENT_COUNT = 50
    const incidentsData = []

    for (let i = 0; i < INCIDENT_COUNT; i++) {
        const lat = faker.location.latitude({ min: -1.35, max: -1.20 })
        const lng = faker.location.longitude({ min: 36.70, max: 37.00 })

        // Sanitize Description: Remove names if generated
        const safeDescription = faker.lorem.paragraph()
        const pii = {
            witnessName: faker.person.fullName(),
            witnessContact: faker.phone.number(),
            specificHouseNumber: faker.location.buildingNumber()
        }

        incidentsData.push({
            title: faker.helpers.arrayElement([
                'Suspicious Activity at CBD',
                'Traffic Obstruction near Westlands',
                'Public Disturbance in Kibera',
                'Theft Reported in Eastleigh',
                'Unattended Package at JKIA'
            ]),
            description: safeDescription, // Public description
            encryptedDetails: mockEncrypt(pii), // Sensitive data
            status: faker.helpers.arrayElement(['OPEN', 'IN_PROGRESS', 'RESOLVED']),
            priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
            location: `Nairobi Region (Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)})`,
            latitude: lat,
            longitude: lng,
            reportedBy: admin!.id,
        })
    }

    // Batch insert
    // Note: createMany is supported in recent Prisma versions for Postgres
    // If not supported in the specific version or due to relations, we loop.
    // Using loop for safety with relations if needed, but createMany is better for perf.
    for (const data of incidentsData) {
        await prisma.incident.create({ data })
    }

    console.log(`✅ Automatically generated ${INCIDENT_COUNT} anonymized incidents.`)
    console.log('🔒 Zero raw PII stored in plain text.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
