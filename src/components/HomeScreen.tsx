import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Processo, ProcessoTipo, ProcessosSubTab } from '../types/process';
import {
  calcularDiasRestantes,
  calcularDiasSolicitacaoAteEmissao,
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
  FileText,
  ShieldCheck,
  Calendar,
  Sparkles,
  ExternalLink,
  Edit3,
  Play,
  Pause,
  AlertCircle,
  Timer,
} from 'lucide-react';
import { RevalidationAlertBanner } from './RevalidationAlertBanner';
import { InProgressCarousel } from './InProgressCarousel';

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

  // Para correção: apontamentos pelo órgão
  const paraCorrecaoProcessos = useMemo(
    () => processos.filter((p) => p.situacao === 'Para correção'),
    [processos]
  );

  // Status Cards
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
        id: 'correcao',
        titulo: 'Para correção',
        subtitulo: 'Ajuste solicitado pelo órgão regulador',
        count: paraCorrecaoProcessos.length,
        icon: AlertCircle,
        tag: 'Correção',
        subTab: 'para_correcao' as ProcessosSubTab,
        description: 'Processos com apontamentos técnicos ou correções pendentes',
        items: paraCorrecaoProcessos,
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
    [totalProcessos, emAndamentoProcessos, paraCorrecaoProcessos, emitidasProcessos, revalidacaoProcessos, processos]
  );

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
      {revalidacaoProcessos.length > 0 && (
        <RevalidationAlertBanner
          processosRevalidar={revalidacaoProcessos}
          onVerProcessosRevalidacao={() => onNavigateToProcessos('para_revalidacao')}
          onSelecionarProcesso={onSelectProcesso}
        />
      )}

      {/* SECTION 1: Top Status Cards (Executive KPIs) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
              Visão Geral de Status
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Indicadores consolidados das homologações no Infoserv
            </p>
          </div>

          <button
            onClick={() => onNavigateToProcessos('comparacao_prazos')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-neutral-800 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 transition-all shadow-xs hover:shadow-sm cursor-pointer self-start sm:self-center"
          >
            <div className="w-2 h-2 rounded-full bg-[#E30613]" />
            <Timer className="w-3.5 h-3.5 text-[#E30613]" />
            <span>Médias e Prazos (Envio → Emissão)</span>
            <ArrowRight className="w-3 h-3 text-neutral-400" />
          </button>
        </div>

        {/* 5 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {topCards.map((card) => {
            const IconComp = card.icon;
            const isRevalidacaoUrgent = card.id === 'revalidacao' && card.count > 0;

            return (
              <div
                key={card.id}
                onClick={() => onNavigateToProcessos(card.subTab)}
                className={`cursor-pointer rounded-xl p-4 sm:p-4.5 border text-left relative flex flex-col justify-between select-none shadow-xs hover:shadow-md transition-all ${
                  isRevalidacaoUrgent
                    ? 'revalidacao-pulse-amber'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200/90 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[11px] font-bold ${
                        isRevalidacaoUrgent
                          ? 'text-amber-950 dark:text-amber-100 bg-amber-300/80 dark:bg-amber-800/80 px-2 py-0.5 rounded-md inline-flex items-center gap-1 shadow-2xs'
                          : 'text-neutral-500 dark:text-neutral-400 font-semibold'
                      }`}
                    >
                      {card.tag}
                    </span>
                    <IconComp
                      className={`w-4 h-4 ${
                        isRevalidacaoUrgent
                          ? 'text-amber-950 dark:text-amber-200'
                          : 'text-neutral-400'
                      }`}
                    />
                  </div>

                  <h3
                    className={`text-sm mb-1 ${
                      isRevalidacaoUrgent
                        ? 'font-bold text-amber-950 dark:text-amber-50'
                        : 'font-semibold text-neutral-800 dark:text-neutral-200'
                    }`}
                  >
                    {card.titulo}
                  </h3>
                  <div
                    className={`text-2xl sm:text-3xl font-mono tabular-nums mb-1.5 ${
                      isRevalidacaoUrgent
                        ? 'font-black text-amber-950 dark:text-amber-50 drop-shadow-2xs'
                        : 'font-bold text-neutral-900 dark:text-white'
                    }`}
                  >
                    {card.count}
                  </div>
                </div>

                <div>
                  <p
                    className={`text-xs line-clamp-1 ${
                      isRevalidacaoUrgent
                        ? 'text-amber-950 dark:text-amber-200 font-semibold'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {card.subtitulo}
                  </p>
                  <div
                    className={`mt-3 pt-2 border-t flex items-center justify-between text-xs font-semibold transition-colors ${
                      isRevalidacaoUrgent
                        ? 'border-amber-400/80 dark:border-amber-700/80 text-amber-950 dark:text-amber-100 hover:text-amber-800 dark:hover:text-amber-200'
                        : 'border-neutral-100 dark:border-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:text-[#E30613]'
                    }`}
                  >
                    <span>Ver processos</span>
                    <ArrowRight
                      className={`w-3.5 h-3.5 ${
                        isRevalidacaoUrgent
                          ? 'text-amber-950 dark:text-amber-200'
                          : 'text-neutral-400 group-hover:text-[#E30613]'
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CARROSSEL DE PROCESSOS EM ANDAMENTO COM CARTÃO FIXO */}
        <InProgressCarousel
          processosEmAndamento={emAndamentoProcessos}
          onNavigateToProcessos={onNavigateToProcessos}
          onNavigateToCadastro={onNavigateToCadastro}
          onSelectProcesso={onSelectProcesso}
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
                className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between group ${
                  revalidacaoProcessos.length > 0
                    ? 'revalidacao-pulse-amber border-amber-400/90 text-amber-950 dark:text-amber-100 shadow-2xs hover:brightness-105'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-md ${
                      revalidacaoProcessos.length > 0
                        ? 'bg-amber-300/80 dark:bg-amber-900/80 text-amber-950 dark:text-amber-200'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div
                      className={`text-xs font-bold ${
                        revalidacaoProcessos.length > 0
                          ? 'text-amber-950 dark:text-white'
                          : 'text-neutral-900 dark:text-white font-semibold'
                      }`}
                    >
                      Licenças para Revalidação
                    </div>
                    <div
                      className={`text-[11px] ${
                        revalidacaoProcessos.length > 0
                          ? 'text-amber-900 dark:text-amber-200 font-medium'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {revalidacaoProcessos.length} pendência(s) de renovação
                    </div>
                  </div>
                </div>
                <ArrowRight
                  className={`w-4 h-4 transition-colors ${
                    revalidacaoProcessos.length > 0
                      ? 'text-amber-950 dark:text-amber-200'
                      : 'text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white'
                  }`}
                />
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
