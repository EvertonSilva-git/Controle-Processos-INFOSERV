import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Processo, CnpjOption } from '../types/process';

const ENV_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const ENV_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Permite ler do ambiente ou de override manual do usuário no navegador
export function getSupabaseCredentials() {
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem('shineray_custom_supabase_url') : null;
  const customKey = typeof window !== 'undefined' ? localStorage.getItem('shineray_custom_supabase_anon_key') : null;

  const url = customUrl || ENV_URL;
  const key = customKey || ENV_KEY;

  const isConfigured = Boolean(
    url &&
    key &&
    !url.includes('your-project-id') &&
    url.startsWith('https://')
  );

  return { url, key, isConfigured, isCustom: Boolean(customUrl && customKey) };
}

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) {
    return null;
  }
  if (cachedClient && lastUrl === url && lastKey === key) {
    return cachedClient;
  }
  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    lastUrl = url;
    lastKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Erro ao inicializar cliente Supabase:', err);
    return null;
  }
}

// Converte um objeto Processo para linha do banco de dados (snake_case padrão PostgreSQL)
export function processoToSupabaseRow(p: Processo) {
  return {
    id: p.id,
    tipo: p.tipo,
    numero_solicitacao: p.numeroSolicitacao,
    procedencia: p.procedencia,
    orgao_certificador: p.orgaoCertificador || null,
    mmv: p.mmv,
    marca: p.marca || null,
    modelo: p.modelo || null,
    veiculo: p.veiculo || null,
    versoes: Array.isArray(p.versoes) ? p.versoes : [],
    is_extensao: Boolean(p.isExtensao),
    processo_original_id: p.processoOriginalId || null,
    mmv_original: p.mmvOriginal || null,
    numero_licenca: p.numeroLicenca || null,
    quantidade: p.quantidade || null,
    tipo_veiculo: p.tipoVeiculo,
    data_inicio: p.dataInicio,
    situacao: p.situacao,
    data_envio: p.dataEnvio || null,
    data_emissao: p.dataEmissao || null,
    data_validade: p.dataValidade || null,
    data_revalidacao: p.dataRevalidacao || null,
    nova_data_vencimento: p.novaDataVencimento || null,
    cnpj: p.cnpj || null,
    observacoes: Array.isArray(p.observacoes) ? p.observacoes : [],
    criado_em: p.criadoEm || new Date().toISOString(),
    atualizado_em: p.atualizadoEm || new Date().toISOString(),
  };
}

// Converte uma linha retornada pelo Supabase para a interface Processo
export function supabaseRowToProcesso(row: any): Processo {
  return {
    id: row.id,
    tipo: row.tipo,
    numeroSolicitacao: row.numero_solicitacao || row.numeroSolicitacao || '',
    procedencia: row.procedencia,
    orgaoCertificador: row.orgao_certificador || row.orgaoCertificador || undefined,
    mmv: row.mmv,
    marca: row.marca || undefined,
    modelo: row.modelo || undefined,
    veiculo: row.veiculo || undefined,
    versoes: Array.isArray(row.versoes) ? row.versoes : [],
    isExtensao: Boolean(row.is_extensao ?? row.isExtensao),
    processoOriginalId: row.processo_original_id || row.processoOriginalId || undefined,
    mmvOriginal: row.mmv_original || row.mmvOriginal || undefined,
    numeroLicenca: row.numero_licenca || row.numeroLicenca || undefined,
    quantidade: row.quantidade || undefined,
    tipoVeiculo: row.tipo_veiculo || row.tipoVeiculo || '',
    dataInicio: row.data_inicio || row.dataInicio || '',
    situacao: row.situacao,
    dataEnvio: row.data_envio || row.dataEnvio || undefined,
    dataEmissao: row.data_emissao || row.dataEmissao || undefined,
    dataValidade: row.data_validade || row.dataValidade || undefined,
    dataRevalidacao: row.data_revalidacao || row.dataRevalidacao || undefined,
    novaDataVencimento: row.nova_data_vencimento || row.novaDataVencimento || undefined,
    cnpj: row.cnpj || undefined,
    observacoes: Array.isArray(row.observacoes) ? row.observacoes : [],
    criadoEm: row.criado_em || row.criadoEm || new Date().toISOString(),
    atualizadoEm: row.atualizado_em || row.atualizadoEm || new Date().toISOString(),
  };
}

