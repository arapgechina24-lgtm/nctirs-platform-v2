/**
 * Role-Based Access Control (RBAC) utilities for NCTIRS API routes.
 *
 * Roles: L1 (Analyst) → L2 (Senior) → L3 (Manager) → L4 (Director/Admin)
 */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export type UserRole = 'L1' | 'L2' | 'L3' | 'L4';

/** Numeric hierarchy for role comparison */
const ROLE_LEVELS: Record<UserRole, number> = {
    L1: 1,
    L2: 2,
    L3: 3,
    L4: 4,
};

/**
 * Check if the current session user has at least the required role level.
 * Returns the session if authorized, or a NextResponse error if not.
 *
 * @example
 * ```ts
 * const result = await requireRole('L2');
 * if (result instanceof NextResponse) return result; // 401 or 403
 * // result is the authenticated session
 * const userId = result.user.id;
 * ```
 */
export async function requireRole(minimumRole: UserRole = 'L1') {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json(
            { error: 'Unauthorized — authentication required' },
            { status: 401 }
        );
    }

    const userRole = (session.user.role as UserRole) || 'L1';
    const userLevel = ROLE_LEVELS[userRole] ?? 1;
    const requiredLevel = ROLE_LEVELS[minimumRole] ?? 1;

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
