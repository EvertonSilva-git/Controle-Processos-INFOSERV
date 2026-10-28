import React, { useState, useEffect } from 'react';
import { Processo } from '../types/process';
import {
  getSupabaseCredentials,
  testSupabaseConnection,
  seedAllProcessosToSupabase,
  fetchProcessosFromSupabase,
} from '../services/supabase';
import {
  Database,
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  X,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Server,
  Layers,
} from 'lucide-react';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  processos: Processo[];
  onProcessosUpdated: (processos: Processo[]) => void;
  isVisitante?: boolean;
}

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({
  isOpen,
  onClose,
  processos,
  onProcessosUpdated,
  isVisitante = false,
}) => {
  const [credentials, setCredentials] = useState(getSupabaseCredentials());
  const [customUrl, setCustomUrl] = useState(credentials.url || '');
  const [customKey, setCustomKey] = useState(credentials.key || '');
  const [isTesting, setIsTesting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setCredentials(creds);
      setCustomUrl(creds.url || '');
      setCustomKey(creds.key || '');
      setTestResult(null);

      // Se já configurado, faz teste automático
      if (creds.isConfigured) {
        testSupabaseConnection().then(setTestResult);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(customUrl.trim(), customKey.trim());
      setTestResult(res);
      if (res.success) {
        // Salva override
        localStorage.setItem('shineray_custom_supabase_url', customUrl.trim());
        localStorage.setItem('shineray_custom_supabase_anon_key', customKey.trim());
        setCredentials(getSupabaseCredentials());
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Falha ao testar conexão' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearCustomCredentials = () => {
    localStorage.removeItem('shineray_custom_supabase_url');
    localStorage.removeItem('shineray_custom_supabase_anon_key');
    const creds = getSupabaseCredentials();
    setCredentials(creds);
    setCustomUrl(creds.url || '');
    setCustomKey(creds.key || '');
    setTestResult(null);
  };

  const handleSeedProcessos = async () => {
    if (isVisitante) {
      alert('Modo Visitante: alteração restrita a analistas.');
      return;
    }
    setIsSeeding(true);
    try {
      const res = await seedAllProcessosToSupabase(processos);
      if (res.success) {
        setTestResult({
          success: true,
          message: `Sucesso! ${res.count} processos foram gravados e sincronizados na tabela do Supabase. Todos os dispositivos agora enxergarão estes dados!`,
          count: res.count,
        });
      } else {
        setTestResult({
          success: false,
          message: `Erro ao enviar processos: ${res.error || 'Verifique se a tabela "processos" foi criada no Supabase'}`,
        });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleReloadFromSupabase = async () => {
    setIsReloading(true);
    try {
      const res = await fetchProcessosFromSupabase();
      if (res.success) {
        onProcessosUpdated(res.data);
        setTestResult({
          success: true,
          message: `${res.data.length} processos recarregados diretamente do Supabase com sucesso!`,
          count: res.data.length,
        });
      } else {
        setTestResult({
          success: false,
          message: `Erro ao buscar dados: ${res.error}`,
        });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setIsReloading(false);
    }
  };

  const sqlCode = `-- Criar tabela de processos no Supabase (SQL Editor)
CREATE TABLE IF NOT EXISTS public.processos (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL,
    numero_solicitacao TEXT NOT NULL,
    procedencia TEXT NOT NULL,
    orgao_certificador TEXT,
    mmv TEXT NOT NULL,
    marca TEXT,
    modelo TEXT,
    veiculo TEXT,
    versoes JSONB DEFAULT '[]'::jsonb,
    is_extensao BOOLEAN DEFAULT false,
    processo_original_id TEXT,
    mmv_original TEXT,
    numero_licenca TEXT,
    quantidade TEXT,
    tipo_veiculo TEXT NOT NULL,
    data_inicio TEXT NOT NULL,
    situacao TEXT NOT NULL,
    data_envio TEXT,
    data_emissao TEXT,
    data_validade TEXT,
    data_revalidacao TEXT,
    nova_data_vencimento TEXT,
    cnpj TEXT,
    observacoes JSONB DEFAULT '[]'::jsonb,
    criado_em TEXT,
    atualizado_em TEXT
);

ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura publica" ON public.processos FOR SELECT USING (true);
CREATE POLICY "Permitir gravacao publica" ON public.processos FOR ALL USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.processos;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111827] w-full max-w-2xl rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-white to-sky-50 dark:from-emerald-950/40 dark:via-neutral-900 dark:to-neutral-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                  Banco de Dados Supabase · Cloudflare Sync
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                  Tempo Real
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Sincronização remota entre navegadores e dispositivos para hospedagem no Cloudflare Pages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Status Bar */}
          <div className="p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-850 border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div
                className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                  credentials.isConfigured
                    ? 'bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse'
                    : 'bg-amber-400'
                }`}
              />
              <div>
                <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <span>
                    {credentials.isConfigured
                      ? 'Conexão Supabase Configurada'
                      : 'Aguardando Variáveis de Ambiente no Cloudflare'}
                  </span>
                  {credentials.isCustom && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                      Override Local
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {credentials.isConfigured ? (
                    <>
                      URL:{' '}
                      <strong className="text-neutral-700 dark:text-neutral-300 font-mono">
                        {credentials.url.slice(0, 32)}...
                      </strong>
                    </>
                  ) : (
                    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Cloudflare Pages.'
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReloadFromSupabase}
                disabled={!credentials.isConfigured || isReloading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin' : ''}`} />
                <span>Recarregar</span>
              </button>
            </div>
          </div>

          {/* Test / Operation Feedback */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <span className="font-semibold">{testResult.message}</span>
              </div>
            </div>
          )}

          {/* Sincronização em Massa (Seed dos 70 processos) */}
          <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                  Sincronização dos Processos ({processos.length} no App)
                </h3>
              </div>
              <span className="text-[11px] text-neutral-400 font-mono">
                Tabela: public.processos
              </span>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Para garantir que todos os <strong>{processos.length} processos</strong> estejam salvos no banco de dados e sincronizados entre todos os computadores, clique no botão abaixo. Isso grava toda a base na sua tabela do Supabase.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleSeedProcessos}
                disabled={isSeeding || !credentials.isConfigured}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Cloud className={`w-4 h-4 ${isSeeding ? 'animate-bounce' : ''}`} />
                <span>{isSeeding ? 'Gravando no Supabase...' : `Enviar Todos os ${processos.length} Processos para o Supabase`}</span>
              </button>
            </div>
          </div>

          {/* Guia de Configuração no Cloudflare Pages */}
          <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-850/60 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Como Configurar no Cloudflare Pages
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                title="Copiar comando SQL para criar a tabela no Supabase"
              >
                {copiedSql ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>SQL Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Script SQL</span>
                  </>
                )}
              </button>
            </div>

            <ol className="text-xs text-neutral-600 dark:text-neutral-300 space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                No <strong>Supabase</strong>, abra o <strong>SQL Editor</strong> e execute o script SQL acima para criar a tabela <code className="bg-neutral-200 dark:bg-neutral-800 px-1 py-0.5 rounded font-mono">public.processos</code> e habilitar o Realtime.
              </li>
              <li>
                No <strong>Cloudflare Dashboard</strong>, vá em <strong>Pages</strong> &rarr; Seu Projeto &rarr; <strong>Settings</strong> &rarr; <strong>Environment variables</strong> (Production e Preview).
              </li>
              <li>
                Adicione as duas variáveis:
                <div className="mt-1.5 space-y-1 font-mono text-[11px] bg-white dark:bg-neutral-900 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  <div className="text-emerald-700 dark:text-emerald-300">VITE_SUPABASE_URL = https://seu-projeto.supabase.co</div>
                  <div className="text-sky-700 dark:text-sky-300">VITE_SUPABASE_ANON_KEY = sua-chave-publica-anon</div>
                </div>
              </li>
              <li>
                Faça o redeploy no Cloudflare Pages. A partir daí, o frontend lerá e gravará diretamente no Supabase em tempo real em qualquer dispositivo!
              </li>
            </ol>
          </div>

          {/* Override / Teste Manual de Credenciais */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
            <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
              Conexão Direta / Teste de Credenciais
            </h4>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  VITE_SUPABASE_URL
                </label>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  VITE_SUPABASE_ANON_KEY
                </label>
                <input
                  type="password"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                {credentials.isCustom && (
                  <button
                    type="button"
                    onClick={handleClearCustomCredentials}
                    className="text-xs text-rose-600 hover:underline cursor-pointer"
                  >
                    Limpar override local
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !customUrl.trim() || !customKey.trim()}
                  className="ml-auto px-3.5 py-1.5 rounded-lg text-xs font-bold bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testando...' : 'Testar e Salvar Conexão'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Sincronização Cloudflare + Supabase em Tempo Real</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
