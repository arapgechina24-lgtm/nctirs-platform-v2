'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SecurityIncident, CrimePrediction, SurveillanceFeed } from "@/lib/mockData"
import { Activity, Shield, Wifi, Zap, Eye } from "lucide-react"

interface LiveThreatMapProps {
    incidents: SecurityIncident[];
    predictions: CrimePrediction[];
    surveillance: SurveillanceFeed[];
}

export function LiveThreatMap({ incidents, predictions, surveillance }: LiveThreatMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const [activeLayers, setActiveLayers] = useState({
        threats: true,
        predictions: true,
        surveillance: true,
        infrastructure: true
    });
    // State for neutralized threat IDs to animate shield waves
    const [neutralizedIds, setNeutralizedIds] = useState<Set<string>>(new Set());

    // Simulation effect: Randomly "neutralize" a threat every few seconds
    useEffect(() => {
        const interval = setInterval(() => {
            const activeThreats = incidents.filter(i => i.threatLevel === 'CRITICAL' || i.threatLevel === 'HIGH');
            if (activeThreats.length > 0) {
                const randomThreat = activeThreats[Math.floor(Math.random() * activeThreats.length)];
                // Trigger neutralization visualization
                setNeutralizedIds(prev => {
                    const newSet = new Set(prev);
                    newSet.add(randomThreat.id);
                    return newSet;
                });

                // Remove from neutralized set after animation completes to reset cycle (optional, or keep it blue)
                setTimeout(() => {
                    setNeutralizedIds(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(randomThreat.id);
                        return newSet;
                    });
                }, 5000); // 5 seconds "shield" effect
            }
        }, 4000); // Effect happens every 4 seconds

        return () => clearInterval(interval);
    }, [incidents]);

    useEffect(() => {
        if (typeof window === 'undefined' || !mapRef.current) return;

        const initMap = async () => {
            const L = (await import('leaflet')).default;
            // @ts-expect-error - Leaflet CSS import issue
            await import('leaflet/dist/leaflet.css');

            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
            }

            // Initialize map centered on Kenya with constrained zoom
            const map = L.map(mapRef.current as HTMLElement, {
                zoomControl: false,
                attributionControl: false,
                dragging: false, // Lockdown mode for Director View stability
                scrollWheelZoom: false
            }).setView([-0.0236, 37.9062], 6);

            // CartoDB Dark Matter Tiles (The "War Room" Look)
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                maxZoom: 19,
                subdomains: 'abcd'
            }).addTo(map);

            // Add custom styles for pulsating markers AND shield waves
            const style = document.createElement('style');
            style.textContent = `
        .pulsing-beacon { position: relative; }
        .pulsing-beacon:before {
          content: ''; position: absolute; width: 100%; height: 100%;
          border-radius: 50%; background: inherit;
          animation: pulse-ring 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
          opacity: 0.6; z-index: -1;
        }
        .pulsing-beacon:after {
          content: ''; position: absolute; width: 100%; height: 100%;
          border-radius: 50%; background: inherit;
          animation: pulse-dot 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
          z-index: 1;
        }
        
        /* SHIELD WAVE ANIMATION */
        .shield-wave { position: relative; }
        .shield-wave:before {
            content: ''; position: absolute; top: 50%; left: 50%;
            width: 10px; height: 10px;
            transform: translate(-50%, -50%);
            border: 2px solid #3b82f6; /* Blue Shield */
            border-radius: 50%;
            background: rgba(59, 130, 246, 0.1);
            animation: shield-expand 2s ease-out infinite;
            z-index: 0;
        }
        .shield-wave:after {
            content: ''; position: absolute; top: 50%; left: 50%;
            width: 4px; height: 4px;
            transform: translate(-50%, -50%);
            background: #60a5fa;
            border-radius: 50%;
            z-index: 2;
        }

        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(3); opacity: 0; }
        }
        @keyframes pulse-dot {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes shield-expand {
            0% { width: 10px; height: 10px; opacity: 1; border-width: 2px; }
            100% { width: 80px; height: 80px; opacity: 0; border-width: 0px; }
        }

        .marker-pin {
          width: 12px; height: 12px; border-radius: 50%; border: 2px solid #000;
        }
      `;
            document.head.appendChild(style);

            // --- LAYERS ---

            // 1. THREATS LAYER
            if (activeLayers.threats) {
                incidents.forEach((incident) => {
                    const isNeutralized = neutralizedIds.has(incident.id);

                    // If neutralized, show Blue Shield Wave. If Critical/High, show Red Pulse. Else Green.
                    let color = '#00ff00';
                    let className = 'pulsing-beacon';

                    if (isNeutralized) {
                        color = '#3b82f6'; // Blue
                        className = 'shield-wave'; // Special Shield Class
                    } else if (incident.threatLevel === 'CRITICAL') {
                        color = '#ff0000';
                    } else if (incident.threatLevel === 'HIGH') {
                        color = '#ff8800';
                    } else if (incident.threatLevel === 'MEDIUM') {
                        color = '#ffcc00';
                    }

                    const iconHtml = isNeutralized
                        ? `<div style="width: 100%; height: 100%;"></div>` // Handled by CSS pseudo-elements
                        : `<div class="marker-pin" style="background-color: ${color}; box-shadow: 0 0 10px ${color};"></div>`;

                    const icon = L.divIcon({
                        className: className,
                        html: iconHtml,
                        iconSize: isNeutralized ? [20, 20] : [12, 12], // Shield is slightly larger base
                        iconAnchor: isNeutralized ? [10, 10] : [6, 6]
                    });

                    L.marker(incident.location.coordinates, { icon })
                        .bindPopup(`
              <div class="bg-black text-green-500 font-mono text-xs p-2 border border-green-900">
                <div class="font-bold border-b border-green-800 mb-1">${incident.id}</div>
                <div class="text-white">${incident.type}</div>
                <div class="text-[10px] text-gray-400 mt-1">STATUS: ${isNeutralized ? 'NEUTRALIZING...' : incident.status}</div>
              </div>
            `)
                        .addTo(map);
                });
            }

            // 2. SURVEILLANCE LAYER
            if (activeLayers.surveillance) {
                surveillance.filter(s => s.status === 'ACTIVE' || s.status === 'ALERT').slice(0, 30).forEach((feed) => {
                    const isAlert = feed.status === 'ALERT';
                    const color = isAlert ? '#00ffff' : '#005500';
                    const size = isAlert ? 8 : 4;

                    const icon = L.divIcon({
                        className: isAlert ? 'pulsing-beacon' : '',
                        html: `<div style="width: ${size}px; height: ${size}px; background-color: ${color}; border-radius: 50%;"></div>`,
                        iconSize: [size, size],
                        iconAnchor: [size / 2, size / 2]
                    });

                    L.marker(feed.coordinates, { icon }).addTo(map);
                });
            }

            // 3. INFRASTRUCTURE (Static Critical Nodes)
            if (activeLayers.infrastructure) {
                const criticalNodes = [
                    { name: "MOMBASA FIBER LANDING", coords: [-4.0435, 39.6682] },
                    { name: "NAIROBI DATA CENTER", coords: [-1.2921, 36.8219] },
                    { name: "KONZA TECHNOPOLIS", coords: [-1.6961, 37.1852] }
                ];

                criticalNodes.forEach(node => {
                    const icon = L.divIcon({
                        html: `<div style="border: 1px solid #1a56db; background: rgba(26, 86, 219, 0.3); width: 20px; height: 20px; transform: rotate(45deg);"></div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    });
                    L.marker(node.coords as [number, number], { icon })
                        .bindTooltip(node.name, {
                            permanent: true,
                            direction: 'top',
                            className: 'bg-black text-blue-500 text-[9px] border border-blue-900 px-1'
                        })
                        .addTo(map);
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
    }, [incidents, predictions, surveillance, activeLayers, neutralizedIds]);

    return (
        <Card className="bg-black/80 border-green-900/50 backdrop-blur-sm h-full flex flex-col relative overflow-hidden group">

            {/* "Director General View" Watermark/Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[500] opacity-10 select-none">
                <div className="text-6xl font-bold text-green-500 tracking-[1em] text-center border-4 border-green-900 p-10 rotate-[-15deg]">
                    DIRECTOR<br />GENERAL<br />EYES ONLY
                </div>
            </div>

            {/* Corner Brackets for "War Room Screen" effect */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-green-500/50 z-50"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-green-500/50 z-50"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-green-500/50 z-50"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-green-500/50 z-50"></div>

            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-green-900/30 bg-black/40 z-10">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-green-400">
                    <Activity className="h-4 w-4 animate-pulse" />
                    LIVE THREAT VECTORS // GOD'S EYE VIEW
                </CardTitle>

                {/* Layer Controls */}
                <div className="flex gap-2">
                    <LayerToggle
                        active={activeLayers.threats}
                        onClick={() => setActiveLayers(prev => ({ ...prev, threats: !prev.threats }))}
                        icon={<Zap size={12} />}
                        label="THREATS"
                        color="text-red-500"
                    />
                    <LayerToggle
                        active={activeLayers.surveillance}
                        onClick={() => setActiveLayers(prev => ({ ...prev, surveillance: !prev.surveillance }))}
                        icon={<Wifi size={12} />}
                        label="SURVEILLANCE"
                        color="text-cyan-500"
                    />
                    <LayerToggle
                        active={activeLayers.infrastructure}
                        onClick={() => setActiveLayers(prev => ({ ...prev, infrastructure: !prev.infrastructure }))}
                        icon={<Shield size={12} />}
                        label="INFRA"
                        color="text-blue-500"
                    />
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative min-h-[400px]">
                <div ref={mapRef} className="absolute inset-0 z-0 bg-neutral-900" />

                {/* Map Overlay Stats */}
                <div className="absolute bottom-4 left-4 z-[400] bg-black/80 border border-green-900/50 p-2 text-[10px] font-mono pointer-events-none backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        <span className="text-red-400 font-bold">ACTIVE THREATS: {incidents.filter(i => i.threatLevel === 'CRITICAL').length}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        <span className="text-blue-400">SHIELD ACTIVATIONS: {neutralizedIds.size}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                        <span className="text-cyan-400">SAT FEED: LIVE</span>
                    </div>
                </div>

                {/* View Mode Indicator */}
                <div className="absolute top-4 right-14 z-[400] bg-red-950/80 border border-red-600/50 px-3 py-1 text-[9px] font-bold text-red-200 animate-pulse uppercase tracking-widest backdrop-blur-md">
                    <Eye className="w-3 h-3 inline mr-1" />
                    Classified View
                </div>

            </CardContent>
        </Card>
    )
}

function LayerToggle({ active, onClick, icon, label, color }: any) {
    return (
        <button
            onClick={onClick}
            className={`
        flex items-center gap-1 px-2 py-1 text-[10px] font-mono border transition-all
        ${active ? `bg-green-900/20 border-green-700 ${color}` : 'bg-black border-gray-800 text-gray-600'}
      `}
        >
            {icon} {label}
        </button>
    )
}
