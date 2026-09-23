export type ProcessoTipo = 
  | 'LCVM'
  | 'LCVM Especial'
  | 'LCM'
  | 'LCM Especial'
  | 'Dispensa'
  | 'Extensão';

export type Procedencia = 'Nacional' | 'Importado';

export type SituacaoProcesso = 
  | 'Em edição'
  | 'Encaminhada para o ibama'
  | 'Em análise pelo Analista do ATC'
  | 'A pagar'
  | 'Licença/Certidão emitida';

export type TipoVeiculo =
  | 'Veículo leve de passageiros'
  | 'Veículo leve comercial'
  | 'Motocicleta'
  | 'Motocicleta fora de estrada'
  | 'Triciclo/Quadriciclo'
  | 'Triciclo/Quadriciclo fora de estrada'
  | 'Protótipo';

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
  mmv: string; // prefixed with SHINERAY/ or I/SHINERAY/
  mmvOriginal?: string; // only if tipo === 'Extensão'
  numeroLicenca?: string; // optional / blank until issued
  quantidade?: string; // conditioned by tipo
  tipoVeiculo: TipoVeiculo;
  dataInicio: string; // YYYY-MM-DD
  situacao: SituacaoProcesso;
  dataEnvio?: string; // YYYY-MM-DD
  dataEmissao?: string; // YYYY-MM-DD
  dataValidade?: string; // YYYY-MM-DD
  observacoes: Observacao[];
  criadoEm: string;
  atualizadoEm: string;
}

export type ProcessosSubTab = 
  | 'em_edicao'
  | 'em_tramitacao'
  | 'licencas_emitidas'
  | 'para_revalidacao'
  | 'todos';
