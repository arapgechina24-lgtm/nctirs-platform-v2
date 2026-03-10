import { PrismaClient, IncidentStatus, Priority } from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

// Mock Encryption Function
function mockEncrypt(data: unknown): string {
    return `ENCRYPTED_Blob_${Buffer.from(JSON.stringify(data)).toString('base64')}`
}

async function main() {
    console.log('🚨 INIT: Starting FULL RIOT SIMULATION Sequence...')
    console.log('📍 TARGET: Nairobi CBD / Uhuru Park')

    // 1. Get system user
    const systemUser = await prisma.user.findFirst()
    if (!systemUser) {
        console.error("❌ No user found. Run seed first.")
        return
    }

    const INCIDENT_COUNT = 25
    const incidents = []

    // Keywords for "Riot" scenario
    const riotTitles = [
        "Violent Protest at Uhuru Park",
        "Road Blocked by Burning Tyres",
        "Police Vehicle Stoned",
        "Looting Reported in CBD Shop",
        "Teargas Deployed near Parliament",
        "Medical Emergency: Injured Protester",
        "Property Damage: Windows Smashed"
    ]

    for (let i = 0; i < INCIDENT_COUNT; i++) {
        // Cluster coordinates around Uhuru Park / CBD
        // Lat: -1.290, Lng: 36.817
        const lat = -1.290 + (Math.random() * 0.005 - 0.0025)
        const lng = 36.817 + (Math.random() * 0.005 - 0.0025)

        incidents.push({
            title: faker.helpers.arrayElement(riotTitles),
            description: `URGENT: ${faker.lorem.sentence()} Multiple actors involved. Situation escalating.`,
            encryptedDetails: mockEncrypt({ pii: "Redacted witness info" }),
            status: IncidentStatus.OPEN,
            priority: Priority.CRITICAL, // Force Critical for simulation
            location: `CBD Sector ${faker.number.int({ min: 1, max: 5 })}`,
            latitude: lat,
            longitude: lng,
            reportedBy: systemUser.id,
        })
    }

    // Rapid insertion to simulate flood
    console.log('⚡ FLOODING DATABASE WITH CRITICAL INCIDENTS...')
    for (const data of incidents) {
        await prisma.incident.create({ data })
        process.stdout.write('.') // Progress dot
    }

    console.log('\n✅ SIMULATION COMPLETE.')
    console.log(`🔥 Created ${INCIDENT_COUNT} CRITICAL incidents.`)
    console.log('👉 Check Dashboard for Threat Level Spike.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
