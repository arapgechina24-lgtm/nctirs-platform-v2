const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting database seeding...');

    // Delete existing data
    await prisma.incident.deleteMany();
    await prisma.intelligence.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();

    // Create Initial Admin User
    const adminUser = await prisma.user.create({
        data: {
            name: 'System Admin',
            email: 'admin@nis.go.ke',
            role: 'ADMIN',
            encryptedDetails: 'System Administrator Account'
        }
    });

    console.log(`Created admin user: ${adminUser.email}`);

    // Create Sample Incident
    const incident = await prisma.incident.create({
        data: {
            title: 'Unauthorized Access Attempt Detected',
            description: 'Multiple failed login attempts detected on the central intelligence database from an external IP.',
            status: 'OPEN',
            priority: 'HIGH',
            location: 'Nairobi HQ Server Farm',
            latitude: -1.2921,
            longitude: 36.8219,
            encryptedDetails: '{"ip": "192.168.1.105", "attempts": 15}',
            reportedBy: adminUser.id
        }
    });

    console.log(`Created incident: ${incident.title}`);

    // Create Sample Intelligence Report
    const intel = await prisma.intelligence.create({
        data: {
            title: 'Q3 Cyber Threat Landscape Report',
            content: 'Analysis indicates a 40% increase in ransomware attacks targeting critical infrastructure sectors in East Africa.',
            source: 'National Cyber Fusion Centre',
            classification: 'SECRET',
            createdBy: adminUser.id,
            expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 6))
        }
    });

    console.log(`Created intelligence report: ${intel.title}`);

    console.log('Database seeding completed successfully.');
}

main()
    .catch((e) => {
        console.error('Seeding error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
