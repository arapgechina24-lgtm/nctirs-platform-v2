import * as Ably from 'ably';

// SECURITY NOTE: NEXT_PUBLIC_ABLY_API_KEY is exposed to the client bundle.
// For production, switch to Ably Token Authentication:
// 1. Create a server-side /api/ably-token endpoint that generates short-lived tokens
// 2. Use `authUrl` or `authCallback` in the Ably client config instead of `key`
// See: https://ably.com/docs/auth/token

let ablyInstance: Ably.Realtime | null = null;

export const getAblyClient = () => {
    if (typeof window === 'undefined') return null;

    if (!ablyInstance) {
        const apiKey = process.env.NEXT_PUBLIC_ABLY_API_KEY;
        if (!apiKey) {
            console.warn('Ably API Key missing, falling back to simulation mode.');
            return null;
        }

        ablyInstance = new Ably.Realtime({ key: apiKey });
    }

    return ablyInstance;
};
