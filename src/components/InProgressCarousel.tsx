import React, { useState, useEffect } from 'react';
import { Processo, ProcessoTipo, ProcessosSubTab } from '../types/process';
import {
  calcularDiasSolicitacaoAteEmissao,
  formatarDataBR,
} from '../utils/processCalculations';
import {
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Play,
  Pause,
  ExternalLink,
} from 'lucide-react';

interface InProgressCarouselProps {
  processosEmAndamento: Processo[];
  onNavigateToProcessos: (subTab?: ProcessosSubTab, tipo?: ProcessoTipo) => void;
  onNavigateToCadastro: () => void;
  onSelectProcesso: (processo: Processo) => void;
}

export const InProgressCarousel: React.FC<InProgressCarouselProps> = ({
  processosEmAndamento,
  onNavigateToProcessos,
  onNavigateToCadastro,
  onSelectProcesso,
}) => {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const total = processosEmAndamento.length;
  const safeIndex = total > 0 ? carouselIndex % total : 0;

  // Auto-rotação contínua e suave do carrossel: 4s por slide
  useEffect(() => {
    if (!isPlaying || isHovered || total <= 1) {
      return;
    }

    const stepInterval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % total);
    }, 4000);

    return () => {
      clearInterval(stepInterval);
    };
  }, [isPlaying, isHovered, total]);

  const handlePrev = () => {
    if (total === 0) return;
    setCarouselIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    if (total === 0) return;
    setCarouselIndex((prev) => (prev + 1) % total);
  };

  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
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
      case 'Para correção':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-semibold';
      case 'Em edição':
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs overflow-hidden p-4 sm:p-5 mt-3">
      {/* Header do Carrossel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3.5 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-semibold font-mono">
            {total} {total === 1 ? 'processo em tramitação' : 'processos em tramitação'}
          </span>
        </div>

        {/* Controles de Navegação: Contador, Play/Pause e Setas */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {total > 0 && (
            <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 tabular-nums mr-1">
              Processo <strong className="text-neutral-900 dark:text-white font-bold">{safeIndex + 1}</strong> de {total}
            </span>
          )}

          {/* Botão Play / Pause */}
          <button
            onClick={handleTogglePlay}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-2xs ${
              isPlaying
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-900 dark:border-white'
                : 'bg-white text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
            }`}
            title={isPlaying ? 'Pausar' : 'Play'}
            aria-label={isPlaying ? 'Pausar' : 'Play'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{isPlaying ? 'Pausar' : 'Play'}</span>
          </button>

          {/* Seta Anterior */}
          <button
            onClick={handlePrev}
            disabled={total <= 1}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors"
            title="Anterior"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Seta Próximo */}
          <button
            onClick={handleNext}
            disabled={total <= 1}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors"
            title="Próximo"
            aria-label="Próximo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Estrutura Dividida: Cartão Fixo (Esquerda) + Rolagem Suave Horizontal (Direita) */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch"
      >
        {/* 1. O CARTÃO EM ANDAMENTO FIXO */}
        <div className="lg:col-span-4 rounded-xl p-5 bg-neutral-900 dark:bg-neutral-800 text-white flex flex-col justify-between border border-neutral-800 dark:border-neutral-700 shadow-sm relative overflow-hidden">
          {/* Brilho decorativo sutil de fundo */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800/60 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Cartão Fixo
              </span>
              <span className="text-xs font-mono text-neutral-400">
                Infoserv
              </span>
            </div>

            <h4 className="text-lg font-bold text-white mb-3 tracking-tight">
              Em Andamento
            </h4>

            {/* Bloco de métricas */}
            <div className="bg-neutral-800/80 dark:bg-neutral-700/50 rounded-lg p-3.5 border border-neutral-700/60 mb-4">
              <div className="text-[11px] text-neutral-400 mb-0.5">Total em tramitação ativa</div>
              <div className="text-3xl font-black font-mono text-white tabular-nums">
                {total}
              </div>
              <div className="text-[11px] text-amber-300 mt-1 flex items-center gap-1">
                <span>Navegue ao lado por cada processo individual</span>
              </div>
            </div>
          </div>

          <div>
            {/* Botões de Ação */}
            <div className="flex flex-col gap-2 pt-2 border-t border-neutral-800 dark:border-neutral-700">
              <button
                onClick={() => onNavigateToProcessos('em_tramitacao')}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-white text-neutral-900 hover:bg-neutral-100 dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 inline-flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Ver todos na aba Processos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onNavigateToCadastro}
                className="w-full py-1.5 px-3 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 inline-flex items-center justify-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3 text-[#E30613]" />
                <span>Novo Processo</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. OS PROCESSOS EM ANDAMENTO EM ROLAGEM HORIZONTAL SUAVE */}
        <div className="lg:col-span-8 flex flex-col justify-between">
          {total === 0 ? (
            <div className="h-full min-h-[240px] rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center p-6 text-center">
              <Clock className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mb-2" />
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                Nenhum processo em andamento no momento
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Todos os processos cadastrados já foram concluídos ou possuem certidão emitida.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Trilho de Rolagem Suave */}
              <div className="overflow-hidden rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 p-1 relative">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${safeIndex * 100}%)` }}
                >
                  {processosEmAndamento.map((proc, idx) => {
                    const calculo = calcularDiasSolicitacaoAteEmissao(proc.dataEnvio, proc.dataEmissao);
                    const isCurrent = idx === safeIndex;

                    return (
                      <div
                        key={proc.id}
                        className="w-full shrink-0 p-2 sm:p-3"
                      >
                        <div
                          onClick={() => onSelectProcesso(proc)}
                          className={`rounded-xl border bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer text-left ${
                            isCurrent
                              ? 'border-neutral-300 dark:border-neutral-700 ring-1 ring-neutral-300 dark:ring-neutral-700'
                              : 'border-neutral-200 dark:border-neutral-800'
                          }`}
                        >
                          {/* Linha superior: Solicitação + Situação */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                                {proc.numeroSolicitacao}
                              </span>
                              {proc.cnpj && (
                                <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                                  CNPJ: {proc.cnpj}
                                </span>
                              )}
                            </div>

                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${getSituacaoStyle(
                                proc.situacao
                              )}`}
                            >
                              {proc.situacao}
                            </span>
                          </div>

                          {/* Título MMV */}
                          <h5 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white mb-2 hover:text-[#E30613] transition-colors">
                            {proc.mmv}
                          </h5>

                          {/* Badges de Enquadramento */}
                          <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-md">
                              {proc.tipo}
                            </span>
                            {proc.orgaoCertificador && (
                              <span className="font-bold font-mono text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 px-2 py-0.5 rounded shadow-2xs">
                                {proc.orgaoCertificador}
                              </span>
                            )}
                            <span className="text-neutral-500 dark:text-neutral-400">
                              {proc.tipoVeiculo}
                            </span>
                            <span className="text-neutral-300 dark:text-neutral-700">·</span>
                            <span className="text-neutral-500 dark:text-neutral-400">
                              Procedência {proc.procedencia}
                            </span>
                          </div>

                          {/* Detalhes de Envio e Histórico */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                            <div>
                              <span className="text-neutral-400 text-[11px] block">Data de Envio ao Órgão</span>
                              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                                {proc.dataEnvio ? formatarDataBR(proc.dataEnvio) : 'Ainda não enviado'}
                                {calculo && !calculo.emitido && (
                                  <span className="text-amber-700 dark:text-amber-400 font-semibold ml-1.5 font-mono">
                                    ({calculo.dias} {calculo.dias === 1 ? 'dia' : 'dias'} em análise)
                                  </span>
                                )}
                              </span>
                            </div>

                            <div>
                              <span className="text-neutral-400 text-[11px] block">Última Observação Registrada</span>
                              <p className="text-neutral-600 dark:text-neutral-400 line-clamp-1 italic text-[11px]">
                                {proc.observacoes && proc.observacoes.length > 0
                                  ? proc.observacoes[proc.observacoes.length - 1].texto
                                  : 'Sem observações registradas'}
                              </p>
                            </div>
                          </div>

                          {/* Rodapé com Dica de Ação */}
                          <div className="mt-3.5 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                            <span className="text-[11px] text-neutral-400">Clique no cartão para ver todos os detalhes</span>
                            <span className="inline-flex items-center gap-1 text-[#E30613] hover:underline">
                              <span>Abrir processo</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Indicadores de Paginação / Bolinhas Clicáveis */}
              {total > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  {processosEmAndamento.map((proc, idx) => {
                    const isCurr = idx === safeIndex;
                    return (
                      <button
                        key={proc.id}
                        onClick={() => {
                          setCarouselIndex(idx);
                        }}
                        className={`h-2 rounded-full transition-all duration-200 ${
                          isCurr
                            ? 'w-7 bg-[#E30613]'
                            : 'w-2 bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400'
                        }`}
                        aria-label={`Ir para processo ${idx + 1}: ${proc.numeroSolicitacao}`}
                        title={`${proc.numeroSolicitacao} - ${proc.mmv}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
