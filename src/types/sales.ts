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
