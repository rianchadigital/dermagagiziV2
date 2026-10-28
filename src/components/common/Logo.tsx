import React from 'react';

export const Logo: React.FC<{ size?: 'sm' | 'md' | 'lg'; isHeader?: boolean }> = ({ 
  size = 'md',
  isHeader = false 
}) => {
  const dim = size === 'sm' ? 32 : size === 'lg' ? 46 : 38;
  
  return (
    <div className="flex items-center gap-3">
      <div 
        className="flex items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 via-sky-600 to-indigo-800 text-white shadow-md shadow-sky-950/30 shrink-0"
        style={{ width: dim, height: dim }}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/4 h-3/4"
        >
          {/* Gelombang Laut */}
          <path
            d="M6 34C11 32 15 36 20 34C25 32 29 36 34 34C39 32 43 35 46 34"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M4 40C9 38 13 42 18 40C23 38 27 42 32 40C37 38 41 41 44 40"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Dermaga Kayu */}
          <path
            d="M10 26L38 26"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path d="M16 26V36" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M24 26V37" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M32 26V36" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
          
          {/* Tunas Balita / Daun Pertumbuhan Gizi */}
          <path
            d="M24 10C24 10 32 11 32 18C32 22 28 25 24 25C20 25 16 22 16 18C16 11 24 10 24 10Z"
            fill="#38bdf8"
            fillOpacity="0.5"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M24 13V24"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="24" cy="9" r="3" fill="#fde047" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold tracking-tight text-white text-base md:text-lg uppercase">
            DERMAGA GIZI
          </span>
        </div>
        {!isHeader ? (
          <p className="text-[11px] text-sky-200/90 leading-tight mt-0.5 line-clamp-2">
            Dashboard Pemantauan Tindak Lanjut Balita Bermasalah Gizi Wilayah Kepulauan
          </p>
        ) : (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
            Puskesmas Kepulauan Seribu Selatan
          </p>
        )}
      </div>
    </div>
  );
};
