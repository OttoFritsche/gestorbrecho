import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getProdutosDisponiveisParaVenda } from '@/services/produtoService';
import { Produto } from '@/lib/types/produto';
import { formatCurrency } from '@/lib/utils';

// Tipo estendido para produtos com informação de disponibilidade
type ProdutoDisponivel = Pick<Produto, 'id' | 'nome' | 'preco_venda' | 'quantidade'> & {
  quantidade_disponivel: number;
};

// Props do componente
interface ProdutoSelectProps {
  selectedValue?: string | null; // ID do produto selecionado
  onValueChange: (value: string | null, produto?: ProdutoDisponivel | null) => void; // Callback ao mudar valor, passa ID e objeto do produto
  disabled?: boolean;
}

// Componente Select para escolher um produto disponível para venda
const ProdutoSelect: React.FC<ProdutoSelectProps> = ({ selectedValue, onValueChange, disabled }) => {

  // Busca os produtos disponíveis usando React Query
  const { data: produtosDisponiveis, isLoading, error } = useQuery<ProdutoDisponivel[], Error>({
    queryKey: ['produtosDisponiveisVenda'],
    queryFn: getProdutosDisponiveisParaVenda,
  });

  // Handler para mudança de seleção
  const handleValueChange = (value: string) => {
    if (value === 'nenhum') {
        onValueChange(null, null); // Passa null se "Nenhum" for selecionado
    } else {
        // Encontra o objeto produto correspondente ao ID selecionado
        const produtoSelecionado = produtosDisponiveis?.find(p => p.id === value);
        onValueChange(value, produtoSelecionado); // Passa o ID e o objeto produto
    }
  };

  // Exibe skeleton enquanto carrega
  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  // Exibe mensagem de erro se falhar
  if (error) {
    return <div className="text-red-600 text-sm">Erro ao carregar produtos.</div>;
  }

  return (
    <Select
      onValueChange={handleValueChange}
      value={selectedValue || 'nenhum'} // Usa 'nenhum' como valor padrão se nada selecionado
      disabled={disabled || !produtosDisponiveis || produtosDisponiveis.length === 0}
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecione um produto do estoque..." />
      </SelectTrigger>
      <SelectContent>
        {/* Opção para desvincular produto */}
        <SelectItem value="nenhum">Nenhum (Venda Manual)</SelectItem>
        {/* Lista os produtos disponíveis */}
        {produtosDisponiveis && produtosDisponiveis.length > 0 ? (
          produtosDisponiveis.map((produto) => (
            <SelectItem key={produto.id} value={produto.id}>
              {/* Mostra Nome - Preço (Qtd disponível) */}
              {`${produto.nome} - ${formatCurrency(produto.preco_venda)} (${produto.quantidade_disponivel} disp.)`}
            </SelectItem>
          ))
        ) : (
          <SelectItem value="no-products" disabled>
            Nenhum produto disponível no estoque.
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};

export default ProdutoSelect; 