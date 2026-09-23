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
  PlusCircle, 
  Check, 
  ArrowLeft, 
  Info, 
  FileCheck, 
  AlertCircle,
  Calendar,
  Sparkles
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
      // remove SL or SD prefix if present to keep number clean
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
    } else if (config.isInput) {
      // Keep or reset
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
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao painel</span>
          </button>
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{initialData ? 'Editar Processo Infoserv' : 'Cadastrar Novo Processo'}</span>
            <span className="text-xs font-mono font-normal text-[#E30613] bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 px-2 py-0.5 rounded">
              IBAMA · PROCONVE / PROMOT
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Preencha os campos de conformidade técnica para homologação e emissão de licença ambiental.
          </p>
        </div>
      </div>

      {sucesso && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 flex items-center gap-3 animate-in fade-in-50">
          <div className="p-2 bg-emerald-500 text-white rounded-lg">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm">Processo salvo com sucesso!</div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400">
              Os dados foram registrados no acervo de homologações da Shineray.
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identificação Básica */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E30613]" />
              1. Enquadramento e Identificação (Campos 1 a 5)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Campo 1: Tipo */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                1. Tipo de Processo <span className="text-[#E30613]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {(['LCVM', 'LCVM Especial', 'LCM', 'LCM Especial', 'Dispensa', 'Extensão'] as ProcessoTipo[]).map(
                  (t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipo(t)}
                      className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-center border ${
                        tipo === t
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 border-neutral-900 dark:border-white shadow-sm ring-2 ring-[#E30613]/20'
                          : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {t}
                    </button>
                  )
                )}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Determina as regras automáticas de prefixo (SL/SD), veículos permitidos e quantidade.
              </p>
            </div>

            {/* Campo 2: Número da Solicitação com regra SL/SD */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                2. Número da Solicitação <span className="text-[#E30613]">*</span>
              </label>
              <div className="flex rounded-lg shadow-sm">
                <span className="inline-flex items-center px-3.5 rounded-l-lg border border-r-0 border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-mono font-bold text-sm">
                  {prefixoSolicitacao}
                </span>
                <input
                  type="text"
                  value={numeroSolicitacaoInput}
                  onChange={(e) => setNumeroSolicitacaoInput(e.target.value)}
                  placeholder="Ex: 2026.0142"
                  className={`flex-1 min-w-0 block w-full px-3 py-2.5 rounded-none rounded-r-lg border text-sm font-mono bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#E30613] focus:border-transparent ${
                    erros.numeroSolicitacao
                      ? 'border-red-500 bg-red-50/30'
                      : 'border-neutral-300 dark:border-neutral-700'
                  }`}
                />
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-neutral-500 dark:text-neutral-400">
                  Regra: Dispensa utiliza prefixo <strong>SD</strong>; demais utilizam <strong>SL</strong>.
                </span>
                <span className="font-mono text-neutral-400 dark:text-neutral-500">
                  {prefixoSolicitacao} {numeroSolicitacaoInput || '____'}
                </span>
              </div>
              {erros.numeroSolicitacao && (
                <p className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3 h-3" /> {erros.numeroSolicitacao}
                </p>
              )}
            </div>

            {/* Campo 3: Procedência */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                3. Procedência <span className="text-[#E30613]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Nacional', 'Importado'] as Procedencia[]).map((proc) => (
                  <button
                    key={proc}
                    type="button"
                    onClick={() => setProcedencia(proc)}
                    className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all border text-center ${
                      procedencia === proc
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 border-neutral-900 dark:border-white shadow-sm'
                        : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {proc}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Nacional prefixa MMV com <strong>SHINERAY/</strong>; Importado com <strong>I/SHINERAY/</strong>.
              </p>
            </div>

            {/* Campo 4: MMV */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                4. MMV (Marca / Modelo / Versão) <span className="text-[#E30613]">*</span>
              </label>
              <div className="flex rounded-lg shadow-sm">
                <span className="inline-flex items-center px-3.5 rounded-l-lg border border-r-0 border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-mono font-bold text-xs sm:text-sm whitespace-nowrap">
                  {prefixoMMV}
                </span>
                <input
                  type="text"
                  value={modeloInput}
                  onChange={(e) => setModeloInput(e.target.value.toUpperCase())}
                  placeholder="Ex: WORKER 125, STORM 200 PRO, SHE S 3000W"
                  className={`flex-1 min-w-0 block w-full px-3 py-2.5 rounded-none rounded-r-lg border text-sm font-semibold tracking-wide uppercase bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#E30613] focus:border-transparent ${
                    erros.mmv ? 'border-red-500 bg-red-50/30' : 'border-neutral-300 dark:border-neutral-700'
                  }`}
                />
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-neutral-500 dark:text-neutral-400">
                  Exibição final homologada no Infoserv:
                </span>
                <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                  {prefixoMMV}{modeloInput || '_____'}
                </span>
              </div>
              {erros.mmv && (
                <p className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3 h-3" /> {erros.mmv}
                </p>
              )}
            </div>

            {/* Campo 5: MMV Original (Apenas se for Extensão) */}
            {tipo === 'Extensão' && (
              <div className="space-y-1.5 sm:col-span-2 p-4 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl">
                <label className="block text-xs font-bold text-amber-950 dark:text-amber-300 uppercase tracking-wide">
                  5. MMV Original (Obrigatório para Extensão) <span className="text-[#E30613]">*</span>
                </label>
                <input
                  type="text"
                  value={mmvOriginal}
                  onChange={(e) => setMmvOriginal(e.target.value.toUpperCase())}
                  placeholder="Ex: I/SHINERAY/SHE S 3000W"
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm font-semibold bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    erros.mmvOriginal ? 'border-red-500' : 'border-amber-300 dark:border-amber-700'
                  }`}
                />
                <p className="text-[11px] text-amber-800 dark:text-amber-400">
                  Indique a Marca/Modelo/Versão base cujos ensaios e relatórios de emissões foram aproveitados.
                </p>
                {erros.mmvOriginal && (
                  <p className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3 h-3" /> {erros.mmvOriginal}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Características Técnicas e Quantidade */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E30613]" />
              2. Dados do Veículo e Licenciamento (Campos 6 a 8)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Campo 6: Número da Licença (Pode ficar em branco inicialmente) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                  6. Número da Licença
                </label>
                <span className="text-[10px] text-neutral-400 font-medium">
                  Opcional (Pode preencher após emissão)
                </span>
              </div>
              <input
                type="text"
                value={numeroLicenca}
                onChange={(e) => setNumeroLicenca(e.target.value)}
                placeholder="Ex: LCM-0842/2026-IBAMA (Deixe em branco se pendente)"
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-[#E30613] focus:border-transparent placeholder:text-neutral-400"
              />
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Pode ficar em branco inicialmente, sendo alterado após a emissão pelo Infoserv.
              </p>
            </div>

            {/* Campo 7: Quantidade (Condicionado pelo Tipo) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                7. Quantidade {qtdConfig.isOmitted && <span className="text-neutral-400 font-normal">(Não aplicável para Extensão)</span>}
              </label>

              {qtdConfig.isOmitted ? (
                <div className="py-2.5 px-3 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-500 dark:text-neutral-400 italic">
                  Extensão não requer quantidade definida.
                </div>
              ) : qtdConfig.isSelect ? (
                <select
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-[#E30613] focus:border-transparent"
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
                  placeholder="Digite a quantidade desejada (Ex: 3 unidades para testes)"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-[#E30613] focus:border-transparent"
                />
              )}

              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Regra: LCVM = Restrita/Ilimitada; LCM = Restrita (3 a 50); Especial = Limitada (1 a 2); Dispensa = digitação livre.
              </p>
            </div>

            {/* Campo 8: Tipo de Veículo (Condicionado pelo Tipo) */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                8. Tipo de Veículo <span className="text-[#E30613]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {tiposPermitidos.map((tv) => (
                  <button
                    key={tv}
                    type="button"
                    onClick={() => setTipoVeiculo(tv)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border text-left flex items-center justify-between ${
                      tipoVeiculo === tv
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 border-neutral-900 dark:border-white shadow-sm'
                        : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <span>{tv}</span>
                    {tipoVeiculo === tv && <Check className="w-3.5 h-3.5 text-[#E30613]" />}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Opções filtradas dinamicamente conforme o tipo selecionado ({tipo}).
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Datas e Situação do Processo */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E30613]" />
              3. Tramitação, Prazos e Validade (Campos 9 a 13)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Campo 9: Data do Início */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                9. Data do Início <span className="text-[#E30613]">*</span>
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm font-mono bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#E30613] focus:border-transparent ${
                  erros.dataInicio ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
                }`}
              />
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Data em que o processo no Infoserv começou a ser criado.
              </p>
            </div>

            {/* Campo 10: Situação */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                10. Situação <span className="text-[#E30613]">*</span>
              </label>
              <select
                value={situacao}
                onChange={(e) => setSituacao(e.target.value as SituacaoProcesso)}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-sm font-semibold bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#E30613] focus:border-transparent"
              >
                <option value="Em edição">Em edição</option>
                <option value="Encaminhada para o ibama">Encaminhada para o ibama</option>
                <option value="Em análise pelo Analista do ATC">Em análise pelo Analista do ATC</option>
                <option value="A pagar">A pagar</option>
                <option value="Licença/Certidão emitida">Licença/Certidão emitida</option>
              </select>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Status corrente no fluxo regulatório do IBAMA.
              </p>
            </div>

            {/* Campo 11: Data do Envio */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                11. Data do Envio
              </label>
              <input
                type="date"
                value={dataEnvio}
                onChange={(e) => setDataEnvio(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-[#E30613] focus:border-transparent"
              />
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Data do envio da solicitação ao IBAMA.
              </p>
            </div>

            {/* Campo 12: Data de Emissão */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                12. Data de Emissão
              </label>
              <input
                type="date"
                value={dataEmissao}
                onChange={(e) => setDataEmissao(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-[#E30613] focus:border-transparent"
              />
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Data em que a certidão/licença foi expedida.
              </p>
            </div>

            {/* Campo 13: Data de Validade da Licença */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide flex items-center justify-between">
                <span>13. Data de Validade da Licença</span>
                <span className="text-[10px] text-neutral-400 font-normal">
                  Gera alerta quando faltar ≤ 61 dias
                </span>
              </label>
              <input
                type="date"
                value={dataValidade}
                onChange={(e) => setDataValidade(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-[#E30613] focus:border-transparent"
              />
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Alimenta o cálculo de "Dias restantes" e inclusão no painel "Para revalidação".
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Registro de Observação Inicial */}
        {!initialData && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 sm:p-6 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neutral-400" />
              Observação Inicial de Cadastro (Opcional)
            </h2>
            <textarea
              rows={3}
              value={notaInicial}
              onChange={(e) => setNotaInicial(e.target.value)}
              placeholder="Adicione um parecer preliminar, número de protocolo interno ou informação sobre laudos..."
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-[#E30613] focus:border-transparent placeholder:text-neutral-400"
            />
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Esta anotação ficará registrada no Histórico de Observações com carimbo de data e hora.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-bold text-white bg-[#E30613] hover:bg-[#C40510] active:scale-[0.99] rounded-lg transition-all shadow-sm flex items-center gap-2"
          >
            <FileCheck className="w-4 h-4" />
            <span>{initialData ? 'Atualizar Processo' : 'Salvar Processo no Infoserv'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
