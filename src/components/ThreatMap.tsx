'use client'

import { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SecurityIncident, CrimePrediction, SurveillanceFeed } from "@/lib/mockData"
import { Map as MapIcon } from "lucide-react"
import type * as L from 'leaflet'

interface ThreatMapProps {
  incidents: SecurityIncident[];
  predictions: CrimePrediction[];
  surveillance: SurveillanceFeed[];
}

export function ThreatMap({ incidents, predictions, surveillance }: ThreatMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    // Dynamic import of Leaflet to avoid SSR issues
    const initMap = async () => {
      const L = (await import('leaflet')).default;
      // @ts-expect-error - Leaflet CSS import issue
      await import('leaflet/dist/leaflet.css');

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Initialize map centered on Kenya
      const map = L.map(mapRef.current as HTMLElement).setView([-0.0236, 37.9062], 6);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        className: 'map-tiles',
      }).addTo(map);

      // Custom icon for incidents
      const incidentIcon = (color: string) => L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 0px; border: 1px solid #00ff41; box-shadow: 0 0 10px ${color}80;"></div>`,
        iconSize: [16, 16],
      });

      // Add incident markers
      incidents.slice(0, 20).forEach((incident) => {
        const color =
          incident.threatLevel === 'CRITICAL' ? '#dc2626' :
            incident.threatLevel === 'HIGH' ? '#ea580c' :
              incident.threatLevel === 'MEDIUM' ? '#ca8a04' : '#16a34a';

        const marker = L.marker(incident.location.coordinates, {
          icon: incidentIcon(color),
        }).addTo(map);

        marker.bindPopup(`
          <div style="background: #000; color: #00ff41; border: 1px solid #00ff41; padding: 10px; font-family: monospace; font-size: 11px;">
            <h3 style="font-weight: bold; margin-bottom: 4px; border-bottom: 1px solid #003b00; padding-bottom: 4px;">ID: ${incident.id}</h3>
            <p style="font-size: 10px; margin-bottom: 8px; color: #008f11;">${incident.description}</p>
            <div style="font-size: 10px; line-height: 1.5;">
              <div><strong>LOCATION:</strong> ${incident.location.name}</div>
              <div><strong>THREAT:</strong> ${incident.threatLevel}</div>
              <div><strong>STATUS:</strong> ${incident.status}</div>
              <div><strong>AI_CONF:</strong> ${incident.aiConfidence}%</div>
            </div>
          </div>
        `, { className: 'custom-popupMatrix' });
      });

      // Add prediction markers
      predictions.slice(0, 15).forEach((prediction) => {
        const predictionIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: rgba(0, 255, 65, 0.1); width: 24px; height: 24px; border-radius: 0px; border: 1px dashed #00ff41; box-shadow: 0 0 5px #00ff4140;"></div>`,
          iconSize: [24, 24],
        });

        const marker = L.marker(prediction.location.coordinates, {
          icon: predictionIcon,
        }).addTo(map);

        marker.bindPopup(`
          <div style="background: #000; color: #00ff41; border: 1px solid #00ff41; padding: 10px; font-family: monospace; font-size: 11px;">
            <h3 style="font-weight: bold; margin-bottom: 4px; border-bottom: 1px solid #003b00; padding-bottom: 4px;">PREDICTION_${prediction.id.split('-').pop()}</h3>
            <div style="font-size: 10px; line-height: 1.5;">
              <div><strong>PROBABILITY:</strong> ${prediction.probability}%</div>
              <div><strong>WINDOW:</strong> ${prediction.timeWindow}</div>
            </div>
          </div>
        `, { className: 'custom-popupMatrix' });
      });

      // Add surveillance markers
      surveillance.filter(s => s.status === 'ALERT').slice(0, 10).forEach((feed) => {
        const surveillanceIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: #00ff41; width: 6px; height: 6px; border-radius: 0px; box-shadow: 0 0 10px #00ff41;"></div>`,
          iconSize: [6, 6],
        });

        const marker = L.marker(feed.coordinates, {
          icon: surveillanceIcon,
        }).addTo(map);

        marker.bindPopup(`
          <div style="background: #000; color: #00ff41; border: 1px solid #00ff41; padding: 10px; font-family: monospace; font-size: 11px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">ALRT_${feed.id}</h3>
            <div style="font-size: 10px;">
              <div><strong>TYPE:</strong> ${feed.type}</div>
              <div><strong>LOCATION:</strong> ${feed.location}</div>
            </div>
          </div>
        `, { className: 'custom-popupMatrix' });
      });

      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [incidents, predictions, surveillance]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapIcon className="h-5 w-5 text-green-500" />
          Real-Time Threat Intelligence Map
        </CardTitle>
        <div className="flex gap-4 mt-2 text-[10px] font-mono uppercase">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-600 border border-red-400"></div>
            <span className="text-green-800">Critical_Incidents</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-600 border border-orange-400"></div>
            <span className="text-green-800">High_Threat</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-transparent border border-dashed border-green-400"></div>
            <span className="text-green-800">Predictions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 shadow-[0_0_5px_#00ff41]"></div>
            <span className="text-green-800">Surveillance</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={mapRef}
          className="w-full h-[500px] rounded-lg overflow-hidden border border-gray-800"
        />
      </CardContent>
    </Card>
  )
}
