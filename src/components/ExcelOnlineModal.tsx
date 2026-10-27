import React, { useState, useEffect } from 'react';
import { Processo } from '../types/process';
import { ExcelOnlineConfig, ExcelOnlineSyncResult } from '../types/excelOnline';
import {
  FileSpreadsheet,
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  X,
  Link as LinkIcon,
  Zap,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Info,
} from 'lucide-react';

interface ExcelOnlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  processos: Processo[];
  onTriggerSync?: () => Promise<ExcelOnlineSyncResult | null>;
  isVisitante?: boolean;
}

export const ExcelOnlineModal: React.FC<ExcelOnlineModalProps> = ({
  isOpen,
  onClose,
  processos,
  onTriggerSync,
  isVisitante = false,
}) => {
  const [config, setConfig] = useState<ExcelOnlineConfig>({
    url: '',
    enabled: false,
    autoSync: true,
    lastSync: null,
    lastStatus: 'idle',
    lastMessage: 'Aguardando inserção do link no puxador',
    lastCount: 0,
  });

  const [inputUrl, setInputUrl] = useState('');
  const [autoSyncToggle, setAutoSyncToggle] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedFeed, setCopiedFeed] = useState<'csv' | 'json' | null>(null);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const feedCsvUrl = `${originUrl}/api/excel-online/feed.csv`;
  const feedJsonUrl = `${originUrl}/api/excel-online/feed.json`;

  // Carrega configuração salva
  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/excel-online/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setInputUrl(data.url || '');
        setAutoSyncToggle(data.autoSync ?? true);
      }
    } catch (err) {
      console.error('Erro ao carregar config do Excel Online:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadConfig();
      setFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAndSync = async () => {
    if (isVisitante) {
      setFeedback({
        type: 'error',
        message: 'Modo Visitante: alteração de integrações é restrita a analistas.',
      });
      return;
    }

    const trimmedUrl = inputUrl.trim();
    if (!trimmedUrl) {
      setFeedback({
        type: 'error',
        message: 'Por favor, insira o link da planilha no puxador.',
      });
      return;
    }

    try {
      setIsSaving(true);
      setFeedback(null);

      // Salva configuração
      const saveRes = await fetch('/api/excel-online/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: trimmedUrl,
          enabled: true,
          autoSync: autoSyncToggle,
        }),
      });

      if (!saveRes.ok) {
        throw new Error('Falha ao salvar configuração');
      }

      // Executa sincronização imediata
      const syncRes = await fetch('/api/excel-online/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: trimmedUrl,
          processos,
        }),
      });

      const syncData: ExcelOnlineSyncResult = await syncRes.json();

      if (syncData.success) {
        setFeedback({
          type: 'success',
          message: syncData.message || 'Planilha no Excel Online sincronizada com sucesso!',
        });
        setConfig((prev) => ({
          ...prev,
          url: trimmedUrl,
          enabled: true,
          autoSync: autoSyncToggle,
          lastSync: syncData.syncedAt,
          lastStatus: 'success',
          lastMessage: syncData.message,
          lastCount: syncData.count,
        }));
      } else {
        setFeedback({
          type: 'error',
          message: syncData.message || 'Falha ao sincronizar com a planilha na nuvem.',
        });
        setConfig((prev) => ({
          ...prev,
          url: trimmedUrl,
          lastStatus: 'error',
          lastMessage: syncData.message,
        }));
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Erro ao comunicar com o servidor da aplicação.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = (text: string, type: 'csv' | 'json') => {
    navigator.clipboard.writeText(text);
    setCopiedFeed(type);
    setTimeout(() => setCopiedFeed(null), 2500);
  };

  const isSharePointLink =
    inputUrl.includes('sharepoint.com') ||
    inputUrl.includes('onedrive.live.com') ||
    inputUrl.includes('1drv.ms') ||
    inputUrl.includes('officeapps.live.com');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111827] w-full max-w-3xl rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header do Modal com Identidade Visual do Excel */}
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-white to-emerald-50/30 dark:from-emerald-950/40 dark:via-neutral-900 dark:to-neutral-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                  Integração com Excel Online em Tempo Real
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                  <Cloud className="w-3 h-3" /> Nuvem
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Puxador de dados automatizado para manter sua planilha no Excel Online sempre atualizada
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal com Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Status Bar */}
          <div className="p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-850 border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div
                className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                  config.enabled && config.url
                    ? 'bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse'
                    : 'bg-amber-400'
                }`}
              />
              <div>
                <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <span>
                    {config.enabled && config.url
                      ? 'Puxador Conectado à Planilha na Nuvem'
                      : 'Puxador Aguardando Configuração do Link'}
                  </span>
                  {config.enabled && (
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.2 rounded-md">
                      Tempo Real Ativo
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {config.lastSync ? (
                    <>
                      Última sincronização:{' '}
                      <strong className="text-neutral-700 dark:text-neutral-300">
                        {new Date(config.lastSync).toLocaleTimeString('pt-BR')}
                      </strong>{' '}
                      · {config.lastCount || processos.length} processos sincronizados
                    </>
                  ) : (
                    'Nenhuma sincronização realizada ainda.'
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={handleSaveAndSync}
                disabled={isSaving || !inputUrl.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
                <span>{isSaving ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
              </button>
            </div>
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 border ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span className="font-medium">{feedback.message}</span>
            </div>
          )}

          {/* Card do Puxador: Campo de Input Principal */}
          <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                  Link da Planilha no Excel Online / Webhook
                </label>
              </div>
              <span className="text-[11px] text-neutral-400 font-mono">
                {processos.length} processos prontos para nuvem
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Cole aqui o link do Excel Online (SharePoint, OneDrive) ou endpoint Webhook"
                className="w-full pl-3.5 pr-28 py-2.5 text-xs sm:text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all font-mono"
              />
              <button
                type="button"
                onClick={handleSaveAndSync}
                disabled={isSaving || !inputUrl.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-bold bg-neutral-900 hover:bg-neutral-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSaving ? 'Salvando...' : 'Conectar'}
              </button>
            </div>

            {/* Aviso inteligente caso seja link do SharePoint/OneDrive */}
            {isSharePointLink && (
              <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl text-xs text-sky-900 dark:text-sky-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold">Link do SharePoint / OneDrive Detectado:</span>
                  <p className="text-[11px] leading-relaxed text-sky-800 dark:text-sky-300">
                    Para que o Excel Online puxe todas as alterações automaticamente sem exigir login manual a cada alteração, utilize a opção do <strong>Puxador Web via Power Query</strong> logo abaixo. É o método oficial da Microsoft para sincronização em tempo real na nuvem!
                  </p>
                </div>
              </div>
            )}

            {/* Checkbox de Sincronização Automática em Tempo Real */}
            <div className="pt-2 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSyncToggle}
                  onChange={(e) => setAutoSyncToggle(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800"
                />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  Sincronização em tempo real ativada
                </span>
                <span className="text-[11px] text-neutral-400 hidden sm:inline">
                  (dispara a cada criação, edição ou exclusão de processo)
                </span>
              </label>

              {inputUrl.startsWith('http') && (
                <a
                  href={inputUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  <span>Abrir Planilha</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Guia: Como Conectar o Excel Online em Tempo Real (2 Minutos) */}
          <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-850/60 space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                Como Conectar no Excel Online (Passo a Passo)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Opção A: Feed Web (Recomendado) */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] flex items-center justify-center font-bold">
                      1
                    </span>
                    Puxador Web (Power Query no Excel)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                    Recomendado
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  No Excel Online, clique em <strong>Dados &gt; Obter Dados &gt; Da Web</strong> e cole a URL do feed abaixo. O Excel puxará todas as colunas e atualizará automaticamente:
                </p>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={feedCsvUrl}
                      className="flex-1 px-2.5 py-1.5 text-[11px] font-mono rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(feedCsvUrl, 'csv')}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copiar URL do Feed CSV"
                    >
                      {copiedFeed === 'csv' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[10px]">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Copiar</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-1 text-[10px] text-neutral-400">
                    <span>Também disponível em:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(feedJsonUrl, 'json')}
                      className="text-emerald-600 hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <span>Feed JSON</span>
                      {copiedFeed === 'json' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                    </button>
                    <span>·</span>
                    <a
                      href="/api/excel-online/feed.xlsx"
                      download="shineray_processos_tempo_real.xlsx"
                      className="text-emerald-600 hover:underline flex items-center gap-0.5"
                    >
                      <span>Baixar .xlsx Modelo</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Opção B: Webhook / Power Automate */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-[11px] flex items-center justify-center font-bold">
                      2
                    </span>
                    Webhook do Power Automate / Office 365
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Crie um fluxo no <strong>Microsoft Power Automate</strong> ("Quando uma requisição HTTP for recebida" &rarr; "Adicionar linha em tabela do Excel Online"). Cole a URL gerada no campo acima para que o app envie alterações ativamente!
                </p>
                <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[10px] text-neutral-600 dark:text-neutral-300 font-mono">
                  POST com payload JSON com todas as 18 colunas dos processos.
                </div>
              </div>
            </div>
          </div>

          {/* Mapeamento de Colunas Sincronizadas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span className="font-bold uppercase tracking-wider text-[11px]">
                Colunas Integradas na Planilha ({processos.length} processos)
              </span>
              <span>18 colunas estruturadas</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Nº Solicitação',
                'Marca / Modelo / Versão',
                'MMV Original',
                'Tipo de Homologação',
                'Extensão',
                'Quantidade',
                'Procedência',
                'CNPJ',
                'Tipo de Veículo',
                'Órgão Certificador',
                'Situação Regulamentar',
                'Nº Licença / Certidão',
                'Data de Envio',
                'Data de Emissão',
                'Data de Vencimento',
                'Nova Data Vencimento',
                'Observações',
                'Última Atualização',
              ].map((col, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-700"
                >
                  {col}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="px-5 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
            {config.enabled ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Integração configurada e ativa na nuvem
              </span>
            ) : (
              <span>Insira o link para ativar a sincronização em tempo real</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleSaveAndSync}
              disabled={isSaving || !inputUrl.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
              <span>{isSaving ? 'Sincronizando...' : 'Salvar e Sincronizar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
