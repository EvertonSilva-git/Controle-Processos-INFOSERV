import React, { useState } from 'react';
import { Processo, CnpjOption, DEFAULT_CNPJ_OPTIONS } from '../types/process';
import { Building2, Layers, Check, Plus, Trash2 } from 'lucide-react';
import { AddCnpjModal } from './AddCnpjModal';

interface CnpjFilterCardsProps {
  processos: Processo[];
  selectedCnpj: string | null;
  onSelectCnpj: (cnpj: string | null) => void;
  cnpjs?: CnpjOption[];
  onAddCnpj?: (newCnpj: CnpjOption) => void;
  onDeleteCnpj?: (rawCnpj: string) => void;
}

export const CnpjFilterCards: React.FC<CnpjFilterCardsProps> = ({
  processos,
  selectedCnpj,
  onSelectCnpj,
  cnpjs = DEFAULT_CNPJ_OPTIONS,
  onAddCnpj,
  onDeleteCnpj,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Normalize comparison helper
  const getCnpjCount = (rawCnpj: string) => {
    const cleanTarget = rawCnpj.replace(/\D/g, '');
    return processos.filter((p) => {
      const pClean = (p.cnpj || '').replace(/\D/g, '');
      return pClean === cleanTarget;
    }).length;
  };

  const totalCount = processos.length;

  const handleSaveNewCnpj = (newCnpj: CnpjOption) => {
    if (onAddCnpj) {
      onAddCnpj(newCnpj);
    }
    // Automatically select the new CNPJ
    onSelectCnpj(newCnpj.raw);
  };

  return (
    <div className="space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
            <Building2 className="w-3.5 h-3.5 text-[#E30613]" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
              Filtro por CNPJ da Empresa
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Selecione o CNPJ para filtrar a listagem de processos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onAddCnpj && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-colors border border-neutral-200/80 dark:border-neutral-700"
            >
              <Plus className="w-3.5 h-3.5 text-[#E30613]" />
              <span>Novo CNPJ</span>
            </button>
          )}

          {selectedCnpj && (
            <button
              type="button"
              onClick={() => onSelectCnpj(null)}
              className="text-xs text-[#E30613] hover:underline font-medium flex items-center gap-1"
            >
              <span>Ver todos os CNPJs</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Card: Todos */}
        <button
          type="button"
          onClick={() => onSelectCnpj(null)}
          className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between group ${
            selectedCnpj === null
              ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 border-neutral-900 dark:border-neutral-100 shadow-sm'
              : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border-neutral-200/90 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-neutral-850'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <Layers className={`w-3.5 h-3.5 ${selectedCnpj === null ? 'text-[#E30613]' : 'text-neutral-400'}`} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Todos os CNPJs
              </span>
            </div>
            <span
              className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                selectedCnpj === null
                  ? 'bg-neutral-800 text-neutral-100 dark:bg-neutral-200 dark:text-neutral-900'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {totalCount}
            </span>
          </div>

          <div className={`text-[11px] font-mono ${selectedCnpj === null ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-500 dark:text-neutral-400'}`}>
            Todos os processos
          </div>

          <div className="mt-2 pt-2 border-t border-current/10 flex items-center justify-between text-[10px]">
            <span className={selectedCnpj === null ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-400'}>
              Visão consolidada
            </span>
            {selectedCnpj === null && (
              <span className="inline-flex items-center gap-0.5 text-[#E30613] font-semibold text-[10px]">
                <Check className="w-3 h-3" /> Ativo
              </span>
            )}
          </div>
        </button>

        {/* Individual CNPJ Cards */}
        {cnpjs.map((opt) => {
          const isSelected = selectedCnpj === opt.raw;
          const count = getCnpjCount(opt.raw);

          return (
            <div
              key={opt.raw}
              onClick={() => onSelectCnpj(isSelected ? null : opt.raw)}
              className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between group cursor-pointer ${
                isSelected
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 border-neutral-900 dark:border-neutral-100 shadow-sm ring-1 ring-neutral-900 dark:ring-white'
                  : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border-neutral-200/90 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-neutral-850'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Building2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#E30613]' : 'text-neutral-400'}`} />
                  <span className="font-mono text-xs font-bold tracking-tight truncate">
                    {opt.raw}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {opt.isCustom && onDeleteCnpj && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Remover CNPJ ${opt.formatted}?`)) {
                          onDeleteCnpj(opt.raw);
                          if (selectedCnpj === opt.raw) {
                            onSelectCnpj(null);
                          }
                        }
                      }}
                      className="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Excluir este CNPJ customizado"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md shrink-0 tabular-nums ${
                      isSelected
                        ? 'bg-neutral-800 text-neutral-100 dark:bg-neutral-200 dark:text-neutral-900'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {count}
                  </span>
                </div>
              </div>

              <div>
                <div className={`font-mono text-xs font-semibold ${isSelected ? 'text-neutral-200 dark:text-neutral-800' : 'text-neutral-600 dark:text-neutral-300'}`}>
                  {opt.formatted}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-current/10 flex items-center justify-between text-[10px]">
                <span className={isSelected ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-400'}>
                  {count === 1 ? '1 processo' : `${count} processos`}
                </span>
                {isSelected && (
                  <span className="inline-flex items-center gap-0.5 text-[#E30613] font-semibold text-[10px]">
                    <Check className="w-3 h-3" /> Filtrado
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Quick Add Card at the end of the grid */}
        {onAddCnpj && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="p-3.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all flex flex-col items-center justify-center gap-1.5 min-h-[96px] group"
          >
            <div className="p-1.5 rounded-full bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 group-hover:border-[#E30613] text-neutral-400 group-hover:text-[#E30613] transition-colors">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold">Adicionar Outro CNPJ</span>
            <span className="text-[10px] text-neutral-400">Cadastrar novo CNPJ</span>
          </button>
        )}
      </div>

      {/* Add CNPJ Modal */}
      <AddCnpjModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveNewCnpj}
        existingCnpjs={cnpjs}
      />
    </div>
  );
};
