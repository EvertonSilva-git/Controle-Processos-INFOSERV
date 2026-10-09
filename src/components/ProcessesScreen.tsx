import React, { useState, useMemo } from 'react';
import { Processo, ProcessoTipo, ProcessosSubTab, CnpjOption, formatarCNPJ } from '../types/process';
import {
  calcularDiasRestantes,
  calcularDiasSolicitacaoAteEmissao,
  estaParaRevalidar,
  formatarDataBR,
} from '../utils/processCalculations';
import { RevalidationAlertBanner } from './RevalidationAlertBanner';
import { ClassificationTypesBar } from './ClassificationTypesBar';
import { CnpjFilterCards } from './CnpjFilterCards';
import { LeadTimeComparisonScreen } from './LeadTimeComparisonScreen';
import {
  Search,
  MessageSquare,
  Edit3,
  Trash2,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  Layers,
  ArrowUpDown,
  Car,
  FileText,
  AlertCircle,
  Plus,
  X,
  Building2,
  GitBranch,
  ChevronDown,
  Timer,
} from 'lucide-react';

interface ProcessesScreenProps {
  processos: Processo[];
  currentSubTab: ProcessosSubTab;
  onSubTabChange: (subTab: ProcessosSubTab) => void;
  tipoFiltro?: ProcessoTipo | null;
  onTipoFiltroChange?: (tipo: ProcessoTipo | null) => void;
  onOpenObservations: (processo: Processo) => void;
  onEditProcesso: (processo: Processo) => void;
  onDeleteProcesso: (processoId: string) => void;
  onNavigateToCadastro: () => void;
  onCreateExtensao?: (processoOriginal: Processo) => void;
  cnpjs?: CnpjOption[];
  onAddCnpj?: (newCnpj: CnpjOption) => void;
  onDeleteCnpj?: (rawCnpj: string) => void;
  searchTerm?: string;
  onSearchTermChange?: (term: string) => void;
  onExportExcel?: () => void;
}

