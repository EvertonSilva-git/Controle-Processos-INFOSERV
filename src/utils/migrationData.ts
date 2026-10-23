import { Processo, CnpjOption, DEFAULT_CNPJ_OPTIONS, formatarCNPJ } from '../types/process';
import { normalizarSituacaoProcesso } from '../App';

export interface MigrationPackage {
  format: 'shineray-infoserv-migration-v1';
  app: string;
  version: string;
  exportedAt: string;
  exportedBy: string;
  environmentOrigin: string;
  stats: {
    totalProcessos: number;
    totalLicencasEmitidas: number;
    totalExtensoes: number;
    totalObservacoes: number;
    totalCnpjs: number;
  };
  cnpjs: CnpjOption[];
  processos: Processo[];
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  data?: MigrationPackage;
}

/**
 * Monta o pacote de migração completo com metadados e estatísticas.
 */
export function createMigrationPackage(
  processos: Processo[],
  cnpjList: CnpjOption[],
  user?: string | null
): MigrationPackage {
  const agora = new Date().toISOString();
  const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown';

  const totalLicencas = processos.filter(
    (p) => p.situacao === 'Licença/Certidão emitida' || !!p.numeroLicenca
  ).length;

  const totalExtensoes = processos.filter((p) => p.isExtensao || p.tipo === 'Extensão').length;

  const totalObservacoes = processos.reduce(
    (acc, p) => acc + (Array.isArray(p.observacoes) ? p.observacoes.length : 0),
    0
  );

  // Normaliza cada processo antes de empacotar para garantir que situações e versões estejam limpas
  const normalizedProcessos = processos.map(normalizarSituacaoProcesso);

  return {
    format: 'shineray-infoserv-migration-v1',
    app: 'Infoserv Shineray Homologação',
    version: '1.0',
    exportedAt: agora,
    exportedBy: user || 'Analista Shineray',
    environmentOrigin: origin,
    stats: {
      totalProcessos: normalizedProcessos.length,
      totalLicencasEmitidas: totalLicencas,
      totalExtensoes: totalExtensoes,
      totalObservacoes: totalObservacoes,
      totalCnpjs: cnpjList.length,
    },
    cnpjs: cnpjList,
    processos: normalizedProcessos,
  };
}

/**
 * Dispara o download no navegador de um arquivo JSON estruturado de migração.
 */
