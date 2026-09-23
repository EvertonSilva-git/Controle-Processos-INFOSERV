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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-xl w-full shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-850 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#E30613] text-white rounded-xl shadow-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                Histórico de Observações
              </div>
              <h3 className="text-base font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                <span className="font-mono text-[#E30613]">{processo.numeroSolicitacao}</span>
                <span className="text-neutral-300 dark:text-neutral-700">·</span>
                <span>{processo.mmv}</span>
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Observation Input Form */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
              Nova Observação para o Registro
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={novoTexto}
                onChange={(e) => setNovoTexto(e.target.value)}
                placeholder="Descreva despachos, pendências técnicas, pagamento de GRU, reuniões com IBAMA ou ATC..."
                className="w-full p-3 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#E30613] focus:border-transparent placeholder:text-neutral-400"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Será salvo com data e hora automática no histórico oficial.
              </span>
              <button
                type="submit"
                disabled={!novoTexto.trim()}
                className="px-4 py-2 bg-[#E30613] hover:bg-[#C40510] disabled:opacity-40 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Registrar Envio</span>
              </button>
            </div>
          </form>
        </div>

        {/* Timeline of Observations */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide flex items-center justify-between">
            <span>Linha do Tempo de Registros ({processo.observacoes?.length || 0})</span>
            <span className="text-[11px] font-normal text-neutral-400 dark:text-neutral-500">Mais recentes primeiro</span>
          </div>

          {!processo.observacoes || processo.observacoes.length === 0 ? (
            <div className="py-10 text-center text-neutral-400 dark:text-neutral-500 text-xs">
              Nenhuma anotação registrada ainda para este processo.
              <br />
              Utilize o campo acima para adicionar o primeiro despacho.
            </div>
          ) : (
            <div className="space-y-3">
              {[...processo.observacoes].reverse().map((obs) => (
                <div
                  key={obs.id}
                  className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 transition-colors relative group"
                >
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mb-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-neutral-700 dark:text-neutral-300">
                      <User className="w-3 h-3 text-[#E30613]" />
                      <span>{obs.autor || 'Analista Shineray'}</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-neutral-400 dark:text-neutral-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatarDataHoraBR(obs.dataHora)}</span>
                      {onDeleteObservacao && (
                        <button
                          type="button"
                          onClick={() => onDeleteObservacao(processo.id, obs.id)}
                          className="ml-2 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-600 transition-opacity"
                          title="Remover anotação"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
};
