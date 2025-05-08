import { supabase } from '@/integrations/supabase/client';

// Define a interface Cliente
export interface Cliente {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  ativo: boolean;
  endereco: string | null;
  observacoes: string | null;
  classificacao: string; 
  limite_credito: number | null;
  indicado_por: string | null;
  aceita_email: boolean;
  aceita_sms: boolean;
  aceita_whatsapp: boolean;
}

/**
 * Busca todos os clientes do usuário atual
 */
export const fetchClientes = async (): Promise<Cliente[]> => {
  const { data, error } = await supabase
    .from('clientes')
    .select('id, nome, telefone, email, ativo, endereco, observacoes, classificacao, limite_credito, indicado_por, aceita_email, aceita_sms, aceita_whatsapp')
    .order('nome');

  if (error) {
    console.error("Erro ao buscar clientes:", error);
    throw new Error(error.message);
  }
  
  return data || [];
};

/**
 * Busca um cliente específico pelo ID
 */
export const fetchClienteById = async (id: string): Promise<Cliente | null> => {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error("Erro ao buscar cliente por ID:", error);
    throw new Error(error.message);
  }
  
  return data;
};

/**
 * Cria um novo cliente
 */
export const createCliente = async (cliente: Omit<Cliente, 'id'>): Promise<Cliente> => {
  const { data, error } = await supabase
    .from('clientes')
    .insert([cliente])
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar cliente:", error);
    throw new Error(error.message);
  }
  
  return data;
};

/**
 * Atualiza um cliente existente
 */
export const updateCliente = async (id: string, cliente: Partial<Cliente>): Promise<Cliente> => {
  const { data, error } = await supabase
    .from('clientes')
    .update(cliente)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar cliente:", error);
    throw new Error(error.message);
  }
  
  return data;
};

/**
 * Alterna o status (ativo/inativo) de um cliente
 */
export const toggleClienteStatus = async (id: string, ativo: boolean): Promise<void> => {
  const { error } = await supabase
    .from('clientes')
    .update({ ativo })
    .eq('id', id);

  if (error) {
    console.error("Erro ao alterar status do cliente:", error);
    throw new Error(error.message);
  }
}; 