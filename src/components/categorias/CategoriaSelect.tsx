import React from 'react';
import { useQuery } from '@tanstack/react-query';

// Importa componentes da UI (Shadcn/UI)
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton'; // Para estado de loading

// Importa tipos e serviço
import { Categoria, CategoriaTipo } from '@/lib/types/categoria';
import { getCategorias } from '@/services/categoriaService';

// Props para o componente CategoriaSelect
interface CategoriaSelectProps {
  value: string | undefined; // ID da categoria selecionada
  onChange: (value: string | undefined) => void; // Função chamada ao mudar a seleção
  tipo: CategoriaTipo; // Tipo de categoria a ser filtrada e exibida
  placeholder?: string; // Texto a ser exibido quando nada está selecionado
  disabled?: boolean; // Para desabilitar o select
  className?: string; // Para permitir estilização adicional
}

const CategoriaSelect: React.FC<CategoriaSelectProps> = ({
  value,
  onChange,
  tipo,
  placeholder = "Selecione uma categoria", // Placeholder padrão
  disabled = false,
  className,
}) => {

  // Busca as categorias do tipo especificado (apenas ativas)
  const { data: categorias, isLoading, isError } = useQuery<Categoria[], Error>({
    // Chave de query inclui o tipo para cachear separadamente
    queryKey: ['categorias', tipo], 
    // Função de busca do service, passando o tipo
    queryFn: () => getCategorias(tipo, true), 
    // Mantém os dados por um tempo para evitar recarregamentos rápidos
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Estado de Carregamento: Mostra um Skeleton
  if (isLoading) {
    return <Skeleton className={`h-10 w-full ${className}`} />;
  }

  // Estado de Erro: Mostra uma mensagem simples (poderia ser um componente de erro)
  if (isError) {
    return <div className={`text-red-600 text-sm ${className}`}>Erro ao carregar categorias.</div>;
  }

  // Se não houver categorias, mostrar uma mensagem de aviso
  if (!categorias || categorias.length === 0) {
    return (
      <div className="text-amber-600 border border-amber-300 bg-amber-50 rounded-md p-2 text-sm">
        <p className="font-medium">Nenhuma categoria de {tipo} encontrada.</p>
        <p>Por favor, vá até a seção Categorias e crie pelo menos uma categoria do tipo "{tipo}".</p>
      </div>
    );
  }

  // Renderização Principal
  return (
    <Select 
      value={value} 
      onValueChange={onChange} // Chama a função passada via props
      disabled={disabled} // Agora não desabilitamos baseado na existência de categorias
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {categorias.map((categoria) => (
          <SelectItem key={categoria.id} value={categoria.id}>
            {/* Opcional: Mostrar a cor ao lado do nome */}
            {categoria.cor && (
              <span 
                className="inline-block w-3 h-3 rounded-full mr-2 border"
                style={{ backgroundColor: categoria.cor }}
              ></span>
            )}
            {categoria.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CategoriaSelect; 