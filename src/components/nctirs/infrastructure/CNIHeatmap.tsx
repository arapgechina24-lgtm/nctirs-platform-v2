'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DesignSystem } from '@/lib/nctirs/designSystem';
import { Zap, Smartphone, Database, Layers, Wifi } from 'lucide-react';
import type * as L from 'leaflet';
import { KENYA_CNI_ASSETS } from '@/lib/nctirs/cni-sim';

const CNIHeatmap: React.FC = () => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const [activeLayer, setActiveLayer] = useState<'ALL' | 'DIGITAL' | 'ENERGY'>('ALL');

    const sectors = [
        { id: 'FIN', name: 'M-PESA CORE', status: 'STABLE', integrity: 99.9, icon: <Smartphone className="w-4 h-4" />, color: 'text-green-500' },
        { id: 'PWR', name: 'KENGEN GRID', status: 'WARNING', integrity: 82.4, icon: <Zap className="w-4 h-4" />, color: 'text-yellow-500' },
        { id: 'GOV', name: 'IFMIS PORTAL', status: 'STABLE', integrity: 98.1, icon: <Database className="w-4 h-4" />, color: 'text-green-500' },
    ];

    useEffect(() => {
        if (typeof window === 'undefined' || !mapRef.current) return;

        const initMap = async () => {
            const L = (await import('leaflet')).default;
            // @ts-expect-error - Leaflet CSS import issue
            await import('leaflet/dist/leaflet.css');

            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
            }

            // Center on Kenya
            const map = L.map(mapRef.current as HTMLElement, {
                zoomControl: false,
                attributionControl: false
            }).setView([-1.2921, 36.8219], 6); // Nairobi centered

            // Dark/Matrix Styled Map Tiles
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(map);

            // --- SOVEREIGN SIMULATION LAYER (User Assets) ---
            if (activeLayer === 'ALL' || activeLayer === 'ENERGY' || activeLayer === 'DIGITAL') {
                KENYA_CNI_ASSETS.forEach(asset => {
                    // Determine color based on threat level
                    let color = '#22c55e'; // Green
                    if (asset.currentThreatLevel > 70) color = '#ef4444'; // Red
                    else if (asset.currentThreatLevel > 40) color = '#eab308'; // Yellow

                    // Determine Icon based on type
                    let iconHtml = '';
                    if (asset.type === 'ENERGY') {
                        iconHtml = `<div class="w-4 h-4 rounded-full border-2 border-white shadow-[0_0_15px_${color}]" style="background-color: ${color}"></div>`;
                    } else {
                        iconHtml = `<div class="w-4 h-4 transform rotate-45 border-2 border-white shadow-[0_0_15px_${color}]" style="background-color: ${color}"></div>`;
                    }

                    const assetIcon = L.divIcon({
                        className: 'custom-sim-marker',
                        html: iconHtml,
                        iconSize: [16, 16]
                    });

                    // Only show if layer matches type
                    if (activeLayer === 'ALL' ||
                        (activeLayer === 'ENERGY' && asset.type === 'ENERGY') ||
                        (activeLayer === 'DIGITAL' && (asset.type === 'TELECOM' || asset.type === 'SUBMARINE_CABLE'))) {

                        L.marker(asset.coordinates, { icon: assetIcon })
                            .addTo(map)
                            .bindPopup(`
                                <div class="bg-black text-white font-mono text-xs p-3 border-l-4 border-[${color}] w-[220px]">
                                    <h4 class="font-bold text-sm mb-1">${asset.name}</h4>
                                    <div class="flex justify-between text-[10px] text-gray-400 uppercase mb-2">
                                        <span>${asset.type}</span>
                                        <span class="${asset.status === 'OPERATIONAL' ? 'text-green-400' : 'text-red-400'}">${asset.status}</span>
                                    </div>
                                    <div class="bg-gray-900 rounded p-1 mb-1">
                                         <div class="flex justify-between text-[10px] mb-1">
                                            <span>THREAT LEVEL</span>
                                            <span style="color: ${color}">${asset.currentThreatLevel}%</span>
                                         </div>
                                         <div class="h-1 bg-gray-700 w-full rounded overflow-hidden">
                                            <div class="h-full transition-all duration-500" style="width: ${asset.currentThreatLevel}%; background-color: ${color}"></div>
                                         </div>
                                    </div>
                                    <div class="text-[9px] text-gray-500 italic">Simulated Node ID: ${asset.id}</div>
                                </div>
                            `);
                    }
                });
            }

            // --- DATA CENTERS & DIGITAL NODES (Points) ---
            const digitalAssets = [
                {
                    name: 'Seacom Ltd (Landing Stn)',
                    coords: [-4.0543, 39.6682],
                    type: 'GATEWAY',
                    desc: 'Primary landing station. Vital gateway for international connectivity. Monitoring essential for traffic anomaly detection.'
                },
                {
                    name: 'Africa Data Centres',
                    coords: [-1.3000, 36.8600], // Approx location
                    type: 'TIER_3',
                    desc: 'Signficant carrier-neutral facility housing financial/gov infrastructure. High physical security & power redundancy.'
                },
                {
                    name: 'icolo.io NBO 1',
                    coords: [-1.3450, 36.9000], // Mombasa Rd area
                    type: 'IXP_HUB',
                    desc: 'Key hub for internet exchange (Nairobi). 24/7 health/connectivity metrics. Critical for local service resilience.'
                },
            ];

            const dcIcon = L.divIcon({
                className: 'custom-dc-marker',
                html: `<div class="w-3 h-3 bg-cyan-400 rounded-sm shadow-[0_0_10px_#22d3ee] border border-cyan-200"></div>`,
                iconSize: [12, 12]
            });

            if (activeLayer === 'ALL' || activeLayer === 'DIGITAL') {
                digitalAssets.forEach(dc => {
                    L.marker(dc.coords as [number, number], { icon: dcIcon })
                        .addTo(map)
                        .bindPopup(`
                            <div class="bg-black text-green-500 font-mono text-xs p-2 border border-green-900 w-[200px]">
                                <div class="font-bold border-b border-green-800 pb-1 mb-1 text-cyan-400">${dc.name}</div>
                                <div class="text-[10px] uppercase text-gray-400 mb-1">${dc.type}</div>
                                <div class="text-[10px] leading-tight">${dc.desc}</div>
                            </div>
                        `);
                });
            }

            // --- POWER GRID ASSETS (Points) ---
            const powerAssets = [
                {
                    name: 'Kenya Power Roysambu',
                    coords: [-1.2185, 36.8870],
                    type: 'PLANT',
                    desc: 'Major operational facility. Ensures supply to Northern Nairobi. Prime candidate for ICS threat simulation.'
                },
                {
                    name: 'KP Substation (PV86+5H3)',
                    coords: [-1.2500, 36.8500], // Approx relative to others
                    type: 'NODE',
                    desc: 'Critical distribution node. Active 24/7. Essential for mapping threat actor proximity to hardware.'
                }
            ];

            const pwrIcon = L.divIcon({
                className: 'custom-pwr-marker',
                html: `<div class="w-3 h-3 bg-yellow-500 rounded-full shadow-[0_0_10px_#eab308] border border-yellow-200"></div>`,
                iconSize: [12, 12]
            });

            if (activeLayer === 'ALL' || activeLayer === 'ENERGY') {
                powerAssets.forEach(p => {
                    L.marker(p.coords as [number, number], { icon: pwrIcon })
                        .addTo(map)
                        .bindPopup(`
                            <div class="bg-black text-green-500 font-mono text-xs p-2 border border-green-900 w-[200px]">
                                <div class="font-bold border-b border-green-800 pb-1 mb-1 text-yellow-500">${p.name}</div>
                                <div class="text-[10px] uppercase text-gray-400 mb-1">${p.type}</div>
                                <div class="text-[10px] leading-tight">${p.desc}</div>
                            </div>
                        `);
                });

                // Lines
                const powerLines = [
                    // Olkaria -> Nairobi
                    [[-0.89, 36.3], [-1.2921, 36.8219]],
                    // Seven Forks -> Nairobi
                    [[-0.8, 37.5], [-1.2921, 36.8219]],
                    // Connect User Assets (Roysambu area)
                    [[-1.2921, 36.8219], [-1.2185, 36.8870]] // Nairobi CBD -> Roysambu
                ];

                powerLines.forEach(line => {
                    L.polyline(line as [number, number][], {
                        color: '#fbbf24', // Amber
                        weight: 1,
                        opacity: 0.5
                    }).addTo(map);
                });
            }

            // --- SUBMARINE CABLES (Lines) ---
            if (activeLayer === 'ALL' || activeLayer === 'DIGITAL') {
                // Simulating landing points in Mombasa going out to ocean
                const submarineCables = [
                    // TEAMS (Seacom Node)
                    [[-4.0543, 39.6682], [-4.5, 42.0], [-5.0, 45.0]],
                    // SEACOM
                    [[-4.05, 39.67], [-4.8, 41.5], [-6.0, 44.0]],
                    // EASSy
                    [[-4.06, 39.66], [-3.8, 41.0], [-2.0, 43.0]],
                ];

                submarineCables.forEach(cable => {
                    L.polyline(cable as [number, number][], {
                        color: '#3b82f6', // Blue
                        weight: 2,
                        opacity: 0.8,
                        dashArray: '4, 4'
                    }).addTo(map);
                });

                // --- NATIONAL FIBRE BACKBONE (NOFBI) ---
                const nofbiRoutes = [
                    // Mombasa -> Nairobi
                    [[-4.0543, 39.6682], [-3.3, 38.5], [-2.5, 37.8], [-1.2921, 36.8219]],
                    // Nairobi -> Kisumu
                    [[-1.2921, 36.8219], [-0.5, 36.0], [0.0, 35.0], [-0.0917, 34.7680]],
                    // Nairobi -> Nanyuki -> Marsabit (North)
                    [[-1.2921, 36.8219], [0.0, 37.07], [2.3, 37.9], [4.0, 38.0]],
                ];

                nofbiRoutes.forEach(route => {
                    L.polyline(route as [number, number][], {
                        color: '#10b981', // Emerald Green
                        weight: 2,
                        opacity: 0.7
                    }).addTo(map);
                });
            }

            mapInstanceRef.current = map;
        };

        initMap();

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [activeLayer]);

    return (
        <div className={`border border-[#003b00] bg-black/90 ${DesignSystem.layout.cardShadow} rounded-none h-full overflow-hidden flex flex-col relative`}>
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 z-[500] bg-black/80 backdrop-blur-sm border-b border-[#003b00] p-2 flex justify-between items-center">
                <h2 className={`text-xs font-bold ${DesignSystem.layout.terminalText} text-orange-400 flex items-center gap-2`}>
                    <ActivityIcon />
                    CRITICAL INFRASTRUCTURE
                </h2>
                <div className="flex gap-1">
                    <button
                        onClick={() => setActiveLayer('DIGITAL')}
                        className={`p-1 border ${activeLayer === 'DIGITAL' ? 'border-cyan-400 text-cyan-400' : 'border-gray-700 text-gray-700'} rounded hover:bg-cyan-950/30`}
                        title="Digital Layers"
                    >
                        <Wifi className="w-3 h-3" />
                    </button>
                    <button
                        onClick={() => setActiveLayer('ENERGY')}
                        className={`p-1 border ${activeLayer === 'ENERGY' ? 'border-yellow-400 text-yellow-400' : 'border-gray-700 text-gray-700'} rounded hover:bg-yellow-950/30`}
                        title="Energy Layers"
                    >
                        <Zap className="w-3 h-3" />
                    </button>
                    <button
                        onClick={() => setActiveLayer('ALL')}
                        className={`p-1 border ${activeLayer === 'ALL' ? 'border-green-400 text-green-400' : 'border-gray-700 text-gray-700'} rounded hover:bg-green-950/30`}
                        title="All Layers"
                    >
                        <Layers className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* The Map */}
            <div ref={mapRef} className="flex-1 bg-[#050505] relative z-0" />

            {/* Stat Overlay (Floating Bottom) */}
            <div className="absolute bottom-2 left-2 right-2 z-[500] grid grid-cols-1 gap-1">
                {sectors.map((sector) => (
                    <div key={sector.id} className="bg-black/90 border border-green-900/50 p-2 flex items-center justify-between backdrop-blur-md">
                        <div className="flex items-center gap-2">
                            <div className={`${sector.color}`}>{sector.icon}</div>
                            <div className="text-[10px] font-mono text-gray-300 font-bold">{sector.name}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-16 h-1 bg-gray-800 rounded overflow-hidden">
                                <div className={`h-full ${sector.status === 'WARNING' ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${sector.integrity}%` }} />
                            </div>
                            <span className="text-[10px] font-mono text-green-400">{sector.integrity}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ActivityIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
);

export default CNIHeatmap;
