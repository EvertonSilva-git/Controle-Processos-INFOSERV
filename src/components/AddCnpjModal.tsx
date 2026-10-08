import React, { useState } from 'react';
import { CnpjOption, formatarCNPJ, limparCNPJ } from '../types/process';
import { X, Building2, Plus, Check, AlertCircle } from 'lucide-react';

interface AddCnpjModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newCnpj: CnpjOption) => void;
  existingCnpjs: CnpjOption[];
}

export const AddCnpjModal: React.FC<AddCnpjModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingCnpjs,
}) => {
  const [cnpjInput, setCnpjInput] = useState('');
  const [descricaoInput, setDescricaoInput] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  if (!isOpen) return null;

  const rawDigits = limparCNPJ(cnpjInput);
  const formattedPreview = formatarCNPJ(rawDigits);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const digitsOnly = value.replace(/\D/g, '').slice(0, 14);
    setCnpjInput(formatarCNPJ(digitsOnly));
    setErro(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = limparCNPJ(cnpjInput);

    if (clean.length !== 14) {
      setErro('O CNPJ deve conter exatamente 14 dígitos numéricos.');
      return;
    }

    // Check duplicate
    const exists = existingCnpjs.some((c) => c.raw === clean);
    if (exists) {
      setErro('Este CNPJ já está cadastrado no sistema.');
      return;
    }

    const newOption: CnpjOption = {
      raw: clean,
      formatted: formatarCNPJ(clean),
      label: clean,
      isCustom: true,
    };

    onSave(newOption);
    setCnpjInput('');
    setDescricaoInput('');
    setErro(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#E30613]/10 text-[#E30613]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Cadastrar Novo CNPJ
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Adicione um novo CNPJ da Shineray
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* CNPJ Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Número do CNPJ <span className="text-[#E30613]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={cnpjInput}
                onChange={handleInputChange}
                placeholder="00.000.000/0000-00"
                className="w-full px-3.5 py-2.5 text-sm font-mono border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-neutral-400">
                {rawDigits.length}/14
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Digite apenas os números ou cole com pontuação.
            </p>
          </div>

          {/* Optional Label */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Descrição / Observação (opcional)
            </label>
            <input
              type="text"
              value={descricaoInput}
              onChange={(e) => setDescricaoInput(e.target.value)}
              placeholder="Ex: Fabricante / Importador"
              className="w-full px-3.5 py-2 text-sm border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500"
            />
          </div>

          {/* Error display */}
          {erro && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {/* Live Preview Card */}
          {rawDigits.length > 0 && (
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60 space-y-1">
              <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">
                Pré-visualização do Cartão
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                    {rawDigits}
                  </div>
                  <div className="font-mono text-[11px] text-neutral-500">
                    {formattedPreview}
                  </div>
                </div>
                {descricaoInput.trim() && (
                  <div className="text-right">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-200/70 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                      {descricaoInput.trim()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={rawDigits.length !== 14}
              className="px-4 py-2 bg-[#E30613] hover:bg-[#c70510] disabled:opacity-50 disabled:hover:bg-[#E30613] text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar CNPJ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
