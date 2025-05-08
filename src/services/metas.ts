import { supabase } from '@/integrations/supabase/client';
import { Meta, ProgressoMeta, Alerta, ConfiguracaoAlerta } from '@/types/financeiro';

// Tipos auxiliares para os dados de formulário
type MetaPayload = Omit<Meta, 'id' | 'created_at' | 'user_id' | 'valor_atual' | 'status' | 'percentual_concluido' | 'dias_status'>;
type ProgressoMetaPayload = Omit<ProgressoMeta, 'id' | 'created_at' | 'user_id'>;

/**
 * Busca todas as metas do usuário logado, com opção de filtro por status.
 * @param statusFiltro - 'todas', 'andamento', 'atingida', 'nao_atingida'.
 */
export const getMetas = async (statusFiltro: 'todas' | 'andamento' | 'atingida' | 'nao_atingida' = 'todas'): Promise<Meta[]> => {
  let query = supabase
    .from('metas')
    .select('*');

  // Aplica filtro de status se não for 'todas'
  if (statusFiltro !== 'todas') {
    query = query.eq('status', statusFiltro);
  }

  // Ordena por status (andamento primeiro) e depois data fim
  query = query.order('status', { ascending: true }).order('data_fim', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar metas:', error);
    throw new Error('Não foi possível buscar as metas.');
  }
  return data || [];
};

/**
 * Busca uma meta específica pelo ID.
 */
export const getMetaById = async (id: string): Promise<Meta | null> => {
  const { data, error } = await supabase
    .from('metas')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') { // Ignora erro "No rows found"
    console.error('Erro ao buscar meta por ID:', error);
    throw new Error('Não foi possível buscar a meta.');
  }
  return data;
};

/**
 * Adiciona uma nova meta.
 */
export const addMeta = async (metaData: MetaPayload): Promise<Meta> => {
  const { data, error } = await supabase
    .from('metas')
    .insert([{ ...metaData }]) // Insere os dados fornecidos
    .select()
    .single();

  if (error) {
    console.error('Erro ao adicionar meta:', error);
    throw new Error('Não foi possível adicionar a meta.');
  }
  return data;
};

/**
 * Atualiza uma meta existente.
 */
export const updateMeta = async (id: string, updates: Partial<MetaPayload>): Promise<Meta> => {
  const { data, error } = await supabase
    .from('metas')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar meta:', error);
    throw new Error('Não foi possível atualizar a meta.');
  }
  return data;
};

/**
 * Exclui uma meta.
 */
export const deleteMeta = async (id: string): Promise<void> => {
  // Primeiro, excluir progressos associados (devido à FK com ON DELETE CASCADE, isso pode não ser estritamente necessário, mas é mais explícito)
  const { error: progressError } = await supabase
    .from('progresso_meta')
    .delete()
    .eq('meta_id', id);

  if (progressError) {
    console.error('Erro ao excluir progresso da meta:', progressError);
    throw new Error('Não foi possível excluir o histórico de progresso da meta.');
  }

  // Excluir alertas associados
  const { error: alertError } = await supabase
    .from('alertas')
    .delete()
    .eq('meta_id', id);

   if (alertError) {
     console.error('Erro ao excluir alertas da meta:', alertError);
     // Pode ser um erro menos crítico, talvez apenas logar
   }

  // Finalmente, excluir a meta
  const { error: metaError } = await supabase
    .from('metas')
    .delete()
    .eq('id', id);

  if (metaError) {
    console.error('Erro ao excluir meta:', metaError);
    throw new Error('Não foi possível excluir a meta.');
  }
};

// --- Progresso Meta ---

/**
 * Busca o histórico de progresso para uma meta específica.
 */
export const getProgressoMeta = async (metaId: string): Promise<ProgressoMeta[]> => {
  const { data, error } = await supabase
    .from('progresso_meta')
    .select('*')
    .eq('meta_id', metaId)
    .order('data', { ascending: true });

  if (error) {
    console.error('Erro ao buscar progresso da meta:', error);
    throw new Error('Não foi possível buscar o histórico de progresso.');
  }
  return data || [];
};

/**
 * Adiciona um novo registro de progresso para uma meta.
 * Esta função DEVE ser chamada dentro de uma transaction ou RPC no futuro
 * para garantir que a atualização do valor na meta e a inserção do progresso
 * sejam atômicas e que a verificação de status seja consistente.
 * Por agora, faremos em duas etapas, cientes do risco.
 */
