/**
 * Role-Based Access Control (RBAC) utilities for NCTIRS API routes.
 *
 * Roles: L1 (Analyst) → L2 (Senior) → L3 (Manager) → L4 (Director/Admin)
 */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export type UserRole = 'ANALYST' | 'OFFICER' | 'COMMANDER' | 'ADMIN';

/** Numeric hierarchy for role comparison */
const ROLE_LEVELS: Record<UserRole, number> = {
    ANALYST: 1,      // L1
    OFFICER: 2,      // L2
    COMMANDER: 3,    // L3
    ADMIN: 4,        // L4
};

// Map L-prefixes for backward compatibility if needed
const ROLE_MAP: Record<string, UserRole> = {
    L1: 'ANALYST',
    L2: 'OFFICER',
    L3: 'COMMANDER',
    L4: 'ADMIN',
};

export async function requireRole(minimumRole: string = 'ANALYST') {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json(
            { error: 'Unauthorized — authentication required' },
            { status: 401 }
        );
    }

    // Resolve role (handles both L1 and ANALYST names)
    const rawRole = session.user.role || 'ANALYST';
    const userRole = ROLE_MAP[rawRole] || (rawRole as UserRole);
    const targetRole = ROLE_MAP[minimumRole] || (minimumRole as UserRole);

    const userLevel = ROLE_LEVELS[userRole] ?? 1;
    const requiredLevel = ROLE_LEVELS[targetRole] ?? 1;

    if (userLevel < requiredLevel) {
        return NextResponse.json(
            {
                error: 'Forbidden — insufficient clearance level',
                required: minimumRole,
                current: userRole,
            },
            { status: 403 }
        );
    }

    return session;
}

/**
 * Simple auth check — returns session or 401 error response.
 */
export async function requireAuth() {
    return requireRole('L1');
}
