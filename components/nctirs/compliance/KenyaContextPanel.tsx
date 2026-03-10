import { TrafficNode, MpesaTransaction, WeatherLog } from '@/lib/nctirs/kenyaContextData';
import { BorderLog, WildlifePing, SocialSentiment, ISPTrace } from '@/lib/nctirs/kenyaExtendedData';
import { CloudRain, Sun, Cloud, CloudFog, Smartphone, Car, PawPrint, MessageSquareDiff, ShieldAlert } from 'lucide-react';

interface KenyaContextPanelProps {
    weather: WeatherLog;
    traffic: TrafficNode[];
    transactions: MpesaTransaction[];
    // Extended Data
    borderLogs?: BorderLog[];
    wildlife?: WildlifePing[];
    sentiment?: SocialSentiment[];
    cyberTraces?: ISPTrace[];
}

export default function KenyaContextPanel({
    weather,
    traffic,
    transactions,
    borderLogs = [],
    wildlife = [],
    sentiment = [],
    // cyberTraces unused for now, reserved for future map viz
    // cyberTraces = []
}: KenyaContextPanelProps) {
    // Filter high-risk content
    const highRiskTx = transactions.filter(t => t.riskScore > 70).slice(0, 5);
    const congestedRoads = [...traffic].sort((a, b) => b.congestionLevel - a.congestionLevel).slice(0, 4);
    const criticalBorderLogs = borderLogs.filter(l => l.riskFlag !== 'NONE').slice(0, 3);
    const dangerWildlife = wildlife.filter(w => w.status !== 'NORMAL').slice(0, 3);
    const negativeSentiment = sentiment.filter(s => s.sentimentScore < -0.5);

    const getWeatherIcon = () => {
        switch (weather.condition) {
            case 'Heavy Rain': return <CloudRain className="w-6 h-6 text-blue-400" />;
            case 'Sunny': return <Sun className="w-6 h-6 text-yellow-400" />;
            case 'Cloudy': return <Cloud className="w-6 h-6 text-gray-400" />;
            case 'Fog': return <CloudFog className="w-6 h-6 text-slate-400" />;
            default: return <Sun className="w-6 h-6 text-yellow-400" />;
        }
    };

    return (
        <div className="flex flex-col gap-4 bg-black/40 border border-green-900/30 p-4 rounded-sm backdrop-blur-sm">
            <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest border-b border-green-900/50 pb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Nairobi Live Fusion
            </h3>

            {/* --- WEATHER & SENTIMENT ROW --- */}
            <div className="grid grid-cols-2 gap-2">
                {/* WEATHER */}
                <div className="bg-black/60 p-2 border border-blue-900/30 rounded flex flex-col items-center justify-center text-center">
                    {getWeatherIcon()}
                    <div className="text-lg font-bold text-white leading-none mt-1">{weather.temperature}°C</div>
                    <div className="text-[9px] text-gray-400 uppercase">{weather.condition}</div>
                </div>
                {/* SENTIMENT */}
                <div className="bg-black/60 p-2 border border-purple-900/30 rounded flex flex-col gap-1">
                    <div className="text-[9px] text-purple-400 uppercase font-bold flex items-center gap-1">
                        <MessageSquareDiff className="w-3 h-3" /> Public Mood
                    </div>
                    {negativeSentiment.map(s => (
                        <div key={s.platform} className="text-[10px] text-red-400 border-l-2 border-red-500 pl-1">
                            {s.topic} ({(s.sentimentScore * 100).toFixed(0)}%)
                        </div>
                    ))}
                    {negativeSentiment.length === 0 && <div className="text-[10px] text-green-500">Stable</div>}
                </div>
            </div>

            {/* --- TRAFFIC & WILDLIFE ROW --- */}
            <div className="space-y-2">
                {/* TRAFFIC */}
                <div>
                    <div className="text-xs text-gray-400 uppercase font-bold flex items-center gap-2 mb-1">
                        <Car className="w-3 h-3" /> Traffic Alerts
                    </div>
                    {congestedRoads.map((road) => (
                        <div key={road.id} className="flex justify-between text-[10px] border-b border-gray-800/30">
                            <span className="truncate w-24 text-gray-300">{road.roadName}</span>
                            <span className="text-red-500 font-bold">{road.congestionLevel}/10</span>
                        </div>
                    ))}
                </div>

                {/* WILDLIFE / BORDER */}
                <div>
                    <div className="text-xs text-gray-400 uppercase font-bold flex items-center gap-2 mb-1">
                        <PawPrint className="w-3 h-3" /> Project Watch
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                        {dangerWildlife.map(w => (
                            <div key={w.assetId} className="bg-orange-900/10 border border-orange-900/30 p-1 px-2 rounded flex justify-between items-center">
                                <span className="text-[10px] text-orange-400">{w.type} @ {w.location}</span>
                                <span className="text-[9px] text-orange-500 font-bold">{w.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- FINANCIAL INTELLIGENCE --- */}
            <div className="space-y-1 mt-1">
                <div className="text-xs text-gray-400 uppercase font-bold flex items-center gap-2">
                    <Smartphone className="w-3 h-3" /> Financial Intel
                </div>
                {highRiskTx.map((tx) => (
                    <div key={tx.transactionId} className="flex justify-between items-center text-[10px] border-l-2 border-red-600 pl-2 bg-red-950/10 py-0.5">
                        <span className="text-gray-300 font-mono">{tx.transactionId}</span>
                        <span className="text-red-400 font-bold">Ksh {tx.amount.toLocaleString()}</span>
                    </div>
                ))}
            </div>

            {/* --- BORDER ALERTS --- */}
            {criticalBorderLogs.length > 0 && (
                <div className="bg-red-950/30 border border-red-600/50 p-2 rounded animate-pulse">
                    <div className="text-[10px] text-red-500 font-bold flex items-center gap-2 uppercase mb-1">
                        <ShieldAlert className="w-3 h-3" /> Border Breach Alert
                    </div>
                    {criticalBorderLogs.map(log => (
                        <div key={log.id} className="text-[10px] text-red-300 leading-tight">
                            [{log.pointOfEntry}] {log.riskFlag}: {log.travelerNationality} National
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
