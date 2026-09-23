import React, { useState, useEffect } from 'react';

interface ShinerayLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
  theme?: 'light' | 'dark';
  customLogoUrl?: string | null;
}

/**
 * ShinerayLogo - Carregamento Automático de Imagens dos Arquivos do App
 * Busca automaticamente qualquer imagem adicionada à pasta /public ou /public/images:
 * - Modo Claro: logo_shineray_final.png, logo-light.png, logo-claro.png, etc.
 * - Modo Noturno: Logo-Shineray (1).png, Logo-Shineray.png, logo-dark.png, etc.
 * Caso o arquivo ainda não tenha sido adicionado, exibe instantaneamente o emblema vetorial oficial.
 */
export const ShinerayLogo: React.FC<ShinerayLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  theme = 'light',
  customLogoUrl,
}) => {
  const isDark = theme === 'dark';

  const imgHeights = {
    sm: 'h-6 sm:h-7',
    md: 'h-8 sm:h-9',
    lg: 'h-10 sm:h-12',
  }[size];

  const dimensions = {
    sm: { width: 170, height: 28 },
    md: { width: 220, height: 36 },
    lg: { width: 270, height: 44 },
  }[size];

  // Candidates for light and dark modes in priority order
  // Conforme solicitação: logo_modoclaro = Modo Claro | logo_claro = Tema Noturno
  const lightCandidates = [
    customLogoUrl,
    '/images/logo_modoclaro.png',
    '/logo_modoclaro.png',
    '/image/logo_modoclaro.png',
    '/logo-light.png',
  ].filter(Boolean) as string[];

  const darkCandidates = [
    customLogoUrl,
    '/images/logo_claro.png',
    '/logo_claro.png',
    '/image/logo_claro.png',
    '/logo-dark.png',
  ].filter(Boolean) as string[];

  const candidateList = isDark ? darkCandidates : lightCandidates;
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [imageFailedAll, setImageFailedAll] = useState(false);

  // Reset candidate index when theme changes
  useEffect(() => {
    setCandidateIndex(0);
    setImageFailedAll(false);
  }, [theme, customLogoUrl]);

  const currentSrc = candidateList[candidateIndex];

  const handleImageError = () => {
    if (candidateIndex + 1 < candidateList.length) {
      setCandidateIndex((prev) => prev + 1);
    } else {
      setImageFailedAll(true);
    }
  };

  const textColor = isDark ? '#FFFFFF' : '#111111';
  const textStroke = isDark ? '#FFFFFF' : 'none';
  const textStrokeWidth = isDark ? '0.75' : '0';

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* If an image candidate is available, load it directly */}
      {!imageFailedAll && currentSrc ? (
        <img
          src={currentSrc}
          alt="Shineray do Brasil"
          referrerPolicy="no-referrer"
          onError={handleImageError}
          className={`${imgHeights} w-auto object-contain max-w-[240px] transition-all`}
        />
      ) : (
        /* Native Fallback Vector SVG Graphic */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 460 76"
          style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
          className="w-auto shrink-0 transition-opacity"
          fill="none"
          aria-label="Shineray do Brasil"
        >
          {/* Shineray 4-point Dynamic Red Star Emblem */}
          <g id="shineray-emblem">
            {/* Top-Left Wing */}
            <polygon points="38,38 4,4 38,28" fill="#E30613" />
            <polygon points="38,38 4,4 28,38" fill="#B3050F" />
            
            {/* Bottom-Left Wing */}
            <polygon points="38,38 4,72 28,38" fill="#B3050F" />
            <polygon points="38,38 4,72 38,48" fill="#E30613" />
            
            {/* Top-Right Wing */}
            <polygon points="38,38 72,4 38,28" fill="#E30613" />
            <polygon points="38,38 72,4 48,38" fill="#B3050F" />
            
            {/* Bottom-Right Wing */}
            <polygon points="38,38 72,72 48,38" fill="#B3050F" />
            <polygon points="38,38 72,72 38,48" fill="#E30613" />

            {/* Center dynamic core */}
            <polygon points="38,28 48,38 38,48 28,38" fill="#E30613" />
            <circle cx="38" cy="38" r="2.5" fill="#D70511" />
          </g>

          {/* Brand Typography: SH */}
          <text 
            x="90" 
            y="56" 
            fontFamily="'Plus Jakarta Sans', 'Arial Black', 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif" 
            fontWeight="900" 
            fontSize="52" 
            letterSpacing="-1px" 
            fill={textColor}
            stroke={textStroke}
            strokeWidth={textStrokeWidth}
          >
            SH
          </text>

          {/* Dynamic Forward Slash "/" (Official Red Accent) */}
          <polygon points="179,56 195,17 210,17 194,56" fill="#E30613" />

          {/* Brand Typography: NERAY */}
          <text 
            x="214" 
            y="56" 
            fontFamily="'Plus Jakarta Sans', 'Arial Black', 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif" 
            fontWeight="900" 
            fontSize="52" 
            letterSpacing="-0.5px" 
            fill={textColor}
            stroke={textStroke}
            strokeWidth={textStrokeWidth}
          >
            NERAY
          </text>
        </svg>
      )}

      {/* Infoserv System Badge */}
      {showSubtitle && (
        <div className="hidden sm:flex flex-col border-l border-neutral-200 dark:border-neutral-800 pl-2.5 ml-1">
          <span className="text-[10px] uppercase font-black tracking-widest text-[#E30613] leading-tight">
            INFOSERV
          </span>
          <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400 leading-tight">
            IBAMA · PROMOT
          </span>
        </div>
      )}
    </div>
  );
};