export function downloadMigrationPackage(pkg: MigrationPackage, customFileName?: string): void {
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName =
    customFileName || `shineray-homologacao-migracao-nuvem-${dateStr}.json`;

  const jsonContent = JSON.stringify(pkg, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Valida minuciosamente um texto JSON ou objeto para certificar que contém
 * processos válidos da Shineray e pode ser migrado com segurança.
 */
export function validateMigrationPackage(rawInput: unknown): ValidationResult {
  try {
    let parsed: any = rawInput;
    if (typeof rawInput === 'string') {
      try {
        parsed = JSON.parse(rawInput);
      } catch (err: any) {
        return {
          isValid: false,
          error: `O arquivo fornecido não é um JSON válido: ${err?.message || 'formato corrompido'}.`,
        };
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      return {
        isValid: false,
        error: 'O arquivo JSON não contém um objeto ou array estruturado.',
      };
    }

    let processosArray: any[] = [];
    let cnpjsArray: CnpjOption[] = [];
    let exportedAt = new Date().toISOString();
    let exportedBy = 'Nuvem Anterior';
    let environmentOrigin = 'Nuvem Externa';

    // Suporta tanto o formato nativo da v1 do MigrationPackage quanto exportações puras de array de processos
    if (Array.isArray(parsed)) {
      // É uma exportação legada/simples direta de array de processos
      processosArray = parsed;
    } else if (Array.isArray(parsed.processos)) {
      processosArray = parsed.processos;
      if (Array.isArray(parsed.cnpjs)) {
        cnpjsArray = parsed.cnpjs;
      }
      if (typeof parsed.exportedAt === 'string') exportedAt = parsed.exportedAt;
      if (typeof parsed.exportedBy === 'string') exportedBy = parsed.exportedBy;
      if (typeof parsed.environmentOrigin === 'string') environmentOrigin = parsed.environmentOrigin;
    } else {
      return {
        isValid: false,
        error: 'Nenhum processo foi encontrado no arquivo. O JSON deve conter uma lista "processos" ou ser um array de processos.',
      };
    }

    if (processosArray.length === 0) {
      return {
        isValid: false,
        error: 'O pacote de migração contém uma lista de processos vazia (0 registros).',
      };
    }

    // Valida os primeiros registros para integridade mínima de campos
    const amostra = processosArray.slice(0, 10);
    const camposObrigatorios: Array<keyof Processo> = ['id', 'tipo', 'numeroSolicitacao', 'mmv', 'situacao'];
    
    for (let i = 0; i < amostra.length; i++) {
      const p = amostra[i];
      if (!p || typeof p !== 'object') {
        return {
          isValid: false,
          error: `O item #${i + 1} da lista de processos é inválido.`,
        };
      }
      for (const campo of camposObrigatorios) {
        if (p[campo] === undefined || p[campo] === null) {
          return {
            isValid: false,
            error: `O processo #${i + 1} (${p.numeroSolicitacao || 'sem número'}) está incompleto (campo obrigatório ausente: "${String(campo)}").`,
          };
        }
      }
    }

    // Normaliza todos os processos recebidos
    const normalizedProcessos: Processo[] = processosArray.map((p) => {
      const proc = normalizarSituacaoProcesso(p as Processo);
      // Assegura observações como array
      if (!Array.isArray(proc.observacoes)) {
        proc.observacoes = [];
      }
      return proc;
    });

    const totalLicencas = normalizedProcessos.filter(
      (p) => p.situacao === 'Licença/Certidão emitida' || !!p.numeroLicenca
    ).length;

    const totalExtensoes = normalizedProcessos.filter((p) => p.isExtensao || p.tipo === 'Extensão').length;

    const totalObservacoes = normalizedProcessos.reduce(
      (acc, p) => acc + (Array.isArray(p.observacoes) ? p.observacoes.length : 0),
      0
    );

    const data: MigrationPackage = {
      format: 'shineray-infoserv-migration-v1',
      app: parsed.app || 'Infoserv Shineray Homologação',
      version: parsed.version || '1.0',
      exportedAt,
      exportedBy,
      environmentOrigin,
      stats: {
        totalProcessos: normalizedProcessos.length,
        totalLicencasEmitidas: totalLicencas,
        totalExtensoes,
        totalObservacoes,
        totalCnpjs: cnpjsArray.length,
      },
      cnpjs: cnpjsArray,
      processos: normalizedProcessos,
    };

    return {
      isValid: true,
      data,
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: `Erro ao validar arquivo de migração: ${err?.message || 'erro desconhecido'}`,
    };
  }
}

/**
 * Mescla ou substitui os processos conforme a estratégia escolhida pelo usuário.
 */
export function mergeMigrationProcessos(
  current: Processo[],
  incoming: Processo[],
  strategy: 'replace' | 'merge'
): Processo[] {
  if (strategy === 'replace') {
    return incoming.map(normalizarSituacaoProcesso);
  }

  // Merge strategy: mantém os existentes, mas atualiza se o id ou numeroSolicitacao já existir
  const map = new Map<string, Processo>();

  // 1. Coloca os existentes no mapa indexados por id e numeroSolicitacao
  current.forEach((p) => {
    map.set(p.id, p);
    if (p.numeroSolicitacao) {
      map.set(`sol:${p.numeroSolicitacao.trim().toUpperCase()}`, p);
    }
  });

  // 2. Mescla ou adiciona novos do incoming
  incoming.forEach((inProc) => {
    const normal = normalizarSituacaoProcesso(inProc);
    const keySol = normal.numeroSolicitacao ? `sol:${normal.numeroSolicitacao.trim().toUpperCase()}` : null;

    let existing = map.get(normal.id);
    if (!existing && keySol && map.has(keySol)) {
      existing = map.get(keySol);
    }

    if (existing) {
      // Mescla observações para não perder anotações de nenhuma ponta
      const obsMap = new Map<string, any>();
      (existing.observacoes || []).forEach((o) => obsMap.set(o.id || o.texto, o));
      (normal.observacoes || []).forEach((o) => obsMap.set(o.id || o.texto, o));

      const merged: Processo = {
        ...existing,
        ...normal,
        observacoes: Array.from(obsMap.values()),
        atualizadoEm: new Date().toISOString(),
      };
      map.set(existing.id, merged);
      if (keySol) map.set(keySol, merged);
    } else {
      map.set(normal.id, normal);
      if (keySol) map.set(keySol, normal);
    }
  });

  // Retorna array único
  const idsVistos = new Set<string>();
  const resultado: Processo[] = [];

  map.forEach((proc) => {
    if (!idsVistos.has(proc.id)) {
      idsVistos.add(proc.id);
      resultado.push(proc);
    }
  });

  // Ordena por data de início decrescente
  return resultado.sort((a, b) => (b.dataInicio || '').localeCompare(a.dataInicio || ''));
}

/**
 * Mescla a lista de CNPJs recebida com a existente, evitando duplicidades.
 */
export function mergeMigrationCnpjs(
  current: CnpjOption[] = DEFAULT_CNPJ_OPTIONS,
  incoming: CnpjOption[] = []
): CnpjOption[] {
  const map = new Map<string, CnpjOption>();

  current.forEach((c) => {
    if (c.raw) map.set(c.raw, c);
  });

  incoming.forEach((inc) => {
    if (inc.raw) {
      if (!map.has(inc.raw)) {
        map.set(inc.raw, {
          ...inc,
          formatted: formatarCNPJ(inc.raw),
          isCustom: true,
        });
      }
    }
  });

  return Array.from(map.values());
}
