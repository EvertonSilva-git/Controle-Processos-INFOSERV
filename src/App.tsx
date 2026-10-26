import React, { useState, useEffect, useMemo } from 'react';
import { Processo, ProcessoTipo, ProcessosSubTab, CnpjOption, DEFAULT_CNPJ_OPTIONS, formatarCNPJ, SituacaoProcesso } from './types/process';
import { INITIAL_PROCESSOS } from './data/initialData';
import { estaParaRevalidar, decomporMMV } from './utils/processCalculations';
import { exportarProcessosExcel } from './utils/exportExcel';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { ProcessFormScreen } from './components/ProcessFormScreen';
import { ProcessesScreen } from './components/ProcessesScreen';
import { ObservationModal } from './components/ObservationModal';
import { EditProcessModal } from './components/EditProcessModal';
import { MigrationModal } from './components/MigrationModal';
import {
  MigrationPackage,
  mergeMigrationProcessos,
  mergeMigrationCnpjs,
} from './utils/migrationData';
import { Eye, EyeOff, Lock, ArrowLeft, KeyRound, Cloud } from 'lucide-react';

const STORAGE_KEY = 'shineray_infoserv_processos_v1';
const INITIALIZED_FLAG = 'shineray_infoserv_initialized_v2';
const CNPJ_STORAGE_KEY = 'shineray_infoserv_cnpjs_v1';
const THEME_STORAGE_KEY = 'shineray_infoserv_theme';
const USER_STORAGE_KEY = 'shineray_infoserv_user';

const USER_PASSWORDS: Record<string, string> = {
  'Everton Silva': 'El@2026#',
  'Luca Andrade': '@Arapuca123',
};

// Normaliza processos garantindo situações válidas e versão estritamente em branco quando não preenchida
export const normalizarSituacaoProcesso = (p: Processo): Processo => {
  const proc = { ...p };

  // Regra do usuário: Se versão for idêntica ao modelo (erro legado), limpa para deixar estritamente em branco
  if (proc.veiculo && proc.modelo && proc.veiculo.trim().toUpperCase() === proc.modelo.trim().toUpperCase()) {
    proc.veiculo = '';
    proc.versoes = [];
  }
  if (proc.versoes && proc.versoes.length === 1 && proc.modelo && proc.versoes[0].trim().toUpperCase() === proc.modelo.trim().toUpperCase()) {
    proc.versoes = [];
    proc.veiculo = '';
  }

  // Regra do usuário: Extensões devem sempre estar em situação Emitida
  if (proc.tipo === 'Extensão' || proc.isExtensao) {
    proc.situacao = 'Licença/Certidão emitida';
  } else if (proc.tipo === 'Dispensa') {
    const permitidas: SituacaoProcesso[] = [
      'Em edição',
      'Encaminhada para o ibama',
      'Licença/Certidão emitida',
    ];
    if (!permitidas.includes(proc.situacao)) {
      proc.situacao = 'Encaminhada para o ibama';
    }
  }
  return proc;
};

