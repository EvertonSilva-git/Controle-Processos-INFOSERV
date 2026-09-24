import React, { useState, useMemo } from 'react';
import { Processo, ProcessoTipo, ProcessosSubTab } from '../types/process';
import {
  calcularDiasRestantes,
  calcularDiasSolicitacaoAteEmissao,
  estaParaRevalidar,
  formatarDataBR,
} from '../utils/processCalculations';
import { RevalidationAlertBanner } from './RevalidationAlertBanner';
import { ClassificationTypesBar } from './ClassificationTypesBar';
import {
  Search,
  MessageSquare,
  Edit3,
  Trash2,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  Layers,
  ArrowUpDown,
  Car,
  FileText,
  AlertCircle,
  Plus,
  X
} from 'lucide-react';

interface ProcessesScreenProps {
  processos: Processo[];
  currentSubTab: ProcessosSubTab;
  onSubTabChange: (subTab: ProcessosSubTab) => void;
  tipoFiltro?: ProcessoTipo | null;
  onTipoFiltroChange?: (tipo: ProcessoTipo | null) => void;
  onOpenObservations: (processo: Processo) => void;
  onEditProcesso: (processo: Processo) => void;
  onDeleteProcesso: (processoId: string) => void;
  onNavigateToCadastro: () => void;
}