// Busca todos os processos diretamente da tabela do Supabase
export async function fetchProcessosFromSupabase(): Promise<{ success: boolean; data: Processo[]; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, data: [], error: 'Supabase não configurado' };
  }

  try {
    const { data, error } = await client
      .from('processos')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) {
      console.warn('Aviso ao consultar processos do Supabase:', error.message);
      return { success: false, data: [], error: error.message };
    }

    const processos = (data || []).map(supabaseRowToProcesso);
    return { success: true, data: processos };
  } catch (err: any) {
    console.error('Erro na chamada fetchProcessosFromSupabase:', err);
    return { success: false, data: [], error: err.message || 'Erro de conexão' };
  }
}

// Salva ou atualiza um processo no Supabase
export async function saveProcessoToSupabase(processo: Processo): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase não configurado' };
  }

  try {
    const row = processoToSupabaseRow(processo);
    const { error } = await client
      .from('processos')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('Erro ao salvar processo no Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Exceção ao gravar no Supabase:', err);
    return { success: false, error: err.message };
  }
}

// Exclui um processo no Supabase
export async function deleteProcessoFromSupabase(processoId: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase não configurado' };
  }

  try {
    const { error } = await client
      .from('processos')
      .delete()
      .eq('id', processoId);

    if (error) {
      console.error('Erro ao excluir processo no Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Exceção ao excluir no Supabase:', err);
    return { success: false, error: err.message };
  }
}

// Envia e sincroniza todos os 70 processos para o Supabase (Seed/Migração inicial)
export async function seedAllProcessosToSupabase(
  processos: Processo[]
): Promise<{ success: boolean; count: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, count: 0, error: 'Supabase não configurado' };
  }

  try {
    if (processos.length === 0) {
      return { success: true, count: 0 };
    }

    const rows = processos.map(processoToSupabaseRow);

    // Envia em lotes de 40 para evitar limites de payload
    const batchSize = 40;
    let savedCount = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await client
        .from('processos')
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        throw new Error(`Falha no lote ${i / batchSize + 1}: ${error.message}`);
      }
      savedCount += batch.length;
    }

    return { success: true, count: savedCount };
  } catch (err: any) {
    console.error('Erro ao enviar processos para o Supabase:', err);
    return { success: false, count: 0, error: err.message };
  }
}

// Teste de conexão com o Supabase
export async function testSupabaseConnection(
  customUrl?: string,
  customKey?: string
): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    const { url, key } = customUrl && customKey
      ? { url: customUrl, key: customKey }
      : getSupabaseCredentials();

    if (!url || !key) {
      return { success: false, message: 'URL e Anon Key do Supabase são obrigatórios.' };
    }

    const testClient = createClient(url, key, { auth: { persistSession: false } });

    // Testa selecionando contagem da tabela processos
    const { count, error } = await testClient
      .from('processos')
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.code === '42P01' || error.message.includes('relation "public.processos" does not exist') || error.message.includes('does not exist')) {
        return {
          success: false,
          message: 'Conectado ao Supabase com sucesso, mas a tabela "processos" ainda não foi criada. Execute o script SQL no seu dashboard.',
        };
      }
      return {
        success: false,
        message: `Erro do Supabase: ${error.message}`,
      };
    }

    return {
      success: true,
      message: `Conexão bem-sucedida! ${count ?? 0} processos encontrados no banco de dados remoto.`,
      count: count ?? 0,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Falha na conexão: ${err.message || 'Verifique a URL e a Anon Key'}`,
    };
  }
}

// Assinatura em Tempo Real (Realtime postgres_changes)
export function subscribeToProcessosRealtime(
  onInsert: (novo: Processo) => void,
  onUpdate: (atualizado: Processo) => void,
  onDelete: (id: string) => void
): () => void {
  const client = getSupabaseClient();
  if (!client) {
    return () => {};
  }

  try {
    const channel = client
      .channel('shineray_processos_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'processos' },
        (payload) => {
          if (payload.new) {
            onInsert(supabaseRowToProcesso(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'processos' },
        (payload) => {
          if (payload.new) {
            onUpdate(supabaseRowToProcesso(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'processos' },
        (payload) => {
          if (payload.old && payload.old.id) {
            onDelete(payload.old.id);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Realtime ativo
        }
      });

    return () => {
      try {
        client.removeChannel(channel);
      } catch (e) {
        // cleanup safe
      }
    };
  } catch (err) {
    console.error('Erro ao assinar Realtime do Supabase:', err);
    return () => {};
  }
}
