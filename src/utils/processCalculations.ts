import { ProcessoTipo, Procedencia, TipoVeiculo, SituacaoProcesso } from '../types/process';

/**
 * Calculates remaining days from the current date until the expiration date.
 * If dataValidade is missing or invalid, returns null.
 */
export function calcularDiasRestantes(dataValidade?: string): number | null {
  if (!dataValidade) return null;
  const parts = dataValidade.split('-');
  if (parts.length !== 3) return null;

  const validade = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  validade.setHours(0, 0, 0, 0);

  const diffMs = validade.getTime() - hoje.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Retorna a data de vencimento efetiva da licença:
 * Caso exista novaDataVencimento (pós-revalidação), ela prevalece; caso contrário, dataValidade.
 */
export function obterDataVencimentoEfetiva(
  dataValidade?: string,
  novaDataVencimento?: string
): string | undefined {
  return novaDataVencimento || dataValidade;
}

/**
 * Verifies if a process license is up for revalidation (within 61 days)
 * Considera novaDataVencimento caso tenha sido informada.
 */
export function estaParaRevalidar(
  dataValidade?: string,
  situacao?: string,
  novaDataVencimento?: string
): boolean {
  const dataEfetiva = novaDataVencimento || dataValidade;
  if (!dataEfetiva) return false;
  // Usually applies to issued licenses or processes with an active license date
  const dias = calcularDiasRestantes(dataEfetiva);
  if (dias === null) return false;
  // Within 61 days (and could be positive or slightly past)
  return dias <= 61;
}

/**
 * Calculates days between submission date and license issue date.
 * If dataEmissao is present: calculates elapsed days until issuance.
 * If dataEmissao is absent but dataEnvio is present: calculates elapsed days under analysis.
 */
export function calcularDiasSolicitacaoAteEmissao(
  dataEnvio?: string,
  dataEmissao?: string
): { dias: number; emitido: boolean } | null {
  if (!dataEnvio) return null;

  const envioParts = dataEnvio.split('-');
  if (envioParts.length !== 3) return null;
  const envio = new Date(parseInt(envioParts[0]), parseInt(envioParts[1]) - 1, parseInt(envioParts[2]));
  envio.setHours(0, 0, 0, 0);

  if (dataEmissao) {
    const emissaoParts = dataEmissao.split('-');
    if (emissaoParts.length !== 3) return null;
    const emissao = new Date(parseInt(emissaoParts[0]), parseInt(emissaoParts[1]) - 1, parseInt(emissaoParts[2]));
    emissao.setHours(0, 0, 0, 0);

    const diffMs = emissao.getTime() - envio.getTime();
    const dias = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    return { dias, emitido: true };
  } else {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const diffMs = hoje.getTime() - envio.getTime();
    const dias = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    return { dias, emitido: false };
  }
}

/**
 * Formats YYYY-MM-DD to DD/MM/YYYY
 */
export function formatarDataBR(dataIso?: string): string {
  if (!dataIso) return '-';
  const parts = dataIso.split('-');
  if (parts.length !== 3) return dataIso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Formats Date object or ISO string to Brazilian full datetime: DD/MM/YYYY às HH:mm
 */
export function formatarDataHoraBR(isoStr?: string): string {
  if (!isoStr) return '-';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    const horas = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano} às ${horas}:${mins}`;
  } catch {
    return isoStr;
  }
}

/**
 * Returns required prefix for Solicitation Number:
 * 'SD' for Dispensa, 'SL' for all other types
 */
export function obterPrefixoSolicitacao(tipo: ProcessoTipo): 'SD' | 'SL' {
  return tipo === 'Dispensa' ? 'SD' : 'SL';
}

/**
 * Retorna o prefixo do MMV com base na procedência:
 * 'I/' para Importado, '' para Nacional
 */
export function obterPrefixoMMV(procedencia: Procedencia): 'I/' | '' {
  return procedencia === 'Importado' ? 'I/' : '';
}

/**
 * Returns allowed vehicle types based on process type
 */
export function obterTiposVeiculoPermitidos(tipo: ProcessoTipo): TipoVeiculo[] {
  switch (tipo) {
    case 'LCVM':
      return [
        'Veículo leve de passageiros',
        'Veículo leve comercial',
        'Motor',
        'Veículo pesado',
        'Chassi',
        'Ônibus',
        'Máquina Agrícola ou Rodoviária'
      ];
    case 'LCVM Especial':
      return [
        'Máquina Agrícola e Rodoviária',
        'Veículo leve comercial',
        'Veículo leve de passageiros',
        'Veículo pesado'
      ];
    case 'LCM':
      return ['Motocicleta'];
    case 'LCM Especial':
      return [
        'Ciclomotor',
        'Minimoto',
        'Motocicleta',
        'Motocicleta de competição',
        'Motocicleta fora de estrada',
        'Triciclo/Quadriciclo',
        'Triciclo/Quadriciclo fora de estrada'
      ];
    case 'Dispensa':
      return ['Protótipo'];
    case 'Extensão':
      return [
        'Veículo leve de passageiros',
        'Veículo leve comercial',
        'Motor',
        'Veículo pesado',
        'Chassi',
        'Ônibus',
        'Máquina Agrícola ou Rodoviária',
        'Máquina Agrícola e Rodoviária',
        'Ciclomotor',
        'Minimoto',
        'Motocicleta',
        'Motocicleta de competição',
        'Motocicleta fora de estrada',
        'Triciclo/Quadriciclo',
        'Triciclo/Quadriciclo fora de estrada'
      ];
    default:
      return ['Motocicleta'];
  }
}

/**
 * Returns allowed quantity options (if selectable) for process type
/**
 * Verifica se um veículo de LCM Especial exige digitação manual da quantidade.
 * Conforme regra: Minimoto, Motocicleta de competição, Motocicleta fora de estrada,
 * Triciclo/Quadriciclo fora de estrada.
 */
export function isLcmEspecialQuantidadeManual(tipoVeiculo?: TipoVeiculo | string): boolean {
  if (!tipoVeiculo) return false;
  const normalizado = tipoVeiculo
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return (
    normalizado.includes('minimoto') ||
    normalizado.includes('competicao') ||
    normalizado.includes('fora de estrada')
  );
}

/**
 * Returns allowed quantity options (if selectable) for process type
 */
export function obterOpcoesQuantidade(
  tipo: ProcessoTipo,
  tipoVeiculo?: TipoVeiculo
): {
  isSelect: boolean;
  isInput: boolean;
  isOmitted: boolean;
  options: string[];
} {
  switch (tipo) {
    case 'LCVM':
      return {
        isSelect: true,
        isInput: false,
        isOmitted: false,
        options: ['Restrita (3 a 100)', 'Ilimitada (100+)'],
      };
    case 'LCVM Especial':
      return {
        isSelect: true,
        isInput: false,
        isOmitted: false,
        options: ['1', '2'],
      };
    case 'LCM':
      return {
        isSelect: true,
        isInput: false,
        isOmitted: false,
        options: ['Restrita (3 a 50)', 'Ilimitada (50+)'],
      };
    case 'LCM Especial':
      if (isLcmEspecialQuantidadeManual(tipoVeiculo)) {
        return {
          isSelect: false,
          isInput: true,
          isOmitted: false,
          options: [],
        };
      }
      return {
        isSelect: true,
        isInput: false,
        isOmitted: false,
        options: ['1', '2'],
      };
    case 'Extensão':
      return {
        isSelect: false,
        isInput: false,
        isOmitted: true,
        options: [],
      };
    case 'Dispensa':
      return {
        isSelect: false,
        isInput: true,
        isOmitted: false,
        options: [],
      };
    default:
      return { isSelect: false, isInput: true, isOmitted: false, options: [] };
  }
}

/**
 * Monta o MMV unificado a partir dos campos separados: Marca, Modelo e Veículo/Versão.
 * Se Importado, adiciona "I/" no início.
/**
 * Monta o MMV unificado a partir dos campos: Marca, Modelo, Versão principal e Versões Adicionais opcionais.
 * Se Importado, adiciona "I/" no início.
 * Exemplo de versões únicas: SHINERAY/WORKER 125
 * Exemplo de múltiplas versões: SHINERAY/WORKER 125 / 125 SPORT
 */
export function montarMMV(
  procedencia: Procedencia,
  marca: string,
  modelo: string,
  veiculo: string,
  versoesAdicionais?: string[]
): string {
  const prefixo = procedencia === 'Importado' ? 'I/' : '';
  const m = (marca || '').trim().toUpperCase();
  const mod = (modelo || '').trim().toUpperCase();

  // Consolida versões sem duplicar vazios
  const listaVersoes: string[] = [];
  if (veiculo && veiculo.trim()) {
    // Caso veiculo já venha concatenado com barras
    const partes = veiculo.split('/').map((s) => s.trim().toUpperCase()).filter(Boolean);
    listaVersoes.push(...partes);
  }
  if (versoesAdicionais && Array.isArray(versoesAdicionais)) {
    versoesAdicionais.forEach((va) => {
      const vTrim = (va || '').trim().toUpperCase();
      if (vTrim && !listaVersoes.includes(vTrim)) {
        listaVersoes.push(vTrim);
      }
    });
  }

  const v = listaVersoes.join(' / ');

  // Se a versão estiver em branco, mantém apenas Marca e Modelo sem barra extra ou texto residual
  if (m && mod) {
    return v ? `${prefixo}${m}/${mod} / ${v}` : `${prefixo}${m}/${mod}`;
  }
  if (m) {
    return v ? `${prefixo}${m} / ${v}` : `${prefixo}${m}`;
  }
  if (mod) {
    return v ? `${prefixo}${mod} / ${v}` : `${prefixo}${mod}`;
  }
  return v ? `${prefixo}${v}` : '';
}

/**
 * Decompõe um MMV existente em Marca, Modelo, Veículo/Versão e lista de versões.
 * Regra: Delimitação estrita por barras ('/').
 * Se não houver versão preenchida ou se houver apenas Marca/Modelo, a versão permanece estritamente em branco.
 * Nunca joga o nome do modelo na versão.
 */
export function decomporMMV(
  mmv: string,
  procedencia?: Procedencia
): { marca: string; modelo: string; veiculo: string; versoes: string[] } {
  if (!mmv) return { marca: '', modelo: '', veiculo: '', versoes: [] };

  let limpo = mmv.trim();
  // Remove prefixo I/ se presente
  if (limpo.startsWith('I/')) {
    limpo = limpo.slice(2).trim();
  }

  // MMV é tipicamente: MARCA/MODELO ou MARCA/MODELO / VERSAO 1 / VERSAO 2
  // Separamos as partes pelo caractere '/'
  const partes = limpo.split('/').map((s) => s.trim()).filter(Boolean);

  if (partes.length === 0) {
    return { marca: '', modelo: '', veiculo: '', versoes: [] };
  }

  if (partes.length === 1) {
    // Apenas modelo ou MMV sem barra: versão fica estritamente em branco
    return { marca: '', modelo: partes[0], veiculo: '', versoes: [] };
  }

  if (partes.length === 2) {
    // Formato padrão: MARCA / MODELO (sem versão cadastrada -> versão em branco)
    return {
      marca: partes[0],
      modelo: partes[1],
      veiculo: '',
      versoes: [],
    };
  }

  // 3 ou mais partes: MARCA / MODELO / VERSÃO 1 (/ VERSÃO 2 ...)
  const marca = partes[0];
  const modelo = partes[1];
  const versoes = partes.slice(2);
  return {
    marca,
    modelo,
    veiculo: versoes.join(' / '),
    versoes,
  };
}

/**
 * Retorna as situações permitidas para o processo.
 * Regra do negócio: Para Dispensa e para Extensões (tipo 'Dispensa', tipo 'Extensão' ou isExtensao === true),
 * são permitidas estritamente:
 * 1. 'Em edição'
 * 2. 'Encaminhada para o ibama'
 * 3. 'Licença/Certidão emitida'
 * Para os demais tipos de homologação, todas as situações do fluxo regulatório são permitidas.
 */
export function obterSituacoesPermitidas(
  tipo: ProcessoTipo,
  isExtensao?: boolean
): SituacaoProcesso[] {
  // Regra: Extensões devem sempre estar em situação Emitida
  if (tipo === 'Extensão' || isExtensao) {
    return ['Licença/Certidão emitida'];
  }
  if (tipo === 'Dispensa') {
    return [
      'Em edição',
      'Encaminhada para o ibama',
      'Licença/Certidão emitida',
    ];
  }
  return [
    'Em edição',
    'Encaminhada para o ibama',
    'Em análise pelo Analista do ATC',
    'A pagar',
    'Para correção',
    'Licença/Certidão emitida',
  ];
}