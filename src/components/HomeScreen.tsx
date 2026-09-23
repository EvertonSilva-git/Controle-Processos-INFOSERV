import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Processo, ProcessoTipo, ProcessosSubTab } from '../types/process';
import {
  calcularDiasRestantes,
  formatarDataBR,
  estaParaRevalidar,
} from '../utils/processCalculations';
import { RevalidationAlertBanner } from './RevalidationAlertBanner';
import { 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Plus, 
  ArrowRight,
  ShieldCheck,
  FileText,
  Car,
  Compass,
  Play,
  Pause,
  Sparkles,
  Edit3,
  MessageSquare,
  Check,
} from 'lucide-react';

interface HomeScreenProps {
  processos: Processo[];
  onNavigateToProcessos: (subTab?: ProcessosSubTab, tipoFiltro?: ProcessoTipo) => void;
  onNavigateToCadastro: () => void;
  onSelectProcesso: (processo: Processo) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  processos,
  onNavigateToProcessos,
  onNavigateToCadastro,
  onSelectProcesso,
}) => {
  // Counts calculation
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

  // Carousel: Status Cards (4 cards) with their related process list
  const topCards = useMemo(
    () => [
      {
        id: 'todos',
        numero: '#1',
        titulo: 'Todos os processos',
        subtitulo: 'Totalidade de cadastros no Infoserv',
        count: totalProcessos,
        icon: Layers,
        accent: 'border-l-4 border-l-neutral-800 dark:border-l-neutral-200 text-neutral-900',
        badgeBg: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200',
        tag: 'Geral',
        subTab: 'todos' as ProcessosSubTab,
        description: 'Visão integral de todas as homologações registradas no sistema',
        items: processos,
      },
      {
        id: 'andamento',
        numero: '#2',
        titulo: 'Em andamento',
        subtitulo: 'Licenças ainda não emitidas pelo órgão',
        count: emAndamentoProcessos.length,
        icon: Clock,
        accent: 'border-l-4 border-l-amber-500 text-amber-900',
        badgeBg: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
        tag: 'Em trâmite',
        subTab: 'em_tramitacao' as ProcessosSubTab,
        description: 'Processos em edição técnica, análise ATC, IBAMA ou aguardando pagamento',
        items: emAndamentoProcessos,
      },
      {
        id: 'emitidas',
        numero: '#3',
        titulo: 'Licenças Emitidas',
        subtitulo: 'Processos concluídos com certidão oficial',
        count: emitidasProcessos.length,
        icon: CheckCircle2,
        accent: 'border-l-4 border-l-emerald-600 text-emerald-950',
        badgeBg: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
        tag: 'Concluídas',
        subTab: 'licencas_emitidas' as ProcessosSubTab,
        description: 'Processos homologados com licença emitida e número oficial ativo',
        items: emitidasProcessos,
      },
      {
        id: 'revalidacao',
        numero: '#4',
        titulo: 'Para revalidação',
        subtitulo: 'Validade a expirar nos próximos 61 dias',
        count: revalidacaoProcessos.length,
        icon: AlertTriangle,
        accent: 'border-l-4 border-l-[#E30613] text-[#B0040E]',
        badgeBg: 'bg-red-50 text-[#E30613] dark:bg-red-950/40 dark:text-red-300',
        tag: 'Urgente (≤ 61 dias)',
        subTab: 'para_revalidacao' as ProcessosSubTab,
        description: 'Atenção prioritária: renovações necessárias junto ao IBAMA',
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

  // Status Carousel auto-rotation: 3 seconds with visual progress
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

  const handleCardClick = (idx: number, subTab: ProcessosSubTab) => {
    setTopIndex(idx);
    setTopCycleProgress(0);
  };

  const getSituacaoStyle = (situacao: string) => {
    switch (situacao) {
      case 'Licença/Certidão emitida':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'Encaminhada para o ibama':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'Em análise pelo Analista do ATC':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
      case 'A pagar':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'Em edição':
      default:
        return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700';
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
    <div className="space-y-8 pb-12">
      {/* Alerta Destacado de Licenças para Revalidação */}
      <RevalidationAlertBanner
        processosRevalidar={revalidacaoProcessos}
        onVerProcessosRevalidacao={() => onNavigateToProcessos('para_revalidacao')}
        onSelecionarProcesso={onSelectProcesso}
      />

      {/* Hero Welcome & Quick Search Bar */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-neutral-800">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#E30613] mb-2">
            <span className="w-2 h-2 rounded-full bg-[#E30613] animate-ping" />
            Central Shineray de Homologação Veicular
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Gestão Centralizada de Processos Infoserv
          </h1>
          <p className="text-neutral-300 text-sm sm:text-base leading-relaxed mb-6">
            Acompanhe o ciclo completo de emissão de licenças LCVM, LCM, dispensas e extensões do IBAMA.
            Monitore prazos de revalidação e histórico de observações em tempo real.
          </p>

          {/* Quick search input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Busca rápida por número (SL/SD), MMV (ex: WORKER 125, STORM), licença..."
              className="w-full pl-10 pr-24 py-3 bg-neutral-800/80 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E30613] focus:border-transparent transition-all"
            />
            {quickSearch && (
              <button
                onClick={() => setQuickSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white px-2 py-1"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Quick search instant results drawer */}
          {quickSearch.trim() && (
            <div className="mt-3 bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden shadow-2xl max-h-64 overflow-y-auto">
              <div className="p-2.5 text-xs font-semibold text-neutral-400 border-b border-neutral-700/60 flex justify-between items-center">
                <span>Resultados encontrados ({filteredQuickList.length})</span>
                <span className="text-[11px] text-neutral-500">Clique para inspecionar</span>
              </div>
              {filteredQuickList.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-400">
                  Nenhum processo localizado para "{quickSearch}".
                </div>
              ) : (
                <div className="divide-y divide-neutral-700/50">
                  {filteredQuickList.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onSelectProcesso(p)}
                      className="w-full p-3 text-left hover:bg-neutral-700/60 transition-colors flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span className="font-mono text-[#E30613]">{p.numeroSolicitacao}</span>
                          <span>·</span>
                          <span>{p.mmv}</span>
                        </div>
                        <div className="text-neutral-400 text-[11px] mt-0.5">
                          {p.tipo} · {p.tipoVeiculo} · {p.situacao}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-400 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 1: Top Status Cards Carousel with Synchronized Mini List */}
      <div className="space-y-3">
        {/* Header with Title and Carousel Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Status</span>
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
                    className={`relative h-2 rounded-full overflow-hidden transition-all duration-300 ${
                      isCurr
                        ? 'w-7 bg-neutral-200 dark:bg-neutral-700'
                        : 'w-2 bg-neutral-300 dark:bg-neutral-800 hover:bg-neutral-400'
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
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 shadow-sm transition-colors"
              title={isTopManualPaused ? 'Retomar rotação automática' : 'Pausar rotação automática'}
              aria-label={isTopManualPaused ? 'Play' : 'Pause'}
            >
              {isTopManualPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>

            {/* Prev / Next buttons */}
            <button
              onClick={handlePrevTop}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 shadow-sm transition-colors"
              title="Cartão anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextTop}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 shadow-sm transition-colors"
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
                onClick={() => handleCardClick(idx, card.subTab)}
                onMouseEnter={() => {
                  setTopIndex(idx);
                  setTopCycleProgress(0);
                }}
                className={`cursor-pointer rounded-xl bg-white dark:bg-neutral-900 p-4 sm:p-5 transition-all duration-200 shadow-sm border text-left relative overflow-hidden flex flex-col justify-between select-none ${
                  isActive
                    ? 'ring-2 ring-[#E30613] border-[#E30613] shadow-md scale-[1.01] bg-neutral-50/80 dark:bg-neutral-850'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow'
                } ${card.accent}`}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute top-0 right-0 left-0 h-1 bg-[#E30613]" />
                )}

                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${card.badgeBg}`}>
                      {card.tag}
                    </span>
                    <IconComp className="w-5 h-5 opacity-70 text-neutral-600 dark:text-neutral-300" />
                  </div>

                  <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    {card.titulo}
                  </h3>
                  <div className="text-3xl font-extrabold font-mono tabular-nums tracking-tight text-neutral-900 dark:text-white mb-2">
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
                    className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-300 group hover:text-[#E30613] transition-colors"
                  >
                    <span>{isActive ? 'Exibindo na mini lista' : 'Ver processos'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#E30613] transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* MINI LISTA ABAIXO DOS 4 CARTÕES DE STATUS OPERACIONAL */}
        <div
          onMouseEnter={() => setIsTopHovered(true)}
          onMouseLeave={() => setIsTopHovered(false)}
          className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden transition-all duration-200 mt-2"
        >
          {/* Header da Mini Lista */}
          <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className={`px-2.5 py-1 rounded text-xs font-bold ${activeCard.badgeBg}`}>
                {activeCard.tag}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                    Mini Lista de Processos · <span className="text-[#E30613]">{activeCard.titulo}</span>
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.2 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                    {activeProcesses.length}{' '}
                    {activeProcesses.length === 1 ? 'processo' : 'processos'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {activeCard.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateToProcessos(activeCard.subTab)}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#E30613] hover:bg-[#C40510] text-white inline-flex items-center gap-1.5 transition-colors shadow-sm"
                title="Abrir tela de processos com este filtro aplicado"
              >
                <span>Ver todos na aba Processos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onNavigateToCadastro}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 inline-flex items-center gap-1 transition-colors"
                title="Cadastrar novo processo"
              >
                <Plus className="w-3 h-3 text-[#E30613]" />
                <span>Novo</span>
              </button>
            </div>
          </div>

          {/* Conteúdo da Mini Lista: Linhas compactas */}
          {activeProcesses.length === 0 ? (
            <div className="py-7 px-4 text-center">
              <FileText className="w-7 h-7 text-neutral-300 dark:text-neutral-600 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Nenhum processo localizado para "{activeCard.titulo}".
              </p>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                Passe o mouse por outros cartões acima para visualizar os processos de cada status.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800 overflow-x-auto">
              {/* Desktop Table View */}
              <table className="w-full text-left border-collapse text-xs hidden md:table">
                <thead>
                  <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    <th className="py-2 px-3">Solicitação</th>
                    <th className="py-2 px-3">MMV / Modelo</th>
                    <th className="py-2 px-3">Tipo</th>
                    <th className="py-2 px-3">Veículo</th>
                    <th className="py-2 px-3">Procedência</th>
                    <th className="py-2 px-3">Licença Infoserv</th>
                    <th className="py-2 px-3">Situação</th>
                    <th className="py-2 px-3">Validade</th>
                    <th className="py-2 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {activeProcesses.map((proc) => {
                    const diasRestantes = calcularDiasRestantes(proc.dataValidade);
                    const isReval = estaParaRevalidar(proc.dataValidade, proc.situacao);

                    return (
                      <tr
                        key={proc.id}
                        onClick={() => onSelectProcesso(proc)}
                        className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors group"
                      >
                        {/* Solicitacao */}
                        <td className="py-2.5 px-3 font-mono font-bold text-[#E30613] whitespace-nowrap">
                          {proc.numeroSolicitacao}
                        </td>

                        {/* MMV */}
                        <td className="py-2.5 px-3 font-extrabold text-neutral-900 dark:text-white group-hover:text-[#E30613] transition-colors">
                          {proc.mmv}
                        </td>

                        {/* Tipo Homologacao */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                            {proc.tipo}
                          </span>
                        </td>

                        {/* Tipo Veiculo */}
                        <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
                          {proc.tipoVeiculo}
                        </td>

                        {/* Procedência */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              proc.procedencia === 'Nacional'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                            }`}
                          >
                            {proc.procedencia}
                          </span>
                        </td>

                        {/* Licença */}
                        <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                          {proc.numeroLicenca ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {proc.numeroLicenca}
                            </span>
                          ) : (
                            <span className="text-neutral-400 italic">Em emissão</span>
                          )}
                        </td>

                        {/* Situação */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${getSituacaoStyle(
                              proc.situacao
                            )}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                            <span className="truncate max-w-[130px]">{proc.situacao}</span>
                          </span>
                        </td>

                        {/* Validade */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {proc.dataValidade ? (
                            <div className="flex items-center gap-1">
                              <span
                                className={`font-semibold ${
                                  isReval
                                    ? 'text-[#E30613] font-bold'
                                    : 'text-neutral-700 dark:text-neutral-300'
                                }`}
                              >
                                {formatarDataBR(proc.dataValidade)}
                              </span>
                              {diasRestantes !== null && (
                                <span
                                  className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                                    isReval
                                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
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
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div
                            className="inline-flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => onSelectProcesso(proc)}
                              className="px-2 py-0.5 rounded text-[11px] font-bold text-[#E30613] hover:bg-red-50 dark:hover:bg-red-950/40 inline-flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
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
              <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-800">
                {activeProcesses.map((proc) => {
                  const diasRestantes = calcularDiasRestantes(proc.dataValidade);
                  const isReval = estaParaRevalidar(proc.dataValidade, proc.situacao);

                  return (
                    <div
                      key={proc.id}
                      onClick={() => onSelectProcesso(proc)}
                      className="p-3 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50 cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[#E30613]">
                          {proc.numeroSolicitacao}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getSituacaoStyle(
                            proc.situacao
                          )}`}
                        >
                          {proc.situacao}
                        </span>
                      </div>

                      <div className="font-bold text-xs text-neutral-900 dark:text-white">
                        {proc.mmv}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                        <span>{proc.tipo} · {proc.tipoVeiculo}</span>
                        <span>{proc.procedencia}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-100 dark:border-neutral-800">
                        <span className="font-mono text-[10px] text-neutral-600 dark:text-neutral-300">
                          {proc.numeroLicenca || 'Sem licença'}
                        </span>
                        {proc.dataValidade && (
                          <span className={`text-[10px] font-semibold ${isReval ? 'text-[#E30613]' : ''}`}>
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

      {/* ALERT BOX if any process needs revalidation within 61 days */}
      {revalidacaoProcessos.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg text-[#E30613] shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-950 flex items-center gap-2">
                Atenção: {revalidacaoProcessos.length} licença(s) para revalidação (expira em ≤ 61 dias)
              </h4>
              <p className="text-xs text-red-800 mt-0.5">
                Modelos como{' '}
                <span className="font-semibold">
                  {revalidacaoProcessos.slice(0, 2).map((p) => p.mmv).join(', ')}
                </span>{' '}
                precisam de protocolo de revalidação no Infoserv para não comprometer a comercialização.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToProcessos('para_revalidacao')}
            className="shrink-0 px-3.5 py-2 bg-[#E30613] hover:bg-[#C40510] text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            Examinar Licenças
          </button>
        </div>
      )}

      {/* QUICK ACTIONS & RECENT PROCESSES PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Quick Launch Cards */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight">
              Ações Rápidas de Homologação
            </h3>

            <div className="space-y-2">
              <button
                onClick={onNavigateToCadastro}
                className="w-full p-3 rounded-lg border border-[#E30613]/20 bg-red-50/40 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/40 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#E30613] text-white rounded-md">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">
                      Cadastrar Novo Processo
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Regras SL/SD, MMV e restrições
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#E30613] transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => onNavigateToProcessos('para_revalidacao')}
                className="w-full p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500 text-white rounded-md">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">
                      Painel de Revalidação
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Controle do prazo de 61 dias
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => onNavigateToProcessos('em_edicao')}
                className="w-full p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-neutral-800 text-white rounded-md">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">
                      Processos em Edição
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Pendentes de envio para o IBAMA
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Latest Activity / Recent Processes */}
        <div className="lg:col-span-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight">
                Processos Recentes em Destaque
              </h3>
              <button
                onClick={() => onNavigateToProcessos('todos')}
                className="text-xs font-semibold text-[#E30613] hover:underline flex items-center gap-1"
              >
                Ver todos ({totalProcessos})
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {processos.slice(0, 4).map((p) => {
                const precisaRevalidar = estaParaRevalidar(p.dataValidade, p.situacao);

                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectProcesso(p)}
                    className="py-3 flex items-center justify-between hover:bg-neutral-50/80 dark:hover:bg-neutral-800/80 px-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#E30613]">
                          {p.numeroSolicitacao}
                        </span>
                        <span className="text-neutral-300 dark:text-neutral-700">·</span>
                        <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                          {p.mmv}
                        </span>
                        {precisaRevalidar && (
                          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100/60 dark:bg-red-950/60 px-1.5 py-0.2 rounded">
                            Revalidação
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-2">
                        <span>{p.tipo}</span>
                        <span>·</span>
                        <span>{p.procedencia}</span>
                        <span>·</span>
                        <span>{p.situacao}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300">
                        {p.numeroLicenca || 'Sem licença'}
                      </div>
                      <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
                        {p.dataEnvio ? `Envio: ${p.dataEnvio.split('-').reverse().join('/')}` : 'Não enviado'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
            <span>Base sincronizada com o padrão regulatório PROCONVE / PROMOT</span>
            <span className="font-mono text-[11px]">Shineray do Brasil</span>
          </div>
        </div>
      </div>
    </div>
  );
};
