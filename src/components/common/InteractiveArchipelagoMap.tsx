import React, { useState } from 'react';
import { 
  Compass, 
  Plus, 
  Minus, 
  RotateCcw, 
  Ship, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Navigation,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { Pulau } from '../../types';

interface InteractiveArchipelagoMapProps {
  pulauList: Pulau[];
  selectedPulauId?: string;
  onSelectPulau?: (pulauId: string) => void;
  heightClass?: string;
  showDetailsOnHover?: boolean;
}

export const InteractiveArchipelagoMap: React.FC<InteractiveArchipelagoMapProps> = ({
  pulauList,
  selectedPulauId,
  onSelectPulau,
  heightClass = 'h-[360px] lg:h-[410px]',
  showDetailsOnHover = true
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredPulau, setHoveredPulau] = useState<string | null>(null);

  // Island definitions with geographic positioning within canvas (400 x 300 virtual coordinate space)
  const islands = [
    {
      id: 'PULAU-01',
      name: 'Pulau Tidung',
      cx: 120,
      cy: 90,
      sasaran: 28,
      perluTL: 20,
      tertunda: 6,
      status: 'Lancar',
      statusColor: '#10b981',
      path: 'M95,85 Q115,75 145,85 Q165,95 135,102 Q105,100 95,85 Z',
      bridge: 'M145,85 L180,92',
      secondIslet: 'M180,90 Q195,88 200,94 Q195,98 180,95 Z'
    },
    {
      id: 'PULAU-02',
      name: 'Pulau Pari',
      cx: 260,
      cy: 140,
      sasaran: 24,
      perluTL: 17,
      tertunda: 7,
      status: 'Lancar',
      statusColor: '#10b981',
      path: 'M245,130 Q265,125 285,135 Q290,148 275,152 Q255,150 245,130 Z'
    },
    {
      id: 'PULAU-03',
      name: 'Pulau Lancang',
      cx: 140,
      cy: 210,
      sasaran: 12,
      perluTL: 9,
      tertunda: 3,
      status: 'Perlu koordinasi',
      statusColor: '#f59e0b',
      path: 'M125,205 Q145,198 155,210 Q145,222 130,218 Z'
    },
    {
      id: 'PULAU-04',
      name: 'Pulau Untung Jawa',
      cx: 300,
      cy: 235,
      sasaran: 8,
      perluTL: 7,
      tertunda: 1,
      status: 'Lancar',
      statusColor: '#10b981',
      path: 'M285,225 Q310,220 320,235 Q305,248 290,242 Z'
    }
  ];

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden bg-gradient-to-b from-[#cae8f8] via-[#bfe3f7] to-[#aedbf4] dark:from-[#0b223d] dark:via-[#091d35] dark:to-[#071629] border border-sky-200 dark:border-sky-900/60 shadow-xs select-none group`}>
      
      {/* 1. Sea Water Pattern & Subtle Bathymetry Shading */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
        <defs>
          <pattern id="seaGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38bdf8" strokeWidth="0.4" strokeOpacity="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#seaGrid)" />
      </svg>

      {/* 2. Vector Sea Map Surface */}
      <svg 
        viewBox="0 0 400 300" 
        className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-300"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        {/* Shallow coral reef / water halos around islands */}
        <ellipse cx="145" cy="90" rx="60" ry="25" fill="#a7daf5" fillOpacity="0.5" className="dark:fill-sky-800/20" />
        <ellipse cx="265" cy="140" rx="35" ry="25" fill="#a7daf5" fillOpacity="0.5" className="dark:fill-sky-800/20" />
        <ellipse cx="140" cy="210" rx="30" ry="20" fill="#a7daf5" fillOpacity="0.5" className="dark:fill-sky-800/20" />
        <ellipse cx="300" cy="235" rx="35" ry="22" fill="#a7daf5" fillOpacity="0.5" className="dark:fill-sky-800/20" />

        {/* Dotted Shipping / Boat Navigation Routes */}
        <g stroke="#0284c7" strokeWidth="1.4" strokeDasharray="3 3" fill="none" strokeOpacity="0.65">
          <path d="M145,90 Q195,105 260,140" />
          <path d="M145,90 Q130,150 140,210" />
          <path d="M260,140 Q220,180 140,210" />
          <path d="M260,140 Q290,190 300,235" />
          <path d="M140,210 Q220,230 300,235" />
        </g>

        {/* Boat Icons Along Maritime Routes */}
        <g fill="#0369a1" className="dark:fill-sky-300">
          <circle cx="200" cy="115" r="3" />
          <circle cx="137" cy="150" r="3" />
          <circle cx="200" cy="195" r="3" />
          <circle cx="280" cy="187" r="3" />
        </g>

        {/* Islands Landmasses with lush island green styling */}
        {islands.map(isle => {
          const isSelected = selectedPulauId === isle.id;
          const isHovered = hoveredPulau === isle.id;

          return (
            <g 
              key={isle.id}
              onClick={() => onSelectPulau && onSelectPulau(isle.id)}
              onMouseEnter={() => setHoveredPulau(isle.id)}
              onMouseLeave={() => setHoveredPulau(null)}
              className="cursor-pointer group"
            >
              {/* Island Silhouette (Main Landmass) */}
              <path
                d={isle.path}
                fill={isSelected ? '#15803d' : '#22c55e'}
                stroke="#166534"
                strokeWidth={isSelected ? '2' : '1.2'}
                className="transition-all duration-200 hover:fill-[#16a34a] filter drop-shadow-sm"
              />

              {/* Tidung Bridge + Kecil Island */}
              {isle.bridge && (
                <path d={isle.bridge} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="1 1" />
              )}
              {isle.secondIslet && (
                <path d={isle.secondIslet} fill="#22c55e" stroke="#166534" strokeWidth="1" />
              )}

              {/* Active Indicator Pulse */}
              {isSelected && (
                <circle cx={isle.cx} cy={isle.cy} r="18" fill="#0284c7" fillOpacity="0.2" className="animate-ping" />
              )}
            </g>
          );
        })}

        {/* Sea Title Watermark */}
        <text 
          x="200" 
          y="270" 
          textAnchor="middle" 
          fontFamily="sans-serif" 
          fontSize="12" 
          fontStyle="italic"
          fontWeight="bold"
          letterSpacing="2"
          fill="#0369a1" 
          fillOpacity="0.25"
          className="dark:fill-sky-300/20 pointer-events-none"
        >
          Laut Jawa
        </text>
      </svg>

      {/* 3. Floating Island Badges (Exact layout matching mockup) */}
      {islands.map(isle => {
        const isSelected = selectedPulauId === isle.id;

        // Position coordinates as CSS percentages
        const topPct = (isle.cy / 300) * 100;
        const leftPct = (isle.cx / 400) * 100;

        return (
          <div
            key={isle.id}
            onClick={() => onSelectPulau && onSelectPulau(isle.id)}
            style={{ 
              top: `${topPct}%`, 
              left: `${leftPct}%`,
              transform: 'translate(-50%, -100%)' 
            }}
            className="absolute z-20 cursor-pointer pointer-events-auto transition-transform duration-200 hover:scale-105"
          >
            <div className={`
              px-2 py-1 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs shadow-md border 
              ${isSelected ? 'border-sky-500 ring-2 ring-sky-400/40' : 'border-slate-200/90 dark:border-slate-700'}
              flex flex-col items-center gap-0.5 text-[10px] leading-tight
            `}>
              {/* Island Name */}
              <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isle.statusColor }} />
                <span>{isle.name}</span>
              </div>

              {/* Metrics Badge: 👤 sasaran | 🎗️ perlu TL | ⚠️ tertunda */}
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-600 dark:text-slate-300 pt-0.5 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-0.5" title="Jumlah Sasaran Balita">
                  <span className="text-slate-400">👤</span>
                  <b>{isle.sasaran}</b>
                </span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span className="flex items-center gap-0.5 text-sky-600 dark:text-sky-400 font-bold" title="Memerlukan Tindak Lanjut">
                  <span>🎗️</span>
                  <b>{isle.perluTL}</b>
                </span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span className="flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-bold" title="Tindak Lanjut Tertunda">
                  <span>⚠️</span>
                  <b>{isle.tertunda}</b>
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* 4. Compass Rose (Top Left) */}
      <div className="absolute top-3 left-3 z-10 flex flex-col items-center p-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-2xs">
        <Navigation className="w-4 h-4 text-sky-700 dark:text-sky-400 -rotate-45" />
        <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 mt-0.5">N</span>
      </div>

      {/* 5. Scale Indicator (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-col items-start px-2 py-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs rounded-lg border border-slate-200/70 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-mono shadow-2xs">
        <div className="w-12 h-1 bg-slate-700 dark:bg-slate-300 mb-0.5" />
        <span>5 km</span>
      </div>

      {/* 6. Zoom Controls (Bottom Left, above scale) */}
      <div className="absolute bottom-11 left-3 z-10 flex flex-col bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <button 
          onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 1.8))}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          title="Zoom In"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.8))}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700"
          title="Zoom Out"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 7. Floating Map Legend (Top Right / Bottom Right matching mockup) */}
      <div className="absolute top-3 right-3 z-10 p-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs text-[10px] space-y-1.5 max-w-[170px]">
        <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px] pb-1 border-b border-slate-100 dark:border-slate-800">
          Legenda
        </div>
        
        <div className="space-y-1 text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <span>👤</span>
            <span>Jumlah sasaran balita</span>
          </div>
          <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400">
            <span>🎗️</span>
            <span>Memerlukan tindak lanjut</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
            <span>⚠️</span>
            <span>Tindak lanjut tertunda</span>
          </div>
        </div>

        <div className="pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] space-y-0.5">
          <div className="font-semibold text-slate-700 dark:text-slate-300">Status Akses Wilayah</div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Lancar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Perlu koordinasi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Terkendala</span>
          </div>
        </div>
      </div>

    </div>
  );
};
