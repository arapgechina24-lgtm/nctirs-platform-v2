'use client';

import { SessionProvider } from 'next-auth/react';
import { SovereignProvider } from '@/contexts/SovereignContext';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <SovereignProvider>
                {children}
            </SovereignProvider>
        </SessionProvider>
    );
}
