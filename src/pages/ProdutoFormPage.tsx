import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProdutoForm from '@/components/produtos/ProdutoForm';
import { getProdutoById, createProduto, updateProduto } from '@/services/produtoService';
import { Produto, ProdutoFormData } from '@/lib/types/produto';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ErrorDisplay from '@/components/ui/error-display';

const ProdutoFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const { data: initialData, isLoading: isLoadingData, error: fetchError } = useQuery<Produto | null, Error>({
    queryKey: ['produto', id], 
    queryFn: () => getProdutoById(id!),
    enabled: isEditing,
  });

  const mutationCreate = useMutation<Produto, Error, ProdutoFormData>({
    mutationFn: createProduto,
    onSuccess: (newProduto) => {
      toast.success(`Produto "${newProduto.nome}" criado com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      navigate('/app/estoque');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar produto: ${error.message}`);
    }
  });

  const mutationUpdate = useMutation<Produto, Error, { id: string; data: ProdutoFormData; imagemAntigaUrl?: string | null }>({
    mutationFn: ({ id, data, imagemAntigaUrl }) => updateProduto(id, data, imagemAntigaUrl),
    onSuccess: (updatedProduto) => {
      toast.success(`Produto "${updatedProduto.nome}" atualizado com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['produto', updatedProduto.id] });
      navigate('/app/estoque');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar produto: ${error.message}`);
    }
  });

  const handleFormSubmit = async (data: ProdutoFormData) => {
    if (isEditing && id) {
      await mutationUpdate.mutateAsync({ 
        id, 
        data, 
        imagemAntigaUrl: initialData?.imagem_url
      });
    } else {
      await mutationCreate.mutateAsync(data);
    }
  };

  const handleCancel = () => {
    navigate('/app/estoque');
  };

  if (isEditing && isLoadingData) {
    return <LoadingSpinner text="Carregando dados do produto..." />;
  }

  if (fetchError) {
    return <ErrorDisplay message={`Erro ao carregar dados para edição: ${fetchError.message}`} />;
  }

  if (isEditing && !initialData && !isLoadingData) {
    return <ErrorDisplay message="Produto não encontrado para edição." />;
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 pt-6 pb-8">
      <div className="flex items-center justify-between pb-4 border-b w-full mb-6">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate(-1)} 
          aria-label="Voltar"
          className="flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-grow text-center px-4">
          <h2 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">
              {isEditing ? 'Editar Produto' : 'Cadastrar Novo Produto'}
          </h2>
          <p className="text-muted-foreground mt-1">
            {isEditing ? 'Modifique as informações do produto selecionado.' : 'Preencha os detalhes do novo item para adicioná-lo ao estoque.'}
          </p>
        </div>
        <div className="w-[40px] flex-shrink-0"></div>
      </div>
      
      <ProdutoForm 
        onSubmit={handleFormSubmit} 
        initialData={isEditing && initialData ? initialData : null} 
        isSubmitting={mutationCreate.isPending || mutationUpdate.isPending}
        onCancel={handleCancel}
      /> 

    </div>
  );
};

export default ProdutoFormPage; 