export interface CNIAsset {
    id: string;
    name: string;
    type: 'ENERGY' | 'TELECOM' | 'SUBMARINE_CABLE';
    status: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE';
    coordinates: [number, number];
    currentThreatLevel: number; // 0-100
}

export const KENYA_CNI_ASSETS: CNIAsset[] = [
    { id: 'KPLC_ROYSAMBU', name: 'Roysambu Substation', type: 'ENERGY', status: 'OPERATIONAL', coordinates: [-1.218, 36.889], currentThreatLevel: 12 },
    { id: 'SEACOM_MSA', name: 'Seacom Landing (Mombasa)', type: 'SUBMARINE_CABLE', status: 'OPERATIONAL', coordinates: [-4.043, 39.668], currentThreatLevel: 5 },
    { id: 'SAF_DATA_NBO', name: 'Safaricom Data Center', type: 'TELECOM', status: 'OPERATIONAL', coordinates: [-1.283, 36.823], currentThreatLevel: 25 },
];
