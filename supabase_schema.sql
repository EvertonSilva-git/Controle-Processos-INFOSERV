-- ====================================================================
-- SHINERAY INFOSERV - SCRIPT DE CRIAÇÃO DA TABELA SUPABASE
-- Execute este script no SQL Editor do seu projeto Supabase
-- (Dashboard do Supabase -> SQL Editor -> New Query -> Run)
-- ====================================================================

-- 1. Criar a tabela de processos de homologação
CREATE TABLE IF NOT EXISTS public.processos (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL,
    numero_solicitacao TEXT NOT NULL,
    procedencia TEXT NOT NULL,
    orgao_certificador TEXT,
    mmv TEXT NOT NULL,
    marca TEXT,
    modelo TEXT,
    veiculo TEXT,
    versoes JSONB DEFAULT '[]'::jsonb,
    is_extensao BOOLEAN DEFAULT false,
    processo_original_id TEXT,
    mmv_original TEXT,
    numero_licenca TEXT,
    quantidade TEXT,
    tipo_veiculo TEXT NOT NULL,
    data_inicio TEXT NOT NULL,
    situacao TEXT NOT NULL,
    data_envio TEXT,
    data_emissao TEXT,
    data_validade TEXT,
    data_revalidacao TEXT,
    nova_data_vencimento TEXT,
    cnpj TEXT,
    observacoes JSONB DEFAULT '[]'::jsonb,
    criado_em TEXT,
    atualizado_em TEXT
);

-- 2. Índices para consultas ultra-rápidas
CREATE INDEX IF NOT EXISTS idx_processos_cnpj ON public.processos (cnpj);
CREATE INDEX IF NOT EXISTS idx_processos_situacao ON public.processos (situacao);
CREATE INDEX IF NOT EXISTS idx_processos_tipo ON public.processos (tipo);
CREATE INDEX IF NOT EXISTS idx_processos_numero_solicitacao ON public.processos (numero_solicitacao);

-- 3. Habilitar Row Level Security (RLS) com acesso para a chave pública anônima (anon)
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (permite que qualquer frontend com anon key consulte os processos)
CREATE POLICY "Permitir leitura anon e authenticated" 
ON public.processos 
FOR SELECT 
USING (true);

-- Política de inserção pública
CREATE POLICY "Permitir insercao anon e authenticated" 
ON public.processos 
FOR INSERT 
WITH CHECK (true);

-- Política de atualização pública
CREATE POLICY "Permitir atualizacao anon e authenticated" 
ON public.processos 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Política de exclusão pública
CREATE POLICY "Permitir exclusao anon e authenticated" 
ON public.processos 
FOR DELETE 
USING (true);

-- 4. Habilitar Supabase Realtime para que todos os navegadores recebam atualizações instantâneas
ALTER PUBLICATION supabase_realtime ADD TABLE public.processos;

-- 5. Opcional: Tabela de CNPJs cadastrados
CREATE TABLE IF NOT EXISTS public.cnpjs (
    raw TEXT PRIMARY KEY,
    formatted TEXT NOT NULL,
    label TEXT NOT NULL,
    filial TEXT,
    is_custom BOOLEAN DEFAULT false
);

ALTER TABLE public.cnpjs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir tudo cnpjs" 
ON public.cnpjs 
FOR ALL 
USING (true)
WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.cnpjs;
