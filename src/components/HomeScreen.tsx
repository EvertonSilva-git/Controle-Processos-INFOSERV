import React, { useState, useEffect, useRef } from 'react';
import { Processo, ProcessoTipo, ProcessosSubTab } from '../types/process';
import { estaParaRevalidar } from '../utils/processCalculations';
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
  Compass
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
  const emAndamentoProcessos = processos.filter(
    (p) => p.situacao !== 'Licença/Certidão emitida' && !p.numeroLicenca
  );
  
  // Licenças Emitidas: issued
  const emitidasProcessos = processos.filter(
    (p) => p.situacao === 'Licença/Certidão emitida' || !!p.numeroLicenca
  );
  
  // Para revalidação: validity expires within 61 days
  const revalidacaoProcessos = processos.filter((p) =>
    estaParaRevalidar(p.dataValidade, p.situacao)
  );

  // Type counts
  const countLCVM = processos.filter((p) => p.tipo === 'LCVM').length;
  const countLCVMEspecial = processos.filter((p) => p.tipo === 'LCVM Especial').length;
  const countLCM = processos.filter((p) => p.tipo === 'LCM').length;
  const countLCMEspecial = processos.filter((p) => p.tipo === 'LCM Especial').length;
  const countDispensa = processos.filter((p) => p.tipo === 'Dispensa').length;
  const countExtensao = processos.filter((p) => p.tipo === 'Extensão').length;

  // Carousel 1: Top Status Cards (4 cards)
  const topCards = [
    {
      id: 'todos',
      titulo: 'Todos os processos',
      subtitulo: 'Totalidade de cadastros no Infoserv',
      count: totalProcessos,
      icon: Layers,
      accent: 'border-l-4 border-l-neutral-800 text-neutral-900',
      badgeBg: 'bg-neutral-100 text-neutral-800',
      tag: 'Geral',
      subTab: 'todos' as ProcessosSubTab,
      description: 'Acervo completo de homologações e solicitações',
    },
    {
      id: 'andamento',
      titulo: 'Em andamento',
      subtitulo: 'Licenças ainda não emitidas pelo órgão',
      count: emAndamentoProcessos.length,
      icon: Clock,
      accent: 'border-l-4 border-l-amber-500 text-amber-900',
      badgeBg: 'bg-amber-50 text-amber-800',
      tag: 'Em trâmite',
      subTab: 'em_tramitacao' as ProcessosSubTab,
      description: 'Processos em edição, ATC, IBAMA ou aguardando pagamento',
    },
    {
      id: 'emitidas',
      titulo: 'Licenças Emitidas',
      subtitulo: 'Processos concluídos com certidão oficial',
      count: emitidasProcessos.length,
      icon: CheckCircle2,
      accent: 'border-l-4 border-l-emerald-600 text-emerald-950',
      badgeBg: 'bg-emerald-50 text-emerald-800',
      tag: 'Concluídas',
      subTab: 'licencas_emitidas' as ProcessosSubTab,
      description: 'Licenças ativas com numeração registrada no sistema',
    },
    {
      id: 'revalidacao',
      titulo: 'Para revalidação',
      subtitulo: 'Validade a expirar nos próximos 61 dias',
      count: revalidacaoProcessos.length,
      icon: AlertTriangle,
      accent: 'border-l-4 border-l-[#E30613] text-[#B0040E]',
      badgeBg: 'bg-red-50 text-[#E30613]',
      tag: 'Urgente (≤ 61 dias)',
      subTab: 'para_revalidacao' as ProcessosSubTab,
      description: 'Atenção imediata para renovação junto ao IBAMA',
    },
  ];

  // Carousel 2: Bottom Type Cards (6 cards)
  const bottomCards = [
    {
      id: 'lcvm',
      titulo: 'LCVM',
      subtitulo: 'Licença para Veículos Leves',
      count: countLCVM,
      tipo: 'LCVM' as ProcessoTipo,
    },
    {
      id: 'lcvm_esp',
      titulo: 'LCVM Especial',
      subtitulo: 'Veículos Leves Restritos / Séries',
      count: countLCVMEspecial,
      tipo: 'LCVM Especial' as ProcessoTipo,
    },
    {
      id: 'lcm',
      titulo: 'LCM',
      subtitulo: 'Licença para Ciclomotores e Motos',
      count: countLCM,
      tipo: 'LCM' as ProcessoTipo,
    },
    {
      id: 'lcm_esp',
      titulo: 'LCM Especial',
      subtitulo: 'Offroad / Triciclos / Quadriciclos',
      count: countLCMEspecial,
      tipo: 'LCM Especial' as ProcessoTipo,
    },
    {
      id: 'dispensa',
      titulo: 'Dispensa',
      subtitulo: 'Isenções e Protótipos de Teste',
      count: countDispensa,
      tipo: 'Dispensa' as ProcessoTipo,
    },
    {
      id: 'extensao',
      titulo: 'Extensão',
      subtitulo: 'Extensões de Modelos / MMV Base',
      count: countExtensao,
      tipo: 'Extensão' as ProcessoTipo,
    },
  ];

  // Carousel 1 state
  const [topIndex, setTopIndex] = useState(0);
  const [isTopPaused, setIsTopPaused] = useState(false);
  const topTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Carousel 2 state
  const [bottomIndex, setBottomIndex] = useState(0);
  const [isBottomPaused, setIsBottomPaused] = useState(false);
  const bottomTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Search input state on home
  const [quickSearch, setQuickSearch] = useState('');

  // Top Carousel auto-rotation: 3 seconds
  useEffect(() => {
    if (isTopPaused) return;
    topTimerRef.current = setInterval(() => {
      setTopIndex((prev) => (prev + 1) % topCards.length);
    }, 3000);

    return () => {
      if (topTimerRef.current) clearInterval(topTimerRef.current);
    };
  }, [isTopPaused, topCards.length]);

  // Bottom Carousel auto-rotation: 3 seconds
  useEffect(() => {
    if (isBottomPaused) return;
    bottomTimerRef.current = setInterval(() => {
      setBottomIndex((prev) => (prev + 1) % bottomCards.length);
    }, 3000);

    return () => {
      if (bottomTimerRef.current) clearInterval(bottomTimerRef.current);
    };
  }, [isBottomPaused, bottomCards.length]);

  const handlePrevTop = () => {
    setTopIndex((prev) => (prev - 1 + topCards.length) % topCards.length);
  };

  const handleNextTop = () => {
    setTopIndex((prev) => (prev + 1) % topCards.length);
  };

  const handlePrevBottom = () => {
    setBottomIndex((prev) => (prev - 1 + bottomCards.length) % bottomCards.length);
  };

  const handleNextBottom = () => {
    setBottomIndex((prev) => (prev + 1) % bottomCards.length);
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

      {/* SECTION 1: Top Status Cards Carousel (alternando a cada 3 segundos com setas) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
              <span>Status Operacional</span>
              <span className="text-xs font-normal text-neutral-500">
                (Alternando a cada 3s · Clique no cartão para filtrar)
              </span>
            </h2>
          </div>

          {/* Navigation Controls: Arrows and Dots */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              {topCards.map((card, idx) => (
                <button
                  key={card.id}
                  onClick={() => setTopIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    topIndex === idx
                      ? 'w-6 bg-[#E30613]'
                      : 'w-2 bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400'
                  }`}
                  aria-label={`Ir para ${card.titulo}`}
                />
              ))}
            </div>
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

        {/* Carousel Container */}
        <div
          onMouseEnter={() => setIsTopPaused(true)}
          onMouseLeave={() => setIsTopPaused(false)}
          className="relative"
        >
          {/* Grid display for wide viewports + Highlighted active slide */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topCards.map((card, idx) => {
              const IconComp = card.icon;
              const isActive = topIndex === idx;

              return (
                <div
                  key={card.id}
                  onClick={() => onNavigateToProcessos(card.subTab)}
                  className={`cursor-pointer rounded-xl bg-white dark:bg-neutral-900 p-5 transition-all duration-300 shadow-sm border text-left relative overflow-hidden flex flex-col justify-between ${
                    isActive
                      ? 'ring-2 ring-[#E30613] border-transparent shadow-md scale-[1.01]'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow'
                  } ${card.accent}`}
                >
                  {/* Subtle active indicator bar */}
                  {isActive && (
                    <div className="absolute top-0 right-0 left-0 h-1 bg-[#E30613]" />
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-3">
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
                    <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-300 group">
                      <span>Ver processos</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#E30613] transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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

      {/* SECTION 2: Bottom Type Cards (mesmo estilo mas menores, com os tipos solicitados) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Classificação por Tipo de Homologação</span>
              <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">
                (LCVM, LCM, Especial, Dispensa, Extensão · Alternando a cada 3s)
              </span>
            </h2>
          </div>

          {/* Navigation Controls for Bottom Cards */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 mr-2">
              {bottomCards.map((bCard, bIdx) => (
                <button
                  key={bCard.id}
                  onClick={() => setBottomIndex(bIdx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    bottomIndex === bIdx
                      ? 'w-4 bg-neutral-800 dark:bg-white'
                      : 'w-1.5 bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400'
                  }`}
                  aria-label={`Tipo ${bCard.titulo}`}
                />
              ))}
            </div>
            <button
              onClick={handlePrevBottom}
              className="p-1 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 shadow-sm transition-colors"
              title="Tipo anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNextBottom}
              className="p-1 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 shadow-sm transition-colors"
              title="Próximo tipo"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Carousel / Grid for 6 smaller cards */}
        <div
          onMouseEnter={() => setIsBottomPaused(true)}
          onMouseLeave={() => setIsBottomPaused(false)}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          {bottomCards.map((card, idx) => {
            const isBottomActive = bottomIndex === idx;

            return (
              <div
                key={card.id}
                onClick={() => onNavigateToProcessos('todos', card.tipo)}
                className={`cursor-pointer rounded-xl bg-white dark:bg-neutral-900 p-3.5 transition-all duration-300 border text-left flex flex-col justify-between ${
                  isBottomActive
                    ? 'ring-2 ring-neutral-800 dark:ring-neutral-200 border-transparent shadow-md scale-[1.02] bg-neutral-50/50 dark:bg-neutral-800/50'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                    <span className="font-semibold text-neutral-400 dark:text-neutral-500 text-[10px] uppercase tracking-wider">
                      Tipo
                    </span>
                    <span className="font-mono text-[11px] text-[#E30613] font-bold">
                      #{idx + 1}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white tracking-tight leading-snug">
                    {card.titulo}
                  </h4>
                </div>

                <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-baseline justify-between">
                  <span className="text-xl font-extrabold font-mono tabular-nums text-neutral-900 dark:text-white">
                    {card.count}
                  </span>
                  <span className="text-[10px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center gap-0.5">
                    Filtrar <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
