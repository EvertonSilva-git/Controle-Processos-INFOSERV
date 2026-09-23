import React, { useState } from 'react';
import { Processo } from '../types/process';
import { calcularDiasRestantes, formatarDataBR } from '../utils/processCalculations';
import { AlertTriangle, ChevronRight, X, Calendar, ShieldAlert, Clock, ArrowRight } from 'lucide-react';

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
    <div className="mb-6 rounded-2xl bg-gradient-to-r from-red-600 via-[#E30613] to-red-700 text-white shadow-lg shadow-red-500/20 border border-red-500 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300">
      {/* Top Banner Row */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div className="p-2.5 bg-white/15 backdrop-blur-sm text-white rounded-xl shadow-inner shrink-0 mt-0.5 sm:mt-0 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 animate-pulse text-amber-200" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="bg-white/20 text-white text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
                Alerta de Validade · IBAMA
              </span>
              <span className="font-mono text-xs font-bold text-amber-200 bg-black/20 px-2 py-0.5 rounded">
                {processosRevalidar.length} {processosRevalidar.length === 1 ? 'licença a revalidar' : 'licenças a revalidar'}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white leading-snug">
              Atenção: Existem licenças de homologação próximas do vencimento (≤ 61 dias)
            </h3>

            <p className="text-xs sm:text-sm text-red-100 mt-1 max-w-2xl leading-relaxed">
              {processosRevalidar.length === 1 ? (
                <>
                  O processo <strong className="font-mono text-white">{maisCritico.numeroSolicitacao}</strong> ({maisCritico.mmv}) possui validade até <strong>{formatarDataBR(maisCritico.dataValidade)}</strong> ({menorPrazo !== null ? (menorPrazo <= 0 ? 'vencida' : `${menorPrazo} dias restantes`) : ''}).
                </>
              ) : (
                <>
                  Há <strong>{processosRevalidar.length} processos</strong> com prazos críticos para renovação no Infoserv. A licença mais urgente ({maisCritico.mmv}) vence em{' '}
                  <span className="font-extrabold text-amber-200 underline decoration-amber-300 decoration-2">
                    {menorPrazo !== null ? (menorPrazo <= 0 ? 'prazo expirado' : `${menorPrazo} dias`) : 'breve'}
                  </span>.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end shrink-0 pt-2 sm:pt-0 border-t border-red-500/50 sm:border-t-0">
          {processosRevalidar.length > 1 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-1.5"
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
            className="px-4 py-2 text-xs font-extrabold bg-white hover:bg-neutral-100 text-[#E30613] rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-[0.98]"
          >
            <span>Abrir Painel de Revalidação</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-1"
            title="Dispensar aviso por enquanto"
            aria-label="Dispensar alerta"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded List of Critical Processes */}
      {isExpanded && processosRevalidar.length > 0 && (
        <div className="bg-black/25 border-t border-white/15 p-4 sm:p-5 animate-in slide-in-from-top-2 duration-200">
          <div className="text-[11px] font-bold text-red-200 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Processos que requerem renovação imediata junto ao IBAMA</span>
            <span className="font-mono text-white/80">Critério: Validade ≤ 61 dias</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {sorted.map((proc) => {
              const dias = calcularDiasRestantes(proc.dataValidade);
              const expirado = dias !== null && dias <= 0;

              return (
                <div
                  key={proc.id}
                  onClick={() => {
                    if (onSelecionarProcesso) onSelecionarProcesso(proc);
                  }}
                  className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 border border-white/10"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white bg-black/30 px-1.5 py-0.5 rounded">
                        {proc.numeroSolicitacao}
                      </span>
                      <span className="text-xs font-bold text-white truncate">
                        {proc.mmv}
                      </span>
                    </div>
                    <div className="text-[11px] text-red-200 flex items-center gap-2 mt-1">
                      <span>{proc.tipo}</span>
                      <span>·</span>
                      <span className="font-mono">{proc.numeroLicenca || 'Sem número'}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 font-mono text-xs font-extrabold text-amber-200 justify-end">
                      <Clock className="w-3 h-3" />
                      <span>{expirado ? 'EXPIRADA' : `${dias} dias`}</span>
                    </div>
                    <div className="text-[10px] text-red-200/90 mt-0.5">
                      Vence em {formatarDataBR(proc.dataValidade)}
                    </div>
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
