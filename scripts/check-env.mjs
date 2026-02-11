import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local if present
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
} else {
    // If no .env.local, try .env
    dotenv.config();
}

const requiredEnvVars = [
    'AUTH_SECRET',
    // Add other required env vars here
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error(`
❌ Error: Missing required environment variables:
${missingEnvVars.map(v => `   - ${v}`).join('\n')}

Please generate them or check your .env.local file.
You can generate a secret with: npx auth secret
`);
    process.exit(1);
}

console.log('✅ Environment verification passed.');
