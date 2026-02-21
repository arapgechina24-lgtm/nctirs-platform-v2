import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { rateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';

async function getUser(email: string): Promise<User | null> {
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials, req) {
                // Rate Limiting by IP Address using headers (fallback to 'unknown')
                const headersList = await headers();
                const ip = headersList.get('x-forwarded-for') || '127.0.0.1'; // Fallback for local development
                const rateLimitId = `login_${ip}`;
                const limitRes = rateLimit(rateLimitId, { limit: 5, windowMs: 60 * 1000 }); // 5 attempts per minute max

                if (limitRes.isExceeded) {
                    console.warn(`Rate limit exceeded for login attempt from IP: ${ip}`);
                    throw new Error('Too many login attempts. Please try again later.');
                }

                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    if (!user) return null;

                    if (!user.isActive) return null; // Enforce active status

                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    if (passwordsMatch) {
                        return user; // Return the user object
                    }
                }

                console.log('Invalid credentials');
                return null;
            },
        }),
    ],
});
