import React from 'react';
// Hooks e Ferramentas
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react'; // Importa o ícone

// Componentes e Tipos
import CategoriaForm from '@/components/categorias/CategoriaForm';
import { Button } from '@/components/ui/button'; // Importa o botão
import { getCategoriaById, updateCategoria } from '@/services/categoriaService';
import { CategoriaFormData } from '@/lib/validations/categoriaSchema';
import LoadingSpinner from '@/components/ui/loading-spinner'; // Assumindo existência
import ErrorDisplay from '@/components/ui/error-display'; // Assumindo existência
import { handleSupabaseError } from '@/lib/utils/supabase-error-handler';
import { UpdateCategoriaData } from '@/lib/types/categoria';

const EditarCategoria = () => {
  // Obtém o ID da categoria da URL
  const { id } = useParams<{ id: string }>();
  // Hooks de navegação e cliente query
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Validação simples do ID (UUID esperado)
  if (!id) {
    return <ErrorDisplay error={new Error('ID da categoria inválido ou não fornecido.')} />;
  }

  // Query para buscar os dados da categoria a ser editada
  const { 
    data: categoriaData, 
    isLoading, 
    isError, 
    error 
  } = useQuery({ 
    queryKey: ['categoria', id], // Chave única para esta categoria específica
    queryFn: () => getCategoriaById(id), // Chama o service para buscar por ID
    enabled: !!id, // Só executa a query se o ID for válido
  });

  // Mutação para atualizar a categoria
  const mutation = useMutation({
    mutationFn: (data: UpdateCategoriaData) => updateCategoria(id, data),
    onSuccess: (updatedData) => {
      toast.success(`Categoria "${updatedData.nome}" atualizada com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      queryClient.invalidateQueries({ queryKey: ['categoria', id] }); 
      navigate('/app/categorias');
    },
    onError: (error) => {
      console.error("Erro ao atualizar categoria:", error);
      const errorMessage = handleSupabaseError(error, "Erro ao atualizar categoria");
      toast.error(errorMessage || 'Ocorreu um erro inesperado ao atualizar a categoria.');
    },
  });

  // Função para lidar com a submissão do formulário
  const handleSubmit = (data: CategoriaFormData) => {
    // A função CategoriaForm já trata os campos opcionais
    mutation.mutate(data as UpdateCategoriaData); // Type assertion
  };

  // --- Renderização Condicional ---
  // Estado de carregamento da query
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Estado de erro na query ou se a categoria não for encontrada
  if (isError || !categoriaData) {
    // Se isError for true, usa o erro da query, senão cria um erro padrão
    const displayError = isError ? error : new Error('Categoria não encontrada.');
    return <ErrorDisplay error={displayError} />;
  }

  // --- Renderização Principal ---
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Botão Voltar foi removido daqui */}

      {/* Cabeçalho centralizado */}
      <div className="flex flex-col items-center justify-center pb-4 border-b w-full mb-6">
        <h2 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">Editar Categoria</h2>
        <p className="text-muted-foreground mt-1">
          Modifique os dados da categoria <span className='font-semibold'>{categoriaData.nome}</span>.
        </p>
      </div>
      
      {/* Renderiza o formulário passando dados iniciais e função de submit */}
      <CategoriaForm 
        onSubmit={handleSubmit} 
        initialData={categoriaData} // Passa os dados carregados
        isSubmitting={mutation.isPending} // Passa o estado de pending da mutação
      />
    </div>
  );
};

export default EditarCategoria; 