export const ProcessesScreen: React.FC<ProcessesScreenProps> = ({
  processos,
  currentSubTab,
  onSubTabChange,
  tipoFiltro,
  onTipoFiltroChange,
  onOpenObservations,
  onEditProcesso,
  onDeleteProcesso,
  onNavigateToCadastro,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [procedenciaFiltro, setProcedenciaFiltro] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'recentes' | 'validade' | 'solicitacao'>('recentes');

  // Counts for tabs - clean and without overlap
  const countEmEdicao = useMemo(
    () => processos.filter((p) => p.situacao === 'Em edição').length,
    [processos]
  );

  const countEmTramitacao = useMemo(
    () =>
      processos.filter(
        (p) =>
          p.situacao === 'Encaminhada para o ibama' ||
          p.situacao === 'Em análise pelo Analista do ATC' ||
          p.situacao === 'A pagar'
      ).length,
    [processos]
  );

  const countLicencasEmitidas = useMemo(
    () =>
      processos.filter(
        (p) => p.situacao === 'Licença/Certidão emitida' || !!p.numeroLicenca
      ).length,
    [processos]
  );

  const countParaRevalidacao = useMemo(
    () => processos.filter((p) => estaParaRevalidar(p.dataValidade, p.situacao)).length,
    [processos]
  );

  const processosParaRevalidar = useMemo(() => {
    return processos.filter((p) => estaParaRevalidar(p.dataValidade, p.situacao));
  }, [processos]);

  // Filter processes according to subTab
  const subTabFiltered = useMemo(() => {
    switch (currentSubTab) {
      case 'em_edicao':
        return processos.filter((p) => p.situacao === 'Em edição');
      case 'em_tramitacao':
        return processos.filter(
          (p) =>
            p.situacao === 'Encaminhada para o ibama' ||
            p.situacao === 'Em análise pelo Analista do ATC' ||
            p.situacao === 'A pagar'
        );
      case 'licencas_emitidas':
        return processos.filter(
          (p) => p.situacao === 'Licença/Certidão emitida' || !!p.numeroLicenca
        );
      case 'para_revalidacao':
        return processos.filter((p) =>
          estaParaRevalidar(p.dataValidade, p.situacao)
        );
      case 'todos':
      default:
        return processos;
    }
  }, [processos, currentSubTab]);

  // Apply search, type, and provenance filters
  const finalFiltered = useMemo(() => {
    return subTabFiltered.filter((p) => {
      // Text search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesSol = p.numeroSolicitacao.toLowerCase().includes(query);
        const matchesMMV = p.mmv.toLowerCase().includes(query);
        const matchesLic = p.numeroLicenca ? p.numeroLicenca.toLowerCase().includes(query) : false;
        const matchesOrig = p.mmvOriginal ? p.mmvOriginal.toLowerCase().includes(query) : false;
        const matchesVeic = p.tipoVeiculo.toLowerCase().includes(query);
        const matchesObs = p.observacoes.some((obs) => obs.texto.toLowerCase().includes(query));

        if (!matchesSol && !matchesMMV && !matchesLic && !matchesOrig && !matchesVeic && !matchesObs) {
          return false;
        }
      }

      // Tipo filter
      if (tipoFiltro && p.tipo !== tipoFiltro) {
        return false;
      }

      // Procedencia filter
      if (procedenciaFiltro !== 'todos' && p.procedencia !== procedenciaFiltro) {
        return false;
      }

      return true;
    });
  }, [subTabFiltered, searchTerm, tipoFiltro, procedenciaFiltro]);

  // Sorting
  const sortedProcessos = useMemo(() => {
    return [...finalFiltered].sort((a, b) => {
      if (sortBy === 'validade') {
        const diasA = calcularDiasRestantes(a.dataValidade) ?? 9999;
        const diasB = calcularDiasRestantes(b.dataValidade) ?? 9999;
        return diasA - diasB;
      }
      if (sortBy === 'solicitacao') {
        return a.numeroSolicitacao.localeCompare(b.numeroSolicitacao);
      }
      // recentes default
      return new Date(b.atualizadoEm || b.criadoEm).getTime() - new Date(a.atualizadoEm || a.criadoEm).getTime();
    });
  }, [finalFiltered, sortBy]);

  // Tab definitions
  const subTabs = [
    {
      id: 'em_edicao' as ProcessosSubTab,
      label: 'Em Edição',
      description: 'Em elaboração interna',
      count: countEmEdicao,
      icon: Clock,
    },
    {
      id: 'em_tramitacao' as ProcessosSubTab,
      label: 'Em Análise / A pagar',
      description: 'Encaminhada ao IBAMA ou ATC',
      count: countEmTramitacao,
      icon: FileText,
    },
    {
      id: 'licencas_emitidas' as ProcessosSubTab,
      label: 'Licenças Emitidas',
      description: 'Concluídas com certidão',
      count: countLicencasEmitidas,
      icon: CheckCircle2,
    },
    {
      id: 'para_revalidacao' as ProcessosSubTab,
      label: 'Para Revalidação',
      description: 'Vencimento em ≤ 61 dias',
      count: countParaRevalidacao,
      icon: AlertTriangle,
      urgent: countParaRevalidacao > 0,
    },
    {
      id: 'todos' as ProcessosSubTab,
      label: 'Todos os Processos',
      description: 'Visão geral consolidada',
      count: processos.length,
      icon: Layers,
    },
  ];

  const getSituacaoStyle = (situacao: string) => {
    switch (situacao) {
      case 'Licença/Certidão emitida':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/40';
      case 'Encaminhada para o ibama':
        return 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/40';
      case 'Em análise pelo Analista do ATC':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/40';
      case 'A pagar':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/40';
      case 'Em edição':
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Alerta de Licenças para Revalidação */}
      {currentSubTab !== 'para_revalidacao' && processosParaRevalidar.length > 0 && (
        <RevalidationAlertBanner
          processosRevalidar={processosParaRevalidar}
          onVerProcessosRevalidacao={() => onSubTabChange('para_revalidacao')}
          onSelecionarProcesso={(proc) => onEditProcesso(proc)}
        />
      )}

      {/* Sub-screens Navigation Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-1.5 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentSubTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onSubTabChange(tab.id)}
                className={`p-3 rounded-lg text-left transition-colors relative flex flex-col justify-between ${
                  isActive
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#E30613]' : 'text-neutral-400'}`} />
                    <span className="text-xs font-semibold truncate">{tab.label}</span>
                  </div>
                  <span
                    className={`font-mono text-xs font-semibold tabular-nums px-1.5 py-0.2 rounded ${
                      isActive
                        ? 'bg-neutral-800 text-neutral-100 dark:bg-neutral-200 dark:text-neutral-900'
                        : tab.urgent
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </div>
                <div
                  className={`text-[10px] truncate ${
                    isActive ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-400'
                  }`}
                >
                  {tab.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Classificação por Tipo de Homologação (LCVM, LCM, Especial, Dispensa, Extensão) */}
      <ClassificationTypesBar
        processos={processos}
        selectedTipo={tipoFiltro}
        onSelectTipo={(tipo) => onTipoFiltroChange && onTipoFiltroChange(tipo)}
        onEditProcesso={onEditProcesso}
        onOpenObservations={onOpenObservations}
        onNavigateToCadastro={onNavigateToCadastro}
      />

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por número (SL/SD), MMV, tipo, veículo, licença..."
              className="w-full pl-9 pr-16 py-2 text-xs sm:text-sm border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500 placeholder:text-neutral-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Tipo */}
            <select
              value={tipoFiltro || ''}
              onChange={(e) =>
                onTipoFiltroChange && onTipoFiltroChange(e.target.value ? (e.target.value as ProcessoTipo) : null)
              }
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            >
              <option value="">Todos os Tipos</option>
              <option value="LCVM">LCVM</option>
              <option value="LCVM Especial">LCVM Especial</option>
              <option value="LCM">LCM</option>
              <option value="LCM Especial">LCM Especial</option>
              <option value="Dispensa">Dispensa</option>
              <option value="Extensão">Extensão</option>
            </select>

            {/* Filter by Procedência */}
            <select
              value={procedenciaFiltro}
              onChange={(e) => setProcedenciaFiltro(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            >
              <option value="todos">Toda Procedência</option>
              <option value="Nacional">Nacional</option>
              <option value="Importado">Importado</option>
            </select>

            {/* Sort by */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            >
              <option value="recentes">Mais recentes</option>
              <option value="validade">Validade (Revalidação)</option>
              <option value="solicitacao">Nº Solicitação</option>
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(tipoFiltro || procedenciaFiltro !== 'todos' || searchTerm) && (
          <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500">
            <span className="font-medium">Filtros:</span>
            {tipoFiltro && (
              <span className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-700 dark:text-neutral-300 font-medium text-[11px]">
                Tipo: {tipoFiltro}
                <button onClick={() => onTipoFiltroChange && onTipoFiltroChange(null)} className="hover:text-red-600">×</button>
              </span>
            )}
            {procedenciaFiltro !== 'todos' && (
              <span className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-700 dark:text-neutral-300 font-medium text-[11px]">
                {procedenciaFiltro}
                <button onClick={() => setProcedenciaFiltro('todos')} className="hover:text-red-600">×</button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-700 dark:text-neutral-300 font-medium text-[11px]">
                Busca: "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="hover:text-red-600">×</button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setProcedenciaFiltro('todos');
                if (onTipoFiltroChange) onTipoFiltroChange(null);
              }}
              className="text-[#E30613] hover:underline font-medium text-[11px] ml-auto"
            >
              Limpar todos
            </button>
          </div>
        )}
      </div>

      {/* Vertical List of Process Cards */}
      <div className="space-y-3.5">
        {sortedProcessos.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-10 text-center shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Nenhum processo encontrado nesta visualização
            </h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Tente redefinir os filtros ou clique abaixo para cadastrar um novo processo no Infoserv.
            </p>
            <div className="pt-2">
              <button
                onClick={onNavigateToCadastro}
                className="px-3.5 py-1.5 bg-[#E30613] hover:bg-[#c70510] text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Processo</span>
              </button>
            </div>
          </div>
        ) : (
          sortedProcessos.map((processo) => {
            const diasRestantes = calcularDiasRestantes(processo.dataValidade);
            const isEmitido = processo.situacao === 'Licença/Certidão emitida' || !!processo.numeroLicenca;
            const showDiasRestantes = isEmitido && !!processo.dataValidade && diasRestantes !== null;
            const isRevalidacaoAlerta = showDiasRestantes && diasRestantes <= 61;

            const calculoEnvioEmissao = calcularDiasSolicitacaoAteEmissao(
              processo.dataEnvio,
              processo.dataEmissao
            );

            return (
              <div
                key={processo.id}
                className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl shadow-xs transition-colors overflow-hidden"
              >
                {/* Header row of the card */}
                <div className="p-3.5 sm:p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Solicitation number */}
                    <span className="font-mono text-sm font-bold text-neutral-900 dark:text-white">
                      {processo.numeroSolicitacao}
                    </span>
                    <span className="text-neutral-300 dark:text-neutral-700">·</span>
                    {/* Process Type */}
                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                      {processo.tipo}
                    </span>
                    {/* Provenance */}
                    <span className="text-xs font-medium text-neutral-500 bg-neutral-100/70 dark:bg-neutral-800/70 px-2 py-0.5 rounded">
                      {processo.procedencia}
                    </span>
                    {/* Vehicle Type */}
                    <span className="text-xs text-neutral-500 font-normal">
                      {processo.tipoVeiculo}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5 ${getSituacaoStyle(
                        processo.situacao
                      )}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                      {processo.situacao}
                    </span>
                  </div>
                </div>

                {/* Body: Process Fields */}
                <div className="p-4 sm:p-5 space-y-3.5">
                  {/* Primary MMV & License block */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                        MMV (Marca / Modelo / Versão)
                      </div>
                      <div className="text-base font-bold text-neutral-900 dark:text-white tracking-tight mt-0.5">
                        {processo.mmv}
                      </div>

                      {processo.mmvOriginal && (
                        <div className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded px-2 py-0.5 mt-1 inline-block">
                          <span className="font-semibold">Base:</span> {processo.mmvOriginal}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                        Número da Licença Infoserv
                      </div>
                      <div className="text-sm font-mono font-medium text-neutral-900 dark:text-white mt-0.5">
                        {processo.numeroLicenca ? (
                          <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/80 dark:border-emerald-800 inline-block font-semibold">
                            {processo.numeroLicenca}
                          </span>
                        ) : (
                          <span className="text-neutral-400 italic font-sans font-normal text-xs">
                            Ainda não emitida pelo IBAMA
                          </span>
                        )}
                      </div>
                      {processo.quantidade && (
                        <div className="text-xs text-neutral-500 mt-1">
                          <span className="font-medium text-neutral-400">Quantidade:</span>{' '}
                          {processo.quantidade}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dates Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2.5 border-y border-neutral-100 dark:border-neutral-800 text-xs">
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase font-medium">
                        Data de Início
                      </span>
                      <span className="font-mono text-neutral-700 dark:text-neutral-300">
                        {formatarDataBR(processo.dataInicio)}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase font-medium">
                        Data do Envio
                      </span>
                      <span className="font-mono text-neutral-700 dark:text-neutral-300">
                        {formatarDataBR(processo.dataEnvio)}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase font-medium">
                        Data de Emissão
                      </span>
                      <span className="font-mono text-neutral-700 dark:text-neutral-300">
                        {formatarDataBR(processo.dataEmissao)}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase font-medium">
                        Validade da Licença
                      </span>
                      <span className="font-mono text-neutral-700 dark:text-neutral-300">
                        {formatarDataBR(processo.dataValidade)}
                      </span>
                    </div>
                  </div>

                  {/* Calculated Fields Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-50/70 dark:bg-neutral-800/40 rounded-lg p-3 border border-neutral-200/70 dark:border-neutral-700/60">
                    {/* Calculated 1: Dias restantes */}
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 shrink-0 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">
                          Dias Restantes de Validade
                        </div>
                        {showDiasRestantes ? (
                          <div className="text-xs font-medium text-neutral-800 dark:text-neutral-200 mt-0.5">
                            {diasRestantes <= 0 ? (
                              <span className="font-bold text-rose-700 dark:text-rose-400">
                                Licença Vencida ({Math.abs(diasRestantes)} dias atrás)
                              </span>
                            ) : (
                              <span>
                                <strong className={`font-mono text-sm ${isRevalidacaoAlerta ? 'text-amber-800 dark:text-amber-300 font-bold' : ''}`}>
                                  {diasRestantes}
                                </strong>{' '}
                                dias até expirar
                                {isRevalidacaoAlerta && (
                                  <span className="ml-1 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                                    (Revalidação necessária)
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-neutral-400 italic mt-0.5">
                            Calculado após emissão da licença
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Calculated 2: Dias da solicitação até a emissão */}
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 shrink-0 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">
                          Prazo da Solicitação até Emissão
                        </div>
                        {calculoEnvioEmissao ? (
                          <div className="text-xs text-neutral-800 dark:text-neutral-200 mt-0.5">
                            <strong className="font-mono text-sm">{calculoEnvioEmissao.dias}</strong>{' '}
                            dias {calculoEnvioEmissao.emitido ? 'corridos até a emissão oficial' : 'em análise desde o envio'}
                          </div>
                        ) : (
                          <div className="text-xs text-neutral-400 italic mt-0.5">
                            Aguardando data de envio ao IBAMA
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Observations bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <button
                      onClick={() => onOpenObservations(processo)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
                      <span>
                        Observações ({processo.observacoes?.length || 0})
                      </span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEditProcesso(processo)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-colors inline-flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#E30613]" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Deseja realmente remover o processo ${processo.numeroSolicitacao} (${processo.mmv})?`
                            )
                          ) {
                            onDeleteProcesso(processo.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Remover processo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
