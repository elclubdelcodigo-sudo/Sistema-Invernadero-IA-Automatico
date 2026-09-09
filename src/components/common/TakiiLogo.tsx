import React from 'react';

interface TakiiLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  themeMode?: 'dark' | 'light' | 'auto';
  className?: string;
}

export const TakiiLogo: React.FC<TakiiLogoProps> = ({
  size = 'md',
  showWordmark = true,
  showSubtitle = false,
  subtitle = 'Since 1835',
  themeMode = 'auto',
  className = ''
}) => {
  // Dimensions based on size
  const dimensions = {
    sm: { box: 28, text: 'text-xs', sub: 'text-[9px]' },
    md: { box: 36, text: 'text-base', sub: 'text-[10px]' },
    lg: { box: 48, text: 'text-xl', sub: 'text-xs' },
    xl: { box: 64, text: 'text-2xl', sub: 'text-sm' },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Official Takii Emblem with 3 circles (Red top, Blue left, Yellow right) + TAKII badge */}
      <div
        className="relative bg-white rounded-xl p-1 shadow-sm border border-slate-200/80 flex flex-col items-center justify-center shrink-0"
        style={{
          width: dimensions.box,
          height: dimensions.box
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top Red Circle */}
          <circle cx="50" cy="32" r="21" fill="#E52421" />
          
          {/* Bottom Left Blue Circle */}
          <circle cx="34" cy="54" r="21" fill="#0082CA" />
          
          {/* Bottom Right Yellow/Gold Circle */}
          <circle cx="66" cy="54" r="21" fill="#F5A81C" />

          {/* TAKII stylized text inside the emblem */}
          {/* T */}
          <path
            d="M20 83 H30 M25 83 V92"
            stroke="#111827"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* A with signature dot */}
          <path
            d="M36 92 L41.5 83 L47 92"
            stroke="#111827"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="41.5" cy="87.5" r="1.7" fill="#111827" />
          {/* K */}
          <path
            d="M53 83 V92 M61 83 L54 87.5 L61 92"
            stroke="#111827"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* I */}
          <path
            d="M68 83 V92"
            stroke="#111827"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* I */}
          <path
            d="M76 83 V92"
            stroke="#111827"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Typographic Wordmark "TAKII SEED" */}
      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black font-serif tracking-tight text-slate-100 light:text-slate-950 ${dimensions.text}`}
              style={{ fontFamily: "'Times New Roman', Times, 'Playfair Display', Georgia, serif" }}
            >
              TAKII SEED
            </span>
          </div>
          {showSubtitle && (
            <span className={`text-slate-400 light:text-slate-500 font-medium tracking-wide mt-0.5 ${dimensions.sub}`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
