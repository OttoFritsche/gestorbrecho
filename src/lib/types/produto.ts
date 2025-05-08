import { Database } from './supabase';

// Define os possíveis status do produto, baseados no ENUM do Supabase
export type ProdutoStatus = 'disponivel' | 'reservado' | 'vendido' | 'inativo';

// Tipo base para representar um produto, alinhado com a tabela 'produtos' do Supabase
// Usamos Database['public']['Tables']['produtos']['Row'] para garantir consistência
export type Produto = Database['public']['Tables']['produtos']['Row'];

// Tipo para os dados do formulário de produto
// Pode diferir ligeiramente do tipo Produto (ex: campo para File da imagem)
export interface ProdutoFormData {
  nome: string;
  descricao?: string | null;
  categoria_id?: string | null; // ID da categoria (opcional)
  sku?: string | null; // SKU (opcional)
  preco_custo?: number | null;
  preco_venda: number;
  quantidade: number;
  status: ProdutoStatus;
  atributos?: Record<string, any> | string | null; // Aceita objeto ou string JSON
  imagem?: FileList | null; // Para o input type="file"
  imagem_url?: string | null; // URL da imagem existente (para edição)
} 