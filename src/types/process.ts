export type ProcessoTipo = 
  | 'LCVM'
  | 'LCVM Especial'
  | 'LCM'
  | 'LCM Especial'
  | 'Dispensa'
  | 'Extensão';

export type Procedencia = 'Nacional' | 'Importado';

export type OrgaoCertificador = 'IMT' | 'CETESB';

export type SituacaoProcesso = 
  | 'Em edição'
  | 'Encaminhada para o ibama'
  | 'Em análise pelo Analista do ATC'
  | 'A pagar'
  | 'Para correção'
  | 'Licença/Certidão emitida';

export type TipoVeiculo =
  | 'Veículo leve de passageiros'
  | 'Veículo leve comercial'
  | 'Motor'
  | 'Veículo pesado'
  | 'Chassi'
  | 'Ônibus'
  | 'Máquina Agrícola ou Rodoviária'
  | 'Máquina Agrícola e Rodoviária'
  | 'Ciclomotor'
  | 'Minimoto'
  | 'Motocicleta'
  | 'Motocicleta de competição'
  | 'Motocicleta fora de estrada'
  | 'Triciclo/Quadriciclo'
  | 'Triciclo/Quadriciclo fora de estrada'
  | 'Protótipo'
  | 'Automóvel'
  | 'Caminhonete'
  | 'Camioneta'
  | 'Utilitário'
  | 'Utilitário Esportivo (SUV)'
  | 'Furgão'
  | 'Van'
  | 'Micro-ônibus'
  | 'Caminhão leve'
  | 'Caminhão'
  | 'Chassi-cabine'
  | 'Picape';

export interface Observacao {
  id: string;
  texto: string;
  dataHora: string; // ISO string or formatted string
  autor?: string;
}

export interface Processo {
  id: string;
  tipo: ProcessoTipo;
  numeroSolicitacao: string; // prefixed with SL or SD
  procedencia: Procedencia;
  orgaoCertificador?: OrgaoCertificador; // 'IMT' ou 'CETESB'
  mmv: string; // ex: I/SHINERAY/SBM 500 ou SHINERAY/WORKER 125
  marca?: string; // campo separado de Marca
  modelo?: string; // campo separado de Modelo
  veiculo?: string; // campo separado de Veículo / Versão
  isExtensao?: boolean; // indica se é um processo de extensão
  processoOriginalId?: string; // id do processo original base
  mmvOriginal?: string; // MMV do processo original
  numeroLicenca?: string; // optional / blank until issued
  quantidade?: string; // conditioned by tipo
  tipoVeiculo: TipoVeiculo;
  dataInicio: string; // YYYY-MM-DD
  situacao: SituacaoProcesso;
  dataEnvio?: string; // YYYY-MM-DD
  dataEmissao?: string; // YYYY-MM-DD
  dataValidade?: string; // YYYY-MM-DD
  cnpj?: string; // CNPJ da empresa/filial (e.g. '12482805000106')
  observacoes: Observacao[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface CnpjOption {
  raw: string;
  formatted: string;
  label: string;
  filial?: string;
  isCustom?: boolean;
}

export const DEFAULT_CNPJ_OPTIONS: CnpjOption[] = [
  {
    raw: '12482805000106',
    formatted: '12.482.805/0001-06',
    label: '12482805000106',
  },
  {
    raw: '12482805000289',
    formatted: '12.482.805/0002-89',
    label: '12482805000289',
  },
  {
    raw: '12482805000360',
    formatted: '12.482.805/0003-60',
    label: '12482805000360',
  },
];

export const CNPJ_OPTIONS = DEFAULT_CNPJ_OPTIONS;

export function formatarCNPJ(cnpj?: string): string {
  if (!cnpj) return '';
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length === 14) {
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  return cnpj;
}

export function limparCNPJ(cnpj?: string): string {
  if (!cnpj) return '';
  return cnpj.replace(/\D/g, '');
}

export type ProcessosSubTab = 
  | 'em_edicao'
  | 'em_tramitacao'
  | 'para_correcao'
  | 'licencas_emitidas'
  | 'para_revalidacao'
  | 'todos';

export type AppUser = 'Luca Andrade' | 'Everton Silva';