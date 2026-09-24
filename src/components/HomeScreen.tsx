import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Processo, ProcessoTipo, ProcessosSubTab } from '../types/process';
import {
  calcularDiasRestantes,
  estaParaRevalidar,
  formatarDataBR,
} from '../utils/processCalculations';
import {
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  FileText,
  ShieldCheck,
  Calendar,
  Sparkles,
  ExternalLink,
  Edit3,
  Play,
  Pause,
} from 'lucide-react';
import { ClassificationTypesBar } from './ClassificationTypesBar';
import { RevalidationAlertBanner } from './RevalidationAlertBanner';

interface HomeScreenProps {
  processos: Processo[];
  onNavigateToProcessos: (subTab?: ProcessosSubTab, tipo?: ProcessoTipo) => void;
  onNavigateToCadastro: () => void;
  onSelectProcesso: (processo: Processo) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  processos,
  onNavigateToProcessos,
  onNavigateToCadastro,
  onSelectProcesso,
}) => {
  const totalProcessos = processos.length;

  // Em andamento: licenses not yet issued
  const emAndamentoProcessos = useMemo(
    () => processos.filter((p) => p.situacao !== 'Licença/Certidão emitida' && !p.numeroLicenca),
    [processos]
  );

  // Licenças Emitidas: issued
  const emitidasProcessos = useMemo(
    () => processos.filter((p) => p.situacao === 'Licença/Certidão emitida' || !!p.numeroLicenca),
    [processos]
  );

  // Para revalidação: validity expires within 61 days
  const revalidacaoProcessos = useMemo(
    () => processos.filter((p) => estaParaRevalidar(p.dataValidade, p.situacao)),
    [processos]
  );

  // Status Cards (4 cards)
  const topCards = useMemo(
    () => [
      {
        id: 'todos',
        titulo: 'Todos os processos',
        subtitulo: 'Totalidade de cadastros no Infoserv',
        count: totalProcessos,
        icon: Layers,
        tag: 'Geral',
        subTab: 'todos' as ProcessosSubTab,
        description: 'Visão integral de todas as homologações registradas no sistema',
        items: processos,
      },
      {
        id: 'andamento',
        titulo: 'Em andamento',
        subtitulo: 'Licenças ainda não emitidas pelo órgão',
        count: emAndamentoProcessos.length,
        icon: Clock,
        tag: 'Em trâmite',
        subTab: 'em_tramitacao' as ProcessosSubTab,
        description: 'Processos em edição técnica, análise ATC, IBAMA ou aguardando pagamento',
        items: emAndamentoProcessos,
      },
      {
        id: 'emitidas',
        titulo: 'Licenças Emitidas',
        subtitulo: 'Processos concluídos com certidão oficial',
        count: emitidasProcessos.length,
        icon: CheckCircle2,
        tag: 'Concluídas',
        subTab: 'licencas_emitidas' as ProcessosSubTab,
        description: 'Processos homologados com licença emitida e número oficial ativo',
        items: emitidasProcessos,
      },
      {
        id: 'revalidacao',
        titulo: 'Para revalidação',
        subtitulo: 'Validade a expirar nos próximos 61 dias',
        count: revalidacaoProcessos.length,
        icon: AlertTriangle,
        tag: 'Atenção (≤ 61 dias)',
        subTab: 'para_revalidacao' as ProcessosSubTab,
        description: 'Renovações necessárias de licença junto ao IBAMA',
        items: revalidacaoProcessos,
      },
    ],
    [totalProcessos, emAndamentoProcessos, emitidasProcessos, revalidacaoProcessos, processos]
  );

  // Carousel state
  const [topIndex, setTopIndex] = useState(0);
  const [isTopManualPaused, setIsTopManualPaused] = useState(false);
  const [isTopHovered, setIsTopHovered] = useState(false);
  const [topCycleProgress, setTopCycleProgress] = useState(0);

  const activeCard = topCards[topIndex] || topCards[0];
  const activeProcesses = activeCard.items;

  // Search input state on home
  const [quickSearch, setQuickSearch] = useState('');

  // Status Carousel auto-rotation: 3 seconds
  useEffect(() => {
    if (isTopManualPaused || isTopHovered) {
      return;
    }

    setTopCycleProgress(0);
    const startTime = Date.now();
    const duration = 3000;

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setTopCycleProgress(pct);
    }, 40);

    const stepInterval = setInterval(() => {
      setTopIndex((prev) => (prev + 1) % topCards.length);
      setTopCycleProgress(0);
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [isTopManualPaused, isTopHovered, topIndex, topCards.length]);

  const handlePrevTop = () => {
    setTopIndex((prev) => (prev - 1 + topCards.length) % topCards.length);
    setTopCycleProgress(0);
  };

  const handleNextTop = () => {
    setTopIndex((prev) => (prev + 1) % topCards.length);
    setTopCycleProgress(0);
  };

  const handleCardClick = (idx: number) => {
    setTopIndex(idx);
    setTopCycleProgress(0);
  };

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
      case 'Em edição':
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  // Quick filtered processes for search
  const filteredQuickList = quickSearch.trim()
    ? processos.filter(
        (p) =>
          p.numeroSolicitacao.toLowerCase().includes(quickSearch.toLowerCase()) ||
          p.mmv.toLowerCase().includes(quickSearch.toLowerCase()) ||
          (p.numeroLicenca && p.numeroLicenca.toLowerCase().includes(quickSearch.toLowerCase())) ||
          p.tipo.toLowerCase().includes(quickSearch.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Alerta de Licenças para Revalidação */}
      <RevalidationAlertBanner
        processosRevalidar={revalidacaoProcessos}
        onVerProcessosRevalidacao={() => onNavigateToProcessos('para_revalidacao')}
        onSelecionarProcesso={onSelectProcesso}
      />

      {/* Hero Welcome & Quick Search Bar */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-5 sm:p-6 shadow-xs border border-neutral-200/90 dark:border-neutral-800">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#E30613] mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E30613]" />
            <span>Central Shineray de Homologação Veicular</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mb-1.5">
            Gestão Integrada de Processos Infoserv
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed mb-4">
            Acompanhe o ciclo completo de emissão de licenças LCVM, LCM, dispensas e extensões do IBAMA.
            Consulte prazos e histórico de observações de forma clara e ágil.
          </p>

          {/* Quick search input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Buscar por número (SL/SD), MMV (ex: WORKER 125, STORM), licença..."
              className="w-full pl-10 pr-20 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500 transition-colors"
            />
            {quickSearch && (
              <button
                onClick={() => setQuickSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white px-2 py-1"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Quick search instant results drawer */}
          {quickSearch.trim() && (
            <div className="mt-2.5 bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden shadow-lg max-h-60 overflow-y-auto">
              <div className="p-2.5 text-xs font-medium text-neutral-500 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/50">
                <span>Resultados encontrados ({filteredQuickList.length})</span>
                <span className="text-[11px] text-neutral-400">Clique para inspecionar</span>
              </div>
              {filteredQuickList.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-500">
                  Nenhum processo localizado para "{quickSearch}".
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredQuickList.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onSelectProcesso(p)}
                      className="w-full p-2.5 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                          <span className="font-mono text-neutral-700 dark:text-neutral-300">{p.numeroSolicitacao}</span>
                          <span>·</span>
                          <span>{p.mmv}</span>
                        </div>
                        <div className="text-neutral-500 text-[11px] mt-0.5">
                          {p.tipo} · {p.tipoVeiculo} · {p.situacao}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-400 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 1: Top Status Cards with Synchronized Mini List */}
      <div className="space-y-3">
        {/* Header with Title and Carousel Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
              Status
            </h2>
          </div>

          {/* Navigation Controls: Dots, Play/Pause, and Arrows */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Dots with progress bar */}
            <div className="flex items-center gap-1 mr-1">
              {topCards.map((card, idx) => {
                const isCurr = topIndex === idx;
                return (
                  <button
                    key={card.id}
                    onClick={() => {
                      setTopIndex(idx);
                      setTopCycleProgress(0);
                    }}
                    className={`relative h-1.5 rounded-full overflow-hidden transition-all duration-200 ${
                      isCurr
                        ? 'w-6 bg-neutral-300 dark:bg-neutral-700'
                        : 'w-2 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300'
                    }`}
                    aria-label={`Ir para ${card.titulo}`}
                    title={`${card.tag}: ${card.titulo} (${card.count})`}
                  >
                    {isCurr && !isTopManualPaused && !isTopHovered && (
                      <div
                        className="absolute inset-y-0 left-0 bg-[#E30613] transition-all duration-75"
                        style={{ width: `${topCycleProgress}%` }}
                      />
                    )}
                    {isCurr && (isTopManualPaused || isTopHovered) && (
                      <div className="absolute inset-0 bg-[#E30613]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Play/Pause Button */}
            <button
              onClick={() => setIsTopManualPaused((prev) => !prev)}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 shadow-2xs transition-colors"
              title={isTopManualPaused ? 'Retomar rotação automática' : 'Pausar rotação automática'}
              aria-label={isTopManualPaused ? 'Play' : 'Pause'}
            >
              {isTopManualPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>

            {/* Prev / Next buttons */}
            <button
              onClick={handlePrevTop}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 shadow-2xs transition-colors"
              title="Cartão anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextTop}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 shadow-2xs transition-colors"
              title="Próximo cartão"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div
          onMouseEnter={() => setIsTopHovered(true)}
          onMouseLeave={() => setIsTopHovered(false)}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 relative"
        >
          {topCards.map((card, idx) => {
            const IconComp = card.icon;
            const isActive = topIndex === idx;

            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(idx)}
                onMouseEnter={() => {
                  setTopIndex(idx);
                  setTopCycleProgress(0);
                }}
                className={`cursor-pointer rounded-xl bg-white dark:bg-neutral-900 p-4 sm:p-4.5 transition-all duration-150 border text-left relative flex flex-col justify-between select-none ${
                  isActive
                    ? 'border-neutral-300 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/60 shadow-xs'
                    : 'border-neutral-200/90 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                {/* Active indicator top line */}
                {isActive && (
                  <div className="absolute top-0 right-0 left-0 h-0.5 bg-[#E30613] rounded-t-xl" />
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                      {card.tag}
                    </span>
                    <IconComp className="w-4 h-4 text-neutral-400" />
                  </div>

                  <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                    {card.titulo}
                  </h3>
                  <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white mb-1.5">
                    {card.count}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                    {card.subtitulo}
                  </p>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToProcessos(card.subTab);
                    }}
                    className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-[#E30613] transition-colors"
                  >
                    <span>{isActive ? 'Exibindo na lista abaixo' : 'Ver processos'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#E30613]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* MINI LISTA ABAIXO DOS 4 CARTÕES DE STATUS */}
        <div
          onMouseEnter={() => setIsTopHovered(true)}
          onMouseLeave={() => setIsTopHovered(false)}
          className="rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs overflow-hidden transition-colors mt-2"
        >
          {/* Header da Mini Lista */}
          <div className="px-4 py-3 bg-neutral-50/70 dark:bg-neutral-800/50 border-b border-neutral-200/80 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white">
                    Processos · <span className="text-[#E30613] font-bold">{activeCard.titulo}</span>
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    ({activeProcesses.length}{' '}
                    {activeProcesses.length === 1 ? 'processo' : 'processos'})
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {activeCard.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateToProcessos(activeCard.subTab)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-950 inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Abrir tela de processos com este filtro aplicado"
              >
                <span>Ver todos na aba Processos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onNavigateToCadastro}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 inline-flex items-center gap-1 transition-colors"
                title="Cadastrar novo processo"
              >
                <Plus className="w-3 h-3 text-[#E30613]" />
                <span>Novo</span>
              </button>
            </div>
          </div>

          {/* Conteúdo da Mini Lista: Linhas compactas */}
          {activeProcesses.length === 0 ? (
            <div className="py-8 px-4 text-center">
              <FileText className="w-7 h-7 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
              <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Nenhum processo localizado para "{activeCard.titulo}".
              </p>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                Passe o mouse por outros cartões acima para visualizar os processos de cada status.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80 overflow-x-auto">
              {/* Desktop Table View */}
              <table className="w-full text-left border-collapse text-xs hidden md:table">
                <thead>
                  <tr className="bg-neutral-50/40 dark:bg-neutral-800/20 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-semibold">Solicitação</th>
                    <th className="py-2.5 px-4 font-semibold">MMV / Modelo</th>
                    <th className="py-2.5 px-4 font-semibold">Tipo</th>
                    <th className="py-2.5 px-4 font-semibold">Veículo</th>
                    <th className="py-2.5 px-4 font-semibold">Procedência</th>
                    <th className="py-2.5 px-4 font-semibold">Licença Infoserv</th>
                    <th className="py-2.5 px-4 font-semibold">Situação</th>
                    <th className="py-2.5 px-4 font-semibold">Validade</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                  {activeProcesses.map((proc) => {
                    const diasRestantes = calcularDiasRestantes(proc.dataValidade);
                    const isReval = estaParaRevalidar(proc.dataValidade, proc.situacao);

                    return (
                      <tr
                        key={proc.id}
                        onClick={() => onSelectProcesso(proc)}
                        className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 cursor-pointer transition-colors group"
                      >
                        {/* Solicitacao */}
                        <td className="py-3 px-4 font-mono font-semibold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                          {proc.numeroSolicitacao}
                        </td>

                        {/* MMV */}
                        <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-white group-hover:text-[#E30613] transition-colors">
                          {proc.mmv}
                        </td>

                        {/* Tipo Homologacao */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                            {proc.tipo}
                          </span>
                        </td>

                        {/* Tipo Veiculo */}
                        <td className="py-3 px-4 text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
                          {proc.tipoVeiculo}
                        </td>

                        {/* Procedência */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                              proc.procedencia === 'Nacional'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'
                            }`}
                          >
                            {proc.procedencia}
                          </span>
                        </td>

                        {/* Licença */}
                        <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap">
                          {proc.numeroLicenca ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                              {proc.numeroLicenca}
                            </span>
                          ) : (
                            <span className="text-neutral-400 italic">Em emissão</span>
                          )}
                        </td>

                        {/* Situação */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5 ${getSituacaoStyle(
                              proc.situacao
                            )}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" />
                            <span className="truncate max-w-[140px]">{proc.situacao}</span>
                          </span>
                        </td>

                        {/* Validade */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {proc.dataValidade ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-medium ${
                                  isReval
                                    ? 'text-amber-800 dark:text-amber-300 font-semibold'
                                    : 'text-neutral-700 dark:text-neutral-300'
                                }`}
                              >
                                {formatarDataBR(proc.dataValidade)}
                              </span>
                              {diasRestantes !== null && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                    isReval
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                                      : 'text-neutral-400'
                                  }`}
                                >
                                  ({diasRestantes}d)
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-neutral-400 italic">-</span>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div
                            className="inline-flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => onSelectProcesso(proc)}
                              className="px-2.5 py-1 rounded-md text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 inline-flex items-center gap-1 transition-colors"
                            >
                              <Edit3 className="w-3 h-3 text-[#E30613]" />
                              <span>Ver</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mobile Stacked View */}
              <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-800/80">
                {activeProcesses.map((proc) => {
                  const diasRestantes = calcularDiasRestantes(proc.dataValidade);
                  const isReval = estaParaRevalidar(proc.dataValidade, proc.situacao);

                  return (
                    <div
                      key={proc.id}
                      onClick={() => onSelectProcesso(proc)}
                      className="p-3.5 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50 cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                          {proc.numeroSolicitacao}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getSituacaoStyle(
                            proc.situacao
                          )}`}
                        >
                          {proc.situacao}
                        </span>
                      </div>

                      <div className="font-semibold text-xs text-neutral-900 dark:text-white">
                        {proc.mmv}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                        <span>{proc.tipo} · {proc.tipoVeiculo}</span>
                        <span>{proc.procedencia}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-neutral-100 dark:border-neutral-800">
                        <span className="font-mono text-[10px] text-neutral-600 dark:text-neutral-300">
                          {proc.numeroLicenca || 'Sem licença'}
                        </span>
                        {proc.dataValidade && (
                          <span className={`text-[10px] font-medium ${isReval ? 'text-amber-700 dark:text-amber-400' : ''}`}>
                            Validade: {formatarDataBR(proc.dataValidade)} {diasRestantes !== null ? `(${diasRestantes}d)` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Carousel de Classificação por Tipo de Homologação */}
      <div className="pt-2">
        <ClassificationTypesBar
          processos={processos}
          onSelectTipo={(tipo) => {
            onNavigateToProcessos(undefined, tipo || undefined);
          }}
          onEditProcesso={(proc) => onSelectProcesso(proc)}
          onNavigateToCadastro={onNavigateToCadastro}
        />
      </div>

      {/* QUICK ACTIONS & RECENT PROCESSES PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Quick Launch Cards */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white tracking-tight">
              Ações Rápidas
            </h3>

            <div className="space-y-2">
              <button
                onClick={onNavigateToCadastro}
                className="w-full p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 rounded-md">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                      Cadastrar Novo Processo
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Regras SL/SD, MMV e enquadramento
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
              </button>

              <button
                onClick={() => onNavigateToProcessos('para_revalidacao')}
                className="w-full p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-md">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                      Licenças para Revalidação
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {revalidacaoProcessos.length} pendência(s) de renovação
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
              </button>

              <button
                onClick={() => onNavigateToProcessos('licencas_emitidas')}
                className="w-full p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-md">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                      Licenças Emitidas
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {emitidasProcessos.length} homologações com número ativo
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Recent Processes Mini Feed */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Últimos Processos Atualizados</span>
              </h3>
              <button
                onClick={() => onNavigateToProcessos('todos')}
                className="text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>Ver todos os {totalProcessos}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              {processos.slice(0, 4).map((proc) => {
                const diasRestantes = calcularDiasRestantes(proc.dataValidade);
                const isReval = estaParaRevalidar(proc.dataValidade, proc.situacao);

                return (
                  <div
                    key={proc.id}
                    onClick={() => onSelectProcesso(proc)}
                    className="py-3 flex items-center justify-between hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 rounded-lg px-2 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                          {proc.numeroSolicitacao}
                        </span>
                        <span className="text-neutral-300 dark:text-neutral-700">·</span>
                        <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                          {proc.mmv}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                        <span>{proc.tipo}</span>
                        <span>·</span>
                        <span>{proc.tipoVeiculo}</span>
                        <span>·</span>
                        <span className="truncate">{proc.procedencia}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getSituacaoStyle(
                            proc.situacao
                          )}`}
                        >
                          {proc.situacao}
                        </span>
                        {proc.dataValidade && (
                          <div className={`text-[10px] font-medium mt-1 ${isReval ? 'text-amber-700 dark:text-amber-400' : 'text-neutral-400'}`}>
                            Validade: {formatarDataBR(proc.dataValidade)}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
