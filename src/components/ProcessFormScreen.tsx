import React, { useState, useEffect } from 'react';
import { 
  Processo, 
  ProcessoTipo, 
  Procedencia, 
  SituacaoProcesso, 
  TipoVeiculo,
  Observacao 
} from '../types/process';
import {
  obterPrefixoSolicitacao,
  obterPrefixoMMV,
  obterTiposVeiculoPermitidos,
  obterOpcoesQuantidade,
} from '../utils/processCalculations';
import { 
  Check, 
  ArrowLeft, 
  FileCheck, 
  AlertCircle 
} from 'lucide-react';

interface ProcessFormScreenProps {
  onSave: (processo: Processo) => void;
  onCancel: () => void;
  initialData?: Processo | null;
}

export const ProcessFormScreen: React.FC<ProcessFormScreenProps> = ({
  onSave,
  onCancel,
  initialData,
}) => {
  // 1. Tipo
  const [tipo, setTipo] = useState<ProcessoTipo>(initialData?.tipo || 'LCM');

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
    initialData?.procedencia || 'Nacional'
  );

  // 4. MMV (Marca/Modelo/Versão) - store the model part
  const prefixoMMV = obterPrefixoMMV(procedencia);
  const [modeloInput, setModeloInput] = useState<string>(() => {
    if (initialData?.mmv) {
      return initialData.mmv.replace(/^(I\/SHINERAY\/|SHINERAY\/)/i, '');
    }
    return '';
  });

  // 5. MMV Original (only if tipo === 'Extensão')
  const [mmvOriginal, setMmvOriginal] = useState<string>(initialData?.mmvOriginal || '');

  // 6. Número da Licença (optional)
  const [numeroLicenca, setNumeroLicenca] = useState<string>(initialData?.numeroLicenca || '');

  // 7. Quantidade
  const qtdConfig = obterOpcoesQuantidade(tipo);
  const [quantidade, setQuantidade] = useState<string>(() => {
    if (initialData?.quantidade) return initialData.quantidade;
    if (qtdConfig.isSelect && qtdConfig.options.length > 0) return qtdConfig.options[0];
    return '';
  });

  // 8. Tipo de veículo
  const tiposPermitidos = obterTiposVeiculoPermitidos(tipo);
  const [tipoVeiculo, setTipoVeiculo] = useState<TipoVeiculo>(() => {
    if (initialData?.tipoVeiculo && tiposPermitidos.includes(initialData.tipoVeiculo)) {
      return initialData.tipoVeiculo;
    }
    return tiposPermitidos[0];
  });

  // 9. Data do início
  const [dataInicio, setDataInicio] = useState<string>(
    initialData?.dataInicio || new Date().toISOString().split('T')[0]
  );

  // 10. Situação
  const [situacao, setSituacao] = useState<SituacaoProcesso>(
    initialData?.situacao || 'Em edição'
  );

  // 11. Data do envio
  const [dataEnvio, setDataEnvio] = useState<string>(initialData?.dataEnvio || '');

  // 12. Data de emissão
  const [dataEmissao, setDataEmissao] = useState<string>(initialData?.dataEmissao || '');

  // 13. Data de validade da licença
  const [dataValidade, setDataValidade] = useState<string>(initialData?.dataValidade || '');

  // Optional first note
  const [notaInicial, setNotaInicial] = useState<string>('');

  // Validation errors
  const [erros, setErros] = useState<{ [key: string]: string }>({});
  const [sucesso, setSucesso] = useState(false);

  // Synchronize vehicle type when tipo changes
  useEffect(() => {
    const permitidos = obterTiposVeiculoPermitidos(tipo);
    if (!permitidos.includes(tipoVeiculo)) {
      setTipoVeiculo(permitidos[0]);
    }
  }, [tipo, tipoVeiculo]);

  // Synchronize quantidade when tipo changes
  useEffect(() => {
    const config = obterOpcoesQuantidade(tipo);
    if (config.isOmitted) {
      setQuantidade('');
    } else if (config.isSelect && config.options.length > 0) {
      if (!config.options.includes(quantidade)) {
        setQuantidade(config.options[0]);
      }
    }
  }, [tipo, quantidade]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const novosErros: { [key: string]: string } = {};

    if (!numeroSolicitacaoInput.trim()) {
      novosErros.numeroSolicitacao = 'Informe o número da solicitação.';
    }

    if (!modeloInput.trim()) {
      novosErros.mmv = 'Informe a identificação do modelo/versão.';
    }

    if (tipo === 'Extensão' && !mmvOriginal.trim()) {
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
    const fullMMV = `${prefixoMMV}${modeloInput.trim()}`;

    const agora = new Date().toISOString();
    const observacoes: Observacao[] = initialData ? [...initialData.observacoes] : [];

    if (notaInicial.trim()) {
      observacoes.push({
        id: `obs-${Date.now()}`,
        texto: notaInicial.trim(),
        dataHora: agora,
        autor: 'Analista de Homologação Shineray',
      });
    }

    const novoProcesso: Processo = {
      id: initialData?.id || `proc-${Date.now()}`,
      tipo,
      numeroSolicitacao: fullSolicitacao,
      procedencia,
      mmv: fullMMV,
      mmvOriginal: tipo === 'Extensão' ? mmvOriginal.trim() : undefined,
      numeroLicenca: numeroLicenca.trim() || undefined,
      quantidade: !qtdConfig.isOmitted ? quantidade.trim() : undefined,
      tipoVeiculo,
      dataInicio,
      situacao,
      dataEnvio: dataEnvio || undefined,
      dataEmissao: dataEmissao || undefined,
      dataValidade: dataValidade || undefined,
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
            {/* Campo 1: Tipo */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                1. Tipo de Processo <span className="text-[#E30613]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {(['LCVM', 'LCVM Especial', 'LCM', 'LCM Especial', 'Dispensa', 'Extensão'] as ProcessoTipo[]).map(
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
                Define o prefixo do MMV ({procedencia === 'Nacional' ? 'SHINERAY/' : 'I/SHINERAY/'}).
              </p>
            </div>

            {/* Campo 4: MMV */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                4. MMV (Marca / Modelo / Versão) <span className="text-[#E30613]">*</span>
              </label>
              <div className="flex rounded-lg shadow-2xs">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono font-bold text-xs sm:text-sm whitespace-nowrap">
                  {prefixoMMV}
                </span>
                <input
                  type="text"
                  value={modeloInput}
                  onChange={(e) => setModeloInput(e.target.value.toUpperCase())}
                  placeholder="Ex: WORKER 125, STORM 200 PRO, SHE S 3000W"
                  className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-lg border text-sm font-medium tracking-wide uppercase bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500 ${
                    erros.mmv ? 'border-rose-400 bg-rose-50/20' : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-neutral-400">
                <span>Exibição no Infoserv:</span>
                <span className="font-mono font-medium text-neutral-700 dark:text-neutral-300">
                  {prefixoMMV}{modeloInput || '_____'}
                </span>
              </div>
              {erros.mmv && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {erros.mmv}
                </p>
              )}
            </div>

            {/* Campo 5: MMV Original (Apenas se for Extensão) */}
            {tipo === 'Extensão' && (
              <div className="space-y-1.5 sm:col-span-2 p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-lg">
                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  5. MMV Original (Modelo de Origem) <span className="text-[#E30613]">*</span>
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
                  Obrigatório para o tipo Extensão: MMV matriz da homologação anterior.
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
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                6. Número da Licença Infoserv (Opcional)
              </label>
              <input
                type="text"
                value={numeroLicenca}
                onChange={(e) => setNumeroLicenca(e.target.value.toUpperCase())}
                placeholder="Ex: 2026/00142/IBAMA"
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
              <p className="text-[11px] text-neutral-400">
                Preencha quando a licença for expedida pelo órgão.
              </p>
            </div>

            {/* Campo 7: Quantidade */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                7. Quantidade de Veículos
              </label>
              {qtdConfig.isOmitted ? (
                <div className="px-3 py-2 rounded-lg border border-dashed border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-400 text-xs">
                  Não aplicável para {tipo} (campo omitido)
                </div>
              ) : qtdConfig.isSelect ? (
                <select
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
                >
                  {qtdConfig.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  placeholder="Informe a quantidade de veículos"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
                />
              )}
              <p className="text-[11px] text-neutral-400">
                {qtdConfig.isOmitted
                  ? 'Campo desnecessário para este tipo de homologação.'
                  : 'Regra de quantidade baseada no enquadramento.'}
              </p>
            </div>

            {/* Campo 8: Tipo de Veículo */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                8. Tipo de Veículo <span className="text-[#E30613]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {tiposPermitidos.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setTipoVeiculo(v)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors border text-center ${
                      tipoVeiculo === v
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 border-neutral-900 dark:border-white shadow-2xs'
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
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                10. Situação Atual <span className="text-[#E30613]">*</span>
              </label>
              <select
                value={situacao}
                onChange={(e) => setSituacao(e.target.value as SituacaoProcesso)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
              >
                <option value="Em edição">Em edição</option>
                <option value="Encaminhada para o ibama">Encaminhada para o ibama</option>
                <option value="Em análise pelo Analista do ATC">Em análise pelo Analista do ATC</option>
                <option value="A pagar">A pagar</option>
                <option value="Licença/Certidão emitida">Licença/Certidão emitida</option>
              </select>
              <p className="text-[11px] text-neutral-400">
                Status corrente no fluxo regulatório do IBAMA.
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

            {/* Campo 13: Data de Validade da Licença */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                <span>13. Data de Validade da Licença</span>
                <span className="text-[11px] text-neutral-400 font-normal">
                  Alerta gerado com ≤ 61 dias restantes
                </span>
              </label>
              <input
                type="date"
                value={dataValidade}
                onChange={(e) => setDataValidade(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
              <p className="text-[11px] text-neutral-400">
                Alimenta o cálculo de "Dias restantes" e inclusão no painel "Para revalidação".
              </p>
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
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 hover:bg-neutral-200/70 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-medium text-white bg-[#E30613] hover:bg-[#c70510] rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>{initialData ? 'Atualizar Processo' : 'Salvar Processo'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
