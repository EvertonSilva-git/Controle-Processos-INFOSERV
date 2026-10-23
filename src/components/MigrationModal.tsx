import React, { useState, useRef } from 'react';
import { Processo, CnpjOption } from '../types/process';
import {
  MigrationPackage,
  createMigrationPackage,
  downloadMigrationPackage,
  validateMigrationPackage,
} from '../utils/migrationData';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  Download,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  X,
  ArrowRight,
  Database,
  Layers,
  FileText,
  Building2,
  Clock,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Info,
} from 'lucide-react';

interface MigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  processos: Processo[];
  cnpjList: CnpjOption[];
  currentUser?: string | null;
  isVisitante?: boolean;
  onApplyMigration: (pkg: MigrationPackage, strategy: 'replace' | 'merge') => void;
}

export const MigrationModal: React.FC<MigrationModalProps> = ({
  isOpen,
  onClose,
  processos,
  cnpjList,
  currentUser,
  isVisitante = false,
  onApplyMigration,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [importStrategy, setImportStrategy] = useState<'replace' | 'merge'>('replace');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [parsedPackage, setParsedPackage] = useState<MigrationPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Monta pacote para visualização na aba de exportação
  const currentPackage = createMigrationPackage(processos, cnpjList, currentUser);

  const handleDownload = () => {
    downloadMigrationPackage(currentPackage);
    setSuccessMessage('Arquivo de migração gerado e baixado com sucesso!');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleCopyClipboard = async () => {
    try {
      const jsonStr = JSON.stringify(currentPackage, null, 2);
      await navigator.clipboard.writeText(jsonStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Falha ao copiar para o clipboard', e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setValidationError(null);
    setParsedPackage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = validateMigrationPackage(content);
      if (res.isValid && res.data) {
        setParsedPackage(res.data);
        setValidationError(null);
      } else {
        setValidationError(res.error || 'Arquivo inválido para migração.');
        setParsedPackage(null);
      }
    };
    reader.onerror = () => {
      setValidationError('Erro ao ler o arquivo selecionado.');
    };
    reader.readAsText(file);
  };

  const handleProcessPastedText = () => {
    if (!pastedJson.trim()) {
      setValidationError('Por favor, cole o código JSON da migração antes de validar.');
      return;
    }
    const res = validateMigrationPackage(pastedJson);
    if (res.isValid && res.data) {
      setParsedPackage(res.data);
      setUploadedFileName('JSON colado manualmente');
      setValidationError(null);
    } else {
      setValidationError(res.error || 'JSON inválido ou corrompido.');
      setParsedPackage(null);
    }
  };

  const handleConfirmImport = () => {
    if (isVisitante) {
      alert('Modo Visitante: você não possui permissão para sobrescrever ou importar dados.');
      return;
    }
    if (!parsedPackage) return;

    setIsProcessing(true);
    try {
      onApplyMigration(parsedPackage, importStrategy);
      setSuccessMessage(
        `Sucesso! ${parsedPackage.processos.length} processos foram importados com sucesso para esta instância.`
      );
      setTimeout(() => {
        setIsProcessing(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setIsProcessing(false);
      setValidationError(`Falha ao aplicar migração: ${err?.message || 'erro interno'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/70 backdrop-blur-sm animate-in fade-in-0 duration-150">
      <div
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="migration-modal-title"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-850/80 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 text-[#E30613] border border-red-200/60 dark:border-red-900/50 shrink-0">
              <Cloud className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2
                id="migration-modal-title"
                className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2"
              >
                Migração entre Nuvens & Backup
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                Transfira todos os processos de uma versão do app para outra nuvem sem precisar registrar tudo de novo.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="px-4 sm:px-6 pt-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('export');
              setValidationError(null);
            }}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'border-[#E30613] text-[#E30613]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <CloudDownload className="w-4 h-4" />
            <span>1. Exportar para Outra Nuvem</span>
            <span className="text-xs px-1.5 py-0.2 rounded-md bg-neutral-100 dark:bg-neutral-800 font-mono text-neutral-700 dark:text-neutral-300">
              {processos.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('import');
              setValidationError(null);
            }}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'border-[#E30613] text-[#E30613]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <CloudUpload className="w-4 h-4" />
            <span>2. Importar de Outra Nuvem</span>
            {parsedPackage && (
              <span className="text-xs px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950/70 font-mono text-emerald-800 dark:text-emerald-300 font-bold">
                +{parsedPackage.processos.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-2.5 animate-in fade-in-0 duration-150">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: EXPORTAR */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              {/* How it works guidance */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200/80 dark:border-neutral-800 space-y-3">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  <Info className="w-4 h-4 text-[#E30613]" />
                  <span>Como migrar seus processos para outra nuvem?</span>
                </div>
                <ol className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    Clique no botão <strong className="text-neutral-900 dark:text-white">"Baixar Pacote de Migração (.json)"</strong> abaixo para salvar a base completa de dados no seu dispositivo.
                  </li>
                  <li>
                    Abra a nova versão do sistema na outra nuvem (AWS, Google Cloud, Vercel ou servidor local).
                  </li>
                  <li>
                    Acesse o botão <strong className="text-neutral-900 dark:text-white">"Migração"</strong> na outra nuvem, clique em <strong className="text-neutral-900 dark:text-white">"Importar de Outra Nuvem"</strong> e selecione o arquivo baixado.
                  </li>
                  <li>
                    Todos os processos, extensões, anotações e CNPJs serão instantaneamente restaurados sem perda de nenhum dado!
                  </li>
                </ol>
              </div>

              {/* Data Summary Grid */}
              <div>
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2.5">
                  Conteúdo do Pacote de Migração Atual
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 rounded-xl">
                    <div className="text-xs text-neutral-500 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Total Processos</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-neutral-900 dark:text-white mt-1">
                      {currentPackage.stats.totalProcessos}
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl">
                    <div className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Licenças Emitidas</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-800 dark:text-emerald-300 mt-1">
                      {currentPackage.stats.totalLicencasEmitidas}
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 rounded-xl">
                    <div className="text-xs text-neutral-500 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Anotações / Obs</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-neutral-900 dark:text-white mt-1">
                      {currentPackage.stats.totalObservacoes}
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 rounded-xl">
                    <div className="text-xs text-neutral-500 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                      <span>CNPJs Registrados</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-neutral-900 dark:text-white mt-1">
                      {currentPackage.stats.totalCnpjs}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#E30613] hover:bg-[#c70510] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Baixar Pacote de Migração (.json)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyClipboard}
                  className="py-3 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 dark:text-emerald-400">Copiado para Área de Transferência!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-neutral-500" />
                      <span>Copiar JSON</span>
                    </>
                  )}
                </button>
              </div>

              {/* Technical Footnote */}
              <div className="p-3 bg-neutral-100/70 dark:bg-neutral-800/50 rounded-lg text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Formato Padronizado v1.0 com compatibilidade universal entre clouds.</span>
                </div>
                <span className="font-mono text-[11px] text-neutral-400">
                  {new Date().toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: IMPORTAR */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              {isVisitante && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-xs sm:text-sm flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold">Acesso Somente Leitura:</span> Você está logado no modo Visitante. Para carregar dados de outra nuvem, faça login com a conta de analista técnico (Luca Andrade ou Everton Silva).
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {validationError && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold">Aviso na validação do arquivo:</span>
                    <p className="mt-0.5 leading-relaxed">{validationError}</p>
                  </div>
                </div>
              )}

              {/* File Dropzone Area */}
              {!parsedPackage ? (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-[#E30613] dark:hover:border-[#E30613] rounded-2xl p-6 sm:p-8 text-center bg-neutral-50/50 dark:bg-neutral-850/50 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="p-3.5 rounded-full bg-red-50 dark:bg-red-950/50 text-[#E30613] group-hover:scale-105 transition-transform">
                      <FileJson className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                        Selecione ou arraste o arquivo <span className="font-mono text-[#E30613]">.json</span> exportado da outra nuvem
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        Arquivos gerados pelo sistema com extensão .json (ou backups legados)
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-750 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-200 shadow-2xs group-hover:border-[#E30613]">
                      <CloudUpload className="w-3.5 h-3.5 text-[#E30613]" />
                      Procurar arquivo no computador
                    </span>
                  </div>

                  {/* Manual Paste Alternative */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowPasteBox(!showPasteBox)}
                      className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>{showPasteBox ? '▼ Ocultar opção de colar texto' : '► Ou colar código JSON diretamente'}</span>
                    </button>

                    {showPasteBox && (
                      <div className="mt-2.5 space-y-2.5">
                        <textarea
                          value={pastedJson}
                          onChange={(e) => setPastedJson(e.target.value)}
                          placeholder="Cole aqui o conteúdo JSON copiado da outra nuvem..."
                          rows={4}
                          className="w-full p-3 font-mono text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E30613]/30"
                        />
                        <button
                          type="button"
                          onClick={handleProcessPastedText}
                          className="px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Processar JSON Colado
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Package Validated - Review & Strategy Selection */
                <div className="space-y-5 animate-in fade-in-0 duration-150">
                  <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                          Arquivo Validado com Sucesso!
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setParsedPackage(null);
                          setUploadedFileName(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 underline cursor-pointer"
                      >
                        Trocar arquivo
                      </button>
                    </div>

                    <div className="text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                      <div>
                        <strong>Arquivo:</strong> {uploadedFileName || 'Pacote de Migração'}
                      </div>
                      <div>
                        <strong>Origem:</strong> {parsedPackage.environmentOrigin} •{' '}
                        <strong>Exportado por:</strong> {parsedPackage.exportedBy} •{' '}
                        <strong>Data:</strong> {new Date(parsedPackage.exportedAt).toLocaleString('pt-BR')}
                      </div>
                    </div>

                    {/* Preview counts */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/80 dark:border-emerald-800/60 text-xs">
                      <div>
                        <span className="text-neutral-500 dark:text-neutral-400">Processos:</span>{' '}
                        <strong className="font-mono text-sm text-neutral-900 dark:text-white">
                          {parsedPackage.stats.totalProcessos}
                        </strong>
                      </div>
                      <div>
                        <span className="text-neutral-500 dark:text-neutral-400">Licenças:</span>{' '}
                        <strong className="font-mono text-sm text-neutral-900 dark:text-white">
                          {parsedPackage.stats.totalLicencasEmitidas}
                        </strong>
                      </div>
                      <div>
                        <span className="text-neutral-500 dark:text-neutral-400">Extensões:</span>{' '}
                        <strong className="font-mono text-sm text-neutral-900 dark:text-white">
                          {parsedPackage.stats.totalExtensoes}
                        </strong>
                      </div>
                      <div>
                        <span className="text-neutral-500 dark:text-neutral-400">CNPJs:</span>{' '}
                        <strong className="font-mono text-sm text-neutral-900 dark:text-white">
                          {parsedPackage.cnpjs.length}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Strategy selection */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block">
                      Como deseja aplicar estes processos na base local?
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Replace */}
                      <label
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          importStrategy === 'replace'
                            ? 'border-[#E30613] bg-red-50/40 dark:bg-red-950/30'
                            : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-850 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="radio"
                            name="strategy"
                            value="replace"
                            checked={importStrategy === 'replace'}
                            onChange={() => setImportStrategy('replace')}
                            className="mt-1 text-[#E30613] focus:ring-[#E30613]"
                          />
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                              Substituir Base Completa (Recomendado)
                            </div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                              Ideal para quando a nova nuvem ainda está vazia ou com dados de teste. Garante que fique 100% idêntica à nuvem de origem.
                            </div>
                          </div>
                        </div>
                      </label>

                      {/* Merge */}
                      <label
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          importStrategy === 'merge'
                            ? 'border-[#E30613] bg-red-50/40 dark:bg-red-950/30'
                            : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-850 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="radio"
                            name="strategy"
                            value="merge"
                            checked={importStrategy === 'merge'}
                            onChange={() => setImportStrategy('merge')}
                            className="mt-1 text-[#E30613] focus:ring-[#E30613]"
                          />
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                              Mesclar com Processos Locais
                            </div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                              Preserva processos já existentes e adiciona os novos ou atualiza os que tiverem o mesmo número/ID.
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setParsedPackage(null)}
                      className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      disabled={isVisitante || isProcessing}
                      onClick={handleConfirmImport}
                      className={`px-5 py-2.5 rounded-xl text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                        isVisitante || isProcessing
                          ? 'bg-neutral-400 cursor-not-allowed opacity-60'
                          : 'bg-[#E30613] hover:bg-[#c70510]'
                      }`}
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Aplicando Migração...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            Confirmar e Carregar {parsedPackage.processos.length} Processos
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-neutral-400" />
            <span>Sincronização entre instâncias Shineray do Infoserv</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hover:underline text-neutral-700 dark:text-neutral-300 font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
