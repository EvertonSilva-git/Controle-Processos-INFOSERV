import React, { useState } from 'react';
import { Processo, Observacao } from '../types/process';
import { formatarDataHoraBR } from '../utils/processCalculations';
import { MessageSquare, Send, X, Clock, User, Trash2 } from 'lucide-react';

interface ObservationModalProps {
  processo: Processo | null;
  isOpen: boolean;
  onClose: () => void;
  onAddObservacao: (processoId: string, texto: string) => void;
  onDeleteObservacao?: (processoId: string, observacaoId: string) => void;
}

export const ObservationModal: React.FC<ObservationModalProps> = ({
  processo,
  isOpen,
  onClose,
  onAddObservacao,
  onDeleteObservacao,
}) => {
  const [novoTexto, setNovoTexto] = useState('');

  if (!isOpen || !processo) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTexto.trim()) return;
    onAddObservacao(processo.id, novoTexto.trim());
    setNovoTexto('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-xl w-full shadow-xl border border-neutral-200/90 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-4.5 border-b border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                Histórico de Observações
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <span className="font-mono text-neutral-700 dark:text-neutral-300">{processo.numeroSolicitacao}</span>
                <span className="text-neutral-300 dark:text-neutral-700">·</span>
                <span>{processo.mmv}</span>
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Observation Input Form */}
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Nova Anotação ou Despacho
            </label>
            <div>
              <textarea
                rows={3}
                value={novoTexto}
                onChange={(e) => setNovoTexto(e.target.value)}
                placeholder="Descreva pendências técnicas, pagamento de taxa GRU, despachos com IBAMA ou ATC..."
                className="w-full p-2.5 text-xs sm:text-sm border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500 placeholder:text-neutral-400"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">
                Registrado com carimbo de data e hora.
              </span>
              <button
                type="submit"
                disabled={!novoTexto.trim()}
                className="px-3.5 py-1.5 bg-[#E30613] hover:bg-[#c70510] disabled:opacity-40 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Salvar Nota</span>
              </button>
            </div>
          </form>
        </div>

        {/* Timeline of Observations */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
            <span>Registros ({processo.observacoes?.length || 0})</span>
            <span className="text-[10px] font-normal text-neutral-400">Mais recentes primeiro</span>
          </div>

          {!processo.observacoes || processo.observacoes.length === 0 ? (
            <div className="py-8 text-center text-neutral-400 text-xs">
              Nenhuma anotação registrada ainda para este processo.
            </div>
          ) : (
            <div className="space-y-2.5">
              {[...processo.observacoes].reverse().map((obs) => (
                <div
                  key={obs.id}
                  className="p-3 rounded-lg border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 hover:bg-neutral-50 dark:hover:bg-neutral-800/70 transition-colors relative group"
                >
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                    <div className="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
                      <User className="w-3 h-3 text-neutral-400" />
                      <span>{obs.autor || 'Analista Shineray'}</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[10px]">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      <span>{formatarDataHoraBR(obs.dataHora)}</span>
                      {onDeleteObservacao && (
                        <button
                          type="button"
                          onClick={() => onDeleteObservacao(processo.id, obs.id)}
                          className="ml-2 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-rose-600 transition-opacity"
                          title="Remover anotação"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
                    {obs.texto}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
