import type { Database } from '@/integrations/supabase/types';
import { Categoria } from './categorias';

export type Sale = Database['public']['Tables']['vendas']['Row'] & {
  categoria_id?: string | null;
};
export type SaleItem = Database['public']['Tables']['vendas_items']['Row']
export type Client = Database['public']['Tables']['clientes']['Row']
export type PaymentMethod = Database['public']['Tables']['formas_pagamento']['Row']
export type Product = Database['public']['Tables']['produtos']['Row'] & {
  quantidade_disponivel?: number;
};

export interface SaleWithRelations extends Sale {
  cliente?: Client | null
  forma_pagamento?: PaymentMethod
  venda_items?: (SaleItem & { produtos?: Product })[]
  categorias?: Categoria | null;
}

// Simplified type for new sales to avoid deep nesting
export interface NewSale {
  cliente_id?: string | null
  forma_pagamento_id: string | null
  data: string
  valor_total: number
  observacoes?: string | null
  items: NewSaleItem[]
  num_parcelas?: number | null
  primeiro_vencimento?: string | null
  user_id: string
  categoria_id?: string | null
  vendedor_id?: string | null
}

// Separate type for sale items to prevent nesting issues
export interface NewSaleItem {
  produto_id?: string | null
  descricao_manual?: string | null
  quantidade: number
  preco_unitario: number
  subtotal: number
  user_id: string
}

// Definindo tipos para dados de entrada de Vendas e Itens

// Tipo para os dados de um item ao criar/atualizar uma venda
export interface SaleItemInput {
  produto_id?: string | null;
  descricao_manual?: string | null;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  user_id: string; 
}

// Tipo para os dados completos da venda ao criar/atualizar
export interface SaleDataInput {
  data_venda: string; // String ISO 8601 com timezone
  cliente_id: string | null;
  forma_pagamento_id: string | null; 
  categoria_id: string | null; 
  valor_total: number;
  items: SaleItemInput[];
  observacoes: string | null;
  user_id: string; 
  num_parcelas?: number | null; 
  primeiro_vencimento?: string | null; // Formato YYYY-MM-DD
  vendedor_id?: string | null;
  data_venda_local?: string; // YYYY-MM-DD - Adicionado aqui se for usado no payload
}

// Outros tipos relacionados a Vendas podem ir aqui...
export interface Sale { 
  // Definição existente, se houver...
  id: string;
  created_at: string;
  user_id: string;
  data_venda: string;
  cliente_id: string | null;
  forma_pagamento_id: string;
  valor_total: number;
  status: string;
  observacoes: string | null;
  updated_at: string;
  num_parcelas: number | null;
  primeiro_vencimento: string | null;
  categoria_id: string | null;
  data_venda_local: string | null;
  vendedor_id: string | null;
}

export interface SaleItem { 
  // Definição existente, se houver...
  id: string;
  venda_id: string;
  produto_id: string | null;
  user_id: string | null;
  descricao_manual: string | null;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  created_at: string;
}

export interface SaleWithRelations extends Sale {
  clientes: { id: string, nome: string } | null; // Ou a estrutura correta
  formas_pagamento: { id: string, nome: string } | null; // Ou a estrutura correta
  categorias: { id: string, nome: string } | null; // Ou a estrutura correta
  vendas_items: SaleItem[]; // Ou tipo mais detalhado se necessário
  pagamentos_prazo?: any[]; // Adicione se necessário
}
