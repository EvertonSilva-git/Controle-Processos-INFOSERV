import { ProcessoTipo, Procedencia, TipoVeiculo } from '../types/process';

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
 * Verifies if a process license is up for revalidation (within 61 days)
 */
export function estaParaRevalidar(dataValidade?: string, situacao?: string): boolean {
  if (!dataValidade) return false;
  // Usually applies to issued licenses or processes with an active license date
  const dias = calcularDiasRestantes(dataValidade);
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
 * Returns MMV prefix based on provenance:
 * 'SHINERAY/' for Nacional, 'I/SHINERAY/' for Importado
 */
export function obterPrefixoMMV(procedencia: Procedencia): 'SHINERAY/' | 'I/SHINERAY/' {
  return procedencia === 'Importado' ? 'I/SHINERAY/' : 'SHINERAY/';
}

/**
 * Returns allowed vehicle types based on process type
 */
export function obterTiposVeiculoPermitidos(tipo: ProcessoTipo): TipoVeiculo[] {
  switch (tipo) {
    case 'LCVM':
    case 'LCVM Especial':
      return ['Veículo leve de passageiros', 'Veículo leve comercial'];
    case 'LCM':
      return ['Motocicleta'];
    case 'LCM Especial':
      return [
        'Motocicleta fora de estrada',
        'Triciclo/Quadriciclo',
        'Triciclo/Quadriciclo fora de estrada',
      ];
    case 'Dispensa':
      return ['Protótipo'];
    case 'Extensão':
      return [
        'Veículo leve de passageiros',
        'Veículo leve comercial',
        'Motocicleta',
        'Motocicleta fora de estrada',
        'Triciclo/Quadriciclo',
        'Triciclo/Quadriciclo fora de estrada',
      ];
    default:
      return ['Motocicleta'];
  }
}

/**
 * Returns allowed quantity options (if selectable) for process type
 */
export function obterOpcoesQuantidade(tipo: ProcessoTipo): {
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
        options: ['Limitada (1 a 2)'],
      };
    case 'LCM':
      return {
        isSelect: true,
        isInput: false,
        isOmitted: false,
        options: ['Restrita (3 a 50)'],
      };
    case 'LCM Especial':
      return {
        isSelect: true,
        isInput: false,
        isOmitted: false,
        options: ['Limitada (1 a 2)'],
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
