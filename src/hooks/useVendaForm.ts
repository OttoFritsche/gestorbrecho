import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { z } from 'zod'

export type Cliente = {
  id: string
  nome: string
}

export type FormaPagamento = {
  id: string
  nome: string
}

export type Produto = {
  id: string
  nome: string
  preco_venda: number | null
}

// Schema for form validation
export const itemSchema = z.object({
  produto_id: z.string().uuid().optional().nullable(),
  descricao_manual: z.string().optional().nullable(),
  quantidade: z.coerce.number().int().positive("Quantidade deve ser positiva.").default(1),
  preco_unitario: z.coerce.number().nonnegative("Preço não pode ser negativo.").default(0),
  subtotal: z.coerce.number().nonnegative().default(0),
  isManual: z.boolean().default(false)
}).refine(data => data.isManual ? !!data.descricao_manual : !!data.produto_id, {
  message: "Selecione um produto ou forneça uma descrição manual.",
  path: ["produto_id"]
});

export const vendaFormSchema = z.object({
  cliente_id: z.string().uuid("UUID de cliente inválido.").optional().nullable(),
  forma_pagamento_id: z.string().uuid("Selecione uma forma de pagamento válida."),
  observacoes: z.string().optional(),
  itens: z.array(itemSchema).min(1, "Adicione pelo menos um item à venda."),
  num_parcelas: z.coerce.number().int().positive("Número de parcelas inválido").optional(),
  primeiro_vencimento: z.date({invalid_type_error: "Data inválida"}).optional(),
  data_venda: z.date({invalid_type_error: "Data da venda inválida"}).default(() => new Date()),
});

export type VendaFormValues = z.infer<typeof vendaFormSchema>;

export const useVendaForm = () => {
  const { data: clientesData, isLoading: isLoadingClientes, error: errorClientes } = useQuery({
    queryKey: ['clientesAtivos'],
    queryFn: fetchClientes,
  });

  const { data: formasPagamentoData, isLoading: isLoadingFormas, error: errorFormas } = useQuery({
    queryKey: ['formasPagamento'],
    queryFn: fetchFormasPagamento,
  });

  const { data: produtosData, isLoading: isLoadingProdutos, error: errorProdutos } = useQuery({
    queryKey: ['produtosDisponiveis'],
    queryFn: fetchProdutos,
  });

  const isLoading = isLoadingClientes || isLoadingFormas || isLoadingProdutos;
  const error = errorClientes || errorFormas || errorProdutos;

  return {
    clientesData,
    formasPagamentoData,
    produtosData,
    isLoading,
    error
  };
};

// Fetch functions
const fetchClientes = async (): Promise<Cliente[]> => {
  const { data, error } = await supabase
    .from('clientes')
    .select('id, nome')
    .eq('ativo', true)
    .order('nome', { ascending: true });

  if (error) {
    console.error("Erro ao buscar clientes:", error);
    throw new Error('Erro ao buscar clientes');
  }
  return data || [];
};

const fetchFormasPagamento = async (): Promise<FormaPagamento[]> => {
  const { data, error } = await supabase
    .from('formas_pagamento')
    .select('id, nome')
    .order('nome', { ascending: true });

  if (error) {
    console.error("Erro ao buscar formas de pagamento:", error);
    throw new Error('Erro ao buscar formas de pagamento');
  }
  return data || [];
};

const fetchProdutos = async (): Promise<Produto[]> => {
  const { data, error } = await supabase
    .from('produtos')
    .select('id, nome, preco_venda')
    .eq('status', 'disponivel')
    .order('nome', { ascending: true });

  if (error) throw new Error('Erro ao buscar produtos');
  return data || [];
};
