import React from 'react';
import { ShinerayLogo } from './ShinerayLogo';
import { 
  Plus, 
  LayoutDashboard, 
  FolderKanban, 
  Download, 
  RefreshCw, 
  Sun, 
  Moon, 
  Clock 
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'home' | 'processos' | 'cadastro';
  onNavigate: (tab: 'home' | 'processos' | 'cadastro') => void;
  totalProcessos: number;
  totalRevalidar: number;
  onExport: () => void;
  onResetData: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  totalProcessos,
  totalRevalidar,
  onExport,
  onResetData,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-neutral-200/90 dark:border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Official Fixed Shineray Brand */}
          <div className="flex items-center">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 rounded-lg transition-transform hover:opacity-95"
              title="Ir para o início"
            >
              <ShinerayLogo 
                size="md" 
                theme={theme}
              />
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onNavigate('home')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
                currentTab === 'home'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Início</span>
            </button>

            <button
              onClick={() => onNavigate('processos')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors relative ${
                currentTab === 'processos'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              <span>Processos</span>
              <span className="text-xs font-mono tabular-nums opacity-80 bg-neutral-200/60 dark:bg-neutral-800 text-inherit px-1.5 py-0.2 rounded">
                {totalProcessos}
              </span>
              {totalRevalidar > 0 && (
                <span
                  title={`${totalRevalidar} licença(s) para revalidação (≤ 61 dias)`}
                  className="flex items-center gap-1 bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 text-[11px] font-mono font-semibold px-1.5 py-0.2 rounded-full"
                >
                  <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>{totalRevalidar}</span>
                </span>
              )}
            </button>
          </nav>

          {/* Zone 3: Actions - Theme Toggle + Export + Primary '+' button */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
              className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              aria-label="Alternar tema de cores"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-neutral-600 transition-transform" />
              )}
            </button>

            <button
              onClick={onExport}
              title="Exportar dados dos processos em JSON/CSV"
              className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors hidden sm:flex"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onResetData}
              title="Restaurar dados padrão de teste"
              className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors hidden md:flex"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Primary Navigation '+' Button with hover tooltip "Cadastrar novo processo" */}
            <div className="relative group">
              <button
                onClick={() => onNavigate('cadastro')}
                aria-label="Cadastrar novo processo"
                className={`flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg font-semibold text-xs sm:text-sm text-white transition-colors shadow-2xs ${
                  currentTab === 'cadastro'
                    ? 'bg-neutral-900 dark:bg-white dark:text-neutral-950'
                    : 'bg-[#E30613] hover:bg-[#c70510]'
                }`}
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">Novo Processo</span>
              </button>

              {/* Tooltip on hover */}
              <div className="absolute right-0 top-full mt-2 hidden group-hover:flex items-center pointer-events-none z-50 whitespace-nowrap">
                <div className="bg-neutral-900 dark:bg-neutral-800 text-white text-xs font-medium px-2.5 py-1.5 rounded shadow-lg border border-neutral-800 dark:border-neutral-700">
                  Cadastrar novo processo
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
