import ExcelJS from 'exceljs';
import { Processo, formatarCNPJ } from '../types/process';
import {
  calcularDiasRestantes,
  calcularDiasSolicitacaoAteEmissao,
  formatarDataBR,
  formatarDataHoraBR,
} from './processCalculations';

export async function exportarProcessosExcel(processos: Processo[]) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Shineray do Brasil - Sistema Infoserv';
  wb.lastModifiedBy = 'Shineray Homologação Técnica';
  wb.created = new Date();
  wb.modified = new Date();

  // Definições padronizadas de bordas para Excel
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'CBD5E1' } },    // slate-300
    left: { style: 'thin', color: { argb: 'CBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'CBD5E1' } },
    right: { style: 'thin', color: { argb: 'CBD5E1' } },
  };

  const mediumBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'medium', color: { argb: '94A3B8' } },
    left: { style: 'medium', color: { argb: '94A3B8' } },
    bottom: { style: 'medium', color: { argb: '94A3B8' } },
    right: { style: 'medium', color: { argb: '94A3B8' } },
  };

  const headerBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'medium', color: { argb: '7F1D1D' } },
    left: { style: 'thin', color: { argb: '991B1B' } },
    bottom: { style: 'medium', color: { argb: '7F1D1D' } },
    right: { style: 'thin', color: { argb: '991B1B' } },
  };

  const totalBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: '64748B' } },
    left: { style: 'thin', color: { argb: 'CBD5E1' } },
    bottom: { style: 'double', color: { argb: '1E293B' } },
    right: { style: 'thin', color: { argb: 'CBD5E1' } },
  };

  // Funções utilitárias de estilo
  const applyRangeStyle = (
    sheet: ExcelJS.Worksheet,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
    fillColor: string,
    border: Partial<ExcelJS.Borders> = thinBorder
  ) => {
    for (let r = startRow; r <= endRow; r++) {
      const row = sheet.getRow(r);
      for (let c = startCol; c <= endCol; c++) {
        const cell = row.getCell(c);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: fillColor },
        };
        cell.border = border;
      }
    }
  };

  // Contadores para KPIs
  const totalProcessos = processos.length;
  const emitidas = processos.filter((p) => p.situacao === 'Licença/Certidão emitida' || !!p.numeroLicenca);
  const emAndamento = processos.filter((p) => p.situacao !== 'Licença/Certidão emitida' && !p.numeroLicenca);
  const paraCorrecao = processos.filter((p) => p.situacao === 'Para correção');
  const paraRevalidar = processos.filter((p) => {
    const dias = calcularDiasRestantes(p.dataValidade);
    return dias !== null && dias > 0 && dias <= 61;
  });
  const vencidas = processos.filter((p) => {
    const dias = calcularDiasRestantes(p.dataValidade);
    return dias !== null && dias <= 0;
  });

  // =========================================================================
  // ABA 1: PROCESSOS DE HOMOLOGAÇÃO DETALHADOS COM BORDAS E FORMATAÇÃO VISUAL
  // =========================================================================
  const ws = wb.addWorksheet('Processos de Homologação', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 8, showGridLines: true }],
  });

  const TOTAL_COLS = 26;

  // Linha 1: Banner Superior Corporativo Shineray
  ws.mergeCells('A1:Z1');
  applyRangeStyle(ws, 1, 1, 1, TOTAL_COLS, '991B1B', mediumBorder);
  const titleCell = ws.getCell('A1');
  titleCell.value = 'SHINERAY DO BRASIL  ·  CONTROLE DE HOMOLOGAÇÃO TÉCNICA E LICENÇAS (INFOSERV / IBAMA)';
  titleCell.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 34;

  // Linha 2: Subtítulo com Data de Emissão e Sistema
  ws.mergeCells('A2:Z2');
  applyRangeStyle(ws, 2, 1, 2, TOTAL_COLS, '1E293B', thinBorder);
  const subCell = ws.getCell('A2');
  const dataGeracao = new Date().toLocaleString('pt-BR');
  subCell.value = `Relatório Técnico Oficial Gerado em: ${dataGeracao}  |  Conformidade Regulamentar PROCONVE / PROMOT M5`;
  subCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'F8FAFC' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(2).height = 20;

  // Linha 3: Espaçador
  ws.getRow(3).height = 6;

  // Linhas 4 e 5: BLOCO DE CARDS DE KPI (Indicadores Rápidos no Topo da Planilha)
  // Card 1: Total Geral (Cols A-D)
  ws.mergeCells('A4:D4');
  ws.mergeCells('A5:D5');
  applyRangeStyle(ws, 4, 1, 5, 4, 'F1F5F9', mediumBorder);
  const kpi1Title = ws.getCell('A4');
  kpi1Title.value = 'TOTAL DE PROCESSOS';
  kpi1Title.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: '475569' } };
  kpi1Title.alignment = { vertical: 'middle', horizontal: 'center' };
  const kpi1Val = ws.getCell('A5');
  kpi1Val.value = totalProcessos;
  kpi1Val.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: '0F172A' } };
  kpi1Val.alignment = { vertical: 'middle', horizontal: 'center' };

  // Card 2: Licenças Emitidas (Cols E-H)
  ws.mergeCells('E4:H4');
  ws.mergeCells('E5:H5');
  applyRangeStyle(ws, 4, 5, 5, 8, 'ECFDF5', mediumBorder);
  const kpi2Title = ws.getCell('E4');
  kpi2Title.value = 'LICENÇAS EMITIDAS';
  kpi2Title.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: '065F46' } };
  kpi2Title.alignment = { vertical: 'middle', horizontal: 'center' };
  const kpi2Val = ws.getCell('E5');
  kpi2Val.value = emitidas.length;
  kpi2Val.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: '047857' } };
  kpi2Val.alignment = { vertical: 'middle', horizontal: 'center' };

  // Card 3: Em Trâmite / Análise (Cols I-M)
  ws.mergeCells('I4:M4');
  ws.mergeCells('I5:M5');
  applyRangeStyle(ws, 4, 9, 5, 13, 'EFF6FF', mediumBorder);
  const kpi3Title = ws.getCell('I4');
  kpi3Title.value = 'EM TRÂMITE / ANÁLISE';
  kpi3Title.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: '1E40AF' } };
  kpi3Title.alignment = { vertical: 'middle', horizontal: 'center' };
  const kpi3Val = ws.getCell('I5');
  kpi3Val.value = emAndamento.length;
  kpi3Val.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: '1D4ED8' } };
  kpi3Val.alignment = { vertical: 'middle', horizontal: 'center' };

  // Card 4: Para Correção (Cols N-R)
  ws.mergeCells('N4:R4');
  ws.mergeCells('N5:R5');
  applyRangeStyle(ws, 4, 14, 5, 18, 'FFF1F2', mediumBorder);
  const kpi4Title = ws.getCell('N4');
  kpi4Title.value = 'PARA CORREÇÃO';
  kpi4Title.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: '9F1239' } };
  kpi4Title.alignment = { vertical: 'middle', horizontal: 'center' };
  const kpi4Val = ws.getCell('N5');
  kpi4Val.value = paraCorrecao.length;
  kpi4Val.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'BE123C' } };
  kpi4Val.alignment = { vertical: 'middle', horizontal: 'center' };

  // Card 5: Para Revalidação / Vencidas (Cols S-Z)
  ws.mergeCells('S4:Z4');
  ws.mergeCells('S5:Z5');
  applyRangeStyle(ws, 4, 19, 5, 26, 'FFFBEB', mediumBorder);
  const kpi5Title = ws.getCell('S4');
  kpi5Title.value = 'ALERTA REVALIDAÇÃO / VENCIMENTO';
  kpi5Title.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: '92400E' } };
  kpi5Title.alignment = { vertical: 'middle', horizontal: 'center' };
  const kpi5Val = ws.getCell('S5');
  kpi5Val.value = `${paraRevalidar.length} a revalidar  |  ${vencidas.length} vencida(s)`;
  kpi5Val.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'B45309' } };
  kpi5Val.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.getRow(4).height = 18;
  ws.getRow(5).height = 26;

  // Linha 6 e 7: Separadores
  ws.getRow(6).height = 8;
  ws.getRow(7).height = 4;

  // Definição das Colunas da Tabela de Processos
  const columns = [
    { key: 'solicitacao', header: 'Nº Solicitação', width: 17, align: 'center' },
    { key: 'tipo', header: 'Tipo Processo', width: 16, align: 'center' },
    { key: 'extensao', header: 'Extensão?', width: 13, align: 'center' },
    { key: 'mmvOriginal', header: 'Processo Matriz (Base)', width: 28, align: 'left' },
    { key: 'situacao', header: 'Situação Regulamentar', width: 28, align: 'center' },
    { key: 'orgao', header: 'Órgão Técnico', width: 16, align: 'center' },
    { key: 'procedencia', header: 'Procedência', width: 15, align: 'center' },
    { key: 'cnpjFormatado', header: 'CNPJ Unidade', width: 22, align: 'center' },
    { key: 'marca', header: 'Marca', width: 16, align: 'center' },
    { key: 'modelo', header: 'Modelo', width: 18, align: 'left' },
    { key: 'veiculo', header: 'Veículo / Versão', width: 24, align: 'left' },
    { key: 'mmv', header: 'MMV Completo', width: 34, align: 'left' },
    { key: 'tipoVeiculo', header: 'Tipo de Veículo', width: 26, align: 'left' },
    { key: 'quantidade', header: 'Quantidade', width: 18, align: 'center' },
    { key: 'numeroLicenca', header: 'Nº Licença / Certidão', width: 24, align: 'center' },
    { key: 'dataInicio', header: 'Data Início', width: 14, align: 'center' },
    { key: 'dataEnvio', header: 'Data Envio', width: 14, align: 'center' },
    { key: 'dataEmissao', header: 'Data Emissão', width: 14, align: 'center' },
    { key: 'dataValidade', header: 'Data Validade', width: 15, align: 'center' },
    { key: 'statusValidade', header: 'Status Validade', width: 25, align: 'center' },
    { key: 'diasRestantes', header: 'Dias Restantes', width: 16, align: 'center' },
    { key: 'prazoAnalise', header: 'Prazo Análise (Dias)', width: 20, align: 'center' },
    { key: 'totalObs', header: 'Nº Anotações', width: 14, align: 'center' },
    { key: 'ultimaObsAutor', header: 'Autor Última Obs.', width: 22, align: 'center' },
    { key: 'ultimaObsTexto', header: 'Última Observação Registrada', width: 50, align: 'left' },
    { key: 'ultimaObsData', header: 'Data da Última Obs.', width: 20, align: 'center' },
  ];

  // Linha 8: Cabeçalhos com Vermelho Institucional Shineray e Bordas
  const headerRow = ws.getRow(8);
  headerRow.height = 30;

  columns.forEach((col, idx) => {
    const colNumber = idx + 1;
    const cell = headerRow.getCell(colNumber);
    cell.value = col.header;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'B91C1C' }, // Vermelho Shineray
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = headerBorder;
    ws.getColumn(colNumber).width = col.width;
  });

  // Linhas 9 em diante: Dados formatados com bordas e cores de destaque
  processos.forEach((p, pIdx) => {
    const rowNumber = 9 + pIdx;
    const row = ws.getRow(rowNumber);
    row.height = 24;

    const diasRestantes = calcularDiasRestantes(p.dataValidade);
    const prazoAnalise = calcularDiasSolicitacaoAteEmissao(p.dataEnvio, p.dataEmissao);
    const ultimaObs = p.observacoes && p.observacoes.length > 0
      ? p.observacoes[p.observacoes.length - 1]
      : null;

    let statusValidade = '-';
    if (diasRestantes !== null) {
      if (diasRestantes <= 0) {
        statusValidade = `VENCIDA (${Math.abs(diasRestantes)}d)`;
      } else if (diasRestantes <= 61) {
        statusValidade = `REVALIDAÇÃO (${diasRestantes}d)`;
      } else {
        statusValidade = `Válida (${diasRestantes}d)`;
      }
    }

    const isZebra = pIdx % 2 === 1;
    const rowBg = isZebra ? 'F8FAFC' : 'FFFFFF'; // Alternância de linhas elegante

    const values = [
      p.numeroSolicitacao,
      p.tipo,
      p.isExtensao ? 'SIM' : 'NÃO',
      p.mmvOriginal || (p.isExtensao ? p.mmv : '-'),
      p.situacao,
      p.orgaoCertificador || 'IMT',
      p.procedencia,
      formatarCNPJ(p.cnpj) || p.cnpj || '-',
      p.marca || '-',
      p.modelo || '-',
      p.veiculo || '-',
      p.mmv,
      p.tipoVeiculo || '-',
      p.quantidade || '-',
      p.numeroLicenca || 'Aguardando Emissão',
      formatarDataBR(p.dataInicio),
      formatarDataBR(p.dataEnvio),
      formatarDataBR(p.dataEmissao),
      formatarDataBR(p.dataValidade),
      statusValidade,
      diasRestantes !== null ? diasRestantes : '-',
      prazoAnalise ? prazoAnalise.dias : '-',
      p.observacoes?.length || 0,
      ultimaObs?.autor || '-',
      ultimaObs?.texto || '-',
      ultimaObs ? formatarDataHoraBR(ultimaObs.dataHora) : '-',
    ];

    values.forEach((val, valIdx) => {
      const colNum = valIdx + 1;
      const cell = row.getCell(colNum);
      cell.value = val;
      cell.font = { name: 'Segoe UI', size: 9.5, color: { argb: '1E293B' } };
      cell.border = thinBorder;
      cell.alignment = {
        vertical: 'middle',
        horizontal: columns[valIdx].align as any,
        wrapText: valIdx === 24, // Wrap apenas para a coluna de texto da anotação
      };

      // Fundo padrão com zebra
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowBg },
      };

      // Destaque Nº Solicitação
      if (colNum === 1) {
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '991B1B' } };
      }

      // Destaque Extensão
      if (colNum === 3 && p.isExtensao) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
        cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: '166534' } };
        cell.border = thinBorder;
      }

      // Destaque Situação Regulamentar
      if (colNum === 5) {
        cell.font = { name: 'Segoe UI', size: 9.5, bold: true };
        cell.border = thinBorder;
        switch (p.situacao) {
          case 'Licença/Certidão emitida':
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
            cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: '15803D' } };
            break;
          case 'Para correção':
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE4E6' } };
            cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'BE123C' } };
            break;
          case 'Encaminhada para o ibama':
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0F2FE' } };
            cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: '0369A1' } };
            break;
          case 'Em análise pelo Analista do ATC':
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EEF2FF' } };
            cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: '4338CA' } };
            break;
          case 'A pagar':
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } };
            cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'B45309' } };
            break;
          default:
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
            cell.font = { name: 'Segoe UI', size: 9.5, color: { argb: '475569' } };
            break;
        }
      }

      // Destaque Nº Licença
      if (colNum === 15 && p.numeroLicenca) {
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '047857' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ECFDF5' } };
        cell.border = thinBorder;
      }

      // Destaque Status Validade
      if (colNum === 20 && diasRestantes !== null) {
        cell.border = thinBorder;
        if (diasRestantes <= 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
          cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: '991B1B' } };
        } else if (diasRestantes <= 61) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } };
          cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: '92400E' } };
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
          cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: '166534' } };
        }
      }
    });
  });

  // Linha de Rodapé / Totalizadores na Tabela
  const lastRowNumber = 9 + processos.length;
  const totalRow = ws.getRow(lastRowNumber);
  totalRow.height = 26;

  for (let c = 1; c <= TOTAL_COLS; c++) {
    const cell = totalRow.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
    cell.border = totalBorder;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '0F172A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  }
  totalRow.getCell(1).value = 'TOTAL';
  totalRow.getCell(2).value = `${totalProcessos} processos`;
  totalRow.getCell(5).value = `${emitidas.length} emitidas | ${emAndamento.length} em trâmite`;

  // AutoFiltro nativo do Excel na linha 8
  ws.autoFilter = {
    from: { row: 8, column: 1 },
    to: { row: lastRowNumber, column: TOTAL_COLS },
  };

  // =========================================================================
  // ABA 2: RESUMO GERENCIAL E DISTRIBUIÇÃO (INDICADORES EXECUTIVOS)
  // =========================================================================
  const wsResumo = wb.addWorksheet('Resumo Gerencial', {
    views: [{ state: 'normal', showGridLines: true }],
  });

  // Título do Resumo
  wsResumo.mergeCells('A1:G1');
  applyRangeStyle(wsResumo, 1, 1, 1, 7, '1E293B', mediumBorder);
  const resTitle = wsResumo.getCell('A1');
  resTitle.value = 'INDICADORES GERENCIAIS · HOMOLOGAÇÃO SHINERAY DO BRASIL';
  resTitle.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFF' } };
  resTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  wsResumo.getRow(1).height = 32;

  // TABELA 1: Por Situação Regulamentar
  wsResumo.mergeCells('A3:D3');
  applyRangeStyle(wsResumo, 3, 1, 3, 4, 'B91C1C', headerBorder);
  const t1Head = wsResumo.getCell('A3');
  t1Head.value = 'DISTRIBUIÇÃO POR SITUAÇÃO REGULAMENTAR';
  t1Head.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  t1Head.alignment = { vertical: 'middle', horizontal: 'center' };

  wsResumo.getRow(4).values = ['Situação', 'Quantidade', '% do Total', 'Classificação'];
  wsResumo.getRow(4).height = 22;
  applyRangeStyle(wsResumo, 4, 1, 4, 4, 'E2E8F0', thinBorder);
  for (let c = 1; c <= 4; c++) {
    const cell = wsResumo.getRow(4).getCell(c);
    cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: '0F172A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  }

  const situacoesMap: Record<string, number> = {};
  processos.forEach((p) => {
    situacoesMap[p.situacao] = (situacoesMap[p.situacao] || 0) + 1;
  });

  let currRow = 5;
  Object.entries(situacoesMap).forEach(([sit, qtd]) => {
    const r = wsResumo.getRow(currRow);
    r.height = 22;
    const pct = totalProcessos > 0 ? ((qtd / totalProcessos) * 100).toFixed(1) + '%' : '0%';
    const statusType = sit === 'Licença/Certidão emitida' ? 'Concluído' : sit === 'Para correção' ? 'Pendência' : 'Em Trâmite';

    r.values = [sit, qtd, pct, statusType];
    for (let c = 1; c <= 4; c++) {
      const cell = r.getCell(c);
      cell.border = thinBorder;
      cell.font = { name: 'Segoe UI', size: 9.5 };
      cell.alignment = { vertical: 'middle', horizontal: c === 1 ? 'left' : 'center' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: currRow % 2 === 0 ? 'F8FAFC' : 'FFFFFF' } };
    }
    currRow++;
  });

  // Linha total Tabela 1
  const totRow1 = wsResumo.getRow(currRow);
  totRow1.values = ['Total Geral', totalProcessos, '100.0%', '-'];
  for (let c = 1; c <= 4; c++) {
    const cell = totRow1.getCell(c);
    cell.border = totalBorder;
    cell.font = { name: 'Segoe UI', size: 9.5, bold: true };
    cell.alignment = { vertical: 'middle', horizontal: c === 1 ? 'left' : 'center' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
  }
  currRow += 2;

  // TABELA 2: Por Tipo de Homologação
  const startT2 = currRow;
  wsResumo.mergeCells(`A${startT2}:D${startT2}`);
  applyRangeStyle(wsResumo, startT2, 1, startT2, 4, 'B91C1C', headerBorder);
  const t2Head = wsResumo.getCell(`A${startT2}`);
  t2Head.value = 'DISTRIBUIÇÃO POR TIPO DE PROCESSO';
  t2Head.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  t2Head.alignment = { vertical: 'middle', horizontal: 'center' };

  currRow++;
  wsResumo.getRow(currRow).values = ['Tipo de Homologação', 'Quantidade', '% do Total', 'Extensões Incluídas'];
  applyRangeStyle(wsResumo, currRow, 1, currRow, 4, 'E2E8F0', thinBorder);
  for (let c = 1; c <= 4; c++) {
    const cell = wsResumo.getRow(currRow).getCell(c);
    cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: '0F172A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  }

  const tiposMap: Record<string, number> = {};
  processos.forEach((p) => {
    tiposMap[p.tipo] = (tiposMap[p.tipo] || 0) + 1;
  });

  currRow++;
  Object.entries(tiposMap).forEach(([tipo, qtd]) => {
    const r = wsResumo.getRow(currRow);
    r.height = 22;
    const pct = totalProcessos > 0 ? ((qtd / totalProcessos) * 100).toFixed(1) + '%' : '0%';
    const extCount = processos.filter((p) => p.tipo === tipo && p.isExtensao).length;

    r.values = [tipo, qtd, pct, extCount > 0 ? `${extCount} extensão(ões)` : 'Nenhuma'];
    for (let c = 1; c <= 4; c++) {
      const cell = r.getCell(c);
      cell.border = thinBorder;
      cell.font = { name: 'Segoe UI', size: 9.5 };
      cell.alignment = { vertical: 'middle', horizontal: c === 1 ? 'left' : 'center' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: currRow % 2 === 0 ? 'F8FAFC' : 'FFFFFF' } };
    }
    currRow++;
  });

  // Linha total Tabela 2
  const totRow2 = wsResumo.getRow(currRow);
  totRow2.values = ['Total Geral', totalProcessos, '100.0%', `${processos.filter(p => p.isExtensao).length} extensões`];
  for (let c = 1; c <= 4; c++) {
    const cell = totRow2.getCell(c);
    cell.border = totalBorder;
    cell.font = { name: 'Segoe UI', size: 9.5, bold: true };
    cell.alignment = { vertical: 'middle', horizontal: c === 1 ? 'left' : 'center' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
  }

  // Larguras da aba de resumo
  wsResumo.getColumn(1).width = 32;
  wsResumo.getColumn(2).width = 16;
  wsResumo.getColumn(3).width = 16;
  wsResumo.getColumn(4).width = 24;

  // =========================================================================
  // ABA 3: HISTÓRICO COMPLETO DE ANOTAÇÕES E DESPACHOS TÉCNICOS
  // =========================================================================
  const wsObs = wb.addWorksheet('Histórico de Observações', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 3, showGridLines: true }],
  });

  // Título da aba de Anotações
  wsObs.mergeCells('A1:G1');
  applyRangeStyle(wsObs, 1, 1, 1, 7, '1E293B', mediumBorder);
  const obsTitle = wsObs.getCell('A1');
  obsTitle.value = 'HISTÓRICO COMPLETO DE ANOTAÇÕES E DESPACHOS TÉCNICOS';
  obsTitle.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFF' } };
  obsTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  wsObs.getRow(1).height = 32;

  // Cabeçalho da tabela de anotações
  const obsCols = [
    { header: 'Nº Solicitação', width: 18, align: 'center' },
    { header: 'MMV do Processo', width: 32, align: 'left' },
    { header: 'Tipo Processo', width: 16, align: 'center' },
    { header: 'Situação Atual', width: 26, align: 'center' },
    { header: 'Autor da Anotação', width: 26, align: 'center' },
    { header: 'Data e Hora', width: 22, align: 'center' },
    { header: 'Conteúdo da Anotação / Despacho', width: 65, align: 'left' },
  ];

  const obsHeaderRow = wsObs.getRow(3);
  obsHeaderRow.height = 26;

  obsCols.forEach((col, idx) => {
    const colNum = idx + 1;
    const cell = obsHeaderRow.getCell(colNum);
    cell.value = col.header;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '475569' },
    };
    cell.border = headerBorder;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    wsObs.getColumn(colNum).width = col.width;
  });

  let obsRowIdx = 4;
  processos.forEach((p) => {
    (p.observacoes || []).forEach((obs) => {
      const r = wsObs.getRow(obsRowIdx);
      r.height = 24;

      const isLuca = obs.autor === 'Luca Andrade';
      const isEverton = obs.autor === 'Everton Silva';

      const obsValues = [
        p.numeroSolicitacao,
        p.mmv,
        p.tipo,
        p.situacao,
        obs.autor ? `${obs.autor}${isLuca ? ' (Engenheiro Mecânico)' : isEverton ? ' (Assistente Técnico)' : ''}` : 'Não informado',
        formatarDataHoraBR(obs.dataHora),
        obs.texto,
      ];

      obsValues.forEach((val, valIdx) => {
        const c = r.getCell(valIdx + 1);
        c.value = val;
        c.font = { name: 'Segoe UI', size: 9.5, color: { argb: '1E293B' } };
        c.border = thinBorder;
        c.alignment = {
          vertical: 'middle',
          horizontal: obsCols[valIdx].align as any,
          wrapText: valIdx === 6,
        };

        c.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: obsRowIdx % 2 === 0 ? 'F8FAFC' : 'FFFFFF' },
        };

        if (valIdx === 0) {
          c.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '991B1B' } };
        }

        if (valIdx === 4 && (isLuca || isEverton)) {
          c.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: isLuca ? '1D4ED8' : '047857' } };
        }
      });

      obsRowIdx++;
    });
  });

  wsObs.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: Math.max(4, obsRowIdx - 1), column: obsCols.length },
  };

  // =========================================================================
  // ABA 4: COMPARATIVO E MÉDIAS DE TEMPO DE EMISSÃO (ENVIO À EMISSÃO)
  // =========================================================================
  const wsPrazos = wb.addWorksheet('Médias e Prazos de Emissão', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 4, showGridLines: true }],
  });

  // Título da aba de prazos
  wsPrazos.mergeCells('A1:H1');
  applyRangeStyle(wsPrazos, 1, 1, 1, 8, '991B1B', mediumBorder);
  const prazosTitle = wsPrazos.getCell('A1');
  prazosTitle.value = 'SHINERAY DO BRASIL · RELATÓRIO COMPARATIVO DE TEMPO DE EMISSÃO DE LICENÇAS';
  prazosTitle.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFF' } };
  prazosTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  wsPrazos.getRow(1).height = 32;

  // Subtítulo
  wsPrazos.mergeCells('A2:H2');
  applyRangeStyle(wsPrazos, 2, 1, 2, 8, '1E293B', thinBorder);
  const prazosSub = wsPrazos.getCell('A2');
  prazosSub.value = 'Métricas calculadas do protocolo com o órgão técnico (IMT / CETESB) até a emissão oficial da licença pelo IBAMA';
  prazosSub.font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: 'F8FAFC' } };
  prazosSub.alignment = { vertical: 'middle', horizontal: 'center' };
  wsPrazos.getRow(2).height = 20;

  wsPrazos.getRow(3).height = 8;

  // Cabeçalho da tabela de prazos detalhados
  const prazosCols = [
    { header: 'Nº Solicitação', width: 18, align: 'center' },
    { header: 'MMV do Veículo', width: 34, align: 'left' },
    { header: 'Órgão Técnico', width: 16, align: 'center' },
    { header: 'Tipo Processo', width: 18, align: 'center' },
    { header: 'Data Envio', width: 15, align: 'center' },
    { header: 'Data Emissão', width: 15, align: 'center' },
    { header: 'Tempo de Emissão (Dias)', width: 24, align: 'center' },
    { header: 'Situação / Nº Licença', width: 28, align: 'center' },
  ];

  const prazosHeaderRow = wsPrazos.getRow(4);
  prazosHeaderRow.height = 28;

  prazosCols.forEach((col, idx) => {
    const colNum = idx + 1;
    const cell = prazosHeaderRow.getCell(colNum);
    cell.value = col.header;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'B91C1C' },
    };
    cell.border = headerBorder;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    wsPrazos.getColumn(colNum).width = col.width;
  });

  let prazosRowIdx = 5;
  const emitidosPrazos = processos.filter((p) => p.dataEnvio && p.dataEmissao);
  const somaPrazos = emitidosPrazos.reduce((acc, p) => {
    const calc = calcularDiasSolicitacaoAteEmissao(p.dataEnvio, p.dataEmissao);
    return acc + (calc ? calc.dias : 0);
  }, 0);
  const mediaDiasGeral = emitidosPrazos.length > 0 ? Math.round(somaPrazos / emitidosPrazos.length) : 0;

  emitidosPrazos.forEach((p) => {
    const calc = calcularDiasSolicitacaoAteEmissao(p.dataEnvio, p.dataEmissao);
    const dias = calc ? calc.dias : 0;
    const r = wsPrazos.getRow(prazosRowIdx);
    r.height = 24;

    const rowValues = [
      p.numeroSolicitacao,
      p.mmv,
      p.orgaoCertificador || 'IMT',
      p.tipo,
      formatarDataBR(p.dataEnvio),
      formatarDataBR(p.dataEmissao),
      dias,
      p.numeroLicenca || p.situacao,
    ];

    rowValues.forEach((val, valIdx) => {
      const c = r.getCell(valIdx + 1);
      c.value = val;
      c.font = { name: 'Segoe UI', size: 9.5, color: { argb: '1E293B' } };
      c.border = thinBorder;
      c.alignment = {
        vertical: 'middle',
        horizontal: prazosCols[valIdx].align as any,
      };

      c.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: prazosRowIdx % 2 === 0 ? 'F8FAFC' : 'FFFFFF' },
      };

      if (valIdx === 0) {
        c.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '991B1B' } };
      }

      if (valIdx === 6) {
        c.font = { name: 'Segoe UI', size: 10, bold: true };
        if (dias <= mediaDiasGeral) {
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
          c.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '166534' } };
        } else {
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE4E6' } };
          c.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '9F1239' } };
        }
      }
    });

    prazosRowIdx++;
  });

  // Linha de Média Geral na Tabela de Prazos
  const prazosTotRow = wsPrazos.getRow(prazosRowIdx);
  prazosTotRow.height = 26;
  for (let c = 1; c <= prazosCols.length; c++) {
    const cell = prazosTotRow.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
    cell.border = totalBorder;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '0F172A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  }
  prazosTotRow.getCell(1).value = 'MÉDIA GERAL';
  prazosTotRow.getCell(2).value = `${emitidosPrazos.length} processos avaliados`;
  prazosTotRow.getCell(7).value = `${mediaDiasGeral} dias`;

  wsPrazos.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: prazosRowIdx, column: prazosCols.length },
  };

  // Gerar o buffer binário XLSX e acionar download direto
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Relatorio_Homologacoes_Shineray_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
