import React, { useState, useEffect } from 'react';
import { 
  Processo, 
  ProcessoTipo, 
  Procedencia, 
  OrgaoCertificador,
  SituacaoProcesso, 
  TipoVeiculo,
  Observacao,
  CnpjOption,
  CNPJ_OPTIONS,
  formatarCNPJ
} from '../types/process';
import {
  obterPrefixoSolicitacao,
  obterTiposVeiculoPermitidos,
  obterOpcoesQuantidade,
  obterSituacoesPermitidas,
  montarMMV,
  decomporMMV,
  calcularDiasSolicitacaoAteEmissao,
} from '../utils/processCalculations';
import { 
  Check, 
  ArrowLeft, 
  FileCheck, 
  AlertCircle,
  Building2,
  Plus,
  GitBranch,
  Timer,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { AddCnpjModal } from './AddCnpjModal';
import { DeleteProcessModal } from './DeleteProcessModal';

interface ProcessFormScreenProps {
  onSave: (processo: Processo) => void;
  onCancel: () => void;
  onDelete?: (processoId: string) => void;
  initialData?: Processo | null;
  cnpjs?: CnpjOption[];
  onAddCnpj?: (newCnpj: CnpjOption) => void;
  isExtensao?: boolean;
  processoOriginal?: Processo | null;
  currentUser?: string | null;
  isVisitante?: boolean;
}

export const ProcessFormScreen: React.FC<ProcessFormScreenProps> = ({
  onSave,
  onCancel,
  onDelete,
  initialData,
  cnpjs = CNPJ_OPTIONS,
  onAddCnpj,
  isExtensao = false,
  processoOriginal,
  currentUser,
  isVisitante = false,
}) => {
  const [isAddCnpjModalOpen, setIsAddCnpjModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isExtensaoProcesso = Boolean(isExtensao || initialData?.isExtensao || processoOriginal);

  // 1. Tipo
  const [tipo, setTipo] = useState<ProcessoTipo>(() => {
    if (initialData?.tipo && initialData.tipo !== 'Extensão') return initialData.tipo;
    if (processoOriginal?.tipo && processoOriginal.tipo !== 'Extensão') return processoOriginal.tipo;
    return 'LCM';
  });

  // 2. Número da solicitação (storing number portion or complete with prefix)
  const prefixoSolicitacao = obterPrefixoSolicitacao(tipo);
  const [numeroSolicitacaoInput, setNumeroSolicitacaoInput] = useState<string>(() => {
    if (initialData?.numeroSolicitacao) {
      return initialData.numeroSolicitacao.replace(/^(SL|SD)\s*/i, '');
    }
    return '';
  });

  // 3. Procedência
  const [procedencia, setProcedencia] = useState<Procedencia>(
    initialData?.procedencia || processoOriginal?.procedencia || 'Nacional'
  );

  // Órgão Certificador (IMT ou CETESB)
  const [orgaoCertificador, setOrgaoCertificador] = useState<OrgaoCertificador>(
    initialData?.orgaoCertificador || processoOriginal?.orgaoCertificador || 'IMT'
  );

  // 4. MMV decomposto em Marca, Modelo, Versão principal e Versões Adicionais
  const decomposto = initialData?.mmv
    ? decomporMMV(initialData.mmv, initialData.procedencia)
    : (processoOriginal?.mmv
        ? decomporMMV(processoOriginal.mmv, processoOriginal.procedencia)
        : { marca: '', modelo: '', veiculo: '', versoes: [] });

  const [marcaInput, setMarcaInput] = useState<string>(() => {
    if (initialData?.marca) return initialData.marca;
    if (processoOriginal?.marca) return processoOriginal.marca;
    return decomposto.marca || '';
  });

  const [modeloInput, setModeloInput] = useState<string>(() => {
    if (initialData?.modelo) return initialData.modelo;
    return decomposto.modelo || '';
  });

  const [veiculoInput, setVeiculoInput] = useState<string>(() => {
    if (initialData) {
      if (initialData.versoes && initialData.versoes.length > 0) {
        return initialData.versoes[0];
      }
      if (typeof initialData.veiculo === 'string' && initialData.veiculo.trim()) {
        const parts = initialData.veiculo.split('/').map((s) => s.trim()).filter(Boolean);
        return parts.length > 0 ? parts[0] : '';
      }
      // Se não possui versões cadastradas, a versão foi deixada em branco!
      // NUNCA pegar o nome do modelo nem supor partes do modelo como versão.
      if (initialData.modelo || initialData.id) {
        return '';
      }
      return decomposto.veiculo || '';
    }

    if (processoOriginal) {
      if (processoOriginal.versoes && processoOriginal.versoes.length > 0) {
        return processoOriginal.versoes[0];
      }
      if (typeof processoOriginal.veiculo === 'string' && processoOriginal.veiculo.trim()) {
        const parts = processoOriginal.veiculo.split('/').map((s) => s.trim()).filter(Boolean);
        return parts.length > 0 ? parts[0] : '';
      }
      if (processoOriginal.modelo) {
        return '';
      }
      return decomposto.veiculo || '';
    }

    return '';
  });

  const [versoesAdicionais, setVersoesAdicionais] = useState<string[]>(() => {
    if (initialData) {
      if (initialData.versoes && initialData.versoes.length > 1) {
        return initialData.versoes.slice(1);
      }
      if (typeof initialData.veiculo === 'string' && initialData.veiculo.includes('/')) {
        return initialData.veiculo
          .split('/')
          .slice(1)
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (initialData.modelo || initialData.id) {
        return [];
      }
      if (decomposto.versoes && decomposto.versoes.length > 1) {
        return decomposto.versoes.slice(1);
      }
      return [];
    }

    if (processoOriginal) {
      if (processoOriginal.versoes && processoOriginal.versoes.length > 1) {
        return processoOriginal.versoes.slice(1);
      }
      if (typeof processoOriginal.veiculo === 'string' && processoOriginal.veiculo.includes('/')) {
        return processoOriginal.veiculo
          .split('/')
          .slice(1)
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return [];
    }

    return [];
  });

  const handleAddVersao = () => {
    setVersoesAdicionais((prev) => [...prev, '']);
  };

  const handleUpdateVersaoAdicional = (index: number, val: string) => {
    setVersoesAdicionais((prev) => {
      const copy = [...prev];
      copy[index] = val.toUpperCase();
      return copy;
    });
  };

  const handleRemoveVersaoAdicional = (index: number) => {
    setVersoesAdicionais((prev) => prev.filter((_, i) => i !== index));
  };

  // 5. MMV Original (only if tipo === 'Extensão' ou isExtensaoProcesso)
  const [mmvOriginal, setMmvOriginal] = useState<string>(
    initialData?.mmvOriginal || processoOriginal?.mmv || ''
  );

  // 6. Número da Licença (copia automaticamente se for extensão de processo original)
  const [numeroLicenca, setNumeroLicenca] = useState<string>(
    initialData?.numeroLicenca || processoOriginal?.numeroLicenca || ''
  );

  // 8. Tipo de veículo
  const tiposPermitidos = obterTiposVeiculoPermitidos(tipo);
  const [tipoVeiculo, setTipoVeiculo] = useState<TipoVeiculo>(() => {
    if (initialData?.tipoVeiculo && tiposPermitidos.includes(initialData.tipoVeiculo)) {
      return initialData.tipoVeiculo;
    }
    return tiposPermitidos[0];
  });

  // 7. Quantidade
  const qtdConfig = obterOpcoesQuantidade(tipo, tipoVeiculo);
  const [quantidade, setQuantidade] = useState<string>(() => {
    if (initialData?.quantidade) return initialData.quantidade;
    const initialConfig = obterOpcoesQuantidade(tipo, initialData?.tipoVeiculo || tiposPermitidos[0]);
    if (initialConfig.isSelect && initialConfig.options.length > 0) return initialConfig.options[0];
    return '';
  });

  // 9. Data do início
  const [dataInicio, setDataInicio] = useState<string>(
    initialData?.dataInicio || new Date().toISOString().split('T')[0]
  );

  // 10. Situação (para Dispensa e Extensão: apenas 'Em edição', 'Encaminhada para o ibama', 'Licença/Certidão emitida')
  const situacoesPermitidas = obterSituacoesPermitidas(tipo, isExtensaoProcesso);
  const [situacao, setSituacao] = useState<SituacaoProcesso>(() => {
    const permitidasIniciais = obterSituacoesPermitidas(
      tipo,
      initialData?.isExtensao || isExtensao || false
    );
    if (initialData?.situacao && permitidasIniciais.includes(initialData.situacao)) {
      return initialData.situacao;
    }
    return permitidasIniciais[0];
  });

  // 11. Data do envio
  const [dataEnvio, setDataEnvio] = useState<string>(initialData?.dataEnvio || '');

  // 12. Data de emissão
  const [dataEmissao, setDataEmissao] = useState<string>(initialData?.dataEmissao || '');

  // 13. Data de validade da licença (Vencimento original)
  const [dataValidade, setDataValidade] = useState<string>(initialData?.dataValidade || '');

  // 14. Data de Revalidação
  const [dataRevalidacao, setDataRevalidacao] = useState<string>(initialData?.dataRevalidacao || '');

  // 15. Nova Data de Vencimento
  const [novaDataVencimento, setNovaDataVencimento] = useState<string>(initialData?.novaDataVencimento || '');

  // CNPJ da Homologação (Fabricante / Filial)
  const [cnpj, setCnpj] = useState<string>(() => {
    if (initialData?.cnpj) return initialData.cnpj;
    return '12482805000106'; // Matriz pré-selecionada
  });

  // Optional first note
  const [notaInicial, setNotaInicial] = useState<string>('');

  // Validation errors
  const [erros, setErros] = useState<{ [key: string]: string }>({});
  const [sucesso, setSucesso] = useState(false);

  // Synchronize situacao when tipo or isExtensao changes
  useEffect(() => {
    const permitidas = obterSituacoesPermitidas(tipo, isExtensaoProcesso);
    if (!permitidas.includes(situacao)) {
      setSituacao(permitidas[0]);
    }
  }, [tipo, isExtensaoProcesso, situacao]);

  // Synchronize vehicle type when tipo changes
  useEffect(() => {
    const permitidos = obterTiposVeiculoPermitidos(tipo);
    if (!permitidos.includes(tipoVeiculo)) {
      setTipoVeiculo(permitidos[0]);
    }
  }, [tipo, tipoVeiculo]);

  // Synchronize quantidade when tipo or tipoVeiculo changes
  useEffect(() => {
    const config = obterOpcoesQuantidade(tipo, tipoVeiculo);
    if (config.isOmitted) {
      setQuantidade('');
    } else if (config.isSelect && config.options.length > 0) {
      if (!config.options.includes(quantidade)) {
        setQuantidade(config.options[0]);
      }
    }
  }, [tipo, tipoVeiculo, quantidade]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isVisitante) {
      alert('Modo Visitante: você não possui permissão para salvar ou alterar processos.');
      return;
    }
    const novosErros: { [key: string]: string } = {};

    if (!numeroSolicitacaoInput.trim()) {
      novosErros.numeroSolicitacao = 'Informe o número da solicitação.';
    }

    if (!marcaInput.trim()) {
      novosErros.marca = 'Informe a Marca do veículo.';
    }

    if (!modeloInput.trim()) {
      novosErros.modelo = 'Informe o Modelo (ex: SBM, WORKER).';
    }

    if (isExtensaoProcesso && !mmvOriginal.trim()) {
      novosErros.mmvOriginal = 'Para extensão, é obrigatório informar o MMV Original.';
    }

    if (!dataInicio) {
      novosErros.dataInicio = 'Informe a data de início do processo.';
    }

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    setErros({});

    // Construct full values
    const fullSolicitacao = `${prefixoSolicitacao} ${numeroSolicitacaoInput.trim()}`;
    const todasVersoes = [
      veiculoInput.trim().toUpperCase(),
      ...versoesAdicionais.map((v) => v.trim().toUpperCase()),
    ].filter(Boolean);

    const fullMMV = montarMMV(
      procedencia,
      marcaInput,
      modeloInput,
      veiculoInput,
      versoesAdicionais
    );

    const agora = new Date().toISOString();
    const observacoes: Observacao[] = initialData ? [...initialData.observacoes] : [];

    if (notaInicial.trim()) {
      observacoes.push({
        id: `obs-${Date.now()}`,
        texto: notaInicial.trim(),
        dataHora: agora,
        autor: currentUser || 'Luca Andrade',
      });
    }

    const novoProcesso: Processo = {
      id: initialData?.id || `proc-${Date.now()}`,
      tipo,
      numeroSolicitacao: fullSolicitacao,
      procedencia,
      orgaoCertificador,
      mmv: fullMMV,
      marca: marcaInput.trim().toUpperCase(),
      modelo: modeloInput.trim().toUpperCase(),
      veiculo: todasVersoes.length > 0 ? todasVersoes.join(' / ') : '',
      versoes: todasVersoes,
      isExtensao: isExtensaoProcesso,
      processoOriginalId: processoOriginal?.id || initialData?.processoOriginalId || undefined,
      mmvOriginal: isExtensaoProcesso ? mmvOriginal.trim() : undefined,
      numeroLicenca: numeroLicenca.trim() || undefined,
      quantidade: !qtdConfig.isOmitted ? quantidade.trim() : undefined,
      tipoVeiculo,
      dataInicio,
      situacao,
      cnpj: cnpj.trim() || undefined,
      dataEnvio: dataEnvio || undefined,
      dataEmissao: dataEmissao || undefined,
      dataValidade: dataValidade || undefined,
      dataRevalidacao: dataRevalidacao || undefined,
      novaDataVencimento: novaDataVencimento || undefined,
      observacoes,
      criadoEm: initialData?.criadoEm || agora,
      atualizadoEm: agora,
    };

    setSucesso(true);
    setTimeout(() => {
      onSave(novoProcesso);
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao painel</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{initialData ? 'Editar Processo' : 'Cadastrar Novo Processo'}</span>
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
              Infoserv · IBAMA
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Preencha os campos para registro e controle de homologação veicular.
          </p>
        </div>
      </div>

      {sucesso && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-xs sm:text-sm">Processo salvo com sucesso!</div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
              Os dados foram registrados no acervo de homologações da Shineray.
            </div>
          </div>
        </div>
      )}

      {/* Visitor notice banner */}
      {isVisitante && (
        <div className="p-4 bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl text-purple-900 dark:text-purple-200 text-xs flex items-center gap-3 shadow-xs">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold shrink-0">
            Modo Consulta
          </div>
          <div>
            <div className="font-bold text-sm text-purple-950 dark:text-purple-100">
              Acesso de Visitante (Somente Leitura)
            </div>
            <div className="text-[11px] text-purple-700/80 dark:text-purple-300">
              Você está visualizando os dados técnicos do processo. O registro de alterações e criação de processos estão desativados para o perfil visitante.
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Enquadramento e Identificação */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
            <h2 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              1. Enquadramento e Identificação
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Banner de Extensão se aplicável */}
            {isExtensaoProcesso && (
              <div className="sm:col-span-2 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                    <GitBranch className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide">
                      Processo de Extensão de Homologação
                    </div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      Vinculado ao processo original: <strong>{mmvOriginal || 'Original'}</strong>
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900 rounded font-semibold text-emerald-800 dark:text-emerald-200">
                  Extensão Ativa
                </span>
              </div>
            )}

            {/* Campo 1: Tipo */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                1. Tipo de Processo <span className="text-[#E30613]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {(['LCVM', 'LCVM Especial', 'LCM', 'LCM Especial', 'Dispensa'] as ProcessoTipo[]).map(
                  (t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipo(t)}
                      className={`py-2 px-2.5 rounded-lg text-xs font-medium transition-colors text-center border ${
                        tipo === t
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 border-neutral-900 dark:border-white shadow-2xs'
                          : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {t}
                    </button>
                  )
                )}
              </div>
              <p className="text-[11px] text-neutral-400">
                Determina as regras automáticas de prefixo (SL/SD), veículos permitidos e quantidade.
              </p>
            </div>

            {/* Campo 2: Número da Solicitação com regra SL/SD */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                2. Número da Solicitação <span className="text-[#E30613]">*</span>
              </label>
              <div className="flex rounded-lg shadow-2xs">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono font-bold text-xs sm:text-sm">
                  {prefixoSolicitacao}
                </span>
                <input
                  type="text"
                  value={numeroSolicitacaoInput}
                  onChange={(e) => setNumeroSolicitacaoInput(e.target.value)}
                  placeholder="Ex: 2026.0142"
                  className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-lg border text-sm font-mono bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500 ${
                    erros.numeroSolicitacao
                      ? 'border-rose-400 bg-rose-50/20'
                      : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-neutral-400">
                <span>
                  Prefixo {prefixoSolicitacao} atribuído automaticamente
                </span>
                <span className="font-mono text-neutral-600 dark:text-neutral-400">
                  {prefixoSolicitacao} {numeroSolicitacaoInput || '____'}
                </span>
              </div>
              {erros.numeroSolicitacao && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {erros.numeroSolicitacao}
                </p>
              )}
            </div>

            {/* Campo 3: Procedência */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                3. Procedência <span className="text-[#E30613]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Nacional', 'Importado'] as Procedencia[]).map((proc) => (
                  <button
                    key={proc}
                    type="button"
                    onClick={() => setProcedencia(proc)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors border text-center ${
                      procedencia === proc
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 border-neutral-900 dark:border-white shadow-2xs'
                        : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {proc}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-neutral-400">
                {procedencia === 'Importado' ? 'Aplica prefixo "I/" no início do MMV' : 'Procedência Nacional (sem prefixo I/)'}
              </p>
            </div>

            {/* Campo: Órgão Certificador (IMT ou CETESB) */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                4. Órgão Homologador / Certificador <span className="text-[#E30613]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5 max-w-md">
                {(['IMT', 'CETESB'] as OrgaoCertificador[]).map((org) => {
                  const isSelected = orgaoCertificador === org;
                  return (
                    <button
                      key={org}
                      type="button"
                      onClick={() => setOrgaoCertificador(org)}
                      className={`py-2.5 px-3.5 rounded-lg text-xs font-bold transition-all border text-center flex items-center justify-between ${
                        isSelected
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 border-neutral-900 dark:border-white shadow-2xs ring-1 ring-neutral-900 dark:ring-white'
                          : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold">{org}</span>
                        <span className={`text-[10px] font-normal ${isSelected ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-400'}`}>
                          {org === 'IMT' ? 'Instituto Mauá' : 'CETESB'}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="p-0.5 rounded-full bg-[#E30613] text-white">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-neutral-400">
                Selecione a entidade técnica responsável pelos ensaios (IMT ou CETESB).
              </p>
            </div>

            {/* Campo: CNPJ da Empresa / Titular da Homologação */}
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  CNPJ da Empresa / Unidade <span className="text-[#E30613]">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {cnpj && (
                    <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                      Formatado: <strong className="text-neutral-800 dark:text-neutral-200">{formatarCNPJ(cnpj)}</strong>
                    </span>
                  )}
                  {!isVisitante && (
                    <button
                      type="button"
                      onClick={() => setIsAddCnpjModalOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#E30613] hover:underline cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar outro CNPJ</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {cnpjs.map((opt) => {
                  const isSelected = cnpj.replace(/\D/g, '') === opt.raw;
                  return (
                    <button
                      key={opt.raw}
                      type="button"
                      onClick={() => setCnpj(opt.raw)}
                      className={`p-3 rounded-lg border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 border-neutral-900 dark:border-white shadow-2xs ring-1 ring-neutral-900 dark:ring-white'
                          : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Building2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#E30613]' : 'text-neutral-400'}`} />
                          <span className="font-mono text-xs font-bold tracking-tight truncate">
                            {opt.raw}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="p-0.5 rounded-full bg-[#E30613] text-white shrink-0">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                      <div className={`text-[11px] font-mono mt-0.5 ${isSelected ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-500 dark:text-neutral-400'}`}>
                        {opt.formatted}
                      </div>
                    </button>
                  );
                })}

                {/* Button card to add new CNPJ - Bloqueado para Visitante */}
                {!isVisitante && (
                  <button
                    type="button"
                    onClick={() => setIsAddCnpjModalOpen(true)}
                    className="p-3 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all flex flex-col items-center justify-center gap-1 text-center group"
                  >
                    <Plus className="w-4 h-4 text-[#E30613] group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium">+ Outro CNPJ</span>
                    <span className="text-[10px] text-neutral-400">Cadastrar novo</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-neutral-400">
                Selecione o CNPJ da Shineray responsável pela solicitação e emissão no Infoserv/IBAMA.
              </p>
            </div>

            {/* Campo 5: MMV Separado em Marca, Modelo e Múltiplas Versões */}
            <div className="space-y-4 sm:col-span-2 p-4 bg-neutral-50/80 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/80 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    5. Identificação MMV (Marca / Modelo / Versões) <span className="text-[#E30613]">*</span>
                  </label>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Preencha a Marca, o Modelo e as Versões específicas da moto ou veículo.
                  </p>
                </div>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                  {procedencia === 'Importado' ? 'Prefixo "I/" aplicado automaticamente' : 'Procedência Nacional (sem prefixo I/)'}
                </span>
              </div>

              {/* Linha com Marca e Modelo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Marca */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                    Marca do Veículo <span className="text-[#E30613]">*</span>
                  </label>
                  <div className="relative">
                    {procedencia === 'Importado' && (
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.5 rounded">
                        I/
                      </span>
                    )}
                    <input
                      type="text"
                      value={marcaInput}
                      onChange={(e) => setMarcaInput(e.target.value.toUpperCase())}
                      placeholder="Ex: SHINERAY, VOLT, SBM..."
                      className={`w-full ${procedencia === 'Importado' ? 'pl-9' : 'px-3'} py-2 rounded-lg border text-sm font-semibold tracking-wide uppercase bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500 ${
                        erros.marca ? 'border-rose-400 bg-rose-50/20' : 'border-neutral-200 dark:border-neutral-700'
                      }`}
                    />
                  </div>
                  {erros.marca && (
                    <p className="text-[10px] text-rose-600 dark:text-rose-400">
                      {erros.marca}
                    </p>
                  )}
                </div>

                {/* 2. Modelo */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                    Modelo Base <span className="text-[#E30613]">*</span>
                  </label>
                  <input
                    type="text"
                    value={modeloInput}
                    onChange={(e) => setModeloInput(e.target.value.toUpperCase())}
                    placeholder="Ex: WORKER, STORM, SBM, SHI"
                    className={`w-full px-3 py-2 rounded-lg border text-sm font-semibold tracking-wide uppercase bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500 ${
                      erros.modelo ? 'border-rose-400 bg-rose-50/20' : 'border-neutral-200 dark:border-neutral-700'
                    }`}
                  />
                  {erros.modelo && (
                    <p className="text-[10px] text-rose-600 dark:text-rose-400">
                      {erros.modelo}
                    </p>
                  )}
                </div>
              </div>

              {/* Seção de Versões (Principal + Opções para adicionar mais versões) */}
              <div className="pt-2.5 border-t border-neutral-200/80 dark:border-neutral-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Versões do Veículo / Motocicleta
                    </label>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      Cadastre a versão principal e clique no botão para adicionar outras versões específicas.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVersao}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Adicionar versão</span>
                  </button>
                </div>

                {/* Versão Principal (Versão #1) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                      Versão Principal (Versão 1)
                    </label>
                    <span className="text-[10px] font-mono text-neutral-400">Padrão</span>
                  </div>
                  <input
                    type="text"
                    value={veiculoInput}
                    onChange={(e) => setVeiculoInput(e.target.value.toUpperCase())}
                    placeholder="Ex: 125, STD, 200 PRO, CABINE SIMPLES 1.0"
                    className="w-full px-3 py-2 rounded-lg border text-sm font-semibold tracking-wide uppercase bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500 border-neutral-200 dark:border-neutral-700"
                  />
                </div>

                {/* Lista dinâmica de versões adicionais */}
                {versoesAdicionais.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {versoesAdicionais.map((va, idx) => (
                      <div key={idx} className="flex items-center gap-2 animate-in fade-in-0 duration-150">
                        <div className="flex-1 space-y-1">
                          <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                            Versão Adicional #{idx + 2}
                          </label>
                          <input
                            type="text"
                            value={va}
                            onChange={(e) => handleUpdateVersaoAdicional(idx, e.target.value)}
                            placeholder={`Ex: 125 SPORT, OFFROAD, EFI, VERSÃO ${idx + 2}`}
                            className="w-full px-3 py-2 rounded-lg border text-sm font-semibold tracking-wide uppercase bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500 border-neutral-200 dark:border-neutral-700"
                          />
                        </div>
                        <div className="pt-5">
                          <button
                            type="button"
                            onClick={() => handleRemoveVersaoAdicional(idx)}
                            className="p-2 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                            title="Remover esta versão"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Resumo visual das versões registradas */}
                {([veiculoInput.trim().toUpperCase(), ...versoesAdicionais.map((v) => v.trim().toUpperCase())].filter(Boolean).length > 0) && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold mr-1">
                      Versões ativas:
                    </span>
                    {[veiculoInput.trim().toUpperCase(), ...versoesAdicionais.map((v) => v.trim().toUpperCase())].filter(Boolean).map((v, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 shadow-2xs"
                      >
                        <span className="text-[9px] font-bold text-neutral-400">#{i + 1}</span>
                        <span>{v}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Pré-visualização do MMV Formatado */}
              <div className="pt-2.5 border-t border-neutral-200/80 dark:border-neutral-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <span className="text-neutral-500 dark:text-neutral-400">
                  Visualização unificada no cartão do processo:
                </span>
                <span className="font-mono font-bold text-neutral-900 dark:text-white bg-white dark:bg-neutral-900 px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 shadow-2xs break-all">
                  {montarMMV(procedencia, marcaInput, modeloInput, veiculoInput, versoesAdicionais) || 'Aguardando preenchimento...'}
                </span>
              </div>
            </div>

            {/* Campo 6: MMV Original (Apenas se for Extensão) */}
            {isExtensaoProcesso && (
              <div className="space-y-1.5 sm:col-span-2 p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 rounded-lg">
                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  6. MMV Original (Modelo de Origem da Extensão) <span className="text-[#E30613]">*</span>
                </label>
                <input
                  type="text"
                  value={mmvOriginal}
                  onChange={(e) => setMmvOriginal(e.target.value.toUpperCase())}
                  placeholder="Ex: SHINERAY/WORKER 125"
                  className={`w-full px-3 py-2 rounded-lg border text-sm uppercase bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400 ${
                    erros.mmvOriginal ? 'border-rose-400' : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                />
                <p className="text-[11px] text-neutral-500">
                  Obrigatório para Extensão: MMV matriz da homologação anterior.
                </p>
                {erros.mmvOriginal && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {erros.mmvOriginal}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Dados Técnicos e Quantidade */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
            <h2 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              2. Dados Técnicos e Quantidade
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Campo 6: Número da Licença */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  6. Número da Licença Infoserv (Opcional)
                </label>
                {isExtensaoProcesso && (processoOriginal?.numeroLicenca || initialData?.processoOriginalId || initialData?.isExtensao) && numeroLicenca && (
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    Copiada do original
                  </span>
                )}
              </div>
              <input
                type="text"
                disabled={isVisitante}
                value={numeroLicenca}
                onChange={(e) => setNumeroLicenca(e.target.value.toUpperCase())}
                placeholder="Ex: 2026/00142/IBAMA"
                className={`w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-neutral-400 ${
                  isVisitante ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              />
              <p className="text-[11px] text-neutral-400">
                {isExtensaoProcesso
                  ? 'Licença herdada automaticamente da homologação original. Pode ser ajustada se necessário.'
                  : 'Preencha quando a licença for expedida pelo órgão.'}
              </p>
            </div>

            {/* Campo 7: Quantidade */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  7. Quantidade de Veículos <span className="text-[#E30613]">*</span>
                </label>
                {tipo === 'LCM Especial' && qtdConfig.isInput && (
                  <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                    Digitação manual ({tipoVeiculo})
                  </span>
                )}
              </div>
              {qtdConfig.isOmitted ? (
                <div className="px-3 py-2 rounded-lg border border-dashed border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-400 text-xs">
                  Não aplicável para {tipo} (campo omitido)
                </div>
              ) : tipo === 'LCM Especial' && !qtdConfig.isInput ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2.5">
                    {['1', '2'].map((val) => {
                      const isSelected = quantidade === val || (!quantidade && val === '1');
                      return (
                        <button
                          key={val}
                          type="button"
                          disabled={isVisitante}
                          onClick={() => setQuantidade(val)}
                          className={`py-2.5 px-3.5 rounded-xl border text-center transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 border-neutral-900 dark:border-white shadow-xs ring-2 ring-[#E30613]/30 font-bold'
                              : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                          } ${isVisitante ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-base font-extrabold">{val}</span>
                            <span className="text-xs font-semibold">
                              {val === '1' ? '1 Veículo' : '2 Veículos'}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="p-0.5 rounded-full bg-[#E30613] text-white">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Para <strong>LCM Especial</strong> ({tipoVeiculo}), a quantidade padrão é de <strong>1</strong> ou <strong>2</strong> veículos.
                  </p>
                </div>
              ) : qtdConfig.isInput ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    disabled={isVisitante}
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    placeholder={
                      tipo === 'LCM Especial'
                        ? 'Digite a quantidade (ex: 5, 10, lote experimental...)'
                        : 'Ex: 2 protótipos de engenharia para pista...'
                    }
                    className={`w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400 ${
                      isVisitante ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  />
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {tipo === 'LCM Especial'
                      ? `Digitação manual habilitada para ${tipoVeiculo}. Adicione a quantidade conforme especificação técnica.`
                      : 'Especifique o número exato e a destinação técnica.'}
                  </p>
                </div>
              ) : qtdConfig.isSelect ? (
                <div className="space-y-1.5">
                  <select
                    value={quantidade}
                    disabled={isVisitante}
                    onChange={(e) => setQuantidade(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400 ${
                      isVisitante ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {qtdConfig.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-neutral-400">
                    Regra de quantidade baseada no enquadramento.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    disabled={isVisitante}
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    placeholder="Informe a quantidade de veículos"
                    className={`w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400 ${
                      isVisitante ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  />
                  <p className="text-[11px] text-neutral-400">
                    Especifique a quantidade pretendida.
                  </p>
                </div>
              )}
            </div>

            {/* Campo 8: Tipo de Veículo */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                8. Tipo de Veículo <span className="text-[#E30613]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {tiposPermitidos.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setTipoVeiculo(v)}
                    className={`py-2 px-2.5 rounded-lg text-xs font-medium transition-colors border text-center ${
                      tipoVeiculo === v
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 border-neutral-900 dark:border-white shadow-2xs font-semibold'
                        : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-neutral-400">
                Filtrado conforme o tipo selecionado ({tipo}).
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Cronograma e Situação */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
            <h2 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              3. Cronograma e Situação
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Campo 9: Data de Início */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                9. Data de Início do Processo <span className="text-[#E30613]">*</span>
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm font-mono bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400 ${
                  erros.dataInicio ? 'border-rose-400' : 'border-neutral-200 dark:border-neutral-700'
                }`}
              />
              <p className="text-[11px] text-neutral-400">
                Data do início da elaboração técnica interna.
              </p>
              {erros.dataInicio && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {erros.dataInicio}
                </p>
              )}
            </div>

            {/* Campo 10: Situação */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  10. Situação Atual <span className="text-[#E30613]">*</span>
                </label>
                {(tipo === 'Dispensa' || isExtensaoProcesso) && (
                  <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                    Fluxo simplificado: 3 situações
                  </span>
                )}
              </div>
              <select
                value={situacao}
                disabled={isVisitante}
                onChange={(e) => setSituacao(e.target.value as SituacaoProcesso)}
                className={`w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400 ${
                  isVisitante ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {situacoesPermitidas.map((sit) => (
                  <option key={sit} value={sit}>
                    {sit}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-neutral-400">
                {(tipo === 'Dispensa' || isExtensaoProcesso)
                  ? 'Para Dispensa e Extensão, são aplicáveis apenas: Em edição, Encaminhada para o ibama e Licença/Certidão emitida.'
                  : 'Status corrente no fluxo regulatório do IBAMA.'}
              </p>
            </div>

            {/* Campo 11: Data do Envio */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                11. Data do Envio ao Órgão
              </label>
              <input
                type="date"
                value={dataEnvio}
                onChange={(e) => setDataEnvio(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
              <p className="text-[11px] text-neutral-400">
                Data do envio da solicitação ao IBAMA.
              </p>
            </div>

            {/* Campo 12: Data de Emissão */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                12. Data de Emissão da Licença
              </label>
              <input
                type="date"
                value={dataEmissao}
                onChange={(e) => setDataEmissao(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
              <p className="text-[11px] text-neutral-400">
                Data em que a certidão/licença foi expedida.
              </p>
            </div>

            {/* Indicador de Lead Time Regulamentar Calculado em Tempo Real */}
            {dataEnvio && (
              <div className="sm:col-span-2 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-[#E30613]" />
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Lead Time de Emissão ({dataEmissao ? 'Envio → Emissão Concluída' : 'Dias Decorridos Desde o Envio'}):
                  </span>
                </div>
                {(() => {
                  const calc = calcularDiasSolicitacaoAteEmissao(dataEnvio, dataEmissao);
                  if (!calc) return null;
                  return (
                    <span className={`font-mono font-bold px-2.5 py-1 rounded-lg border shadow-2xs ${
                      calc.emitido
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    }`}>
                      {calc.dias} dias {calc.emitido ? '· Concluído' : '· Aguardando órgão'}
                    </span>
                  );
                })()}
              </div>
            )}

            {/* Campo 13: Data de Validade da Licença */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                <span>13. Data de Validade da Licença (Vencimento Original)</span>
                <span className="text-[11px] text-neutral-400 font-normal">
                  Alerta gerado com ≤ 61 dias restantes
                </span>
              </label>
              <input
                type="date"
                disabled={isVisitante}
                value={dataValidade}
                onChange={(e) => setDataValidade(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-neutral-400 ${
                  isVisitante ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              />
              <p className="text-[11px] text-neutral-400">
                Alimenta o cálculo de "Dias restantes" e inclusão no painel "Para revalidação".
              </p>
            </div>

            {/* Bloco de Revalidação de Licença: Campos 14 e 15 */}
            <div className="sm:col-span-2 p-4 rounded-xl border border-amber-200/90 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                      Revalidação de Licença / Certidão
                    </h3>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Preencha quando a homologação passar pelo processo de revalidação técnica
                    </p>
                  </div>
                </div>
                {(dataRevalidacao || novaDataVencimento) && (
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                    Revalidado
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* Campo 14: Data de Revalidação */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    14. Data de Revalidação
                  </label>
                  <input
                    type="date"
                    disabled={isVisitante}
                    value={dataRevalidacao}
                    onChange={(e) => setDataRevalidacao(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-neutral-400 ${
                      isVisitante ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  />
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Data em que a revalidação foi realizada ou protocolada.
                  </p>
                </div>

                {/* Campo 15: Nova Data de Vencimento */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    15. Nova Data de Vencimento
                  </label>
                  <input
                    type="date"
                    disabled={isVisitante}
                    value={novaDataVencimento}
                    onChange={(e) => setNovaDataVencimento(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-neutral-400 ${
                      isVisitante ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  />
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Novo prazo de validade da certidão após revalidação.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Registro de Observação Inicial */}
        {!initialData && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              Observação Inicial (Opcional)
            </h2>
            <textarea
              rows={3}
              value={notaInicial}
              onChange={(e) => setNotaInicial(e.target.value)}
              placeholder="Adicione um parecer preliminar, número de protocolo interno ou informação sobre laudos..."
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400 placeholder:text-neutral-400"
            />
            <p className="text-[11px] text-neutral-400">
              Esta anotação ficará registrada no Histórico de Observações com carimbo de data e hora.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
          <div>
            {initialData && !isVisitante && onDelete && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Processo</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 hover:bg-neutral-200/70 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
            >
              {isVisitante ? 'Fechar Visualização' : 'Cancelar'}
            </button>
            {!isVisitante && (
              <button
                type="submit"
                className="px-5 py-2 text-xs font-medium text-white bg-[#E30613] hover:bg-[#c70510] rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>{initialData ? 'Atualizar Processo' : 'Salvar Processo'}</span>
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Modal para adicionar novo CNPJ */}
      {!isVisitante && (
        <AddCnpjModal
          isOpen={isAddCnpjModalOpen}
          onClose={() => setIsAddCnpjModalOpen(false)}
          onSave={(newCnpj) => {
            if (onAddCnpj) {
              onAddCnpj(newCnpj);
            }
            setCnpj(newCnpj.raw);
          }}
          existingCnpjs={cnpjs}
        />
      )}

      {/* Modal para confirmação de exclusão */}
      {initialData && (
        <DeleteProcessModal
          isOpen={isDeleteModalOpen}
          processo={initialData}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => {
            if (onDelete && initialData) {
              onDelete(initialData.id);
              setIsDeleteModalOpen(false);
              onCancel();
            }
          }}
        />
      )}
    </div>
  );
};
