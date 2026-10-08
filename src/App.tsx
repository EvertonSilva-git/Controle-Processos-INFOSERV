import React, { useState, useEffect, useMemo } from 'react';
import { Processo, ProcessoTipo, ProcessosSubTab, CnpjOption, DEFAULT_CNPJ_OPTIONS, formatarCNPJ } from './types/process';
import { INITIAL_PROCESSOS } from './data/initialData';
import { estaParaRevalidar, decomporMMV } from './utils/processCalculations';
import { exportarProcessosExcel } from './utils/exportExcel';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { ProcessFormScreen } from './components/ProcessFormScreen';
import { ProcessesScreen } from './components/ProcessesScreen';
import { ObservationModal } from './components/ObservationModal';
import { EditProcessModal } from './components/EditProcessModal';

const STORAGE_KEY = 'shineray_infoserv_processos_v1';
const CNPJ_STORAGE_KEY = 'shineray_infoserv_cnpjs_v1';
const THEME_STORAGE_KEY = 'shineray_infoserv_theme';
const USER_STORAGE_KEY = 'shineray_infoserv_user'; // Nova chave para o login

export default function App() {
  // Estado de Autenticação (Login)
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    try {
      return localStorage.getItem(USER_STORAGE_KEY);
    } catch (e) {
      return null;
    }
  });

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

  // Load initial state from localStorage or seed
  const [processos, setProcessos] = useState<Processo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Erro ao ler localStorage', e);
    }
    return INITIAL_PROCESSOS;
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

  // Fetch shared processes and CNPJs from server
  useEffect(() => {
    const fetchGlobalServerData = async () => {
      try {
        const procRes = await fetch('/api/processos');
        if (procRes.ok) {
          const procData = await procRes.json();
          if (Array.isArray(procData.processos) && procData.processos.length > 0) {
            setProcessos(procData.processos);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(procData.processos));
          }
        }

        const cnpjRes = await fetch('/api/cnpjs');
        if (cnpjRes.ok) {
          const cnpjData = await cnpjRes.json();
          if (Array.isArray(cnpjData.cnpjs) && cnpjData.cnpjs.length > 0) {
            setCnpjList(cnpjData.cnpjs);
            localStorage.setItem(CNPJ_STORAGE_KEY, JSON.stringify(cnpjData.cnpjs));
          }
        }
      } catch (err) {
        console.warn('API global indisponível ou offline. Usando cache local:', err);
      }
    };

    fetchGlobalServerData();

    const interval = setInterval(fetchGlobalServerData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAddCnpj = (newCnpj: CnpjOption) => {
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
        fetch('/api/cnpjs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cnpjs: updated }),
        }).catch((e) => console.warn('Erro ao salvar CNPJ no servidor:', e));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  const handleDeleteCnpj = (rawCnpj: string) => {
    setCnpjList((prev) => {
      const updated = prev.filter((c) => c.raw !== rawCnpj);
      try {
        localStorage.setItem(CNPJ_STORAGE_KEY, JSON.stringify(updated));
        fetch('/api/cnpjs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cnpjs: updated }),
        }).catch((e) => console.warn('Erro ao atualizar CNPJ no servidor:', e));
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

  // Save to localStorage & sync
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(processos));
      fetch('/api/processos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processos }),
      }).catch((e) => console.warn('Erro ao sincronizar processos com servidor:', e));
    } catch (err) {
      console.error('Erro ao salvar no localStorage:', err);
    }
  }, [processos]);

  const handleSaveProcesso = (novoOuAtualizado: Processo) => {
    setProcessos((prev) => {
      const existsIndex = prev.findIndex((p) => p.id === novoOuAtualizado.id);
      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = novoOuAtualizado;
        return copy;
      }
      return [novoOuAtualizado, ...prev];
    });

    if (observacaoModalProcesso?.id === novoOuAtualizado.id) {
      setObservacaoModalProcesso(novoOuAtualizado);
    }

    setCurrentTab('processos');
  };

  const handleDeleteProcesso = (processoId: string) => {
    setProcessos((prev) => prev.filter((p) => p.id !== processoId));
    if (observacaoModalProcesso?.id === processoId) {
      setObservacaoModalProcesso(null);
    }
  };

  // Add observation note - AGORA USA O CURRENT USER
  const handleAddObservacao = (processoId: string, texto: string) => {
    const agora = new Date().toISOString();
    setProcessos((prev) =>
      prev.map((p) => {
        if (p.id !== processoId) return p;
        const novaObs = {
          id: `obs-${Date.now()}`,
          texto,
          dataHora: agora,
          autor: currentUser || 'Analista Desconhecido', // Aplicação do nome escolhido
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

  // Exportação organizada em planilha Excel (.xlsx)
  const handleExportExcel = () => {
    exportarProcessosExcel(processos);
  };

  // Criação automática de extensão duplicando dados do processo original
  const handleCreateExtensao = (original: Processo) => {
    const agora = new Date().toISOString();
    const mmvParts = decomporMMV(original.mmv, original.procedencia);
    const novaExtensao: Processo = {
      id: `proc-ext-${Date.now()}`,
      tipo: original.tipo === 'Extensão' ? 'LCVM' : original.tipo,
      numeroSolicitacao: `${original.numeroSolicitacao} EXT`,
      procedencia: original.procedencia,
      orgaoCertificador: original.orgaoCertificador || 'IMT',
      mmv: original.mmv,
      marca: original.marca || mmvParts.marca,
      modelo: original.modelo || mmvParts.modelo,
      veiculo: original.veiculo || mmvParts.veiculo,
      isExtensao: true,
      processoOriginalId: original.id,
      mmvOriginal: original.mmv,
      numeroLicenca: '',
      quantidade: original.quantidade,
      tipoVeiculo: original.tipoVeiculo,
      dataInicio: agora.split('T')[0],
      situacao: 'Em edição',
      cnpj: original.cnpj,
      dataEnvio: '',
      dataEmissao: '',
      dataValidade: '',
      observacoes: [
        {
          id: `obs-${Date.now()}`,
          texto: `Extensão gerada a partir do processo original ${original.numeroSolicitacao} (${original.mmv}).`,
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
    estaParaRevalidar(p.dataValidade, p.situacao)
  ).length;

  // ECRÃ DE LOGIN (Se não houver utilizador selecionado: Luca Andrade ou Everton Silva)
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
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed">
            Selecione o analista responsável para iniciar a sessão e registrar notas e despachos.
          </p>
          <div className="space-y-3.5">
            <button
              onClick={() => handleLogin('Luca Andrade')}
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
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                Acessar →
              </span>
            </button>

            <button
              onClick={() => handleLogin('Everton Silva')}
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
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                Acessar →
              </span>
            </button>
          </div>
          <div className="mt-8 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400">
            Controle de processos regulatórios PROCONVE / PROMOT M5
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0f172a] flex flex-col font-sans text-neutral-900 dark:text-neutral-100 selection:bg-[#E30613]/10 selection:text-[#E30613] transition-colors">
      <Navbar
        currentTab={currentTab}
        onNavigate={(tab) => {
          setCurrentTab(tab);
          if (tab === 'home') {
            setTipoFiltro(null);
          }
        }}
        totalProcessos={processos.length}
        totalRevalidar={totalRevalidar}
        onExportExcel={handleExportExcel}
        onResetData={handleResetData}
        theme={theme}
        onToggleTheme={toggleTheme}
        processos={processos}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectProcesso={(p) => setObservacaoModalProcesso(p)}
        currentUser={currentUser}
        onSwitchUser={() => {
          setCurrentUser(null);
          localStorage.removeItem(USER_STORAGE_KEY);
        }}
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
            onNavigateToCadastro={() => setCurrentTab('cadastro')}
            onSelectProcesso={(p) => {
              setObservacaoModalProcesso(p);
            }}
          />
        )}

        {currentTab === 'cadastro' && (
          <ProcessFormScreen
            onSave={(novo) => {
              handleSaveProcesso(novo);
            }}
            onCancel={() => setCurrentTab('home')}
            cnpjs={allCnpjs}
            onAddCnpj={handleAddCnpj}
            currentUser={currentUser}
          />
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
            onNavigateToCadastro={() => setCurrentTab('cadastro')}
            onCreateExtensao={handleCreateExtensao}
            cnpjs={allCnpjs}
            onAddCnpj={handleAddCnpj}
            onDeleteCnpj={handleDeleteCnpj}
            searchTerm={searchQuery}
            onSearchTermChange={setSearchQuery}
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
        cnpjs={allCnpjs}
        onAddCnpj={handleAddCnpj}
        currentUser={currentUser}
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