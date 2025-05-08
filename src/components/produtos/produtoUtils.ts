import { ProdutoStatus } from "@/lib/types/produto";

/**
 * Retorna a variante de cor do Badge com base no status do produto.
 * @param status O status do produto.
 * @returns A variante do componente Badge (ou 'default').
 */
export const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
  switch (status as ProdutoStatus) {
    case 'disponivel':
      return 'success'; // Usaremos uma variante customizada 'success' (verde)
    case 'reservado':
      return 'warning'; // Usaremos uma variante customizada 'warning' (amarelo/laranja)
    case 'vendido':
      return 'secondary'; // Cinza
    case 'inativo':
      return 'outline'; // Contorno / cinza claro
    default:
      return 'default'; // Padrão
  }
};

// Adicione aqui outras funções utilitárias específicas para produtos, se necessário. 