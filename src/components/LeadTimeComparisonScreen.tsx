import React, { useState, useMemo } from 'react';
import { Processo, ProcessoTipo, OrgaoCertificador, Procedencia, formatarCNPJ } from '../types/process';
import {
  calcularDiasSolicitacaoAteEmissao,
  formatarDataBR,
} from '../utils/processCalculations';
import {
  Timer,
  Clock,
  TrendingDown,
  TrendingUp,
  Award,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  Search,
  ArrowUpDown,
  FileCheck2,
  Hourglass,
  Gauge,
  Edit3,
  MessageSquare,
  BarChart3,
  Filter,
  CheckCircle2,
  Scale,
  Sparkles,
} from 'lucide-react';

interface LeadTimeComparisonScreenProps {
  processos: Processo[];
  onEditProcesso?: (processo: Processo) => void;
  onOpenObservations?: (processo: Processo) => void;
}

export const LeadTimeComparisonScreen: React.FC<LeadTimeComparisonScreenProps> = ({
  processos,
  onEditProcesso,
  onOpenObservations,
}) => {
  // Filtros internos da subtela
  const [filtroOrgao, setFiltroOrgao] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroProcedencia, setFiltroProcedencia] = useState<string>('todos');
  const [ordenacao, setOrdenacao] = useState<'rapidos' | 'demorados' | 'recentes' | 'solicitacao'>('rapidos');
  const [termoBusca, setTermoBusca] = useState<string>('');

  // 1. Processos com prazo finalizado computável (Envio -> Emissão)
  const processosComPrazo = useMemo(() => {
    return processos
      .map((p) => {
        const calc = calcularDiasSolicitacaoAteEmissao(p.dataEnvio, p.dataEmissao);
        return {
          processo: p,
          dias: calc?.emitido ? calc.dias : null,
          dataEnvio: p.dataEnvio,
          dataEmissao: p.dataEmissao,
        };
      })
      .filter((item): item is { processo: Processo; dias: number; dataEnvio: string; dataEmissao: string } => {
        return item.dias !== null && !!item.dataEnvio && !!item.dataEmissao;
      });
  }, [processos]);

  // 2. Processos em trâmite com envio registrado (Envio -> Hoje aguardando emissão)
  const processosEmTramiteComEnvio = useMemo(() => {
    return processos
      .filter((p) => p.dataEnvio && (!p.dataEmissao || p.situacao !== 'Licença/Certidão emitida'))
      .map((p) => {
        const calc = calcularDiasSolicitacaoAteEmissao(p.dataEnvio, undefined);
        return {
          processo: p,
          diasDecorridos: calc ? calc.dias : 0,
        };
      })
      .sort((a, b) => b.diasDecorridos - a.diasDecorridos);
  }, [processos]);

  // 3. Estatísticas Gerais Globais
  const statsGerais = useMemo(() => {
    if (processosComPrazo.length === 0) {
      return {
        total: 0,
        media: 0,
        mediana: 0,
        min: 0,
        max: 0,
        maisRapido: null,
        maisDemorado: null,
      };
    }

    const valoresDias = processosComPrazo.map((item) => item.dias).sort((a, b) => a - b);
    const soma = valoresDias.reduce((acc, curr) => acc + curr, 0);
    const media = soma / valoresDias.length;

    // Mediana
    const meio = Math.floor(valoresDias.length / 2);
    const mediana =
      valoresDias.length % 2 !== 0
        ? valoresDias[meio]
        : (valoresDias[meio - 1] + valoresDias[meio]) / 2;

    const min = valoresDias[0];
    const max = valoresDias[valoresDias.length - 1];

    const maisRapido = processosComPrazo.find((item) => item.dias === min) || null;
    const maisDemorado = processosComPrazo.find((item) => item.dias === max) || null;

    return {
      total: processosComPrazo.length,
      media: Number(media.toFixed(1)),
      mediana: Number(mediana.toFixed(1)),
      min,
      max,
      maisRapido,
      maisDemorado,
    };
  }, [processosComPrazo]);

  // 4. Comparativo por Órgão Certificador (IMT vs. CETESB)
  const statsPorOrgao = useMemo(() => {
    const orgaosList: OrgaoCertificador[] = ['IMT', 'CETESB'];

    return orgaosList.map((orgao) => {
      const lista = processosComPrazo.filter(
        (item) => (item.processo.orgaoCertificador || 'IMT') === orgao
      );
      if (lista.length === 0) {
        return {
          orgao,
          total: 0,
          media: 0,
          min: 0,
          max: 0,
          diferencaMediaGeral: 0,
        };
      }
      const soma = lista.reduce((acc, item) => acc + item.dias, 0);
      const media = Number((soma / lista.length).toFixed(1));
      const min = Math.min(...lista.map((i) => i.dias));
      const max = Math.max(...lista.map((i) => i.dias));
      const diferencaMediaGeral = Number((media - statsGerais.media).toFixed(1));

      return {
        orgao,
        total: lista.length,
        media,
        min,
        max,
        diferencaMediaGeral,
      };
    });
  }, [processosComPrazo, statsGerais.media]);

  // 5. Comparativo por Tipo de Processo (LCVM, LCM, Especial, Extensão, Dispensa)
  const statsPorTipo = useMemo(() => {
    const tiposMap: Record<string, number[]> = {};

    processosComPrazo.forEach((item) => {
      const tipo = item.processo.tipo;
      if (!tiposMap[tipo]) tiposMap[tipo] = [];
      tiposMap[tipo].push(item.dias);
    });

    return Object.entries(tiposMap)
      .map(([tipo, diasList]) => {
        const soma = diasList.reduce((acc, d) => acc + d, 0);
        const media = Number((soma / diasList.length).toFixed(1));
        const min = Math.min(...diasList);
        const max = Math.max(...diasList);
        const diferenca = Number((media - statsGerais.media).toFixed(1));

        return {
          tipo,
          total: diasList.length,
          media,
          min,
          max,
          diferenca,
        };
      })
      .sort((a, b) => a.media - b.media);
  }, [processosComPrazo, statsGerais.media]);

  // 6. Comparativo por Procedência (Nacional vs. Importado)
  const statsPorProcedencia = useMemo(() => {
    const procedencias: Procedencia[] = ['Nacional', 'Importado'];

    return procedencias.map((proc) => {
      const lista = processosComPrazo.filter((item) => item.processo.procedencia === proc);
      if (lista.length === 0) {
        return { procedencia: proc, total: 0, media: 0, min: 0, max: 0, diferenca: 0 };
      }
      const soma = lista.reduce((acc, item) => acc + item.dias, 0);
      const media = Number((soma / lista.length).toFixed(1));
      const min = Math.min(...lista.map((i) => i.dias));
      const max = Math.max(...lista.map((i) => i.dias));
      const diferenca = Number((media - statsGerais.media).toFixed(1));

      return {
        procedencia: proc,
        total: lista.length,
        media,
        min,
        max,
        diferenca,
      };
    });
  }, [processosComPrazo, statsGerais.media]);

  // 7. Lista Filtrada e Ordenada para a Tabela Detalhada
  const processosFiltradosETabelados = useMemo(() => {
    return processosComPrazo
      .filter((item) => {
        // Filtro Órgão
        if (filtroOrgao !== 'todos') {
          const org = item.processo.orgaoCertificador || 'IMT';
          if (org !== filtroOrgao) return false;
        }

        // Filtro Tipo
        if (filtroTipo !== 'todos' && item.processo.tipo !== filtroTipo) {
          return false;
        }

        // Filtro Procedência
        if (filtroProcedencia !== 'todos' && item.processo.procedencia !== filtroProcedencia) {
          return false;
        }

        // Busca por texto
        if (termoBusca.trim()) {
          const q = termoBusca.toLowerCase().trim();
          const matchSol = item.processo.numeroSolicitacao.toLowerCase().includes(q);
          const matchMMV = item.processo.mmv.toLowerCase().includes(q);
          const matchLic = item.processo.numeroLicenca?.toLowerCase().includes(q) || false;
          const matchOrg = item.processo.orgaoCertificador?.toLowerCase().includes(q) || false;
          if (!matchSol && !matchMMV && !matchLic && !matchOrg) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (ordenacao === 'rapidos') {
          return a.dias - b.dias;
        }
        if (ordenacao === 'demorados') {
          return b.dias - a.dias;
        }
        if (ordenacao === 'recentes') {
          return new Date(b.dataEmissao).getTime() - new Date(a.dataEmissao).getTime();
        }
        if (ordenacao === 'solicitacao') {
          return a.processo.numeroSolicitacao.localeCompare(b.processo.numeroSolicitacao);
        }
        return 0;
      });
  }, [processosComPrazo, filtroOrgao, filtroTipo, filtroProcedencia, ordenacao, termoBusca]);

  // Maior tempo entre todos para calcular a barra relativa
  const maxDiasGeral = Math.max(statsGerais.max || 1, 60);

  return (
    <div className="space-y-6">
      {/* Header do Módulo de Prazos */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-neutral-800 relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/30">
              <Timer className="w-3.5 h-3.5 text-[#E30613]" />
              <span>Lead Time Regulamentar · Envio → Emissão</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Médias e Comparativo de Prazos de Emissão
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Monitore a duração real que os órgãos técnicos (CETESB e IMT / IBAMA) levam para deferir e emitir licenças a partir do protocolo formal da documentação técnica.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 text-center min-w-[120px]">
              <div className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider">Amostragem</div>
              <div className="text-xl font-black text-white font-mono">{statsGerais.total}</div>
              <div className="text-[10px] text-neutral-400">licenças emitidas</div>
            </div>

            <div className="bg-[#E30613]/20 backdrop-blur-md px-4 py-2.5 rounded-xl border border-red-500/30 text-center min-w-[130px]">
              <div className="text-[11px] font-semibold text-red-200 uppercase tracking-wider">Média Global</div>
              <div className="text-xl font-black text-white font-mono">
                {statsGerais.media} <span className="text-xs font-normal">dias</span>
              </div>
              <div className="text-[10px] text-red-300">tempo médio total</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Cards Executivos de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Média Geral */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Tempo Médio Geral</span>
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/60 text-[#E30613]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white font-mono">
              {statsGerais.media} <span className="text-sm font-semibold text-neutral-500">dias</span>
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1.5">
              <span>Entre o envio e a emissão oficial</span>
            </div>
          </div>
        </div>

        {/* Card 2: Mediana */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Mediana dos Prazos</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white font-mono">
              {statsGerais.mediana} <span className="text-sm font-semibold text-neutral-500">dias</span>
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              50% emitidos até esta duração
            </div>
          </div>
        </div>

        {/* Card 3: Mais Ágil (Mínimo) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Processo Mais Rápido</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {statsGerais.min} <span className="text-sm font-semibold text-neutral-500">dias</span>
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 truncate" title={statsGerais.maisRapido?.processo.mmv}>
              {statsGerais.maisRapido ? `${statsGerais.maisRapido.processo.numeroSolicitacao} · ${statsGerais.maisRapido.processo.mmv}` : '-'}
            </div>
          </div>
        </div>

        {/* Card 4: Mais Demorado (Máximo) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Maior Tempo Registrado</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {statsGerais.max} <span className="text-sm font-semibold text-neutral-500">dias</span>
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 truncate" title={statsGerais.maisDemorado?.processo.mmv}>
              {statsGerais.maisDemorado ? `${statsGerais.maisDemorado.processo.numeroSolicitacao} · ${statsGerais.maisDemorado.processo.mmv}` : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Grid com Painéis de Comparação (Órgão + Tipo + Procedência) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel 1: Comparativo por Órgão Certificador (IMT vs. CETESB) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 text-[#E30613]">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Comparativo por Órgão
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-neutral-400">
                CETESB vs IMT
              </span>
            </div>

            <div className="space-y-4">
              {statsPorOrgao.map((item) => {
                const percentual = statsGerais.media > 0 ? (item.media / maxDiasGeral) * 100 : 0;
                const isMaisRapido = item.diferencaMediaGeral < 0;

                return (
                  <div
                    key={item.orgao}
                    className="p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base text-neutral-900 dark:text-white px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                          {item.orgao}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          ({item.total} licença{item.total !== 1 ? 's' : ''})
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-black font-mono text-neutral-900 dark:text-white">
                          {item.media} <span className="text-xs font-normal text-neutral-500">dias</span>
                        </span>
                      </div>
                    </div>

                    {/* Barra de Progresso Visual */}
                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.orgao === 'IMT' ? 'bg-blue-600' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(10, percentual))}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 pt-0.5">
                      <span>Mín: {item.min}d · Máx: {item.max}d</span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-full ${
                          isMaisRapido
                            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800'
                            : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {isMaisRapido ? `↓ ${Math.abs(item.diferencaMediaGeral)}d abaixo da média` : `↑ +${item.diferencaMediaGeral}d da média`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Baseado em processos com data de envio e emissão registradas.</span>
          </div>
        </div>

        {/* Painel 2: Comparativo por Tipo de Processo */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Comparativo por Tipo
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-neutral-400">
                Prazos por Categoria
              </span>
            </div>

            <div className="space-y-3">
              {statsPorTipo.map((item) => {
                const barWidth = statsGerais.max > 0 ? (item.media / statsGerais.max) * 100 : 0;
                const isAbaixo = item.diferenca <= 0;

                return (
                  <div key={item.tipo} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">
                          {item.tipo}
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          ({item.total})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-neutral-900 dark:text-white">
                          {item.media} dias
                        </span>
                        <span className={`text-[10px] font-semibold ${isAbaixo ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {isAbaixo ? `(${item.diferenca}d)` : `(+${item.diferenca}d)`}
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#E30613] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(12, barWidth))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400">
            Processos de extensão aproveitam relatórios e costumam ter menor tempo de análise.
          </div>
        </div>

        {/* Painel 3: Comparativo por Procedência (Nacional vs. Importado) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Procedência
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-neutral-400">
                Nacional vs. Importado
              </span>
            </div>

            <div className="space-y-4">
              {statsPorProcedencia.map((item) => {
                const percentual = statsGerais.media > 0 ? (item.media / maxDiasGeral) * 100 : 0;

                return (
                  <div
                    key={item.procedencia}
                    className="p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm text-neutral-900 dark:text-white">
                          {item.procedencia}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          {item.total} licença{item.total !== 1 ? 's' : ''} analisada{item.total !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-base font-bold text-neutral-900 dark:text-white">
                          {item.media} dias
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          Mín: {item.min}d · Máx: {item.max}d
                        </div>
                      </div>
                    </div>

                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.procedencia === 'Nacional' ? 'bg-emerald-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(10, percentual))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400">
            Veículos importados passam por checagem documental adicional de desembaraço aduaneiro.
          </div>
        </div>
      </div>

      {/* Monitoramento de Processos em Trâmite (Lead Time em Andamento) */}
      {processosEmTramiteComEnvio.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <Hourglass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Processos em Análise no Órgão (Dias Decorridos Desde o Envio)
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Processos enviados aguardando emissão da certidão comparados com a média histórica ({statsGerais.media} dias)
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 self-start sm:self-center">
              {processosEmTramiteComEnvio.length} em trâmite
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {processosEmTramiteComEnvio.map((item) => {
              const proc = item.processo;
              const isAcimaDaMedia = item.diasDecorridos > statsGerais.media;

              return (
                <div
                  key={proc.id}
                  className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[#E30613] bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded border border-red-200/50 dark:border-red-900/40">
                        {proc.numeroSolicitacao}
                      </span>
                      <span className="text-[11px] font-semibold font-mono text-neutral-500 dark:text-neutral-400">
                        {proc.orgaoCertificador || 'IMT'}
                      </span>
                    </div>

                    <div className="font-bold text-xs text-neutral-900 dark:text-white truncate" title={proc.mmv}>
                      {proc.mmv}
                    </div>

                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                      <span>Enviado em:</span>
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">
                        {formatarDataBR(proc.dataEnvio)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-neutral-200/70 dark:border-neutral-750 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-neutral-400">Tempo decorrido</div>
                      <div className="font-mono text-sm font-extrabold text-neutral-900 dark:text-white">
                        {item.diasDecorridos} dias
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isAcimaDaMedia
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {isAcimaDaMedia ? `+${(item.diasDecorridos - statsGerais.media).toFixed(0)}d acima da média` : 'Dentro da média'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabela Analítica Completa e Ranqueada de Licenças Emitidas */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Barra de Filtros e Busca da Tabela */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <span>Histórico Detalhado e Comparativo de Licenças</span>
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                {processosFiltradosETabelados.length} registradas
              </span>
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Prazos individuais computados e confrontados com a média geral ({statsGerais.media} dias)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Campo de Busca Rápida */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                placeholder="Filtrar por MMV, SL..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
            </div>

            {/* Filtro Órgão */}
            <select
              value={filtroOrgao}
              onChange={(e) => setFiltroOrgao(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 focus:outline-none"
            >
              <option value="todos">Todos os Órgãos</option>
              <option value="IMT">IMT</option>
              <option value="CETESB">CETESB</option>
            </select>

            {/* Filtro Tipo */}
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 focus:outline-none"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="LCVM">LCVM</option>
              <option value="LCM">LCM</option>
              <option value="LCVM Especial">LCVM Especial</option>
              <option value="LCM Especial">LCM Especial</option>
              <option value="Dispensa">Dispensa</option>
              <option value="Extensão">Extensão</option>
            </select>

            {/* Ordenação */}
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 focus:outline-none"
            >
              <option value="rapidos">Mais Rápidos Primeiro</option>
              <option value="demorados">Mais Demorados Primeiro</option>
              <option value="recentes">Mais Recentes</option>
              <option value="solicitacao">Nº Solicitação</option>
            </select>
          </div>
        </div>

        {/* Tabela de Resultados */}
        <div className="overflow-x-auto rounded-xl border border-neutral-200/90 dark:border-neutral-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-850 border-b border-neutral-200/90 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3.5">Solicitação / MMV</th>
                <th className="py-3 px-3">Tipo</th>
                <th className="py-3 px-3">Órgão</th>
                <th className="py-3 px-3">Procedência</th>
                <th className="py-3 px-3 text-center">Data Envio</th>
                <th className="py-3 px-3 text-center">Data Emissão</th>
                <th className="py-3 px-3.5 text-center">Tempo Total (Dias)</th>
                <th className="py-3 px-3.5 text-center">Desvio da Média</th>
                <th className="py-3 px-3">Nº Licença</th>
                <th className="py-3 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
              {processosFiltradosETabelados.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-neutral-400">
                    Nenhum processo localizado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                processosFiltradosETabelados.map((item, idx) => {
                  const proc = item.processo;
                  const diferenca = Number((item.dias - statsGerais.media).toFixed(1));
                  const isMaisRapido = diferenca < 0;
                  const percentualBarra = (item.dias / maxDiasGeral) * 100;

                  return (
                    <tr
                      key={proc.id}
                      className="hover:bg-neutral-50/80 dark:hover:bg-neutral-850/60 transition-colors"
                    >
                      {/* Solicitação e MMV */}
                      <td className="py-3 px-3.5 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#E30613] bg-red-50 dark:bg-red-950/60 px-1.5 py-0.5 rounded border border-red-200/50 dark:border-red-900/40 shrink-0">
                            {proc.numeroSolicitacao}
                          </span>
                          <span className="font-bold text-neutral-900 dark:text-white truncate max-w-[220px]" title={proc.mmv}>
                            {proc.mmv}
                          </span>
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300 px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
                          {proc.tipo}
                        </span>
                      </td>

                      {/* Órgão */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                          {proc.orgaoCertificador || 'IMT'}
                        </span>
                      </td>

                      {/* Procedência */}
                      <td className="py-3 px-3 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                        {proc.procedencia}
                      </td>

                      {/* Data Envio */}
                      <td className="py-3 px-3 text-center whitespace-nowrap font-mono text-neutral-700 dark:text-neutral-300">
                        {formatarDataBR(item.dataEnvio)}
                      </td>

                      {/* Data Emissão */}
                      <td className="py-3 px-3 text-center whitespace-nowrap font-mono text-neutral-700 dark:text-neutral-300">
                        {formatarDataBR(item.dataEmissao)}
                      </td>

                      {/* Tempo Total em Dias */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap min-w-[140px]">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-mono font-extrabold text-sm text-neutral-900 dark:text-white">
                            {item.dias} dias
                          </span>
                          <div className="w-20 bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full rounded-full ${
                                isMaisRapido ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(10, percentualBarra))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Desvio da Média */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span
                          className={`font-semibold text-[11px] px-2.5 py-0.5 rounded-full ${
                            isMaisRapido
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : diferenca === 0
                              ? 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {isMaisRapido
                            ? `↓ ${Math.abs(diferenca)}d mais rápido`
                            : diferenca === 0
                            ? 'Exato na média'
                            : `↑ +${diferenca}d mais lento`}
                        </span>
                      </td>

                      {/* Nº Licença */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {proc.numeroLicenca || '-'}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {onOpenObservations && (
                            <button
                              type="button"
                              onClick={() => onOpenObservations(proc)}
                              className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              title="Ver anotações"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onEditProcesso && (
                            <button
                              type="button"
                              onClick={() => onEditProcesso(proc)}
                              className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              title="Editar processo"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
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
