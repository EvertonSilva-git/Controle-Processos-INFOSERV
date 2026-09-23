import React from 'react';
import { Processo } from '../types/process';
import { ProcessFormScreen } from './ProcessFormScreen';
import { X } from 'lucide-react';

interface EditProcessModalProps {
  processo: Processo | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (processo: Processo) => void;
}

export const EditProcessModal: React.FC<EditProcessModalProps> = ({
  processo,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !processo) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/70 backdrop-blur-sm flex items-start justify-center p-4 sm:py-8">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-4xl w-full shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 my-auto">
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
            <span>Edição de Processo</span>
            <span>·</span>
            <span className="font-mono text-[#E30613] font-bold">{processo.numeroSolicitacao}</span>
            <span>·</span>
            <span className="text-neutral-700 dark:text-neutral-300 font-semibold">{processo.mmv}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 max-h-[82vh] overflow-y-auto">
          <ProcessFormScreen
            initialData={processo}
            onSave={(updated) => {
              onSave(updated);
              onClose();
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};