export const ProcessesScreen: React.FC<ProcessesScreenProps> = ({
  processos,
  currentSubTab,
  onSubTabChange,
  tipoFiltro,
  onTipoFiltroChange,
  onOpenObservations,
  onEditProcesso,
  onDeleteProcesso,
  onNavigateToCadastro,
  onCreateExtensao,
  cnpjs,
  onAddCnpj,
  onDeleteCnpj,
  searchTerm: externalSearchTerm,
  onSearchTermChange,
  onExportExcel,
}) => {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
  const setSearchTerm = onSearchTermChange || setInternalSearchTerm;
  const [procedenciaFiltro, setProcedenciaFiltro] = useState<string>('todos');
  const [quantidadeFiltro, setQuantidadeFiltro] = useState<string>('todos');
  const [cnpjFiltro, setCnpjFiltro] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recentes' | 'validade' | 'solicitacao'>('recentes');
  const [expandedExtensoes, setExpandedExtensoes] = useState<Record<string, boolean>>({});

  const toggleExpandedExtensoes = (id: string) => {
    setExpandedExtensoes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Processos filtrados pelo CNPJ selecionado (para alimentar dinamicamente a barra de tipos)
  const processosDoCnpj = useMemo(() => {
    if (!cnpjFiltro) return processos;
    const targetClean = cnpjFiltro.replace(/\D/g, '');
    return processos.filter((p) => {
      const pClean = (p.cnpj || '').replace(/\D/g, '');
      return pClean === targetClean;
    });
  }, [processos, cnpjFiltro]);

  const handleSelectCnpj = (novoCnpj: string | null) => {
    setCnpjFiltro(novoCnpj);
    if (novoCnpj && tipoFiltro && onTipoFiltroChange) {
      const cleanTarget = novoCnpj.replace(/\D/g, '');
      const temTipoNoCnpj = processos.some((p) => {
        const pClean = (p.cnpj || '').replace(/\D/g, '');
        return pClean === cleanTarget && p.tipo === tipoFiltro;
      });
      if (!temTipoNoCnpj) {
        onTipoFiltroChange(null);
      }
    }
  };

  // Unique quantities present in processes
  const uniqueQuantidades = useMemo(() => {
    const set = new Set<string>();
    processos.forEach((p) => {
      if (p.quantidade && p.quantidade.trim()) {
        set.add(p.quantidade.trim());
      }
    });
    // Add default options if not present
    ['Restrita (3 a 100)', 'Ilimitada (100+)', 'Restrita (3 a 50)', 'Ilimitada (50+)', '1', '2', 'Limitada (1 a 2)'].forEach((q) => set.add(q));
    return Array.from(set).sort();
  }, [processos]);

  // Counts for tabs
  const countEmEdicao = useMemo(
    () => processos.filter((p) => p.situacao === 'Em edição').length,
    [processos]
  );

  const countParaCorrecao = useMemo(
    () => processos.filter((p) => p.situacao === 'Para correção').length,
    [processos]
  );

  const countEmTramitacao = useMemo(
    () =>
      processos.filter(
        (p) =>
          p.situacao === 'Encaminhada para o ibama' ||
          p.situacao === 'Em análise pelo Analista do ATC' ||
          p.situacao === 'A pagar'
      ).length,
    [processos]
  );

  const countLicencasEmitidas = useMemo(
    () =>
      processos.filter(
        (p) => p.situacao === 'Licença/Certidão emitida' || !!p.numeroLicenca
      ).length,
    [processos]
  );

  const countParaRevalidacao = useMemo(
    () => processos.filter((p) => estaParaRevalidar(p.dataValidade, p.situacao)).length,
    [processos]
  );

  const countComPrazos = useMemo(
    () =>
      processos.filter((p) => {
        const calc = calcularDiasSolicitacaoAteEmissao(p.dataEnvio, p.dataEmissao);
        return !!calc?.emitido;
      }).length,
    [processos]
  );

  const processosParaRevalidar = useMemo(() => {
    return processos.filter((p) => estaParaRevalidar(p.dataValidade, p.situacao));
  }, [processos]);

  // Filter processes according to subTab
  const subTabFiltered = useMemo(() => {
    switch (currentSubTab) {
      case 'em_edicao':
        return processos.filter((p) => p.situacao === 'Em edição');
      case 'para_correcao':
        return processos.filter((p) => p.situacao === 'Para correção');
      case 'em_tramitacao':
        return processos.filter(
          (p) =>
            p.situacao === 'Encaminhada para o ibama' ||
            p.situacao === 'Em análise pelo Analista do ATC' ||
            p.situacao === 'A pagar'
        );
      case 'licencas_emitidas':
        return processos.filter(
          (p) => p.situacao === 'Licença/Certidão emitida' || !!p.numeroLicenca
        );
      case 'para_revalidacao':
        return processos.filter((p) =>
          estaParaRevalidar(p.dataValidade, p.situacao)
        );
      case 'todos':
      default:
        return processos;
    }
  }, [processos, currentSubTab]);

  // Apply search, type, provenance, quantity and cnpj filters
  const finalFiltered = useMemo(() => {
    return subTabFiltered.filter((p) => {
      // Text search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesSol = p.numeroSolicitacao.toLowerCase().includes(query);
        const matchesMMV = p.mmv.toLowerCase().includes(query);
        const matchesLic = p.numeroLicenca ? p.numeroLicenca.toLowerCase().includes(query) : false;
        const matchesOrig = p.mmvOriginal ? p.mmvOriginal.toLowerCase().includes(query) : false;
        const matchesVeic = p.tipoVeiculo.toLowerCase().includes(query);
        const matchesCnpj = p.cnpj
          ? p.cnpj.toLowerCase().includes(query) || formatarCNPJ(p.cnpj).toLowerCase().includes(query)
          : false;
        const matchesOrgao = p.orgaoCertificador ? p.orgaoCertificador.toLowerCase().includes(query) : false;
        const matchesObs = p.observacoes.some((obs) => obs.texto.toLowerCase().includes(query));

        if (!matchesSol && !matchesMMV && !matchesLic && !matchesOrig && !matchesVeic && !matchesCnpj && !matchesOrgao && !matchesObs) {
          return false;
        }
      }

      // Tipo filter
      if (tipoFiltro && p.tipo !== tipoFiltro) {
        return false;
      }

      // Procedencia filter
      if (procedenciaFiltro !== 'todos' && p.procedencia !== procedenciaFiltro) {
        return false;
      }

      // Quantidade filter
      if (quantidadeFiltro !== 'todos') {
        if (!p.quantidade || p.quantidade.trim() !== quantidadeFiltro.trim()) {
          return false;
        }
      }

      // CNPJ filter
      if (cnpjFiltro) {
        const targetClean = cnpjFiltro.replace(/\D/g, '');
        const pClean = (p.cnpj || '').replace(/\D/g, '');
        if (pClean !== targetClean) {
          return false;
        }
      }

      return true;
    });
  }, [subTabFiltered, searchTerm, tipoFiltro, procedenciaFiltro, quantidadeFiltro, cnpjFiltro]);

  // Sorting
  const sortedProcessos = useMemo(() => {
    return [...finalFiltered].sort((a, b) => {
      if (sortBy === 'validade') {
        const diasA = calcularDiasRestantes(a.dataValidade) ?? 9999;
        const diasB = calcularDiasRestantes(b.dataValidade) ?? 9999;
        return diasA - diasB;
      }
      if (sortBy === 'solicitacao') {
        return a.numeroSolicitacao.localeCompare(b.numeroSolicitacao);
      }
      // recentes default
      return new Date(b.atualizadoEm || b.criadoEm).getTime() - new Date(a.atualizadoEm || a.criadoEm).getTime();
    });
  }, [finalFiltered, sortBy]);

  // Tab definitions
  const subTabs = [
    {
      id: 'em_edicao' as ProcessosSubTab,
      label: 'Em Edição',
      description: 'Em elaboração interna',
      count: countEmEdicao,
      icon: Clock,
    },
    {
      id: 'para_correcao' as ProcessosSubTab,
      label: 'Para Correção',
      description: 'Ajuste solicitado pelo órgão',
      count: countParaCorrecao,
      icon: AlertCircle,
      isCorrecao: true,
    },
    {
      id: 'em_tramitacao' as ProcessosSubTab,
      label: 'Em Análise / A pagar',
      description: 'Encaminhada ao IBAMA ou ATC',
      count: countEmTramitacao,
      icon: FileText,
    },
    {
      id: 'licencas_emitidas' as ProcessosSubTab,
      label: 'Licenças Emitidas',
      description: 'Concluídas com certidão',
      count: countLicencasEmitidas,
      icon: CheckCircle2,
    },
    {
      id: 'para_revalidacao' as ProcessosSubTab,
      label: 'Para Revalidação',
      description: 'Vencimento em ≤ 61 dias',
      count: countParaRevalidacao,
      icon: AlertTriangle,
      urgent: countParaRevalidacao > 0,
    },
    {
      id: 'comparacao_prazos' as ProcessosSubTab,
      label: 'Médias e Prazos',
      description: 'Envio → Emissão das licenças',
      count: countComPrazos,
      icon: Timer,
    },
    {
      id: 'todos' as ProcessosSubTab,
      label: 'Todos os Processos',
      description: 'Visão geral consolidada',
      count: processos.length,
      icon: Layers,
    },
  ];

  const getSituacaoStyle = (situacao: string) => {
    switch (situacao) {
      case 'Licença/Certidão emitida':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/40';
      case 'Encaminhada para o ibama':
        return 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/40';
      case 'Em análise pelo Analista do ATC':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/40';
      case 'A pagar':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/40';
      case 'Para correção':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-semibold';
      case 'Em edição':
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Alerta de Licenças para Revalidação */}
      {currentSubTab !== 'para_revalidacao' && processosParaRevalidar.length > 0 && (
        <RevalidationAlertBanner
          processosRevalidar={processosParaRevalidar}
          onVerProcessosRevalidacao={() => onSubTabChange('para_revalidacao')}
          onSelecionarProcesso={(proc) => onEditProcesso(proc)}
        />
      )}

      {/* Sub-screens Navigation Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-1.5 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-1.5">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentSubTab === tab.id;
            const isRevalidacaoUrgent = tab.id === 'para_revalidacao' && tab.count > 0;

            return (
              <button
                key={tab.id}
                onClick={() => onSubTabChange(tab.id)}
                className={`p-3 rounded-lg text-left relative flex flex-col justify-between transition-all ${
                  isRevalidacaoUrgent
                    ? isActive
                      ? 'revalidacao-pulse-amber ring-2 ring-amber-600 dark:ring-amber-400 text-amber-950 font-bold shadow-md'
                      : 'revalidacao-pulse-amber border border-amber-400/90 text-amber-950 dark:text-amber-100 shadow-2xs hover:brightness-105'
                    : isActive
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isRevalidacaoUrgent
                          ? 'text-amber-950 dark:text-amber-200'
                          : isActive
                          ? 'text-[#E30613]'
                          : 'text-neutral-400'
                      }`}
                    />
                    <span
                      className={`text-xs font-semibold truncate ${
                        isRevalidacaoUrgent ? 'text-amber-950 dark:text-amber-100 font-bold' : ''
                      }`}
                    >
                      {tab.label}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-xs font-semibold tabular-nums px-1.5 py-0.2 rounded shrink-0 ${
                      isRevalidacaoUrgent
                        ? 'bg-amber-300/90 text-amber-950 dark:bg-amber-900/90 dark:text-amber-100 font-bold shadow-2xs'
                        : isActive
                        ? 'bg-neutral-800 text-neutral-100 dark:bg-neutral-200 dark:text-neutral-900'
                        : tab.urgent
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </div>
                <div
                  className={`text-[10px] truncate ${
                    isRevalidacaoUrgent
                      ? 'text-amber-900 dark:text-amber-200 font-medium'
                      : isActive
                      ? 'text-neutral-300 dark:text-neutral-600'
                      : 'text-neutral-400'
                  }`}
                >
                  {tab.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Renderização Condicional: Subtela de Médias e Prazos vs. Lista de Processos */}
      {currentSubTab === 'comparacao_prazos' ? (
        <LeadTimeComparisonScreen
          processos={processos}
          onEditProcesso={onEditProcesso}
          onOpenObservations={onOpenObservations}
          onExportExcel={onExportExcel}
        />
      ) : (
        <>
          {/* Cartões Filtros do CNPJ (Posicionados acima dos tipos de homologação) */}
          <CnpjFilterCards
            processos={processos}
            selectedCnpj={cnpjFiltro}
            onSelectCnpj={handleSelectCnpj}
            cnpjs={cnpjs}
            onAddCnpj={onAddCnpj}
            onDeleteCnpj={onDeleteCnpj}
          />

      {/* Classificação por Tipo de Homologação (LCVM, LCM, Especial, Dispensa, Extensão) - Atualiza automaticamente com base no CNPJ */}
      <ClassificationTypesBar
        processos={processosDoCnpj}
        selectedTipo={tipoFiltro}
        selectedCnpj={cnpjFiltro}
        onSelectTipo={(tipo) => onTipoFiltroChange && onTipoFiltroChange(tipo)}
        onEditProcesso={onEditProcesso}
        onOpenObservations={onOpenObservations}
        onNavigateToCadastro={onNavigateToCadastro}
      />

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box - ampliada e confortável */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por número (SL/SD), MMV, tipo, veículo, licença..."
              className="w-full pl-10 pr-16 py-2.5 text-sm sm:text-base border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E30613]/30 dark:focus:ring-[#E30613]/40 placeholder:text-neutral-400 transition-all shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 bg-neutral-200/50 dark:bg-neutral-700 px-2 py-1 rounded-md transition-colors"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Quick Filters - ampliados e legíveis */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Tipo */}
            <select
              value={tipoFiltro || ''}
              onChange={(e) =>
                onTipoFiltroChange && onTipoFiltroChange(e.target.value ? (e.target.value as ProcessoTipo) : null)
              }
              className="px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-400 cursor-pointer shadow-2xs"
            >
              <option value="">Todos os Tipos</option>
              <option value="LCVM">LCVM</option>
              <option value="LCVM Especial">LCVM Especial</option>
              <option value="LCM">LCM</option>
              <option value="LCM Especial">LCM Especial</option>
              <option value="Dispensa">Dispensa</option>
              <option value="Extensão">Extensão</option>
            </select>

            {/* Filter by Procedência */}
            <select
              value={procedenciaFiltro}
              onChange={(e) => setProcedenciaFiltro(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-400 cursor-pointer shadow-2xs"
            >
              <option value="todos">Toda Procedência</option>
              <option value="Nacional">Nacional</option>
              <option value="Importado">Importado</option>
            </select>

            {/* Filter by Quantidade (Requisito: filtro de quantidade ao lado da pesquisa) */}
            <select
              value={quantidadeFiltro}
              onChange={(e) => setQuantidadeFiltro(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-400 cursor-pointer shadow-2xs"
            >
              <option value="todos">Toda Quantidade</option>
              {uniqueQuantidades.map((qtd) => (
                <option key={qtd} value={qtd}>
                  Qtd: {qtd}
                </option>
              ))}
            </select>

            {/* Sort by */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            >
              <option value="recentes">Mais recentes</option>
              <option value="validade">Validade (Revalidação)</option>
              <option value="solicitacao">Nº Solicitação</option>
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(tipoFiltro || procedenciaFiltro !== 'todos' || quantidadeFiltro !== 'todos' || cnpjFiltro || searchTerm) && (
          <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 flex-wrap">
            <span className="font-medium">Filtros:</span>
            {tipoFiltro && (
              <span className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-700 dark:text-neutral-300 font-medium text-[11px]">
                Tipo: {tipoFiltro}
                <button onClick={() => onTipoFiltroChange && onTipoFiltroChange(null)} className="hover:text-red-600">×</button>
              </span>
            )}
            {procedenciaFiltro !== 'todos' && (
              <span className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-700 dark:text-neutral-300 font-medium text-[11px]">
                {procedenciaFiltro}
                <button onClick={() => setProcedenciaFiltro('todos')} className="hover:text-red-600">×</button>
              </span>
            )}
            {quantidadeFiltro !== 'todos' && (
              <span className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-700 dark:text-neutral-300 font-medium text-[11px]">
                Qtd: {quantidadeFiltro}
                <button onClick={() => setQuantidadeFiltro('todos')} className="hover:text-red-600">×</button>
              </span>
            )}
            {cnpjFiltro && (
              <span className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-700 dark:text-neutral-300 font-medium text-[11px]">
                <Building2 className="w-3 h-3 text-[#E30613]" />
                CNPJ: {cnpjFiltro}
                <button onClick={() => setCnpjFiltro(null)} className="hover:text-red-600">×</button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-700 dark:text-neutral-300 font-medium text-[11px]">
                Busca: "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="hover:text-red-600">×</button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setProcedenciaFiltro('todos');
                setQuantidadeFiltro('todos');
                setCnpjFiltro(null);
                if (onTipoFiltroChange) onTipoFiltroChange(null);
              }}
              className="text-[#E30613] hover:underline font-medium text-[11px] ml-auto"
            >
              Limpar todos
            </button>
          </div>
        )}
      </div>

      {/* Vertical List of Process Cards */}
      <div className="space-y-3.5">
        {sortedProcessos.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-10 text-center shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Nenhum processo encontrado nesta visualização
            </h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Tente redefinir os filtros ou clique abaixo para cadastrar um novo processo no Infoserv.
            </p>
            <div className="pt-2">
              <button
                onClick={onNavigateToCadastro}
                className="px-3.5 py-1.5 bg-[#E30613] hover:bg-[#c70510] text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Processo</span>
              </button>
            </div>
          </div>
        ) : (
          sortedProcessos.map((processo) => {
            const diasRestantes = calcularDiasRestantes(processo.dataValidade);
            const isEmitido = processo.situacao === 'Licença/Certidão emitida' || !!processo.numeroLicenca;
            const showDiasRestantes = isEmitido && !!processo.dataValidade && diasRestantes !== null;
            const isRevalidacaoAlerta = showDiasRestantes && diasRestantes <= 61;

            const calculoEnvioEmissao = calcularDiasSolicitacaoAteEmissao(
              processo.dataEnvio,
              processo.dataEmissao
            );

            const isProcessoExtensao = Boolean(processo.isExtensao || processo.tipo === 'Extensão');
            const extensoesDesteProcesso = processos.filter(
              (p) =>
                p.id !== processo.id &&
                Boolean(p.isExtensao || p.tipo === 'Extensão') &&
                (p.processoOriginalId === processo.id ||
                  (p.mmvOriginal && (p.mmvOriginal === processo.mmv || p.mmvOriginal === processo.numeroSolicitacao)))
            );

            return (
              <div
                key={processo.id}
                className={`rounded-xl shadow-xs transition-colors overflow-hidden border-2 ${
                  isProcessoExtensao
                    ? 'bg-emerald-50/20 dark:bg-emerald-950/25 border-emerald-500/80 dark:border-emerald-500/60 ring-1 ring-emerald-400/20'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200/90 dark:border-neutral-800'
                }`}
              >
                {/* Header row of the card */}
                <div
                  className={`p-3.5 sm:p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    isProcessoExtensao
                      ? 'bg-emerald-100/60 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800'
                      : 'bg-neutral-50/50 dark:bg-neutral-800/30 border-neutral-100 dark:border-neutral-800'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Solicitation number */}
                    <span className="font-mono text-sm font-bold text-neutral-900 dark:text-white">
                      {processo.numeroSolicitacao}
                    </span>
                    <span className="text-neutral-300 dark:text-neutral-700">·</span>
                    {/* Process Type */}
                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                      {processo.tipo}
                    </span>
                    {/* Badge de Extensão se for processo de extensão */}
                    {isProcessoExtensao && (
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 inline-flex items-center gap-1 shadow-2xs">
                        <GitBranch className="w-3 h-3 text-emerald-600 dark:text-emerald-300" />
                        <span>Extensão</span>
                      </span>
                    )}
                    {/* Órgão Certificador: IMT ou CETESB */}
                    {processo.orgaoCertificador && (
                      <span className="text-xs font-bold font-mono tracking-tight text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/90 dark:border-neutral-700 px-2 py-0.5 rounded shadow-2xs">
                        {processo.orgaoCertificador}
                      </span>
                    )}
                    {/* Provenance */}
                    <span className="text-xs font-medium text-neutral-500 bg-neutral-100/70 dark:bg-neutral-800/70 px-2 py-0.5 rounded">
                      {processo.procedencia}
                    </span>
                    {/* CNPJ Badge */}
                    {processo.cnpj && (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200/80 dark:border-neutral-700">
                        <Building2 className="w-3 h-3 text-[#E30613]" />
                        <span>CNPJ: {processo.cnpj}</span>
                      </span>
                    )}
                    {/* Vehicle Type */}
                    <span className="text-xs text-neutral-500 font-normal">
                      {processo.tipoVeiculo}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5 ${getSituacaoStyle(
                        processo.situacao
                      )}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                      {processo.situacao}
                    </span>
                  </div>
                </div>

                {/* Body: Process Fields */}
                <div className="p-4 sm:p-5 space-y-3.5">
                  {/* Banner de Extensão se for processo de extensão */}
                  {isProcessoExtensao && (
                    <div className="p-3 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-lg text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div>
                          <span className="font-bold">Extensão originada do processo matriz:</span>{' '}
                          <strong className="font-mono text-emerald-950 dark:text-emerald-100 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded border border-emerald-300/60 dark:border-emerald-700/60">
                            {processo.mmvOriginal || 'Processo Matriz'}
                          </strong>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-200/70 dark:bg-emerald-800/80 text-emerald-900 dark:text-emerald-100 font-bold self-start sm:self-auto">
                        Extensão Ativa
                      </span>
                    </div>
                  )}

                  {/* Banner de extensões filhas se o processo original gerou extensões */}
                  {extensoesDesteProcesso.length > 0 && (
                    <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700/80 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-200">
                          <GitBranch className="w-4 h-4 text-emerald-600" />
                          <span>Este processo possui {extensoesDesteProcesso.length} extensão(ões) gerada(s) a partir dele</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleExpandedExtensoes(processo.id)}
                          className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:hover:bg-emerald-800 transition-colors cursor-pointer"
                        >
                          <span>{expandedExtensoes[processo.id] ? 'Ocultar' : 'Ver quais são'}</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedExtensoes[processo.id] ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      {expandedExtensoes[processo.id] && (
                        <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 space-y-2 animate-in fade-in-0 duration-150">
                          {extensoesDesteProcesso.map((ext) => (
                            <div
                              key={ext.id}
                              className="p-2.5 rounded-lg bg-white dark:bg-neutral-800 border border-emerald-200 dark:border-emerald-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-2xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                                  {ext.numeroSolicitacao}
                                </span>
                                <span className="text-neutral-400">·</span>
                                <span className="font-semibold text-neutral-900 dark:text-white truncate">
                                  {ext.mmv}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 shrink-0">
                                  {ext.situacao}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                <button
                                  type="button"
                                  onClick={() => onOpenObservations(ext)}
                                  className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                                  title="Observações da extensão"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onEditProcesso(ext)}
                                  className="px-2 py-1 rounded text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors inline-flex items-center gap-1 shadow-2xs"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Ver / Editar Extensão</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Primary MMV & License block */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                        MMV (Marca / Modelo / Versão)
                      </div>
                      <div className="text-base font-bold text-neutral-900 dark:text-white tracking-tight mt-0.5">
                        {processo.mmv}
                      </div>

                      {processo.mmvOriginal && !isProcessoExtensao && (
                        <div className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded px-2 py-0.5 mt-1 inline-block">
                          <span className="font-semibold">Base:</span> {processo.mmvOriginal}
                        </div>
                      )}

                      {processo.cnpj && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1.5">
                          <span className="font-medium text-neutral-400">CNPJ:</span>
                          <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">{processo.cnpj}</span>
                          <span className="text-[10px] text-neutral-400 font-mono">({formatarCNPJ(processo.cnpj)})</span>
                        </div>
                      )}

                      {processo.orgaoCertificador && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1.5">
                          <span className="font-medium text-neutral-400">Órgão Técnico:</span>
                          <span className="font-bold font-mono text-neutral-800 dark:text-neutral-200">{processo.orgaoCertificador}</span>
                          <span className="text-[11px] text-neutral-400">({processo.orgaoCertificador === 'IMT' ? 'Instituto Mauá' : 'CETESB'})</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                        Número da Licença Infoserv
                      </div>
                      <div className="text-sm font-mono font-medium text-neutral-900 dark:text-white mt-0.5">
                        {processo.numeroLicenca ? (
                          <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/80 dark:border-emerald-800 inline-block font-semibold">
                            {processo.numeroLicenca}
                          </span>
                        ) : (
                          <span className="text-neutral-400 italic font-sans font-normal text-xs">
                            Ainda não emitida pelo IBAMA
                          </span>
                        )}
                      </div>
                      {processo.quantidade && (
                        <div className="text-xs text-neutral-500 mt-1">
                          <span className="font-medium text-neutral-400">Quantidade:</span>{' '}
                          {processo.quantidade}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dates Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2.5 border-y border-neutral-100 dark:border-neutral-800 text-xs">
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase font-medium">
                        Data de Início
                      </span>
                      <span className="font-mono text-neutral-700 dark:text-neutral-300">
                        {formatarDataBR(processo.dataInicio)}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase font-medium">
                        Data do Envio
                      </span>
                      <span className="font-mono text-neutral-700 dark:text-neutral-300">
                        {formatarDataBR(processo.dataEnvio)}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase font-medium">
                        Data de Emissão
                      </span>
                      <span className="font-mono text-neutral-700 dark:text-neutral-300">
                        {formatarDataBR(processo.dataEmissao)}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase font-medium">
                        Validade da Licença
                      </span>
                      <span className="font-mono text-neutral-700 dark:text-neutral-300">
                        {formatarDataBR(processo.dataValidade)}
                      </span>
                    </div>
                  </div>

                  {/* Calculated Fields Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-50/70 dark:bg-neutral-800/40 rounded-lg p-3 border border-neutral-200/70 dark:border-neutral-700/60">
                    {/* Calculated 1: Dias restantes */}
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 shrink-0 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">
                          Dias Restantes de Validade
                        </div>
                        {showDiasRestantes ? (
                          <div className="text-xs font-medium text-neutral-800 dark:text-neutral-200 mt-0.5">
                            {diasRestantes <= 0 ? (
                              <span className="font-bold text-rose-700 dark:text-rose-400">
                                Licença Vencida ({Math.abs(diasRestantes)} dias atrás)
                              </span>
                            ) : (
                              <span>
                                <strong className={`font-mono text-sm ${isRevalidacaoAlerta ? 'text-amber-800 dark:text-amber-300 font-bold' : ''}`}>
                                  {diasRestantes}
                                </strong>{' '}
                                dias até expirar
                                {isRevalidacaoAlerta && (
                                  <span className="ml-1 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                                    (Revalidação necessária)
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-neutral-400 italic mt-0.5">
                            Calculado após emissão da licença
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Calculated 2: Dias da solicitação até a emissão */}
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 shrink-0 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">
                          Prazo da Solicitação até Emissão
                        </div>
                        {calculoEnvioEmissao ? (
                          <div className="text-xs text-neutral-800 dark:text-neutral-200 mt-0.5">
                            <strong className="font-mono text-sm">{calculoEnvioEmissao.dias}</strong>{' '}
                            dias {calculoEnvioEmissao.emitido ? 'corridos até a emissão oficial' : 'em análise desde o envio'}
                          </div>
                        ) : (
                          <div className="text-xs text-neutral-400 italic mt-0.5">
                            Aguardando data de envio ao IBAMA
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Observations bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <button
                      onClick={() => onOpenObservations(processo)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
                      <span>
                        Observações ({processo.observacoes?.length || 0})
                      </span>
                    </button>

                    <div className="flex items-center gap-2">
                      {/* Botão Criar extensão */}
                      <button
                        type="button"
                        onClick={() => onCreateExtensao ? onCreateExtensao(processo) : undefined}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        title={`Gerar uma extensão a partir de ${processo.mmv}`}
                      >
                        <GitBranch className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Criar extensão</span>
                      </button>

                      <button
                        onClick={() => onEditProcesso(processo)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-colors inline-flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#E30613]" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Deseja realmente remover o processo ${processo.numeroSolicitacao} (${processo.mmv})?`
                            )
                          ) {
                            onDeleteProcesso(processo.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Remover processo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  )}
</div>
  );
};
