
import { analyzeThreat } from '../src/lib/ai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function test() {
    console.log('--- Testing AI Integration ---');
    console.log('Gemini Key Present:', !!process.env.GEMINI_API_KEY);
    console.log('Anthropic Key Present:', !!process.env.ANTHROPIC_API_KEY);
    console.log('Default Provider:', process.env.AI_PROVIDER);

    const input = {
        name: 'Test Threat',
        type: 'PHISHING',
        severity: 'MEDIUM',
        description: 'A test phishing email.',
        indicators: ['example.com'],
    };

    console.log('\n1. Testing with Gemini (default or explicit)...');
    try {
        const result1 = await analyzeThreat(input, 'gemini');
        console.log('Gemini Result Source:', result1.source);
        console.log('Gemini Summary:', result1.summary.substring(0, 50) + '...');
    } catch (e) {
        console.error('Gemini Test Failed:', e);
    }

    console.log('\n2. Testing with Claude (explicit)...');
    try {
        if (!process.env.ANTHROPIC_API_KEY) {
            console.log('Skipping Claude test (no key).');
        } else {
            const result2 = await analyzeThreat(input, 'claude');
            console.log('Claude Result Source:', result2.source);
            console.log('Claude Summary:', result2.summary.substring(0, 50) + '...');
        }
    } catch (e) {
        console.error('Claude Test Failed:', e);
    }
}

test();