export const addProgressoMeta = async (progressoData: ProgressoMetaPayload): Promise<ProgressoMeta> => {

  // 1. Busca a meta para verificar valor alvo e status atual
  const meta = await getMetaById(progressoData.meta_id);
  if (!meta) {
    throw new Error('Meta não encontrada para adicionar progresso.');
  }

  // 2. Insere o novo registro de progresso
  const { data: novoProgresso, error: insertError } = await supabase
    .from('progresso_meta')
    .insert([{ ...progressoData }])
    .select()
    .single();

  if (insertError) {
    console.error('Erro ao adicionar progresso:', insertError);
    throw new Error('Não foi possível adicionar o registro de progresso.');
  }

  // 3. Atualiza o valor_atual e o status da meta principal
  const novoValorAtual = progressoData.valor;
  let novoStatus = meta.status;

  if (novoValorAtual >= meta.valor_meta) {
    novoStatus = 'atingida';
  } else if (new Date(meta.data_fim + 'T00:00:00') < new Date()) {
    // Se não atingiu e a data fim já passou
    novoStatus = 'nao_atingida';
  } else {
    novoStatus = 'andamento';
  }

  const { error: updateError } = await supabase
    .from('metas')
    .update({ valor_atual: novoValorAtual, status: novoStatus })
    .eq('id', progressoData.meta_id);

  if (updateError) {
    console.error('Erro ao atualizar valor/status da meta após adicionar progresso:', updateError);
    // Idealmente, aqui deveria ocorrer um rollback da inserção do progresso
    throw new Error('Erro ao atualizar a meta principal após adicionar progresso.');
  }

  return novoProgresso;
};

// --- Alertas e Configurações (Exemplos básicos) ---

/**
 * Busca alertas para o usuário logado.
 */
export const getAlertas = async (apenasNaoLidos = true): Promise<Alerta[]> => {
  let query = supabase
    .from('alertas')
    .select('*');

  if (apenasNaoLidos) {
    query = query.eq('lido', false);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar alertas:', error);
    throw new Error('Não foi possível buscar os alertas.');
  }
  return data || [];
};

/**
 * Marca um alerta como lido ou não lido.
 */
export const updateAlertaLido = async (id: string, lido: boolean): Promise<Alerta> => {
  const updates = {
    lido: lido,
    data_leitura: lido ? new Date().toISOString() : null,
  };
  const { data, error } = await supabase
    .from('alertas')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar status do alerta:', error);
    throw new Error('Não foi possível atualizar o status do alerta.');
  }
  return data;
};

/**
 * Busca a configuração de alertas do usuário logado.
 * Cria uma configuração padrão se não existir.
 */
export const getConfiguracaoAlerta = async (): Promise<ConfiguracaoAlerta> => {
  // Tenta buscar a configuração existente
  const { data, error } = await supabase
    .from('configuracoes_alerta')
    .select('*')
    .maybeSingle(); // Retorna null se não encontrar

  if (error && error.code !== 'PGRST116') {
    console.error('Erro ao buscar configuração de alerta:', error);
    throw new Error('Não foi possível buscar a configuração de alerta.');
  }

  // Se encontrou, retorna
  if (data) {
    return data;
  }

  // Se não encontrou, cria uma configuração padrão
  console.log('Nenhuma configuração de alerta encontrada, criando padrão...')
  const { data: novaConfig, error: insertError } = await supabase
    .from('configuracoes_alerta')
    .insert({})
    .select()
    .single();

  if (insertError) {
    console.error('Erro ao criar configuração de alerta padrão:', insertError);
    throw new Error('Não foi possível criar a configuração de alerta padrão.');
  }

  return novaConfig;
};

/**
 * Atualiza a configuração de alertas do usuário.
 */
export const updateConfiguracaoAlerta = async (updates: Partial<Omit<ConfiguracaoAlerta, 'id' | 'user_id'>>): Promise<ConfiguracaoAlerta> => {
  // Obtém o user_id da sessão atual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado.');
  }

  const { data, error } = await supabase
    .from('configuracoes_alerta')
    .update(updates)
    .eq('user_id', user.id) // Atualiza pela user_id
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar configuração de alerta:', error);
    throw new Error('Não foi possível atualizar a configuração de alerta.');
  }
  return data;
}; 