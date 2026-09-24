import React, { useState } from 'react';
import { Processo } from '../types/process';
import { calcularDiasRestantes, formatarDataBR } from '../utils/processCalculations';
import { AlertCircle, ChevronRight, X, ArrowRight, Clock } from 'lucide-react';

interface RevalidationAlertBannerProps {
  processosRevalidar: Processo[];
  onVerProcessosRevalidacao: () => void;
  onSelecionarProcesso?: (processo: Processo) => void;
}

export const RevalidationAlertBanner: React.FC<RevalidationAlertBannerProps> = ({
  processosRevalidar,
  onVerProcessosRevalidacao,
  onSelecionarProcesso,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (processosRevalidar.length === 0 || isDismissed) {
    return null;
  }

  // Find the most critical one (fewest days remaining)
  const sorted = [...processosRevalidar].sort((a, b) => {
    const dA = calcularDiasRestantes(a.dataValidade) ?? 999;
    const dB = calcularDiasRestantes(b.dataValidade) ?? 999;
    return dA - dB;
  });

  const maisCritico = sorted[0];
  const menorPrazo = calcularDiasRestantes(maisCritico.dataValidade);

  return (
    <div className="mb-6 rounded-xl bg-amber-50/90 dark:bg-amber-950/25 border border-amber-200/90 dark:border-amber-800/40 text-neutral-800 dark:text-neutral-200 shadow-sm overflow-hidden transition-all">
      {/* Top Banner Row */}
      <div className="p-4 sm:p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-lg shrink-0 mt-0.5 sm:mt-0 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                Lembrete de Validade
              </span>
              <span className="text-neutral-400">·</span>
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                {processosRevalidar.length} {processosRevalidar.length === 1 ? 'licença para revalidação' : 'licenças para revalidação'}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-white leading-snug">
              Licenças de homologação próximas do vencimento (≤ 61 dias)
            </h3>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 max-w-2xl leading-relaxed">
              {processosRevalidar.length === 1 ? (
                <>
                  O processo <strong className="font-mono text-neutral-900 dark:text-white">{maisCritico.numeroSolicitacao}</strong> ({maisCritico.mmv}) tem validade até <strong>{formatarDataBR(maisCritico.dataValidade)}</strong> {menorPrazo !== null ? `(${menorPrazo <= 0 ? 'vencida' : `${menorPrazo} dias restantes`})` : ''}.
                </>
              ) : (
                <>
                  Existem {processosRevalidar.length} processos que necessitam de renovação no Infoserv. A mais urgente ({maisCritico.mmv}) vence em{' '}
                  <span className="font-semibold text-amber-800 dark:text-amber-300">
                    {menorPrazo !== null ? (menorPrazo <= 0 ? 'prazo expirado' : `${menorPrazo} dias`) : 'breve'}
                  </span>.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end shrink-0 pt-2 sm:pt-0 border-t border-amber-200/60 dark:border-amber-800/40 sm:border-t-0">
          {processosRevalidar.length > 1 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>{isExpanded ? 'Recolher' : `Ver lista (${processosRevalidar.length})`}</span>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              />
            </button>
          )}

          <button
            type="button"
            onClick={onVerProcessosRevalidacao}
            className="px-3.5 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>Filtrar na tabela</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg transition-colors ml-1"
            title="Dispensar aviso por agora"
            aria-label="Dispensar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded list view */}
      {isExpanded && (
        <div className="border-t border-amber-200/70 dark:border-amber-800/40 bg-white/60 dark:bg-neutral-900/60 p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {sorted.map((proc) => {
              const dias = calcularDiasRestantes(proc.dataValidade);
              const ehCritico = dias !== null && dias <= 30;

              return (
                <div
                  key={proc.id}
                  onClick={() => onSelecionarProcesso && onSelecionarProcesso(proc)}
                  className="p-2.5 rounded-lg bg-white dark:bg-neutral-800/90 border border-neutral-200/80 dark:border-neutral-700 hover:border-amber-300 dark:hover:border-amber-700 transition-colors cursor-pointer text-left shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                      {proc.numeroSolicitacao}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        ehCritico
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {dias !== null ? (dias <= 0 ? 'Vencida' : `${dias} dias`) : 'Sem data'}
                    </span>
                  </div>

                  <div className="font-semibold text-xs text-neutral-900 dark:text-white truncate">
                    {proc.mmv}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                    <span>{proc.tipo}</span>
                    <span>Vence em {formatarDataBR(proc.dataValidade)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
