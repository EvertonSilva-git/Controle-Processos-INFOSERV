import React, { useState, useEffect } from 'react';
import { Processo, ProcessoTipo, ProcessosSubTab } from './types/process';
import { INITIAL_PROCESSOS } from './data/initialData';
import { estaParaRevalidar } from './utils/processCalculations';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { ProcessFormScreen } from './components/ProcessFormScreen';
import { ProcessesScreen } from './components/ProcessesScreen';
import { ObservationModal } from './components/ObservationModal';
import { EditProcessModal } from './components/EditProcessModal';
import { LogoManagerModal } from './components/LogoManagerModal';

const STORAGE_KEY = 'shineray_infoserv_processos_v1';
const THEME_STORAGE_KEY = 'shineray_infoserv_theme';
const LOGO_LIGHT_STORAGE_KEY = 'shineray_custom_logo_light';
const LOGO_DARK_STORAGE_KEY = 'shineray_custom_logo_dark';
const LEGACY_LOGO_STORAGE_KEY = 'shineray_custom_logo';

export default function App() {
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

  // Dual Custom Logo states: Light and Dark
  const [customLogoLight, setCustomLogoLight] = useState<string | null>(() => {
    try {
      return (
        localStorage.getItem(LOGO_LIGHT_STORAGE_KEY) ||
        localStorage.getItem(LEGACY_LOGO_STORAGE_KEY) ||
        null
      );
    } catch {
      return null;
    }
  });

  const [customLogoDark, setCustomLogoDark] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LOGO_DARK_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

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

  const handleSaveLogos = (lightUrl: string | null, darkUrl: string | null) => {
    setCustomLogoLight(lightUrl);
    setCustomLogoDark(darkUrl);
    try {
      if (lightUrl) {
        localStorage.setItem(LOGO_LIGHT_STORAGE_KEY, lightUrl);
        localStorage.setItem(LEGACY_LOGO_STORAGE_KEY, lightUrl);
      } else {
        localStorage.removeItem(LOGO_LIGHT_STORAGE_KEY);
        localStorage.removeItem(LEGACY_LOGO_STORAGE_KEY);
      }

      if (darkUrl) {
        localStorage.setItem(LOGO_DARK_STORAGE_KEY, darkUrl);
      } else {
        localStorage.removeItem(LOGO_DARK_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Erro ao salvar logos no localStorage:', e);
    }
  };

  // Load initial state from localStorage or seed
  const [processos, setProcessos] = useState<Processo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Erro ao recuperar dados do localStorage:', err);
    }
    return INITIAL_PROCESSOS;
  });

  // Navigation
  const [currentTab, setCurrentTab] = useState<'home' | 'processos' | 'cadastro'>('home');
  const [currentSubTab, setCurrentSubTab] = useState<ProcessosSubTab>('todos');
  const [tipoFiltro, setTipoFiltro] = useState<ProcessoTipo | null>(null);

  // Modals
  const [observacaoModalProcesso, setObservacaoModalProcesso] = useState<Processo | null>(null);
  const [editModalProcesso, setEditModalProcesso] = useState<Processo | null>(null);

  // Save to localStorage whenever processos change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(processos));
    } catch (err) {
      console.error('Erro ao salvar no localStorage:', err);
    }
  }, [processos]);

  // Handlers for Processos
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

    // Update opened modal process if active
    if (observacaoModalProcesso?.id === novoOuAtualizado.id) {
      setObservacaoModalProcesso(novoOuAtualizado);
    }

    // Switch to processes screen
    setCurrentTab('processos');
  };

  const handleDeleteProcesso = (processoId: string) => {
    setProcessos((prev) => prev.filter((p) => p.id !== processoId));
    if (observacaoModalProcesso?.id === processoId) {
      setObservacaoModalProcesso(null);
    }
  };

  // Add observation note
  const handleAddObservacao = (processoId: string, texto: string) => {
    const agora = new Date().toISOString();
    setProcessos((prev) =>
      prev.map((p) => {
        if (p.id !== processoId) return p;
        const novaObs = {
          id: `obs-${Date.now()}`,
          texto,
          dataHora: agora,
          autor: 'Analista de Homologação Shineray',
        };
        const updated = {
          ...p,
          observacoes: [...(p.observacoes || []), novaObs],
          atualizadoEm: agora,
        };
        // keep modal updated
        setObservacaoModalProcesso(updated);
        return updated;
      })
    );
  };

  // Delete single observation
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

  // Export data
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

  // Reset to initial seed
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

  // Total para revalidação
  const totalRevalidar = processos.filter((p) =>
    estaParaRevalidar(p.dataValidade, p.situacao)
  ).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] flex flex-col font-sans text-neutral-900 dark:text-neutral-100 selection:bg-[#E30613]/10 selection:text-[#E30613] transition-colors">
      {/* Top Bar Contract (Wordmark - Links - Primary Action) */}
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
        onExport={handleExportData}
        onResetData={handleResetData}
        theme={theme}
        onToggleTheme={toggleTheme}
        customLogoLight={customLogoLight}
        customLogoDark={customLogoDark}
        onOpenLogoManager={() => setIsLogoModalOpen(true)}
      />

      {/* Main Content Viewport */}
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
          />
        )}
      </main>

      {/* Logo Manager Modal (Dual Light/Dark Logo Support) */}
      <LogoManagerModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        customLogoLight={customLogoLight}
        customLogoDark={customLogoDark}
        currentTheme={theme}
        onSaveLogos={handleSaveLogos}
      />

      {/* Observation History Modal */}
      <ObservationModal
        processo={observacaoModalProcesso}
        isOpen={!!observacaoModalProcesso}
        onClose={() => setObservacaoModalProcesso(null)}
        onAddObservacao={handleAddObservacao}
        onDeleteObservacao={handleDeleteObservacao}
      />

      {/* Edit Process Modal */}
      <EditProcessModal
        processo={editModalProcesso}
        isOpen={!!editModalProcesso}
        onClose={() => setEditModalProcesso(null)}
        onSave={(updated) => handleSaveProcesso(updated)}
      />

      {/* Quiet Footer */}
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
