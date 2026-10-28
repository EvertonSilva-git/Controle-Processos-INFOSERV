import React, { useState, useMemo } from 'react';
import { Processo, ProcessoTipo, ProcessosSubTab, CnpjOption, formatarCNPJ } from '../types/process';
import {
  calcularDiasRestantes,
  calcularDiasSolicitacaoAteEmissao,
  estaParaRevalidar,
  obterDataVencimentoEfetiva,
  formatarDataBR,
} from '../utils/processCalculations';
import { RevalidationAlertBanner } from './RevalidationAlertBanner';
import { ClassificationTypesBar } from './ClassificationTypesBar';
import { CnpjFilterCards } from './CnpjFilterCards';
import { LeadTimeComparisonScreen } from './LeadTimeComparisonScreen';
import { DeleteProcessModal } from './DeleteProcessModal';
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
  Eye,
  ArrowRight,
  RefreshCw,
  Cloud,
  Database,
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
  onOpenMigration?: () => void;
  onOpenExcelOnline?: () => void;
  onOpenSupabaseModal?: () => void;
  currentUser?: string | null;
  isVisitante?: boolean;
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
  onOpenMigration,
  onOpenExcelOnline,
  onOpenSupabaseModal,
  currentUser,
  isVisitante = false,
}) => {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
  const setSearchTerm = onSearchTermChange || setInternalSearchTerm;
  const [procedenciaFiltro, setProcedenciaFiltro] = useState<string>('todos');
  const [quantidadeFiltro, setQuantidadeFiltro] = useState<string>('todos');
  const [cnpjFiltro, setCnpjFiltro] = useState<string | null>(() => {
    try {
      return localStorage.getItem('shineray_cnpj_filtro') || null;
    } catch {
      return null;
    }
  });
  const [sortBy, setSortBy] = useState<'recentes' | 'validade' | 'solicitacao'>('recentes');
  const [expandedExtensoes, setExpandedExtensoes] = useState<Record<string, boolean>>({});
  const [highlightedCardId, setHighlightedCardId] = useState<string | null>(null);
  const [processoParaExcluir, setProcessoParaExcluir] = useState<Processo | null>(null);

  const toggleExpandedExtensoes = (id: string) => {
    setExpandedExtensoes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleJumpToExtensao = (extensaoId: string) => {
    const target = processos.find((p) => p.id === extensaoId);
    if (!target) return;

    // Se houver busca restringindo o target, limpa a busca
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matches =
        target.numeroSolicitacao.toLowerCase().includes(q) ||
        target.mmv.toLowerCase().includes(q) ||
        (target.numeroLicenca && target.numeroLicenca.toLowerCase().includes(q));
      if (!matches && onSearchTermChange) {
        onSearchTermChange('');
      }
    }

    // Se filtro de tipo excluir o target
    if (tipoFiltro && tipoFiltro !== target.tipo && !target.isExtensao) {
      if (onTipoFiltroChange) {
        onTipoFiltroChange(null);
      }
    }

    // Se filtro de CNPJ for diferente do processo alvo
    if (cnpjFiltro && target.cnpj && target.cnpj !== cnpjFiltro) {
      setCnpjFiltro(null);
    }

    // Muda para aba 'todos' para assegurar que o cartão está visível
    if (currentSubTab !== 'todos') {
      onSubTabChange('todos');
    }

    // Destaca visualmente o cartão
    setHighlightedCardId(extensaoId);

    // Rola a tela até o cartão com suavidade
    setTimeout(() => {
      const el = document.getElementById(`processo-card-${extensaoId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);

    // Remove o destaque após 3,5 segundos
    setTimeout(() => {
      setHighlightedCardId((prev) => (prev === extensaoId ? null : prev));
    }, 3500);
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
    try {
      if (novoCnpj) {
        localStorage.setItem('shineray_cnpj_filtro', novoCnpj);
      } else {
        localStorage.removeItem('shineray_cnpj_filtro');
      }
    } catch {
      // ignore
    }
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

  // Informações do CNPJ ativo selecionado (para banner e cartões de situação)
  const activeCnpjInfo = useMemo(() => {
    if (!cnpjFiltro) return null;
    const clean = cnpjFiltro.replace(/\D/g, '');
    const found = cnpjs?.find((c) => c.raw === clean);
    return {
      raw: clean,
      formatted: found?.formatted || formatarCNPJ(clean),
      count: processosDoCnpj.length,
    };
  }, [cnpjFiltro, cnpjs, processosDoCnpj]);

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

  // Counts for tabs - vinculados dinamicamente ao CNPJ selecionado (processosDoCnpj)
  const countEmEdicao = useMemo(
    () => processosDoCnpj.filter((p) => p.situacao === 'Em edição').length,
    [processosDoCnpj]
  );

  const countParaCorrecao = useMemo(
    () => processosDoCnpj.filter((p) => p.situacao === 'Para correção').length,
    [processosDoCnpj]
  );

  const countEmTramitacao = useMemo(
    () =>
      processosDoCnpj.filter(
        (p) =>
          p.situacao === 'Encaminhada para o ibama' ||
          p.situacao === 'Em análise pelo Analista do ATC' ||
          p.situacao === 'A pagar'
      ).length,
    [processosDoCnpj]
  );

  const countLicencasEmitidas = useMemo(
    () =>
      processosDoCnpj.filter(
        (p) => p.situacao === 'Licença/Certidão emitida' || !!p.numeroLicenca
      ).length,
    [processosDoCnpj]
  );

  const countParaRevalidacao = useMemo(
    () => processosDoCnpj.filter((p) => estaParaRevalidar(p.dataValidade, p.situacao, p.novaDataVencimento)).length,
    [processosDoCnpj]
  );

  const countComPrazos = useMemo(
    () =>
      processosDoCnpj.filter((p) => {
        const calc = calcularDiasSolicitacaoAteEmissao(p.dataEnvio, p.dataEmissao);
        return !!calc?.emitido;
      }).length,
    [processosDoCnpj]
  );

  const processosParaRevalidar = useMemo(() => {
    return processosDoCnpj.filter((p) => estaParaRevalidar(p.dataValidade, p.situacao, p.novaDataVencimento));
  }, [processosDoCnpj]);

  // Filter processes according to subTab - utiliza processosDoCnpj para que a situação filtre dentro do CNPJ
  const subTabFiltered = useMemo(() => {
    switch (currentSubTab) {
      case 'em_edicao':
        return processosDoCnpj.filter((p) => p.situacao === 'Em edição');
      case 'para_correcao':
        return processosDoCnpj.filter((p) => p.situacao === 'Para correção');
      case 'em_tramitacao':
        return processosDoCnpj.filter(
          (p) =>
            p.situacao === 'Encaminhada para o ibama' ||
            p.situacao === 'Em análise pelo Analista do ATC' ||
            p.situacao === 'A pagar'
        );
      case 'licencas_emitidas':
        return processosDoCnpj.filter(
          (p) => p.situacao === 'Licença/Certidão emitida' || !!p.numeroLicenca
        );
      case 'para_revalidacao':
        return processosDoCnpj.filter((p) =>
          estaParaRevalidar(p.dataValidade, p.situacao, p.novaDataVencimento)
        );
      case 'todos':
      default:
        return processosDoCnpj;
    }
  }, [processosDoCnpj, currentSubTab]);

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
        const diasA = calcularDiasRestantes(obterDataVencimentoEfetiva(a.dataValidade, a.novaDataVencimento)) ?? 9999;
        const diasB = calcularDiasRestantes(obterDataVencimentoEfetiva(b.dataValidade, b.novaDataVencimento)) ?? 9999;
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
      description: cnpjFiltro ? `${processosDoCnpj.length} no CNPJ selecionado` : 'Visão geral consolidada',
      count: processosDoCnpj.length,
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

      {/* Indicador de Filtro Ativo por CNPJ nos Cartões de Situação */}
      {activeCnpjInfo && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 bg-neutral-900 dark:bg-neutral-800 text-white border border-neutral-700/80 rounded-xl shadow-xs animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="flex h-2 w-2 rounded-full bg-[#E30613] animate-pulse" />
            <span className="text-neutral-300 font-medium">Cartões de situação filtrados por:</span>
            <span className="font-bold font-mono text-white bg-white/10 px-2.5 py-0.5 rounded border border-white/10">
              {activeCnpjInfo.formatted}
            </span>
            <span className="text-[11px] bg-[#E30613]/25 text-rose-200 border border-[#E30613]/40 px-2 py-0.5 rounded-full font-semibold">
              {activeCnpjInfo.count} processo{activeCnpjInfo.count === 1 ? '' : 's'}
            </span>
            <span className="text-neutral-400 text-[11px] hidden md:inline">
              · Os cartões de situação acima e abaixo exibem apenas processos desta empresa
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleSelectCnpj(null)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-200 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            title="Remover filtro e visualizar todos os CNPJs"
          >
            <span>Ver Todos os CNPJs</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
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
        <div className="space-y-6">
          <CnpjFilterCards
            processos={processos}
            selectedCnpj={cnpjFiltro}
            onSelectCnpj={handleSelectCnpj}
            cnpjs={cnpjs}
            onAddCnpj={onAddCnpj}
            onDeleteCnpj={onDeleteCnpj}
            isVisitante={isVisitante}
          />
          <LeadTimeComparisonScreen
            processos={processosDoCnpj}
            onEditProcesso={onEditProcesso}
            onOpenObservations={onOpenObservations}
            onExportExcel={onExportExcel}
          />
        </div>
      ) : (
        <>
          {/* Banner de Aviso de Modo Visitante */}
          {isVisitante && (
            <div className="p-3.5 sm:p-4 bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl text-purple-950 dark:text-purple-100 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-purple-200/80 dark:bg-purple-900/80 text-purple-800 dark:text-purple-200 font-bold shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold">Modo Visitante (Apenas Consulta):</span>{' '}
                  <span className="text-purple-800 dark:text-purple-300">
                    Você pode visualizar o catálogo completo, prazos regulatórios e observações. Operações de criação, edição e exclusão estão restritas.
                  </span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-200/70 dark:bg-purple-800/80 text-purple-900 dark:text-purple-100 font-bold shrink-0">
                Somente Leitura
              </span>
            </div>
          )}

          {/* Cartões Filtros do CNPJ (Posicionados acima dos tipos de homologação) */}
          <CnpjFilterCards
            processos={processos}
            selectedCnpj={cnpjFiltro}
            onSelectCnpj={handleSelectCnpj}
            cnpjs={cnpjs}
            onAddCnpj={onAddCnpj}
            onDeleteCnpj={onDeleteCnpj}
            isVisitante={isVisitante}
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

            {/* Migração / Backup entre Nuvens */}
            {onOpenMigration && (
              <button
                type="button"
                onClick={onOpenMigration}
                title="Migração entre nuvens: exporte ou importe todos os processos para outra hospedagem ou servidor"
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-750 focus:outline-none transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
              >
                <Cloud className="w-3.5 h-3.5 text-[#E30613]" />
                <span className="hidden sm:inline">Migração</span>
              </button>
            )}

            {/* Puxador em Tempo Real com Excel Online */}
            {onOpenExcelOnline && (
              <button
                type="button"
                onClick={onOpenExcelOnline}
                title="Integrar e sincronizar com planilha no Excel Online em tempo real na nuvem"
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 focus:outline-none transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Excel Online</span>
              </button>
            )}

            {/* Banco de Dados Supabase / Cloudflare Sync */}
            {onOpenSupabaseModal && (
              <button
                type="button"
                onClick={onOpenSupabaseModal}
                title="Sincronizar processos diretamente com o banco de dados remoto Supabase / Cloudflare"
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 focus:outline-none transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
              >
                <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Supabase</span>
              </button>
            )}
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
            const dataVencimentoEfetiva = obterDataVencimentoEfetiva(processo.dataValidade, processo.novaDataVencimento);
            const diasRestantes = calcularDiasRestantes(dataVencimentoEfetiva);
            const isEmitido = processo.situacao === 'Licença/Certidão emitida' || !!processo.numeroLicenca;
            const showDiasRestantes = isEmitido && !!dataVencimentoEfetiva && diasRestantes !== null;
            const isRevalidacaoAlerta = showDiasRestantes && diasRestantes <= 61;
            const isRevalidado = Boolean(processo.dataRevalidacao || processo.novaDataVencimento);

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
                id={`processo-card-${processo.id}`}
                className={`rounded-xl shadow-xs transition-all duration-300 overflow-hidden border-2 ${
                  highlightedCardId === processo.id
                    ? 'ring-4 ring-emerald-500 ring-offset-2 dark:ring-offset-neutral-900 border-emerald-500 shadow-xl scale-[1.008]'
                    : isProcessoExtensao
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
                    {/* Badge se for um processo revalidado */}
                    {isRevalidado && (
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700 inline-flex items-center gap-1 shadow-2xs">
                        <RefreshCw className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>Revalidado</span>
                      </span>
                    )}
                    {/* Badge se for a extensão selecionada via lista suspensa */}
                    {highlightedCardId === processo.id && (
                      <span className="text-xs font-black text-emerald-900 dark:text-emerald-100 bg-emerald-300 dark:bg-emerald-800/90 px-2 py-0.5 rounded-full border border-emerald-400 animate-pulse inline-flex items-center gap-1 shadow-xs">
                        <GitBranch className="w-3 h-3 text-emerald-700 dark:text-emerald-300" />
                        <span>Extensão Selecionada</span>
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
                    <div className="p-3.5 bg-emerald-50/90 dark:bg-emerald-950/35 border border-emerald-300 dark:border-emerald-700/80 rounded-xl space-y-3 shadow-2xs">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-200">
                          <GitBranch className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Extensões vinculadas ({extensoesDesteProcesso.length})</span>
                        </div>

                        {/* LISTA SUSPENSA DE EXTENSÕES (Requisito: lista suspensa para mostrar as extensões e ir direto para o cartão) */}
                        <div className="flex flex-wrap items-center gap-2">
                          <label htmlFor={`jump-ext-${processo.id}`} className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-200 whitespace-nowrap">
                            Ir para extensão:
                          </label>
                          <select
                            id={`jump-ext-${processo.id}`}
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleJumpToExtensao(e.target.value);
                                e.target.value = '';
                              }
                            }}
                            className="text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-emerald-400 dark:border-emerald-600 bg-white dark:bg-neutral-800 text-emerald-950 dark:text-emerald-100 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer max-w-[280px] sm:max-w-none truncate"
                          >
                            <option value="" disabled>
                              -- Selecionar extensão ({extensoesDesteProcesso.length}) --
                            </option>
                            {extensoesDesteProcesso.map((ext) => (
                              <option key={ext.id} value={ext.id}>
                                {ext.numeroSolicitacao} · {ext.mmv} [{ext.situacao}]
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => toggleExpandedExtensoes(processo.id)}
                            className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-100/80 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:hover:bg-emerald-800 transition-colors cursor-pointer shrink-0"
                            title="Ver detalhes de todas as extensões vinculadas"
                          >
                            <span>{expandedExtensoes[processo.id] ? 'Ocultar' : 'Detalhes'}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedExtensoes[processo.id] ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
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
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 shrink-0">
                                  {ext.situacao}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                <button
                                  type="button"
                                  onClick={() => handleJumpToExtensao(ext.id)}
                                  className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                                  title="Rolar diretamente para o cartão desta extensão"
                                >
                                  <span>Ir para cartão</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onOpenObservations(ext)}
                                  className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                                  title="Observações da extensão"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                                {!isVisitante && (
                                  <button
                                    type="button"
                                    onClick={() => onEditProcesso(ext)}
                                    className="px-2 py-1 rounded text-xs font-semibold bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors inline-flex items-center gap-1"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Editar</span>
                                  </button>
                                )}
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

                      {/* Lista de Versões específicas se houver mais de 1 versão */}
                      {((processo.versoes && processo.versoes.length > 1) || (processo.veiculo && processo.veiculo.includes('/'))) && (
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          <span className="text-[10px] text-neutral-400 font-semibold uppercase">
                            Versões:
                          </span>
                          {(processo.versoes && processo.versoes.length > 0
                            ? processo.versoes
                            : (processo.veiculo?.split('/') || []).map((s) => s.trim()).filter(Boolean)
                          ).map((v, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                            >
                              <span className="text-[9px] text-neutral-400">#{idx + 1}</span>
                              <span>{v}</span>
                            </span>
                          ))}
                        </div>
                      )}

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
                  <div className="py-2.5 border-y border-neutral-100 dark:border-neutral-800 text-xs space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                        <span className={`font-mono ${processo.novaDataVencimento ? 'line-through text-neutral-400 text-[11px]' : 'text-neutral-700 dark:text-neutral-300'}`}>
                          {formatarDataBR(processo.dataValidade)}
                        </span>
                        {processo.novaDataVencimento && (
                          <div className="font-mono text-emerald-700 dark:text-emerald-400 font-bold text-xs" title="Novo vencimento pós-revalidação">
                            {formatarDataBR(processo.novaDataVencimento)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Linha de Revalidação se houver data de revalidação ou nova data de vencimento */}
                    {(processo.dataRevalidacao || processo.novaDataVencimento) && (
                      <div className="pt-2 border-t border-dashed border-amber-200 dark:border-amber-800/60 flex flex-wrap items-center gap-3 bg-amber-50/50 dark:bg-amber-950/20 px-2.5 py-1.5 rounded-lg">
                        <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Revalidação:</span>
                        </div>
                        {processo.dataRevalidacao && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-neutral-500 dark:text-neutral-400">Data Revalidação:</span>
                            <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                              {formatarDataBR(processo.dataRevalidacao)}
                            </span>
                          </div>
                        )}
                        {processo.novaDataVencimento && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-neutral-500 dark:text-neutral-400">Novo Vencimento:</span>
                            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                              {formatarDataBR(processo.novaDataVencimento)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Calculated Fields Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-50/70 dark:bg-neutral-800/40 rounded-lg p-3 border border-neutral-200/70 dark:border-neutral-700/60">
                    {/* Calculated 1: Dias restantes */}
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 shrink-0 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide flex items-center justify-between">
                          <span>Dias Restantes de Validade</span>
                          {processo.novaDataVencimento && (
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              (Novo vencimento)
                            </span>
                          )}
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
                      {/* Botão Criar extensão - APENAS para cartões normais (NÃO para cartões de extensão) e NÃO para visitante */}
                      {!isProcessoExtensao && !isVisitante && (
                        <button
                          type="button"
                          onClick={() => onCreateExtensao ? onCreateExtensao(processo) : undefined}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          title={`Gerar uma extensão a partir de ${processo.mmv}`}
                        >
                          <GitBranch className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Criar extensão</span>
                        </button>
                      )}

                      {/* Botão Editar (ou Visualizar se Visitante) */}
                      <button
                        onClick={() => onEditProcesso(processo)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        title={isVisitante ? 'Visualizar dados completos do processo' : 'Editar dados do processo'}
                      >
                        {isVisitante ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            <span>Visualizar</span>
                          </>
                        ) : (
                          <>
                            <Edit3 className="w-3.5 h-3.5 text-[#E30613]" />
                            <span>Editar</span>
                          </>
                        )}
                      </button>

                        {/* Botão Excluir - Oculto para visitante */}
                        {!isVisitante && (
                          <button
                            type="button"
                            onClick={() => setProcessoParaExcluir(processo)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Remover processo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
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

    {/* Modal de Confirmação de Exclusão de Processo */}
    <DeleteProcessModal
      isOpen={!!processoParaExcluir}
      processo={processoParaExcluir}
      onClose={() => setProcessoParaExcluir(null)}
      onConfirm={() => {
        if (processoParaExcluir) {
          onDeleteProcesso(processoParaExcluir.id);
          setProcessoParaExcluir(null);
        }
      }}
      linkedExtensionsCount={
        processoParaExcluir
          ? processos.filter(
              (p) =>
                p.id !== processoParaExcluir.id &&
                Boolean(p.isExtensao || p.tipo === 'Extensão') &&
                (p.processoOriginalId === processoParaExcluir.id ||
                  (p.mmvOriginal &&
                    (p.mmvOriginal === processoParaExcluir.mmv ||
                      p.mmvOriginal === processoParaExcluir.numeroSolicitacao)))
            ).length
          : 0
      }
    />
  </div>
  );
};
