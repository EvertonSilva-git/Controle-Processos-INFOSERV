import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ShinerayLogo } from './ShinerayLogo';
import { Processo, formatarCNPJ } from '../types/process';
import { 
  Plus, 
  LayoutDashboard, 
  FolderKanban, 
  RefreshCw, 
  Sun, 
  Moon, 
  Clock,
  Search,
  X,
  Building2,
  ArrowRight,
  FileSpreadsheet,
  UserCheck
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'home' | 'processos' | 'cadastro';
  onNavigate: (tab: 'home' | 'processos' | 'cadastro') => void;
  totalProcessos: number;
  totalRevalidar: number;
  onExportExcel: () => void;
  onResetData: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  processos?: Processo[];
  onSelectProcesso?: (processo: Processo) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  currentUser?: string | null;
  onSwitchUser?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  totalProcessos,
  totalRevalidar,
  onExportExcel,
  onResetData,
  theme,
  onToggleTheme,
  processos = [],
  onSelectProcesso,
  searchQuery = '',
  onSearchChange,
  currentUser,
  onSwitchUser,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter processes based on search query
  const filteredProcessos = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return processos.filter((p) => {
      const matchesSol = p.numeroSolicitacao.toLowerCase().includes(q);
      const matchesMMV = p.mmv.toLowerCase().includes(q);
      const matchesLic = p.numeroLicenca ? p.numeroLicenca.toLowerCase().includes(q) : false;
      const matchesOrig = p.mmvOriginal ? p.mmvOriginal.toLowerCase().includes(q) : false;
      const matchesTipo = p.tipo.toLowerCase().includes(q);
      const matchesVeic = p.tipoVeiculo.toLowerCase().includes(q);
      const matchesOrgao = p.orgaoCertificador ? p.orgaoCertificador.toLowerCase().includes(q) : false;
      const matchesCnpj = p.cnpj
        ? p.cnpj.toLowerCase().includes(q) || formatarCNPJ(p.cnpj).toLowerCase().includes(q)
        : false;
      const matchesObs = p.observacoes?.some((obs) => obs.texto.toLowerCase().includes(q)) ?? false;

      return (
        matchesSol ||
        matchesMMV ||
        matchesLic ||
        matchesOrig ||
        matchesTipo ||
        matchesVeic ||
        matchesOrgao ||
        matchesCnpj ||
        matchesObs
      );
    });
  }, [processos, searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (onSearchChange) {
      onSearchChange(val);
    }
    setIsSearchOpen(val.trim().length > 0);
  };

  const handleClearSearch = () => {
    if (onSearchChange) {
      onSearchChange('');
    }
    setIsSearchOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsSearchOpen(false);
      onNavigate('processos');
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  const handleSelectResult = (proc: Processo) => {
    setIsSearchOpen(false);
    if (onSelectProcesso) {
      onSelectProcesso(proc);
    } else {
      onNavigate('processos');
    }
  };

  const getSituacaoBadgeStyle = (situacao: string) => {
    switch (situacao) {
      case 'Licença/Certidão emitida':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Para correção':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'A pagar':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Encaminhada para o ibama':
        return 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      case 'Em análise pelo Analista do ATC':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      default:
        return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-neutral-200/90 dark:border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Zone 1: Official Fixed Shineray Brand & Navigation Links */}
          <div className="flex items-center gap-2 sm:gap-5 shrink-0">
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

            <nav className="flex items-center gap-1">
              <button
                onClick={() => onNavigate('home')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
                  currentTab === 'home'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden md:inline">Início</span>
              </button>

              <button
                onClick={() => onNavigate('processos')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors relative ${
                  currentTab === 'processos'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <FolderKanban className="w-4 h-4" />
                <span className="hidden md:inline">Processos</span>
                <span className="text-xs font-mono tabular-nums opacity-80 bg-neutral-200/60 dark:bg-neutral-800 text-inherit px-1.5 py-0.2 rounded">
                  {totalProcessos}
                </span>
                {totalRevalidar > 0 && (
                  <span
                    title={`${totalRevalidar} licença(s) para revalidação (≤ 61 dias)`}
                    className="hidden sm:flex items-center gap-1 bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 text-[11px] font-mono font-semibold px-1.5 py-0.2 rounded-full"
                  >
                    <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>{totalRevalidar}</span>
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Zone 2: Top Bar Search Field - Ampliada e com opções destacadas e confortáveis */}
          <div
            ref={searchContainerRef}
            className="flex-1 max-w-3xl lg:max-w-4xl min-w-0 mx-2 sm:mx-4 relative"
          >
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-5 h-5 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) {
                    setIsSearchOpen(true);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Buscar por número (SL/SD), MMV, tipo, licença, CNPJ, anotações..."
                className="w-full h-11 pl-11 pr-10 text-sm sm:text-base bg-neutral-100 hover:bg-neutral-150 focus:bg-white dark:bg-neutral-800/80 dark:hover:bg-neutral-800 dark:focus:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#E30613]/30 dark:focus:ring-[#E30613]/40 transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-700 transition-colors"
                  title="Limpar pesquisa"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Search Dropdown Drawer - Formato horizontal amplo, espaçoso e sem espremer */}
            {isSearchOpen && searchQuery.trim().length > 0 && (
              <div className="fixed inset-x-3 sm:inset-x-auto sm:absolute sm:left-1/2 sm:-translate-x-1/2 top-16 sm:top-full mt-2 sm:w-[680px] md:w-[780px] lg:w-[860px] sm:max-w-[calc(100vw-32px)] bg-white dark:bg-[#111827] border border-neutral-300 dark:border-neutral-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                <div className="px-4 sm:px-5 py-3 text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-850">
                  <div className="flex items-center gap-2">
                    <span>Opções encontradas ({filteredProcessos.length})</span>
                    <span className="hidden sm:inline text-xs font-normal text-neutral-500 dark:text-neutral-400">
                      · Clique em uma opção para ver detalhes
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      onNavigate('processos');
                    }}
                    className="text-[#E30613] hover:underline font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 py-0.5 px-2 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0"
                  >
                    <span>Ver na tela de processos</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="max-h-[30rem] sm:max-h-[34rem] overflow-y-auto overflow-x-hidden divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredProcessos.length === 0 ? (
                    <div className="p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                      Nenhum processo localizado para "{searchQuery}".
                    </div>
                  ) : (
                    filteredProcessos.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectResult(p)}
                        className="w-full px-4 sm:px-5 py-3.5 sm:py-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group border-l-4 border-transparent hover:border-[#E30613] cursor-pointer"
                      >
                        <div className="min-w-0 flex-1 space-y-1.5">
                          {/* Linha principal: Nº Solicitação e MMV com espaçamento horizontal limpo */}
                          <div className="flex flex-wrap items-center gap-2.5 text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                            <span className="font-mono text-sm sm:text-base text-[#E30613] font-black px-2.5 py-0.5 rounded-md bg-red-50 dark:bg-red-950/50 border border-red-200/60 dark:border-red-900/40 shrink-0">
                              {p.numeroSolicitacao}
                            </span>
                            <span className="truncate group-hover:text-[#E30613] transition-colors">
                              {p.mmv}
                            </span>
                            {p.isExtensao && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md shrink-0">
                                Extensão
                              </span>
                            )}
                          </div>

                          {/* Metadados e Chips em linha horizontal com boa largura */}
                          <div className="text-xs text-neutral-600 dark:text-neutral-300 flex flex-wrap items-center gap-1.5 sm:gap-2 pt-0.5">
                            <span className="font-semibold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200/80 dark:border-neutral-700 shrink-0 whitespace-nowrap">
                              {p.tipo}
                            </span>
                            {p.orgaoCertificador && (
                              <span className="font-mono font-bold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200/80 dark:border-neutral-700 shrink-0 whitespace-nowrap">
                                {p.orgaoCertificador}
                              </span>
                            )}
                            {p.cnpj && (
                              <span className="font-mono inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-700 shrink-0 whitespace-nowrap">
                                <Building2 className="w-3.5 h-3.5 text-[#E30613]" />
                                {formatarCNPJ(p.cnpj)}
                              </span>
                            )}
                            {p.numeroLicenca && (
                              <span className="font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0 whitespace-nowrap">
                                Licença: {p.numeroLicenca}
                              </span>
                            )}
                            {p.tipoVeiculo && (
                              <span className="px-2 py-0.5 rounded bg-neutral-100/70 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-800 shrink-0 whitespace-nowrap">
                                {p.tipoVeiculo}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Regulamentar com badge nítido e seta indicativa */}
                        <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
                          <span className={`text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg border shadow-2xs whitespace-nowrap ${getSituacaoBadgeStyle(p.situacao)}`}>
                            {p.situacao}
                          </span>
                          <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-[#E30613] group-hover:translate-x-1 transition-all shrink-0 hidden md:block" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Zone 3: Actions - Theme Toggle + Excel Compacto + Usuário Compacto + '+' button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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

            {/* Botão de Exportar para Excel (.xlsx) - tamanho compacto e discreto */}
            <button
              onClick={onExportExcel}
              title="Baixar planilha organizada no formato Excel (.xlsx)"
              className="h-8 px-2 sm:px-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-semibold hidden md:inline">Excel</span>
            </button>

            <button
              onClick={onResetData}
              title="Restaurar dados padrão de teste"
              className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors hidden xl:flex cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Usuário Atual com opção de trocar - tamanho compacto */}
            {currentUser && onSwitchUser && (
              <button
                type="button"
                onClick={onSwitchUser}
                title={`Usuário ativo: ${currentUser} (${currentUser === 'Luca Andrade' ? 'Engenheiro Mecânico' : 'Assistente Técnico de Homologação'}) - Clique para alternar`}
                className="h-8 hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-750 transition-colors text-[11px] font-medium text-neutral-700 dark:text-neutral-200 shadow-2xs cursor-pointer shrink-0"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${currentUser === 'Luca Andrade' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                <span className="truncate max-w-[75px] text-[11px] font-semibold">{currentUser}</span>
                <span className="text-[10px] text-neutral-400 font-normal">⇄</span>
              </button>
            )}

            {/* Primary Navigation '+' Button with hover tooltip "Cadastrar novo processo" */}
            <div className="relative group">
              <button
                onClick={() => onNavigate('cadastro')}
                aria-label="Cadastrar novo processo"
                className={`flex items-center justify-center gap-1.5 h-9 px-3 sm:px-3.5 rounded-lg font-semibold text-xs sm:text-sm text-white transition-colors shadow-2xs ${
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

