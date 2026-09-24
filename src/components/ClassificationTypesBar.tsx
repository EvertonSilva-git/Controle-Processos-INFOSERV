import React, { useState, useEffect, useMemo } from 'react';
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
  Play,
  Pause,
  Plus,
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
        titulo: 'LCVM',
        descricao: 'Licença para Veículos Leves',
        subtitulo: 'Veículos leves de passageiros e comerciais',
        count: countLCVM,
        tipo: 'LCVM' as ProcessoTipo,
      },
      {
        id: 'lcvm_esp',
        titulo: 'LCVM Especial',
        descricao: 'Veículos Leves Restritos / Séries',
        subtitulo: 'Séries especiais e aplicações restritas',
        count: countLCVMEspecial,
        tipo: 'LCVM Especial' as ProcessoTipo,
      },
      {
        id: 'lcm',
        titulo: 'LCM',
        descricao: 'Licença para Ciclomotores e Motos',
        subtitulo: 'Motocicletas e scooters de produção regular',
        count: countLCM,
        tipo: 'LCM' as ProcessoTipo,
      },
      {
        id: 'lcm_esp',
        titulo: 'LCM Especial',
        descricao: 'Offroad / Triciclos / Quadriciclos',
        subtitulo: 'Uso fora de estrada e utilitários especiais',
        count: countLCMEspecial,
        tipo: 'LCM Especial' as ProcessoTipo,
      },
      {
        id: 'dispensa',
        titulo: 'Dispensa',
        descricao: 'Isenções e Protótipos de Teste',
        subtitulo: 'Veículos experimentais e de desenvolvimento',
        count: countDispensa,
        tipo: 'Dispensa' as ProcessoTipo,
      },
      {
        id: 'extensao',
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

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header with Title and Carousel Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-white tracking-tight">
            Classificação por Tipo de Homologação
          </h3>

          {selectedTipo && (
            <button
              onClick={() => onSelectTipo && onSelectTipo(null)}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-200/70 hover:bg-neutral-300/80 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors ml-1"
              title="Limpar filtro de tipo"
            >
              Filtro ativo: {selectedTipo} <X className="w-3 h-3" />
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
                  className={`relative h-1.5 rounded-full overflow-hidden transition-all duration-200 ${
                    isCurr
                      ? 'w-6 bg-neutral-300 dark:bg-neutral-700'
                      : 'w-2 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300'
                  }`}
                  aria-label={`Tipo ${bCard.titulo}`}
                  title={`${bCard.titulo}: ${bCard.count} processo(s)`}
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
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 shadow-2xs transition-colors"
            title={isManualPaused ? 'Retomar rotação automática' : 'Pausar rotação automática'}
            aria-label={isManualPaused ? 'Play' : 'Pause'}
          >
            {isManualPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Prev / Next buttons */}
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 shadow-2xs transition-colors"
            title="Tipo anterior"
            aria-label="Tipo anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 shadow-2xs transition-colors"
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
              className={`cursor-pointer rounded-xl bg-white dark:bg-neutral-900 p-3.5 transition-all duration-150 border text-left flex flex-col justify-between select-none relative ${
                isFilterActive
                  ? 'border-[#E30613]/80 bg-red-50/20 dark:bg-red-950/20 shadow-xs ring-1 ring-[#E30613]/50'
                  : isCarouselActive
                  ? 'border-neutral-300 dark:border-neutral-700 bg-neutral-50/80 dark:bg-neutral-800/70 shadow-xs'
                  : 'border-neutral-200/90 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40'
              }`}
            >
              {/* Subtle top indicator bar */}
              {isCarouselActive && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#E30613] rounded-t-xl" />
              )}

              <div>
                <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">
                  Homologação
                </span>
                <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white tracking-tight leading-snug truncate">
                  {card.titulo}
                </h4>
              </div>

              <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-baseline justify-between">
                <span className="text-lg sm:text-xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
                  {card.count}
                </span>
                <span
                  className={`text-[11px] font-medium flex items-center gap-0.5 ${
                    isFilterActive
                      ? 'text-[#E30613]'
                      : isCarouselActive
                      ? 'text-neutral-700 dark:text-neutral-300 font-medium'
                      : 'text-neutral-400'
                  }`}
                >
                  {isFilterActive ? (
                    <>
                      Ativo <Check className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      Ver <ArrowRight className="w-3 h-3" />
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
        className="rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs overflow-hidden transition-colors"
      >
        {/* Header da Mini Lista */}
        <div className="px-4 py-3 bg-neutral-50/70 dark:bg-neutral-800/50 border-b border-neutral-200/80 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white">
                  Processos de <span className="text-[#E30613] font-bold">{activeCard.titulo}</span>
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  ({activeRelatedProcessos.length} {activeRelatedProcessos.length === 1 ? 'item' : 'itens'})
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                {activeCard.descricao} · {activeCard.subtitulo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCardClick(activeCard.tipo, activeIndex)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                selectedTipo === activeCard.tipo
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                  : 'bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
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
                  <span>Filtrar na tabela</span>
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>

            {onNavigateToCadastro && (
              <button
                onClick={onNavigateToCadastro}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 inline-flex items-center gap-1 transition-colors"
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
          <div className="py-8 px-4 text-center">
            <FileText className="w-7 h-7 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Nenhum processo cadastrado para a categoria {activeCard.titulo}.
            </p>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
              Passe o mouse por outras categorias acima para visualizar seus processos.
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
                  <th className="py-2.5 px-4 font-semibold">Tipo do Veículo</th>
                  <th className="py-2.5 px-4 font-semibold">Procedência</th>
                  <th className="py-2.5 px-4 font-semibold">Licença Infoserv</th>
                  <th className="py-2.5 px-4 font-semibold">Situação</th>
                  <th className="py-2.5 px-4 font-semibold">Validade</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {activeRelatedProcessos.map((proc) => {
                  const diasRestantes = calcularDiasRestantes(proc.dataValidade);
                  const isReval = estaParaRevalidar(proc.dataValidade, proc.situacao);

                  return (
                    <tr
                      key={proc.id}
                      onClick={() => onEditProcesso && onEditProcesso(proc)}
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
                          {onOpenObservations && (
                            <button
                              onClick={() => onOpenObservations(proc)}
                              className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              title="Observações"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onEditProcesso && (
                            <button
                              onClick={() => onEditProcesso(proc)}
                              className="px-2.5 py-1 rounded-md text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 inline-flex items-center gap-1 transition-colors"
                            >
                              <Edit3 className="w-3 h-3 text-[#E30613]" />
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
            <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-800/80">
              {activeRelatedProcessos.map((proc) => {
                const diasRestantes = calcularDiasRestantes(proc.dataValidade);
                const isReval = estaParaRevalidar(proc.dataValidade, proc.situacao);

                return (
                  <div
                    key={proc.id}
                    onClick={() => onEditProcesso && onEditProcesso(proc)}
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
                      <span>{proc.tipoVeiculo}</span>
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
  );
};
