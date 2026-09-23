import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Processo, ProcessoTipo } from '../types/process';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Check,
  X,
  FileText,
  Edit3,
  MessageSquare,
  Clock,
  AlertTriangle,
  Play,
  Pause,
  Plus,
  ShieldCheck,
  Calendar,
  Sparkles,
  ExternalLink,
  Layers,
} from 'lucide-react';
import {
  calcularDiasRestantes,
  formatarDataBR,
  estaParaRevalidar,
} from '../utils/processCalculations';

interface ClassificationTypesBarProps {
  processos: Processo[];
  selectedTipo?: ProcessoTipo | null;
  onSelectTipo?: (tipo: ProcessoTipo | null) => void;
  onEditProcesso?: (processo: Processo) => void;
  onOpenObservations?: (processo: Processo) => void;
  onNavigateToCadastro?: () => void;
  className?: string;
}

export const ClassificationTypesBar: React.FC<ClassificationTypesBarProps> = ({
  processos,
  selectedTipo,
  onSelectTipo,
  onEditProcesso,
  onOpenObservations,
  onNavigateToCadastro,
  className = '',
}) => {
  // Counts by type
  const countLCVM = useMemo(() => processos.filter((p) => p.tipo === 'LCVM').length, [processos]);
  const countLCVMEspecial = useMemo(() => processos.filter((p) => p.tipo === 'LCVM Especial').length, [processos]);
  const countLCM = useMemo(() => processos.filter((p) => p.tipo === 'LCM').length, [processos]);
  const countLCMEspecial = useMemo(() => processos.filter((p) => p.tipo === 'LCM Especial').length, [processos]);
  const countDispensa = useMemo(() => processos.filter((p) => p.tipo === 'Dispensa').length, [processos]);
  const countExtensao = useMemo(() => processos.filter((p) => p.tipo === 'Extensão').length, [processos]);

  const typeCards = useMemo(
    () => [
      {
        id: 'lcvm',
        numero: '#1',
        titulo: 'LCVM',
        descricao: 'Licença para Veículos Leves',
        subtitulo: 'Veículos leves de passageiros e comerciais',
        count: countLCVM,
        tipo: 'LCVM' as ProcessoTipo,
      },
      {
        id: 'lcvm_esp',
        numero: '#2',
        titulo: 'LCVM Especial',
        descricao: 'Veículos Leves Restritos / Séries',
        subtitulo: 'Séries especiais e aplicações restritas',
        count: countLCVMEspecial,
        tipo: 'LCVM Especial' as ProcessoTipo,
      },
      {
        id: 'lcm',
        numero: '#3',
        titulo: 'LCM',
        descricao: 'Licença para Ciclomotores e Motos',
        subtitulo: 'Motocicletas e scooters de produção regular',
        count: countLCM,
        tipo: 'LCM' as ProcessoTipo,
      },
      {
        id: 'lcm_esp',
        numero: '#4',
        titulo: 'LCM Especial',
        descricao: 'Offroad / Triciclos / Quadriciclos',
        subtitulo: 'Uso fora de estrada e utilitários especiais',
        count: countLCMEspecial,
        tipo: 'LCM Especial' as ProcessoTipo,
      },
      {
        id: 'dispensa',
        numero: '#5',
        titulo: 'Dispensa',
        descricao: 'Isenções e Protótipos de Teste',
        subtitulo: 'Veículos experimentais e de desenvolvimento',
        count: countDispensa,
        tipo: 'Dispensa' as ProcessoTipo,
      },
      {
        id: 'extensao',
        numero: '#6',
        titulo: 'Extensão',
        descricao: 'Extensões de Modelos / MMV Base',
        subtitulo: 'Variações homologadas com base em licença prévia',
        count: countExtensao,
        tipo: 'Extensão' as ProcessoTipo,
      },
    ],
    [countLCVM, countLCVMEspecial, countLCM, countLCMEspecial, countDispensa, countExtensao]
  );

  // Carousel active index state
  const [activeIndex, setActiveIndex] = useState(0);
  const [isManualPaused, setIsManualPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [cycleProgress, setCycleProgress] = useState(0);

  const activeCard = typeCards[activeIndex] || typeCards[0];
  const activeTipo = activeCard.tipo;

  // Processos belonging to the active type in the carousel
  const activeRelatedProcessos = useMemo(() => {
    return processos.filter((p) => p.tipo === activeTipo);
  }, [processos, activeTipo]);

  // Auto-rotation (every 3 seconds) when not paused and not hovering
  useEffect(() => {
    if (isManualPaused || isHovered) {
      return;
    }

    setCycleProgress(0);
    const startTime = Date.now();
    const duration = 3000;

    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setCycleProgress(pct);
    }, 40);

    const stepTimer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % typeCards.length);
      setCycleProgress(0);
    }, duration);

    return () => {
      clearInterval(progressTimer);
      clearInterval(stepTimer);
    };
  }, [isManualPaused, isHovered, activeIndex, typeCards.length]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + typeCards.length) % typeCards.length);
    setCycleProgress(0);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % typeCards.length);
    setCycleProgress(0);
  };

  const handleCardClick = (tipo: ProcessoTipo, idx: number) => {
    setActiveIndex(idx);
    setCycleProgress(0);
    if (!onSelectTipo) return;
    if (selectedTipo === tipo) {
      onSelectTipo(null);
    } else {
      onSelectTipo(tipo);
    }
  };

  const handleCardHover = (idx: number) => {
    setActiveIndex(idx);
    setCycleProgress(0);
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

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Header with Title and Carousel Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Classificação por Tipo de Homologação</span>
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#E30613]" />
              <span>Alternando e exibindo mini lista de processos a cada 3s</span>
            </span>
          </div>

          {selectedTipo && (
            <button
              onClick={() => onSelectTipo && onSelectTipo(null)}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E30613]/10 text-[#E30613] hover:bg-[#E30613]/20 transition-colors ml-1"
              title="Limpar filtro de tipo"
            >
              Filtro ativo na tabela: {selectedTipo} <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Carousel controls & Play/Pause */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Progress bar and dot indicators */}
          <div className="flex items-center gap-1 mr-1">
            {typeCards.map((bCard, bIdx) => {
              const isCurr = activeIndex === bIdx;
              return (
                <button
                  key={bCard.id}
                  onClick={() => {
                    setActiveIndex(bIdx);
                    setCycleProgress(0);
                  }}
                  className={`relative h-2 rounded-full overflow-hidden transition-all duration-300 ${
                    isCurr
                      ? 'w-7 bg-neutral-200 dark:bg-neutral-700'
                      : 'w-2 bg-neutral-300 dark:bg-neutral-800 hover:bg-neutral-400'
                  }`}
                  aria-label={`Tipo ${bCard.titulo}`}
                  title={`${bCard.numero} ${bCard.titulo}: ${bCard.count} processo(s)`}
                >
                  {isCurr && !isManualPaused && !isHovered && (
                    <div
                      className="absolute inset-y-0 left-0 bg-[#E30613] transition-all duration-75"
                      style={{ width: `${cycleProgress}%` }}
                    />
                  )}
                  {isCurr && (isManualPaused || isHovered) && (
                    <div className="absolute inset-0 bg-[#E30613]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Pause / Play button */}
          <button
            onClick={() => setIsManualPaused((prev) => !prev)}
            className="p-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 shadow-sm transition-colors"
            title={isManualPaused ? 'Retomar rotação automática' : 'Pausar rotação automática'}
            aria-label={isManualPaused ? 'Play' : 'Pause'}
          >
            {isManualPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Prev / Next buttons */}
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 shadow-sm transition-colors"
            title="Tipo anterior"
            aria-label="Tipo anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 shadow-sm transition-colors"
            title="Próximo tipo"
            aria-label="Próximo tipo"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cards Grid (6 Types) */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 relative"
      >
        {typeCards.map((card, idx) => {
          const isCarouselActive = activeIndex === idx;
          const isFilterActive = selectedTipo === card.tipo;

          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.tipo, idx)}
              onMouseEnter={() => handleCardHover(idx)}
              className={`cursor-pointer rounded-xl bg-white dark:bg-neutral-900 p-3 sm:p-3.5 transition-all duration-200 border text-left flex flex-col justify-between select-none relative ${
                isFilterActive
                  ? 'ring-2 ring-[#E30613] border-[#E30613] shadow-md scale-[1.02] bg-red-50/20 dark:bg-red-950/20'
                  : isCarouselActive
                  ? 'ring-2 ring-neutral-900 dark:ring-neutral-200 border-transparent shadow-md scale-[1.02] bg-neutral-50/90 dark:bg-neutral-800/90'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm'
              }`}
            >
              {/* Active type indicator bar */}
              {isCarouselActive && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#E30613] rounded-t-xl" />
              )}

              <div>
                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  <span className="font-semibold text-neutral-400 dark:text-neutral-500 text-[10px] uppercase tracking-wider">
                    TIPO
                  </span>
                  <span className="font-mono text-[11px] text-[#E30613] font-bold">
                    {card.numero}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white tracking-tight leading-snug truncate">
                  {card.titulo}
                </h4>
              </div>

              <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-baseline justify-between">
                <span className="text-xl font-extrabold font-mono tabular-nums text-neutral-900 dark:text-white">
                  {card.count}
                </span>
                <span
                  className={`text-[10px] font-medium flex items-center gap-0.5 ${
                    isFilterActive
                      ? 'text-[#E30613] font-bold'
                      : isCarouselActive
                      ? 'text-neutral-900 dark:text-white font-semibold'
                      : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                  }`}
                >
                  {isFilterActive ? (
                    <>
                      Ativo <Check className="w-2.5 h-2.5" />
                    </>
                  ) : (
                    <>
                      Ver <ArrowRight className="w-2.5 h-2.5" />
                    </>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* MINI LISTA ABAIXO COM AS INFORMAÇÕES DOS PROCESSOS REFERENTES */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden transition-all duration-200"
      >
        {/* Header da Mini Lista */}
        <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded font-mono font-black text-xs bg-[#E30613] text-white">
              {activeCard.numero}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                  Mini Lista de Processos · <span className="text-[#E30613]">{activeCard.titulo}</span>
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.2 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                  {activeRelatedProcessos.length}{' '}
                  {activeRelatedProcessos.length === 1 ? 'processo' : 'processos'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {activeCard.descricao} · {activeCard.subtitulo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCardClick(activeCard.tipo, activeIndex)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                selectedTipo === activeCard.tipo
                  ? 'bg-[#E30613] text-white hover:bg-[#C40510]'
                  : 'bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
              }`}
              title="Filtrar tabela principal abaixo por este tipo"
            >
              {selectedTipo === activeCard.tipo ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Filtro Ativo</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-3 h-3" />
                  <span>Filtrar Tabela Principal</span>
                </>
              )}
            </button>

            {onNavigateToCadastro && (
              <button
                onClick={onNavigateToCadastro}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 inline-flex items-center gap-1 transition-colors"
                title="Cadastrar novo processo"
              >
                <Plus className="w-3 h-3 text-[#E30613]" />
                <span>Novo</span>
              </button>
            )}
          </div>
        </div>

        {/* Conteúdo da Mini Lista: Linhas compactas */}
        {activeRelatedProcessos.length === 0 ? (
          <div className="py-6 px-4 text-center">
            <FileText className="w-7 h-7 text-neutral-300 dark:text-neutral-600 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Nenhum processo cadastrado para a categoria {activeCard.titulo}.
            </p>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
              Passe o mouse pelos outros tipos acima para visualizar seus processos.
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
                  <th className="py-2 px-3">Tipo do Veículo</th>
                  <th className="py-2 px-3">Procedência</th>
                  <th className="py-2 px-3">Licença Infoserv</th>
                  <th className="py-2 px-3">Situação</th>
                  <th className="py-2 px-3">Validade</th>
                  <th className="py-2 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {activeRelatedProcessos.map((proc) => {
                  const diasRestantes = calcularDiasRestantes(proc.dataValidade);
                  const isReval = estaParaRevalidar(proc.dataValidade, proc.situacao);

                  return (
                    <tr
                      key={proc.id}
                      onClick={() => onEditProcesso && onEditProcesso(proc)}
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
                          {onOpenObservations && (
                            <button
                              onClick={() => onOpenObservations(proc)}
                              className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              title="Observações"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onEditProcesso && (
                            <button
                              onClick={() => onEditProcesso(proc)}
                              className="px-2 py-0.5 rounded text-[11px] font-bold text-[#E30613] hover:bg-red-50 dark:hover:bg-red-950/40 inline-flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Ver</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile Stacked View */}
            <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-800">
              {activeRelatedProcessos.map((proc) => {
                const diasRestantes = calcularDiasRestantes(proc.dataValidade);
                const isReval = estaParaRevalidar(proc.dataValidade, proc.situacao);

                return (
                  <div
                    key={proc.id}
                    onClick={() => onEditProcesso && onEditProcesso(proc)}
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
                      <span>{proc.tipoVeiculo}</span>
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
  );
};
