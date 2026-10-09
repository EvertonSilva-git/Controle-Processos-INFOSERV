import React, { useState, useMemo } from 'react';
import { Processo, ProcessoTipo, Procedencia, OrgaoCertificador, formatarCNPJ } from '../types/process';
import {
  calcularDiasSolicitacaoAteEmissao,
  formatarDataBR,
} from '../utils/processCalculations';
import { exportarProcessosExcel } from '../utils/exportExcel';
import {
  Clock,
  Timer,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  Calculator,
  Layers,
  Sparkles,
  GitBranch,
  Edit3,
  MessageSquare,
  Zap,
  BarChart2,
} from 'lucide-react';

interface IssuanceTimeComparisonScreenProps {
  processos: Processo[];
  onEditProcesso: (processo: Processo) => void;
  onOpenObservations: (processo: Processo) => void;
  onNavigateToCadastro?: () => void;
}

export const IssuanceTimeComparisonScreen: React.FC<IssuanceTimeComparisonScreenProps> = ({
  processos,
  onEditProcesso,
  onOpenObservations,
}) => {
  // Filtros locais da subtela analítica
  const [filtroOrgao, setFiltroOrgao] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroProcedencia, setFiltroProcedencia] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'emitidas' | 'em_analise'>('todos');
  const [busca, setBusca] = useState<string>('');
  const [ordenacao, setOrdenacao] = useState<'prazo_desc' | 'prazo_asc' | 'envio_desc' | 'solicitacao'>('prazo_desc');

  // Estado da Calculadora de Previsão de Emissão
  const [calcOrgao, setCalcOrgao] = useState<OrgaoCertificador>('IMT');
  const [calcTipo, setCalcTipo] = useState<ProcessoTipo>('LCVM');
  const [calcDataEnvio, setCalcDataEnvio] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // 1. Processos que já possuem data de envio e data de emissão (Amostra histórica concluída)
  const emitidosComEnvio = useMemo(() => {
    return processos
      .filter((p) => p.dataEnvio && p.dataEmissao)
      .map((p) => {
        const calculo = calcularDiasSolicitacaoAteEmissao(p.dataEnvio, p.dataEmissao);
        const dias = calculo ? calculo.dias : 0;
        return {
          ...p,
          diasAteEmissao: dias,
          mesesAteEmissao: (dias / 30).toFixed(1),
        };
      });
  }, [processos]);

  // 2. Processos atualmente em trâmite com data de envio (Aguardando emissão)
  const emAndamentoComEnvio = useMemo(() => {
    return processos
      .filter((p) => p.dataEnvio && !p.dataEmissao)
      .map((p) => {
        const calculo = calcularDiasSolicitacaoAteEmissao(p.dataEnvio);
        const diasDecorridos = calculo ? calculo.dias : 0;
        return {
          ...p,
          diasDecorridos,
          mesesDecorridos: (diasDecorridos / 30).toFixed(1),
        };
      });
  }, [processos]);

  // 3. Métricas Gerais Consolidadas
  const metricasGerais = useMemo(() => {
    if (emitidosComEnvio.length === 0) {
      return {
        mediaGeral: 0,
        medianaGeral: 0,
        minimo: null,
        maximo: null,
        total: 0,
      };
    }

    const soma = emitidosComEnvio.reduce((acc, curr) => acc + curr.diasAteEmissao, 0);
    const media = Math.round(soma / emitidosComEnvio.length);

    // Mediana
    const ordenados = [...emitidosComEnvio].sort((a, b) => a.diasAteEmissao - b.diasAteEmissao);
    const meio = Math.floor(ordenados.length / 2);
    const mediana =
      ordenados.length % 2 !== 0
        ? ordenados[meio].diasAteEmissao
        : Math.round((ordenados[meio - 1].diasAteEmissao + ordenados[meio].diasAteEmissao) / 2);

    const minimo = ordenados[0];
    const maximo = ordenados[ordenados.length - 1];

    return {
      mediaGeral: media,
      medianaGeral: mediana,
      minimo,
      maximo,
      total: emitidosComEnvio.length,
    };
  }, [emitidosComEnvio]);

  // 4. Comparativo por Órgão Técnico (IMT vs CETESB)
  const metricasPorOrgao = useMemo(() => {
    const imtItens = emitidosComEnvio.filter((p) => p.orgaoCertificador === 'IMT');
    const cetesbItens = emitidosComEnvio.filter((p) => p.orgaoCertificador === 'CETESB');

    const calcStats = (lista: typeof emitidosComEnvio) => {
      if (lista.length === 0) return { media: 0, min: 0, max: 0, total: 0 };
      const soma = lista.reduce((acc, curr) => acc + curr.diasAteEmissao, 0);
      const ordenados = [...lista].sort((a, b) => a.diasAteEmissao - b.diasAteEmissao);
      return {
        media: Math.round(soma / lista.length),
        min: ordenados[0].diasAteEmissao,
        max: ordenados[ordenados.length - 1].diasAteEmissao,
        total: lista.length,
      };
    };

    const imtStats = calcStats(imtItens);
    const cetesbStats = calcStats(cetesbItens);

    const diferencaDias = Math.abs(imtStats.media - cetesbStats.media);
    const orgaoMaisRapido =
      imtStats.media > 0 && cetesbStats.media > 0
        ? imtStats.media <= cetesbStats.media
          ? 'IMT'
          : 'CETESB'
        : imtStats.media > 0
        ? 'IMT'
        : 'CETESB';

    return {
      imt: imtStats,
      cetesb: cetesbStats,
      diferencaDias,
      orgaoMaisRapido,
    };
  }, [emitidosComEnvio]);

  // 5. Comparativo por Tipo de Homologação (LCVM, LCM, Especial, Dispensa, Extensão)
  const metricasPorTipo = useMemo(() => {
    const tiposDisponiveis: ProcessoTipo[] = [
      'LCVM',
      'LCVM Especial',
      'LCM',
      'LCM Especial',
      'Dispensa',
      'Extensão',
    ];

    return tiposDisponiveis
      .map((tipo) => {
        const itens = emitidosComEnvio.filter((p) => p.tipo === tipo);
        if (itens.length === 0) {
          return {
            tipo,
            total: 0,
            media: 0,
            min: 0,
            max: 0,
          };
        }
        const soma = itens.reduce((acc, curr) => acc + curr.diasAteEmissao, 0);
        const ordenados = [...itens].sort((a, b) => a.diasAteEmissao - b.diasAteEmissao);
        return {
          tipo,
          total: itens.length,
          media: Math.round(soma / itens.length),
          min: ordenados[0].diasAteEmissao,
          max: ordenados[ordenados.length - 1].diasAteEmissao,
        };
      })
      .filter((t) => t.total > 0 || metricasGerais.total > 0);
  }, [emitidosComEnvio, metricasGerais.total]);

  // 6. Comparativo por Procedência (Nacional vs Importado)
  const metricasPorProcedencia = useMemo(() => {
    const nacional = emitidosComEnvio.filter((p) => p.procedencia === 'Nacional');
    const importado = emitidosComEnvio.filter((p) => p.procedencia === 'Importado');

    const getAvg = (list: typeof emitidosComEnvio) => {
      if (list.length === 0) return 0;
      return Math.round(list.reduce((acc, c) => acc + c.diasAteEmissao, 0) / list.length);
    };

    return {
      nacionalMedia: getAvg(nacional),
      nacionalTotal: nacional.length,
      importadoMedia: getAvg(importado),
      importadoTotal: importado.length,
    };
  }, [emitidosComEnvio]);

  // 7. Estimador / Calculadora de Emissão com base nas médias históricas
  const previsaoCalculada = useMemo(() => {
    if (!calcDataEnvio) return null;

    // Buscar média histórica específica para o órgão + tipo selecionado
    const historicoCombinado = emitidosComEnvio.filter(
      (p) => p.orgaoCertificador === calcOrgao && p.tipo === calcTipo
    );

    let diasEstimados = metricasGerais.mediaGeral || 45;

    if (historicoCombinado.length > 0) {
      const soma = historicoCombinado.reduce((acc, p) => acc + p.diasAteEmissao, 0);
      diasEstimados = Math.round(soma / historicoCombinado.length);
    } else {
      // Se não houver amostra conjunta, usar média do órgão
      const orgaoAvg =
        calcOrgao === 'IMT' ? metricasPorOrgao.imt.media : metricasPorOrgao.cetesb.media;
      if (orgaoAvg > 0) diasEstimados = orgaoAvg;
    }

    try {
      const [ano, mes, dia] = calcDataEnvio.split('-').map(Number);
      const envioDate = new Date(ano, mes - 1, dia);
      const previsaoDate = new Date(envioDate);
      previsaoDate.setDate(previsaoDate.getDate() + diasEstimados);

      const minDate = new Date(envioDate);
      minDate.setDate(minDate.getDate() + Math.max(15, diasEstimados - 12));

      const maxDate = new Date(envioDate);
      maxDate.setDate(maxDate.getDate() + diasEstimados + 15);

      const fmt = (d: Date) =>
        `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

      return {
        diasEstimados,
        amostras: historicoCombinado.length,
        dataEstimadaFormatada: fmt(previsaoDate),
        janelaMinFormatada: fmt(minDate),
        janelaMaxFormatada: fmt(maxDate),
      };
    } catch {
      return null;
    }
  }, [calcDataEnvio, calcOrgao, calcTipo, emitidosComEnvio, metricasGerais, metricasPorOrgao]);

  // 8. Lista Filtrada e Ordenada de Todos os Processos com Envio (Emitidos e Em Andamento)
  const listaConsolidadaProcessos = useMemo(() => {
    // Unir emitidos e em andamento
    const todosComEnvio = [
      ...emitidosComEnvio.map((p) => ({
        ...p,
        isConcluido: true,
        diasCalculados: p.diasAteEmissao,
        statusLabel: 'Licença Emitida',
      })),
      ...emAndamentoComEnvio.map((p) => ({
        ...p,
        isConcluido: false,
        diasCalculados: p.diasDecorridos,
        statusLabel: p.situacao,
      })),
    ];

    // Aplicar filtros
    const filtrados = todosComEnvio.filter((p) => {
      // Filtro Órgão
      if (filtroOrgao !== 'todos' && p.orgaoCertificador !== filtroOrgao) {
        return false;
      }
      // Filtro Tipo
      if (filtroTipo !== 'todos' && p.tipo !== filtroTipo) {
        return false;
      }
      // Filtro Procedência
      if (filtroProcedencia !== 'todos' && p.procedencia !== filtroProcedencia) {
        return false;
      }
      // Filtro Status
      if (filtroStatus === 'emitidas' && !p.isConcluido) {
        return false;
      }
      if (filtroStatus === 'em_analise' && p.isConcluido) {
        return false;
      }
      // Busca Textual
      if (busca.trim()) {
        const q = busca.toLowerCase().trim();
        const matchesSol = p.numeroSolicitacao.toLowerCase().includes(q);
        const matchesMMV = p.mmv.toLowerCase().includes(q);
        const matchesLic = p.numeroLicenca ? p.numeroLicenca.toLowerCase().includes(q) : false;
        const matchesTipo = p.tipo.toLowerCase().includes(q);
        if (!matchesSol && !matchesMMV && !matchesLic && !matchesTipo) {
          return false;
        }
      }
      return true;
    });

    // Ordenação
    return filtrados.sort((a, b) => {
      if (ordenacao === 'prazo_desc') {
        return b.diasCalculados - a.diasCalculados;
      }
      if (ordenacao === 'prazo_asc') {
        return a.diasCalculados - b.diasCalculados;
      }
      if (ordenacao === 'envio_desc') {
        return new Date(b.dataEnvio || '').getTime() - new Date(a.dataEnvio || '').getTime();
      }
      if (ordenacao === 'solicitacao') {
        return a.numeroSolicitacao.localeCompare(b.numeroSolicitacao);
      }
      return 0;
    });
  }, [
    emitidosComEnvio,
    emAndamentoComEnvio,
    filtroOrgao,
    filtroTipo,
    filtroProcedencia,
    filtroStatus,
    busca,
    ordenacao,
  ]);

  return (
    <div className="space-y-6">
      {/* 1. Header do Painel Analítico de Prazos */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/60 text-[#E30613] flex items-center justify-center">
              <Timer className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Comparativo & Médias de Tempo de Emissão
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-3xl leading-relaxed">
            Métricas de desempenho calculadas com base no tempo decorrido desde o envio da documentação
            ao órgão técnico (<span className="font-semibold text-neutral-700 dark:text-neutral-300">IMT / CETESB</span>) até a emissão oficial da licença pelo <span className="font-semibold text-neutral-700 dark:text-neutral-300">IBAMA</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => exportarProcessosExcel(processos)}
            title="Baixar planilha completa com dados e prazos em formato Excel (.xlsx)"
            className="px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Exportar Relatório Excel</span>
          </button>
        </div>
      </div>

      {/* 2. Top KPI Cards - Indicadores Executivos de Desempenho */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Média Geral de Emissão */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-semibold mb-2">
            <span>MÉDIA GERAL DE EMISSÃO</span>
            <Clock className="w-4 h-4 text-[#E30613]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tabular-nums tracking-tight">
                {metricasGerais.mediaGeral}
              </span>
              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">dias corridos</span>
            </div>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
              Aproximadamente {((metricasGerais.mediaGeral || 0) / 30).toFixed(1)} meses · Mediana de {metricasGerais.medianaGeral} dias
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 flex justify-between">
            <span>Amostra analisada:</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">{metricasGerais.total} licenças</span>
          </div>
        </div>

        {/* Card 2: Comparativo IMT vs CETESB */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-semibold mb-2">
            <span>IMT VS CETESB (MÉDIAS)</span>
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="grid grid-cols-2 gap-2 my-auto">
            <div className="bg-neutral-50 dark:bg-neutral-800/60 p-2.5 rounded-lg border border-neutral-200/70 dark:border-neutral-700/60 text-center">
              <div className="text-[10px] uppercase font-bold text-neutral-400">IMT</div>
              <div className="text-lg font-black text-blue-700 dark:text-blue-400 tabular-nums">
                {metricasPorOrgao.imt.media} <span className="text-[10px] font-normal">dias</span>
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">{metricasPorOrgao.imt.total} emitidas</div>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-800/60 p-2.5 rounded-lg border border-neutral-200/70 dark:border-neutral-700/60 text-center">
              <div className="text-[10px] uppercase font-bold text-neutral-400">CETESB</div>
              <div className="text-lg font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
                {metricasPorOrgao.cetesb.media} <span className="text-[10px] font-normal">dias</span>
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">{metricasPorOrgao.cetesb.total} emitidas</div>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 truncate">
            {metricasPorOrgao.orgaoMaisRapido === 'IMT' ? (
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                IMT é em média {metricasPorOrgao.diferencaDias} dias mais ágil
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                CETESB é em média {metricasPorOrgao.diferencaDias} dias mais ágil
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Menor e Maior Prazo Registrado */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-semibold mb-2">
            <span>EXTREMOS DE TEMPO</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-2 my-auto">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Mais rápido:
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                {metricasGerais.minimo ? `${metricasGerais.minimo.diasAteEmissao} dias` : '-'}
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 truncate">
              {metricasGerais.minimo
                ? `${metricasGerais.minimo.numeroSolicitacao} (${metricasGerais.minimo.orgaoCertificador} · ${metricasGerais.minimo.tipo})`
                : 'Sem dados'}
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-100 dark:border-neutral-800">
              <span className="text-neutral-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Mais demorado:
              </span>
              <span className="font-bold text-rose-700 dark:text-rose-400 font-mono">
                {metricasGerais.maximo ? `${metricasGerais.maximo.diasAteEmissao} dias` : '-'}
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 truncate">
              {metricasGerais.maximo
                ? `${metricasGerais.maximo.numeroSolicitacao} (${metricasGerais.maximo.orgaoCertificador} · ${metricasGerais.maximo.tipo})`
                : 'Sem dados'}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 flex justify-between">
            <span>Dispersão temporal:</span>
            <span className="font-mono font-semibold text-neutral-700 dark:text-neutral-300">
              {metricasGerais.maximo && metricasGerais.minimo
                ? `${metricasGerais.maximo.diasAteEmissao - metricasGerais.minimo.diasAteEmissao} dias`
                : '-'}
            </span>
          </div>
        </div>

        {/* Card 4: Processos em Trâmite / Tempo Decorrido */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-semibold mb-2">
            <span>EM ANÁLISE NO ÓRGÃO</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tabular-nums tracking-tight">
                {emAndamentoComEnvio.length}
              </span>
              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">processos ativos</span>
            </div>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
              {emAndamentoComEnvio.length > 0
                ? `Média de ${Math.round(
                    emAndamentoComEnvio.reduce((acc, p) => acc + p.diasDecorridos, 0) /
                      emAndamentoComEnvio.length
                  )} dias decorridos desde o protocolo`
                : 'Nenhum processo pendente de emissão'}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 flex justify-between">
            <span>Acompanhamento:</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">Em tempo real</span>
          </div>
        </div>
      </div>

      {/* 3. Painéis Comparativos Visuais (Médias por Tipo de Homologação + Calculadora de Previsão) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel da Esquerda / Centro: Gráficos de Barra por Tipo de Homologação */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-4.5 h-4.5 text-[#E30613]" />
                <span>Média de Tempo por Tipo de Homologação</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Comparativo da duração média (em dias corridos) para emissão de cada modalidade
              </p>
            </div>
            <span className="text-xs font-medium text-neutral-500 hidden sm:inline">
              Média geral: <span className="font-bold text-neutral-900 dark:text-white font-mono">{metricasGerais.mediaGeral}d</span>
            </span>
          </div>

          <div className="space-y-4">
            {metricasPorTipo.map((item) => {
              const maxScale = Math.max(75, (metricasGerais.maximo?.diasAteEmissao || 60) + 10);
              const percentage = Math.min(100, Math.round((item.media / maxScale) * 100));
              const isFaster = item.media > 0 && item.media <= metricasGerais.mediaGeral;

              return (
                <div key={item.tipo} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-800 dark:text-neutral-200 w-28 sm:w-32 truncate">
                        {item.tipo}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        ({item.total} {item.total === 1 ? 'licença' : 'licenças'})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      {item.media > 0 ? (
                        <>
                          <span className="font-extrabold text-neutral-900 dark:text-white text-sm">
                            {item.media} dias
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                              isFaster
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}
                          >
                            {isFaster
                              ? `-${metricasGerais.mediaGeral - item.media}d`
                              : `+${item.media - metricasGerais.mediaGeral}d`}
                          </span>
                        </>
                      ) : (
                        <span className="text-neutral-400 text-xs">Sem emissões</span>
                      )}
                    </div>
                  </div>

                  {/* Barra comparativa proporcional */}
                  <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden flex items-center relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.media === 0
                          ? 'w-0'
                          : isFaster
                          ? 'bg-emerald-500 dark:bg-emerald-400'
                          : 'bg-[#E30613]'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                    {/* Linha pontilhada da média geral */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-neutral-400/80 z-10"
                      style={{
                        left: `${Math.round((metricasGerais.mediaGeral / maxScale) * 100)}%`,
                      }}
                      title={`Média geral: ${metricasGerais.mediaGeral} dias`}
                    />
                  </div>
                  {item.total > 0 && (
                    <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                      <span>Mínimo: {item.min}d</span>
                      <span>Máximo: {item.max}d</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Comparativo de Procedência no rodapé */}
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-2 gap-4 text-xs">
            <div className="bg-neutral-50 dark:bg-neutral-850 p-3 rounded-xl border border-neutral-200/70 dark:border-neutral-800">
              <span className="text-[11px] font-semibold text-neutral-400 block mb-1">
                PROCEDÊNCIA NACIONAL
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-neutral-900 dark:text-white font-mono">
                  {metricasPorProcedencia.nacionalMedia} dias
                </span>
                <span className="text-[10px] text-neutral-500">
                  ({metricasPorProcedencia.nacionalTotal} licenças)
                </span>
              </div>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-850 p-3 rounded-xl border border-neutral-200/70 dark:border-neutral-800">
              <span className="text-[11px] font-semibold text-neutral-400 block mb-1">
                PROCEDÊNCIA IMPORTADO
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-neutral-900 dark:text-white font-mono">
                  {metricasPorProcedencia.importadoMedia} dias
                </span>
                <span className="text-[10px] text-neutral-500">
                  ({metricasPorProcedencia.importadoTotal} licenças)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Painel da Direita: Calculadora Interativa de Previsão de Emissão */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/60 text-[#E30613]">
                <Calculator className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Simulador de Previsão de Emissão
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Estime a data de emissão de um novo protocolo
                </p>
              </div>
            </div>

            <div className="space-y-3.5 pt-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Órgão Certificador
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCalcOrgao('IMT')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      calcOrgao === 'IMT'
                        ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700 shadow-2xs'
                        : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    IMT
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcOrgao('CETESB')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      calcOrgao === 'CETESB'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 shadow-2xs'
                        : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    CETESB
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Tipo de Homologação
                </label>
                <select
                  value={calcTipo}
                  onChange={(e) => setCalcTipo(e.target.value as ProcessoTipo)}
                  className="w-full p-2 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400"
                >
                  <option value="LCVM">LCVM</option>
                  <option value="LCVM Especial">LCVM Especial</option>
                  <option value="LCM">LCM</option>
                  <option value="LCM Especial">LCM Especial</option>
                  <option value="Dispensa">Dispensa</option>
                  <option value="Extensão">Extensão</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Data de Envio / Protocolo
                </label>
                <input
                  type="date"
                  value={calcDataEnvio}
                  onChange={(e) => setCalcDataEnvio(e.target.value)}
                  className="w-full p-2 text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400"
                />
              </div>
            </div>
          </div>

          {/* Resultado da Estimativa */}
          {previsaoCalculada && (
            <div className="bg-gradient-to-br from-neutral-50 to-red-50/40 dark:from-neutral-850 dark:to-neutral-800 border border-neutral-200 dark:border-neutral-700 p-4 rounded-xl space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#E30613] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Previsão Estatística de Emissão</span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xl font-black text-neutral-900 dark:text-white font-mono">
                    {previsaoCalculada.dataEstimadaFormatada}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Média de {previsaoCalculada.diasEstimados} dias para {calcOrgao} · {calcTipo}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200/70 dark:border-neutral-700/60 text-[11px] text-neutral-500 space-y-0.5">
                <div className="flex justify-between">
                  <span>Janela provável:</span>
                  <span className="font-mono font-semibold text-neutral-700 dark:text-neutral-300">
                    {previsaoCalculada.janelaMinFormatada} a {previsaoCalculada.janelaMaxFormatada}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-neutral-400">
                  <span>Base amostral:</span>
                  <span>{previsaoCalculada.amostras} processo(s) idênticos</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Monitor de Processos Atualmente em Análise (Tempo Decorrido vs Média Histórica) */}
      {emAndamentoComEnvio.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-4.5 h-4.5 text-amber-500" />
                <span>Processos em Trâmite · Tempo Decorrido vs Média Histórica</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Acompanhe há quantos dias os processos enviados estão aguardando despacho e se ultrapassaram a média histórica
              </p>
            </div>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800 self-start sm:self-auto">
              {emAndamentoComEnvio.length} em trâmite
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {emAndamentoComEnvio.map((proc) => {
              const mediaDoOrgao =
                proc.orgaoCertificador === 'IMT'
                  ? metricasPorOrgao.imt.media
                  : metricasPorOrgao.cetesb.media;
              const mediaEsperada = mediaDoOrgao || metricasGerais.mediaGeral || 45;
              const percentual = Math.min(100, Math.round((proc.diasDecorridos / mediaEsperada) * 100));
              const ultrapassou = proc.diasDecorridos > mediaEsperada;

              return (
                <div
                  key={proc.id}
                  className={`p-4 rounded-xl border transition-all ${
                    ultrapassou
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                      : 'bg-neutral-50/80 dark:bg-neutral-850 border-neutral-200/80 dark:border-neutral-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#E30613] bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded border border-red-200/60 dark:border-red-900/40">
                          {proc.numeroSolicitacao}
                        </span>
                        <span className="text-xs font-bold text-neutral-900 dark:text-white truncate max-w-[200px]">
                          {proc.mmv}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-2">
                        <span>{proc.tipo}</span>
                        <span>·</span>
                        <span className="font-bold text-neutral-700 dark:text-neutral-300">
                          {proc.orgaoCertificador || 'IMT'}
                        </span>
                        <span>·</span>
                        <span>Envio: {formatarDataBR(proc.dataEnvio)}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-black font-mono text-neutral-900 dark:text-white tabular-nums">
                        {proc.diasDecorridos} <span className="text-xs font-normal">dias</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                          ultrapassou
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/80 dark:text-rose-200'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200'
                        }`}
                      >
                        {ultrapassou
                          ? `+${proc.diasDecorridos - mediaEsperada}d acima da média`
                          : `${percentual}% do prazo médio`}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso do Tempo Decorrido */}
                  <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mt-3">
                    <div
                      className={`h-full rounded-full transition-all ${
                        ultrapassou
                          ? 'bg-rose-500'
                          : percentual > 75
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${percentual}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2">
                    <span>Média histórica esperada: ~{mediaEsperada} dias</span>
                    <button
                      type="button"
                      onClick={() => onOpenObservations(proc)}
                      className="text-[#E30613] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Ver Anotações ({proc.observacoes?.length || 0})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Tabela Detalhada com Filtros e Ordenação Completa */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-[#E30613]" />
              <span>Detalhamento dos Processos Analisados</span>
            </h3>
            <p className="text-xs text-neutral-400">
              Registros individuais contendo datas exatas de envio, emissão e cálculo comparativo de prazo
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-neutral-500 dark:text-neutral-400">
            {listaConsolidadaProcessos.length} registro(s) exibido(s)
          </span>
        </div>

        {/* Barra de Filtros e Busca Específica */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Busca */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por Nº Solicitação, MMV, Licença..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
          </div>

          {/* Filtro Órgão */}
          <select
            value={filtroOrgao}
            onChange={(e) => setFiltroOrgao(e.target.value)}
            className="p-2 text-xs font-semibold bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-700 dark:text-neutral-200 focus:outline-none"
          >
            <option value="todos">Todos os Órgãos</option>
            <option value="IMT">IMT</option>
            <option value="CETESB">CETESB</option>
          </select>

          {/* Filtro Tipo */}
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="p-2 text-xs font-semibold bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-700 dark:text-neutral-200 focus:outline-none"
          >
            <option value="todos">Todos os Tipos</option>
            <option value="LCVM">LCVM</option>
            <option value="LCVM Especial">LCVM Especial</option>
            <option value="LCM">LCM</option>
            <option value="LCM Especial">LCM Especial</option>
            <option value="Dispensa">Dispensa</option>
            <option value="Extensão">Extensão</option>
          </select>

          {/* Ordenação */}
          <select
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value as any)}
            className="p-2 text-xs font-semibold bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-700 dark:text-neutral-200 focus:outline-none"
          >
            <option value="prazo_desc">Maior Prazo (Dias)</option>
            <option value="prazo_asc">Menor Prazo (Mais Ágil)</option>
            <option value="envio_desc">Mais Recentes (Envio)</option>
            <option value="solicitacao">Nº da Solicitação</option>
          </select>
        </div>

        {/* Tabela Responsiva */}
        <div className="overflow-x-auto border border-neutral-200/80 dark:border-neutral-800 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-100/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="p-3 sm:px-4">Processo (SL / MMV)</th>
                <th className="p-3">Órgão</th>
                <th className="p-3">Tipo & Procedência</th>
                <th className="p-3 text-center">Data Envio</th>
                <th className="p-3 text-center">Data Emissão</th>
                <th className="p-3">Nº Licença / Status</th>
                <th className="p-3 text-center">Prazo Total</th>
                <th className="p-3 text-center">Comparativo vs Média</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {listaConsolidadaProcessos.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-neutral-400">
                    Nenhum processo localizado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                listaConsolidadaProcessos.map((p) => {
                  const mediaComparada = metricasGerais.mediaGeral || 45;
                  const delta = p.diasCalculados - mediaComparada;
                  const isMaisRapido = delta < 0;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors"
                    >
                      <td className="p-3 sm:px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#E30613]">
                            {p.numeroSolicitacao}
                          </span>
                          {p.isExtensao && (
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                              EXT
                            </span>
                          )}
                        </div>
                        <div className="text-neutral-800 dark:text-neutral-200 font-semibold truncate max-w-[200px]">
                          {p.mmv}
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                          {p.orgaoCertificador || 'IMT'}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="font-medium text-neutral-800 dark:text-neutral-200">
                          {p.tipo}
                        </div>
                        <div className="text-[11px] text-neutral-400">{p.procedencia}</div>
                      </td>

                      <td className="p-3 text-center font-mono text-neutral-700 dark:text-neutral-300">
                        {formatarDataBR(p.dataEnvio)}
                      </td>

                      <td className="p-3 text-center font-mono">
                        {p.isConcluido ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                            {formatarDataBR(p.dataEmissao)}
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 text-[11px] font-medium italic">
                            Aguardando
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        {p.isConcluido ? (
                          <span className="font-mono text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                            {p.numeroLicenca || 'Emitida'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            {p.statusLabel}
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <div className="text-sm font-black font-mono text-neutral-900 dark:text-white">
                          {p.diasCalculados} <span className="text-[10px] font-normal">dias</span>
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          ~{((p.diasCalculados || 0) / 30).toFixed(1)} mês
                        </div>
                      </td>

                      <td className="p-3 text-center font-mono">
                        {p.isConcluido ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-0.5 ${
                              isMaisRapido
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : delta === 0
                                ? 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                            }`}
                          >
                            {isMaisRapido ? (
                              <TrendingDown className="w-3 h-3" />
                            ) : (
                              <TrendingUp className="w-3 h-3" />
                            )}
                            {isMaisRapido ? `${delta}d (Ágil)` : delta === 0 ? 'Na média' : `+${delta}d (Lento)`}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                            {p.diasCalculados > mediaComparada
                              ? `+${p.diasCalculados - mediaComparada}d acima`
                              : 'Em prazo'}
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenObservations(p)}
                            title="Ver ou adicionar observações"
                            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditProcesso(p)}
                            title="Editar processo"
                            className="p-1.5 text-neutral-400 hover:text-[#E30613] rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
