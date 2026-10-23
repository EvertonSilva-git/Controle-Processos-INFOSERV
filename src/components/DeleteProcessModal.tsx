import React from 'react';
import { Processo, formatarCNPJ } from '../types/process';
import { AlertTriangle, Trash2, X, GitBranch } from 'lucide-react';

interface DeleteProcessModalProps {
  isOpen: boolean;
  processo: Processo | null;
  onClose: () => void;
  onConfirm: () => void;
  linkedExtensionsCount?: number;
}

export const DeleteProcessModal: React.FC<DeleteProcessModalProps> = ({
  isOpen,
  processo,
  onClose,
  onConfirm,
  linkedExtensionsCount = 0,
}) => {
  if (!isOpen || !processo) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full shadow-2xl border border-rose-200 dark:border-rose-900/60 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800 bg-rose-50/60 dark:bg-rose-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
              <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h2 id="delete-modal-title" className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                Excluir Processo
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Esta ação removerá o processo permanentemente.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
            Você tem certeza que deseja excluir o processo abaixo da base de dados da Shineray?
          </p>

          {/* Process details card */}
          <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-bold text-[#E30613]">
                {processo.numeroSolicitacao}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium">
                {processo.tipo}
              </span>
            </div>

            <div className="text-xs font-semibold text-neutral-900 dark:text-white">
              {processo.mmv}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
              {processo.cnpj && (
                <span>CNPJ: {formatarCNPJ(processo.cnpj)}</span>
              )}
              {processo.numeroLicenca && (
                <>
                  <span>·</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    Licença: {processo.numeroLicenca}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Warning if process has linked extensions */}
          {linkedExtensionsCount > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-2.5 text-xs">
              <GitBranch className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">
                  Atenção: Processo Matriz com {linkedExtensionsCount} Extensão(ões)
                </strong>
                <span>
                  Existem {linkedExtensionsCount} extensão(ões) filhas originadas deste processo.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Sim, Excluir Processo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
