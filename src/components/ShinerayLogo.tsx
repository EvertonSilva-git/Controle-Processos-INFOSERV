import React from 'react';

interface ShinerayLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
  customLogoUrl?: string | null;
  customLogoLight?: string | null;
  customLogoDark?: string | null;
  theme?: 'light' | 'dark';
}

export const ShinerayLogo: React.FC<ShinerayLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  customLogoUrl,
  customLogoLight,
  customLogoDark,
  theme,
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const imgHeights = {
    sm: 'h-6',
    md: 'h-8 sm:h-9',
    lg: 'h-10 sm:h-12',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  // Determine active logo url based on theme
  let resolvedLogoUrl: string | null = null;

  if (theme === 'dark') {
    resolvedLogoUrl = customLogoDark || customLogoUrl || customLogoLight || null;
  } else if (theme === 'light') {
    resolvedLogoUrl = customLogoLight || customLogoUrl || null;
  } else {
    // If theme not explicitly passed, check direct customLogoUrl or customLogoLight
    resolvedLogoUrl = customLogoUrl || customLogoLight || customLogoDark || null;
  }

  // If an official logo image is active
  if (resolvedLogoUrl) {
    return (
      <div className={`flex items-center gap-2.5 select-none ${className}`}>
        <img
          src={resolvedLogoUrl}
          alt="Shineray do Brasil"
          className={`${imgHeights[size]} w-auto object-contain max-w-[220px] transition-all`}
        />
        {showSubtitle && (
          <div className="hidden sm:flex flex-col border-l border-neutral-200 dark:border-neutral-700 pl-2.5 ml-0.5">
            <span className="text-[10px] uppercase font-black tracking-widest text-[#E30613]">
              INFOSERV
            </span>
            <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400">
              IBAMA · PROMOT
            </span>
          </div>
        )}
      </div>
    );
  }

  // Default Vector SVG Logo
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Shineray 4-point Dynamic Red Cross Icon */}
      <svg
        className={`${iconSizes[size]} shrink-0`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Top-Left Wing */}
        <polygon points="12,14 44,44 26,50" fill="#E30613" />
        {/* Top-Right Wing */}
        <polygon points="88,14 56,44 74,50" fill="#C40510" />
        {/* Bottom-Left Wing */}
        <polygon points="12,86 44,56 26,50" fill="#E30613" />
        {/* Bottom-Right Wing */}
        <polygon points="88,86 56,56 74,50" fill="#E30613" />
        {/* Center core dynamic cross */}
        <polygon points="44,44 56,44 88,14 78,8 50,38 22,8 12,14" fill="#E30613" />
        <polygon points="44,56 56,56 88,86 78,92 50,62 22,92 12,86" fill="#D70511" />
      </svg>

      {/* Brand Text: SH / NERAY */}
      <div className="flex flex-col">
        <div className={`font-extrabold tracking-tight leading-none ${textSizes[size]} text-neutral-900 dark:text-white flex items-center`}>
          <span className="tracking-tighter">SH</span>
          <span className="text-[#E30613] font-black mx-[1.5px] italic text-[1.08em] select-none">/</span>
          <span className="tracking-tight">NERAY</span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#E30613] mt-0.5">
            INFOSERV · HOMOLOGAÇÃO
          </span>
        )}
      </div>
    </div>
  );
};
