import React, { useState, useMemo } from 'react';
import { Processo, ProcessoTipo, ProcessosSubTab } from '../types/process';
import {
  calcularDiasRestantes,
  calcularDiasSolicitacaoAteEmissao,
  estaParaRevalidar,
  formatarDataBR,
} from '../utils/processCalculations';
import { RevalidationAlertBanner } from './RevalidationAlertBanner';
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
  Plus
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

  // Counts for tabs
  const countEmEdicao = processos.filter(
    (p) => p.situacao === 'Em edição' || (!p.numeroLicenca && p.situacao !== 'Licença/Certidão emitida')
  ).length;

  const countEmTramitacao = processos.filter(
    (p) =>
      p.situacao === 'Encaminhada para o ibama' ||
      p.situacao === 'Em análise pelo Analista do ATC' ||
      p.situacao === 'A pagar'
  ).length;

  const countLicencasEmitidas = processos.filter(
    (p) => p.situacao === 'Licença/Certidão emitida' || !!p.numeroLicenca
  ).length;

  const countParaRevalidacao = processos.filter((p) =>
    estaParaRevalidar(p.dataValidade, p.situacao)
  ).length;

  const processosParaRevalidar = useMemo(() => {
    return processos.filter((p) => estaParaRevalidar(p.dataValidade, p.situacao));
  }, [processos]);

  // Filter processes according to subTab
  const subTabFiltered = useMemo(() => {
    switch (currentSubTab) {
      case 'em_edicao':
        return processos.filter(
          (p) =>
            p.situacao === 'Em edição' ||
            (!p.numeroLicenca && p.situacao !== 'Licença/Certidão emitida')
        );
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
      description: 'Sem licença emitida ainda',
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
      description: 'Acervo consolidado',
      count: processos.length,
      icon: Layers,
    },
  ];

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
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-2 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentSubTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onSubTabChange(tab.id)}
                className={`p-3 rounded-lg text-left transition-all relative flex flex-col justify-between ${
                  isActive
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-sm ring-1 ring-neutral-900 dark:ring-white'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#E30613]' : 'text-neutral-500 dark:text-neutral-400'}`} />
                    <span className="text-xs font-bold truncate">{tab.label}</span>
                  </div>
                  <span
                    className={`font-mono text-xs font-bold tabular-nums px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900'
                        : tab.urgent
                        ? 'bg-red-100 dark:bg-red-950/60 text-[#E30613] dark:text-red-400'
                        : 'bg-neutral-200/60 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
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

                {tab.urgent && !isActive && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#E30613] animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por número (SL/SD), MMV, tipo, veículo, número da licença ou observações..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#E30613] focus:border-transparent placeholder:text-neutral-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
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
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 focus:ring-2 focus:ring-[#E30613]"
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
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 focus:ring-2 focus:ring-[#E30613]"
            >
              <option value="todos">Toda Procedência</option>
              <option value="Nacional">Nacional</option>
              <option value="Importado">Importado</option>
            </select>

            {/* Sort by */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 focus:ring-2 focus:ring-[#E30613]"
            >
              <option value="recentes">Mais recentes</option>
              <option value="validade">Validade (Revalidação)</option>
              <option value="solicitacao">Nº Solicitação</option>
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(tipoFiltro || procedenciaFiltro !== 'todos' || searchTerm) && (
          <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400">
            <span className="font-semibold text-neutral-400">Filtros ativos:</span>
            {tipoFiltro && (
              <span className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-800 dark:text-neutral-200 font-semibold text-[11px]">
                Tipo: {tipoFiltro}
                <button onClick={() => onTipoFiltroChange && onTipoFiltroChange(null)} className="hover:text-red-600">×</button>
              </span>
            )}
            {procedenciaFiltro !== 'todos' && (
              <span className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-800 dark:text-neutral-200 font-semibold text-[11px]">
                {procedenciaFiltro}
                <button onClick={() => setProcedenciaFiltro('todos')} className="hover:text-red-600">×</button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-800 dark:text-neutral-200 font-semibold text-[11px]">
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
              className="text-[#E30613] hover:underline font-semibold text-[11px] ml-auto"
            >
              Limpar todos
            </button>
          </div>
        )}
      </div>

      {/* Vertical Gallery / List of Process Cards */}
      <div className="space-y-4">
        {sortedProcessos.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12 text-center shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              Nenhum processo encontrado nesta visualização
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
              Tente redefinir os filtros ou clique no botão abaixo para adicionar um novo processo no Infoserv.
            </p>
            <div className="pt-2">
              <button
                onClick={onNavigateToCadastro}
                className="px-4 py-2 bg-[#E30613] hover:bg-[#C40510] text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Novo Processo</span>
              </button>
            </div>
          </div>
        ) : (
          sortedProcessos.map((processo) => {
            // Calculations explicitly requested:
            // 1. Dias restantes: da data atual até a data de validade da licença
            const diasRestantes = calcularDiasRestantes(processo.dataValidade);
            const isEmitido = processo.situacao === 'Licença/Certidão emitida' || !!processo.numeroLicenca;
            const showDiasRestantes = isEmitido && !!processo.dataValidade && diasRestantes !== null;
            const isRevalidacaoAlerta = showDiasRestantes && diasRestantes <= 61;

            // 2. Dias da solicitação até a emissão: da data do envio até a data da emissão
            const calculoEnvioEmissao = calcularDiasSolicitacaoAteEmissao(
              processo.dataEnvio,
              processo.dataEmissao
            );

            return (
              <div
                key={processo.id}
                className={`bg-white dark:bg-neutral-900 border rounded-xl shadow-sm transition-all hover:shadow-md overflow-hidden ${
                  isRevalidacaoAlerta
                    ? 'border-red-300 dark:border-red-800 ring-1 ring-red-200 dark:ring-red-900/50'
                    : 'border-neutral-200 dark:border-neutral-800'
                }`}
              >
                {/* Header row of the card */}
                <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Solicitation number */}
                    <span className="font-mono text-sm sm:text-base font-extrabold text-[#E30613] tracking-tight">
                      {processo.numeroSolicitacao}
                    </span>
                    <span className="text-neutral-300 dark:text-neutral-700">·</span>
                    {/* Process Type */}
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 bg-neutral-200/70 dark:bg-neutral-800 px-2 py-0.5 rounded">
                      {processo.tipo}
                    </span>
                    {/* Provenance */}
                    <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/70 px-2 py-0.5 rounded">
                      {processo.procedencia}
                    </span>
                    {/* Vehicle Type */}
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                      {processo.tipoVeiculo}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 ${
                        processo.situacao === 'Licença/Certidão emitida'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : processo.situacao === 'Em edição'
                          ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700'
                          : processo.situacao === 'A pagar'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {processo.situacao}
                    </span>
                  </div>
                </div>

                {/* Body: All Process Fields */}
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Primary MMV & License block */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                        MMV (Marca / Modelo / Versão)
                      </div>
                      <div className="text-base font-extrabold text-neutral-900 dark:text-white tracking-tight mt-0.5">
                        {processo.mmv}
                      </div>

                      {processo.mmvOriginal && (
                        <div className="text-xs text-amber-900 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 rounded px-2 py-1 mt-1.5 inline-block">
                          <span className="font-bold">MMV Original Base:</span> {processo.mmvOriginal}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                        Número da Licença Infoserv
                      </div>
                      <div className="text-sm font-mono font-bold text-neutral-900 dark:text-white mt-0.5">
                        {processo.numeroLicenca ? (
                          <span className="text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 inline-block">
                            {processo.numeroLicenca}
                          </span>
                        ) : (
                          <span className="text-neutral-400 italic font-sans font-normal text-xs">
                            Ainda não emitida pelo IBAMA (Aguardando análise/taxa)
                          </span>
                        )}
                      </div>
                      {processo.quantidade && (
                        <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                          <span className="font-semibold text-neutral-500">Quantidade:</span>{' '}
                          {processo.quantidade}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dates Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-neutral-100 dark:border-neutral-800 text-xs">
                    <div>
                      <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase font-bold">
                        Data de Início
                      </span>
                      <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                        {formatarDataBR(processo.dataInicio)}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase font-bold">
                        Data do Envio
                      </span>
                      <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                        {formatarDataBR(processo.dataEnvio)}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase font-bold">
                        Data de Emissão
                      </span>
                      <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                        {formatarDataBR(processo.dataEmissao)}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase font-bold">
                        Validade da Licença
                      </span>
                      <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                        {formatarDataBR(processo.dataValidade)}
                      </span>
                    </div>
                  </div>

                  {/* Explicitly Requested Calculated Fields Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-50/70 dark:bg-neutral-800/50 rounded-xl p-3 border border-neutral-200/80 dark:border-neutral-700/80">
                    {/* Calculated 1: Dias restantes (até a validade da licença) */}
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                          isRevalidacaoAlerta
                            ? 'bg-red-100 dark:bg-red-950/60 text-[#E30613]'
                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {isRevalidacaoAlerta ? (
                          <AlertTriangle className="w-4 h-4 animate-bounce" />
                        ) : (
                          <Calendar className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Dias Restantes de Validade
                        </div>
                        {showDiasRestantes ? (
                          <div className="mt-0.5">
                            {diasRestantes <= 0 ? (
                              <span className="text-xs font-bold text-red-700 dark:text-red-400">
                                Licença expirada há {Math.abs(diasRestantes)} dias
                              </span>
                            ) : isRevalidacaoAlerta ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-extrabold text-sm text-[#E30613] dark:text-red-400 tabular-nums">
                                  {diasRestantes} dias restantes
                                </span>
                                <span className="text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-[#E30613] dark:text-red-300 px-1.5 py-0.2 rounded uppercase">
                                  Revalidação (≤ 61 dias)
                                </span>
                              </div>
                            ) : (
                              <span className="font-mono font-bold text-xs text-neutral-800 dark:text-neutral-200 tabular-nums">
                                {diasRestantes} dias até o vencimento
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-400 dark:text-neutral-500 italic">
                            Disponível após emissão e preenchimento da validade
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Calculated 2: Dias da solicitação até a emissão */}
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 shrink-0 mt-0.5">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Dias da Solicitação até a Emissão
                        </div>
                        {calculoEnvioEmissao ? (
                          <div className="mt-0.5">
                            {calculoEnvioEmissao.emitido ? (
                              <span className="font-mono font-bold text-xs text-emerald-800 dark:text-emerald-400 tabular-nums">
                                {calculoEnvioEmissao.dias} dias decorridos do envio à emissão
                              </span>
                            ) : (
                              <span className="font-mono font-bold text-xs text-amber-800 dark:text-amber-400 tabular-nums">
                                {calculoEnvioEmissao.dias} dias em análise (aguardando emissão)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-400 dark:text-neutral-500 italic">
                            Aguardando registro da data de envio
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions: Message observations icon + Edit & Delete */}
                <div className="p-3 sm:px-5 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  {/* Requested Message Icon button for observations */}
                  <button
                    onClick={() => onOpenObservations(processo)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-colors shadow-sm group"
                    title="Abrir Histórico de Observações"
                  >
                    <MessageSquare className="w-4 h-4 text-[#E30613] group-hover:scale-110 transition-transform" />
                    <span>Observações</span>
                    <span className="font-mono text-[11px] bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 px-1.5 py-0.2 rounded-full font-bold">
                      {processo.observacoes?.length || 0}
                    </span>
                  </button>

                  {/* Edit and Delete Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditProcesso(processo)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-colors"
                      title="Editar processo e preencher número da licença"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
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
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Excluir processo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
