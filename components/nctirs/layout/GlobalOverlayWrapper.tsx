'use client';

import { createNC4Report } from '@/lib/nctirs/soar-logic';
import EmergencyOverlay from '@/components/nctirs/incident/EmergencyOverlay';

export default function GlobalOverlayWrapper() {
    // In a real app, this would perform a server action or update context
    const handleMitigate = () => {
        console.log('[NC4 PROTOCOL] Mitigation Initiated by User');
        return createNC4Report(
            "ENERGY_GRID_MAIN",
            "CRITICAL",
            "T1098.004"
        );
    };

    return (
        <EmergencyOverlay
            isActive={false}
            targetAsset="ENERGY_GRID_MAIN"
            onMitigate={handleMitigate}
        />
    );
}