export default function App() {
  // Estado de Autenticação (Login)
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    try {
      return localStorage.getItem(USER_STORAGE_KEY);
    } catch (e) {
      return null;
    }
  });

  const [selectedLoginUser, setSelectedLoginUser] = useState<'Luca Andrade' | 'Everton Silva' | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (nome: string) => {
    setCurrentUser(nome);
    localStorage.setItem(USER_STORAGE_KEY, nome);
  };

  // Theme state: light or dark
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {
      console.error(e);
    }
    return 'light';
  });

  // Sync theme class with document root
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // 1. CARGA INICIAL: Lê a versão mais recente do AUTO-SAVE no localStorage
  // Garante que exclusões sejam respeitadas mesmo que a lista esteja vazia!
  const [processos, setProcessos] = useState<Processo[]>(() => {
    try {
      const isInit = localStorage.getItem(INITIALIZED_FLAG);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Se o usuário já salvou dados (inclusive lista vazia após excluir), mantém exatamente o que foi salvo
          return parsed.map(normalizarSituacaoProcesso);
        }
      }
      // Se já foi inicializado alguma vez mas a chave estava vazia, não recarrega processos padrão
      if (isInit === 'true') {
        return [];
      }
      // Apenas na primeiríssima execução (sem flag e sem dados), inicia e grava a flag
      localStorage.setItem(INITIALIZED_FLAG, 'true');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PROCESSOS));
      return INITIAL_PROCESSOS.map(normalizarSituacaoProcesso);
    } catch (e) {
      console.error('Erro ao ler autosave do localStorage', e);
      return [];
    }
  });

  // Load and manage CNPJs
  const [cnpjList, setCnpjList] = useState<CnpjOption[]>(() => {
    try {
      const saved = localStorage.getItem(CNPJ_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Erro ao ler CNPJs do localStorage', e);
    }
    return DEFAULT_CNPJ_OPTIONS;
  });

  // 2. AUTO-SAVE EM TEMPO REAL: Salva no localStorage sempre que houver alteração
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(processos));
      localStorage.setItem(INITIALIZED_FLAG, 'true');
    } catch (err) {
      console.error('Erro no AutoSave imediato:', err);
    }
  }, [processos]);

  // 3. AUTO-SAVE PERIÓDICO A CADA 10 SEGUNDOS (salvamento automático a cada 10s)
  useEffect(() => {
    const timer = setInterval(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(processos));
        localStorage.setItem(INITIALIZED_FLAG, 'true');
      } catch (err) {
        console.error('Erro no AutoSave periódico de 10s:', err);
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [processos]);

  const handleAddCnpj = (newCnpj: CnpjOption) => {
    if (currentUser === 'Visitante') {
      alert('Modo Visitante: você não possui permissão para cadastrar novo CNPJ.');
      return;
    }
    setCnpjList((prev) => {
      const existsIndex = prev.findIndex((c) => c.raw === newCnpj.raw);
      let updated: CnpjOption[];
      if (existsIndex >= 0) {
        updated = [...prev];
        updated[existsIndex] = newCnpj;
      } else {
        updated = [...prev, newCnpj];
      }
      try {
        localStorage.setItem(CNPJ_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  const handleDeleteCnpj = (rawCnpj: string) => {
    if (currentUser === 'Visitante') {
      alert('Modo Visitante: você não possui permissão para excluir CNPJs.');
      return;
    }
    setCnpjList((prev) => {
      const updated = prev.filter((c) => c.raw !== rawCnpj);
      try {
        localStorage.setItem(CNPJ_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  const allCnpjs = useMemo(() => {
    const list = [...cnpjList];
    processos.forEach((p) => {
      if (p.cnpj) {
        const clean = p.cnpj.replace(/\D/g, '');
        if (clean && !list.some((c) => c.raw === clean)) {
          list.push({
            raw: clean,
            formatted: formatarCNPJ(clean),
            label: clean,
            isCustom: true,
          });
        }
      }
    });
    return list;
  }, [cnpjList, processos]);

  // Navigation with persistence
  const [currentTab, setCurrentTab] = useState<'home' | 'processos' | 'cadastro'>(() => {
    try {
      const savedTab = localStorage.getItem('shineray_active_tab');
      if (savedTab === 'home' || savedTab === 'processos' || savedTab === 'cadastro') {
        return savedTab;
      }
    } catch (e) {
      // fallback
    }
    return 'home';
  });

  useEffect(() => {
    try {
      localStorage.setItem('shineray_active_tab', currentTab);
    } catch (e) {
      // ignore
    }
  }, [currentTab]);

  const [currentSubTab, setCurrentSubTab] = useState<ProcessosSubTab>('todos');
  const [tipoFiltro, setTipoFiltro] = useState<ProcessoTipo | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [observacaoModalProcesso, setObservacaoModalProcesso] = useState<Processo | null>(null);
  const [editModalProcesso, setEditModalProcesso] = useState<Processo | null>(null);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);

  const handleSaveProcesso = (novoOuAtualizado: Processo) => {
    if (currentUser === 'Visitante') {
      alert('Modo Visitante: você possui acesso somente para consulta.');
      return;
    }
    const normalizado = normalizarSituacaoProcesso(novoOuAtualizado);
    setProcessos((prev) => {
      const existsIndex = prev.findIndex((p) => p.id === normalizado.id);
      let atualizados: Processo[];
      if (existsIndex >= 0) {
        atualizados = [...prev];
        atualizados[existsIndex] = normalizado;
      } else {
        atualizados = [normalizado, ...prev];
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizados));
      } catch (e) {
        console.error('Erro ao salvar processo no localStorage:', e);
      }
      return atualizados;
    });

    if (observacaoModalProcesso?.id === normalizado.id) {
      setObservacaoModalProcesso(normalizado);
    }

    setCurrentTab('processos');
  };

  const handleDeleteProcesso = (processoId: string) => {
    if (currentUser === 'Visitante') {
      return;
    }
    setProcessos((prev) => {
      const updated = prev.filter((p) => p.id !== processoId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem(INITIALIZED_FLAG, 'true');
      } catch (err) {
        console.error('Erro ao salvar exclusão:', err);
      }
      return updated;
    });

    if (observacaoModalProcesso?.id === processoId) {
      setObservacaoModalProcesso(null);
    }
    if (editModalProcesso?.id === processoId) {
      setEditModalProcesso(null);
    }
  };

  // Add observation note
  const handleAddObservacao = (processoId: string, texto: string) => {
    if (currentUser === 'Visitante') {
      alert('Modo Visitante: você não possui permissão para registrar anotações.');
      return;
    }
    const agora = new Date().toISOString();
    setProcessos((prev) =>
      prev.map((p) => {
        if (p.id !== processoId) return p;
        const novaObs = {
          id: `obs-${Date.now()}`,
          texto,
          dataHora: agora,
          autor: currentUser || 'Analista Desconhecido',
        };
        const updated = {
          ...p,
          observacoes: [...(p.observacoes || []), novaObs],
          atualizadoEm: agora,
        };
        setObservacaoModalProcesso(updated);
        return updated;
      })
    );
  };

  const handleDeleteObservacao = (processoId: string, obsId: string) => {
    if (currentUser === 'Visitante') {
      alert('Modo Visitante: você não possui permissão para excluir anotações.');
      return;
    }
    setProcessos((prev) =>
      prev.map((p) => {
        if (p.id !== processoId) return p;
        const updated = {
          ...p,
          observacoes: p.observacoes.filter((o) => o.id !== obsId),
          atualizadoEm: new Date().toISOString(),
        };
        setObservacaoModalProcesso(updated);
        return updated;
      })
    );
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(processos, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `shineray_infoserv_backup_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportExcel = () => {
    exportarProcessosExcel(processos);
  };

  const handleApplyMigration = (pkg: MigrationPackage, strategy: 'replace' | 'merge') => {
    if (currentUser === 'Visitante') {
      alert('Modo Visitante: você não possui permissão para aplicar migrações.');
      return;
    }

    const novosProcessos = mergeMigrationProcessos(processos, pkg.processos, strategy);
    const novosCnpjs = mergeMigrationCnpjs(cnpjList, pkg.cnpjs);

    setProcessos(novosProcessos);
    setCnpjList(novosCnpjs);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novosProcessos));
      localStorage.setItem(INITIALIZED_FLAG, 'true');
      localStorage.setItem(CNPJ_STORAGE_KEY, JSON.stringify(novosCnpjs));
    } catch (err) {
      console.error('Erro ao salvar migração no localStorage:', err);
    }

    setCurrentTab('processos');
  };

  const handleCreateExtensao = (original: Processo) => {
    if (currentUser === 'Visitante') {
      alert('Modo Visitante: você possui acesso somente leitura e não pode criar extensões.');
      return;
    }
    if (original.isExtensao || original.tipo === 'Extensão') {
      alert('Atenção: Cartões de extensão não possuem permissão para criar novas extensões. Apenas cartões normais podem gerar extensões.');
      return;
    }
    const agora = new Date().toISOString();
    const mmvParts = decomporMMV(original.mmv, original.procedencia);
    const novaExtensao: Processo = {
      id: `proc-ext-${Date.now()}`,
      tipo: original.tipo,
      numeroSolicitacao: `${original.numeroSolicitacao} EXT`,
      procedencia: original.procedencia,
      orgaoCertificador: original.orgaoCertificador || 'IMT',
      mmv: original.mmv,
      marca: original.marca || mmvParts.marca,
      modelo: original.modelo || mmvParts.modelo,
      veiculo: typeof original.veiculo === 'string' ? original.veiculo : (original.modelo ? '' : mmvParts.veiculo),
      versoes: Array.isArray(original.versoes) ? original.versoes : (original.modelo ? [] : mmvParts.versoes),
      isExtensao: true,
      processoOriginalId: original.id,
      mmvOriginal: original.mmv,
      numeroLicenca: original.numeroLicenca || '',
      quantidade: original.quantidade,
      tipoVeiculo: original.tipoVeiculo,
      dataInicio: agora.split('T')[0],
      situacao: 'Licença/Certidão emitida',
      cnpj: original.cnpj,
      dataEnvio: original.dataEnvio || agora.split('T')[0],
      dataEmissao: original.dataEmissao || agora.split('T')[0],
      dataValidade: original.dataValidade || '',
      observacoes: [
        {
          id: `obs-${Date.now()}`,
          texto: `Extensão gerada a partir do processo original ${original.numeroSolicitacao} (${original.mmv}).${original.numeroLicenca ? ` Licença original herdada: ${original.numeroLicenca}.` : ''}`,
          dataHora: agora,
          autor: currentUser || 'Analista Shineray',
        },
      ],
      criadoEm: agora,
      atualizadoEm: agora,
    };

    setProcessos((prev) => [novaExtensao, ...prev]);
    setEditModalProcesso(novaExtensao);
    setCurrentTab('processos');
  };

  const handleResetData = () => {
    if (currentUser === 'Visitante') {
      alert('Modo Visitante: você não possui permissão para restaurar dados.');
      return;
    }
    if (
      window.confirm(
        'Deseja restaurar os processos de teste padrão da Shineray? Isso resetará dados modificados.'
      )
    ) {
      setProcessos(INITIAL_PROCESSOS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PROCESSOS));
      alert('Dados restaurados com sucesso.');
    }
  };

  const totalRevalidar = processos.filter((p) =>
    estaParaRevalidar(p.dataValidade, p.situacao, p.novaDataVencimento)
  ).length;

  const handleVerifyPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedLoginUser) return;
    const expectedPassword = USER_PASSWORDS[selectedLoginUser];
    if (passwordInput === expectedPassword) {
      handleLogin(selectedLoginUser);
      setSelectedLoginUser(null);
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError('Senha incorreta. Verifique os caracteres e tente novamente.');
    }
  };

  // ECRÃ DE LOGIN
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0f172a] flex items-center justify-center p-4 font-sans transition-colors selection:bg-[#E30613]/10 selection:text-[#E30613]">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-2xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-14 h-14 bg-[#E30613] rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-red-500/20 ring-4 ring-red-500/10">
              S
            </div>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight mb-1">
            Sistema Infoserv
          </h1>
          <p className="text-xs uppercase font-bold tracking-widest text-[#E30613] mb-3">
            Shineray do Brasil · IBAMA / PROCONVE
          </p>

          {selectedLoginUser ? (
            <form onSubmit={handleVerifyPassword} className="space-y-4 text-left animate-in fade-in-0 duration-200">
              <button
                type="button"
                onClick={() => {
                  setSelectedLoginUser(null);
                  setPasswordInput('');
                  setPasswordError('');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors mb-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Trocar analista</span>
              </button>

              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-base shadow-2xs shrink-0 ${
                    selectedLoginUser === 'Luca Andrade'
                      ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {selectedLoginUser === 'Luca Andrade' ? 'LA' : 'ES'}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                    {selectedLoginUser}
                  </div>
                  <div
                    className={`text-xs font-semibold truncate ${
                      selectedLoginUser === 'Luca Andrade'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {selectedLoginUser === 'Luca Andrade'
                      ? 'Engenheiro Mecânico'
                      : 'Assistente Técnico de Homologação'}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Senha de Acesso do Analista
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    autoFocus
                    placeholder="Digite sua senha"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E30613]/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1">
                    {passwordError}
                  </p>
                )}
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-[#E30613] hover:bg-[#c70510] text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Acessar como {selectedLoginUser.split(' ')[0]}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLoginUser(null);
                    setPasswordInput('');
                    setPasswordError('');
                  }}
                  className="w-full py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            </form>
          ) : (
            <>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed">
                Selecione o analista responsável para iniciar a sessão e registrar notas e despachos.
              </p>
              <div className="space-y-3.5">
                <button
                  onClick={() => {
                    setSelectedLoginUser('Luca Andrade');
                    setPasswordInput('');
                    setPasswordError('');
                    setShowPassword(false);
                  }}
                  className="w-full p-4 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800/80 dark:hover:bg-neutral-750 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-2xl font-semibold transition-all active:scale-[0.98] shadow-xs hover:shadow-md flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-base group-hover:scale-105 transition-transform shadow-2xs">
                      LA
                    </div>
                    <div>
                      <div className="font-bold text-base text-neutral-900 dark:text-white">Luca Andrade</div>
                      <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">Engenheiro Mecânico</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1 transition-colors">
                    <Lock className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Senha</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </button>

                <button
                  onClick={() => {
                    setSelectedLoginUser('Everton Silva');
                    setPasswordInput('');
                    setPasswordError('');
                    setShowPassword(false);
                  }}
                  className="w-full p-4 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800/80 dark:hover:bg-neutral-750 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-2xl font-semibold transition-all active:scale-[0.98] shadow-xs hover:shadow-md flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-base group-hover:scale-105 transition-transform shadow-2xs">
                      ES
                    </div>
                    <div>
                      <div className="font-bold text-base text-neutral-900 dark:text-white">Everton Silva</div>
                      <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Assistente Técnico de Homologação</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-neutral-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center gap-1 transition-colors">
                    <Lock className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Senha</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </button>

                <div className="pt-2">
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-neutral-200 dark:border-neutral-700"></div>
                    <span className="flex-shrink mx-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                      ou Acesso Aberto
                    </span>
                    <div className="flex-grow border-t border-neutral-200 dark:border-neutral-700"></div>
                  </div>

                  <button
                    onClick={() => handleLogin('Visitante')}
                    className="w-full p-4 bg-purple-50/70 hover:bg-purple-100/80 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-100 rounded-2xl font-semibold transition-all active:scale-[0.98] shadow-xs hover:shadow-md flex items-center justify-between text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-purple-200 dark:bg-purple-900/80 text-purple-800 dark:text-purple-200 flex items-center justify-center font-bold text-base group-hover:scale-105 transition-transform shadow-2xs">
                        <Eye className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-base text-neutral-900 dark:text-white">Visitante</span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-purple-200/80 dark:bg-purple-800 text-purple-900 dark:text-purple-100 font-bold">Sem Senha</span>
                        </div>
                        <div className="text-xs font-semibold text-purple-600 dark:text-purple-400">Apenas Consulta · Modo Leitura</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
                      Entrar →
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="mt-8 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400">
            Controle de processos regulatórios PROCONVE / PROMOT M5
          </div>
        </div>
      </div>
    );
  }

  const isVisitante = currentUser === 'Visitante';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0f172a] flex flex-col font-sans text-neutral-900 dark:text-neutral-100 selection:bg-[#E30613]/10 selection:text-[#E30613] transition-colors">
      <Navbar
        currentTab={currentTab}
        onNavigate={(tab) => {
          if (tab === 'cadastro' && isVisitante) return;
          setCurrentTab(tab);
          if (tab === 'home') {
            setTipoFiltro(null);
          }
          if (tab === 'processos' && searchQuery) {
            setCurrentSubTab('todos');
          }
        }}
        totalProcessos={processos.length}
        totalRevalidar={totalRevalidar}
        onExportExcel={handleExportExcel}
        onOpenMigration={() => setIsMigrationModalOpen(true)}
        onResetData={handleResetData}
        theme={theme}
        onToggleTheme={toggleTheme}
        processos={processos}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectProcesso={(p) => {
          setCurrentTab('processos');
          setCurrentSubTab('todos');
          setObservacaoModalProcesso(p);
        }}
        currentUser={currentUser}
        onSwitchUser={() => {
          setCurrentUser(null);
          localStorage.removeItem(USER_STORAGE_KEY);
        }}
        isVisitante={isVisitante}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {currentTab === 'home' && (
          <HomeScreen
            processos={processos}
            onNavigateToProcessos={(subTab, tipo) => {
              if (subTab) setCurrentSubTab(subTab);
              if (tipo) setTipoFiltro(tipo);
              else setTipoFiltro(null);
              setCurrentTab('processos');
            }}
            onNavigateToCadastro={() => {
              if (!isVisitante) setCurrentTab('cadastro');
            }}
            onSelectProcesso={(p) => {
              setObservacaoModalProcesso(p);
            }}
            onOpenMigration={() => setIsMigrationModalOpen(true)}
            isVisitante={isVisitante}
          />
        )}

        {currentTab === 'cadastro' && (
          isVisitante ? (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-10 text-center shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center mx-auto font-bold">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Acesso Restrito · Modo Visitante
              </h3>
              <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
                O perfil de visitante possui autorização exclusivamente para consulta de homologações, prazos regulatórios e relatórios. O cadastro de novos processos requer autenticação de analista técnico.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setCurrentTab('home')}
                  className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity"
                >
                  Voltar ao Painel Geral
                </button>
              </div>
            </div>
          ) : (
            <ProcessFormScreen
              onSave={(novo) => {
                handleSaveProcesso(novo);
              }}
              onCancel={() => setCurrentTab('home')}
              cnpjs={allCnpjs}
              onAddCnpj={handleAddCnpj}
              currentUser={currentUser}
              isVisitante={isVisitante}
            />
          )
        )}

        {currentTab === 'processos' && (
          <ProcessesScreen
            processos={processos}
            currentSubTab={currentSubTab}
            onSubTabChange={(st) => setCurrentSubTab(st)}
            tipoFiltro={tipoFiltro}
            onTipoFiltroChange={(tf) => setTipoFiltro(tf)}
            onOpenObservations={(p) => setObservacaoModalProcesso(p)}
            onEditProcesso={(p) => setEditModalProcesso(p)}
            onDeleteProcesso={handleDeleteProcesso}
            onNavigateToCadastro={() => {
              if (!isVisitante) setCurrentTab('cadastro');
            }}
            onCreateExtensao={handleCreateExtensao}
            cnpjs={allCnpjs}
            onAddCnpj={handleAddCnpj}
            onDeleteCnpj={handleDeleteCnpj}
            searchTerm={searchQuery}
            onSearchTermChange={setSearchQuery}
            onExportExcel={handleExportExcel}
            onOpenMigration={() => setIsMigrationModalOpen(true)}
            currentUser={currentUser}
            isVisitante={isVisitante}
          />
        )}
      </main>

      <ObservationModal
        processo={observacaoModalProcesso}
        isOpen={!!observacaoModalProcesso}
        onClose={() => setObservacaoModalProcesso(null)}
        onAddObservacao={handleAddObservacao}
        onDeleteObservacao={handleDeleteObservacao}
        currentUser={currentUser}
      />

      <EditProcessModal
        processo={editModalProcesso}
        isOpen={!!editModalProcesso}
        onClose={() => setEditModalProcesso(null)}
        onSave={(updated) => handleSaveProcesso(updated)}
        onDelete={handleDeleteProcesso}
        cnpjs={allCnpjs}
        onAddCnpj={handleAddCnpj}
        currentUser={currentUser}
        isVisitante={isVisitante}
      />

      <MigrationModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
        processos={processos}
        cnpjList={allCnpjs}
        currentUser={currentUser}
        isVisitante={isVisitante}
        onApplyMigration={handleApplyMigration}
      />

      <footer className="mt-auto border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111827] py-6 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-neutral-900 dark:text-white tracking-tight">SHINERAY DO BRASIL</span>
            <span>·</span>
            <span>Sistema Integrado Infoserv / IBAMA</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>PROCONVE / PROMOT M5</span>
            <span>·</span>
            <span>Homologação e Conformidade Técnica</span>
          </div>
        </div>
      </footer>
    </div>
  );
}