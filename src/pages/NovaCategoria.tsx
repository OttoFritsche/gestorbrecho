import React from 'react';
// Hooks e Ferramentas
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

// Componentes e Tipos
import CategoriaForm from '@/components/categorias/CategoriaForm';
import { Button } from '@/components/ui/button';
import { createCategoria } from '@/services/categoriaService';
import { CategoriaFormData } from '@/lib/validations/categoriaSchema';
import { NovaCategoria } from '@/lib/types/categoria'; // Usaremos NovaCategoria para tipar os dados enviados
import { handleSupabaseError } from '@/lib/utils/supabase-error-handler'; // Para tratar erros na mutação

const NovaCategoria = () => {
  // Hook para navegação programática
  const navigate = useNavigate();
  // Cliente React Query para invalidar caches
  const queryClient = useQueryClient();

  // Configuração da Mutação para criar categoria
  const mutation = useMutation({
    // Função que será executada ao chamar mutate
    mutationFn: (data: NovaCategoria) => createCategoria(data),
    // Callback em caso de sucesso
    onSuccess: (data) => { // data aqui é a categoria retornada pelo service
      toast.success(`Categoria "${data.nome}" criada com sucesso!`);
      // Invalida a query de listagem para que ela seja recarregada na próxima vez que for acessada
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      // Navega de volta para a página de listagem
      navigate('/app/categorias');
    },
    // Callback em caso de erro
    onError: (error) => {
      console.error("Erro ao criar categoria:", error);
      // Usa o handler de erro (ou um fallback) para mostrar mensagem ao usuário
      const errorMessage = handleSupabaseError(error, "Erro ao criar categoria");
      toast.error(errorMessage || 'Ocorreu um erro inesperado ao criar a categoria.');
    },
  });

  // Função para lidar com a submissão do formulário
  const handleSubmit = (data: CategoriaFormData) => {
    // A função CategoriaForm já trata os campos opcionais (descricao, cor)
    // Chama a mutação com os dados validados do formulário
    mutation.mutate(data as NovaCategoria); // Faz type assertion seguro aqui pois CategoriaFormData é compatível
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
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
          <h2 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">Nova Categoria</h2>
          <p className="text-muted-foreground mt-1">
            Crie uma nova categoria para organizar seus produtos, receitas ou despesas.
          </p>
        </div>
        <div className="w-[40px] flex-shrink-0"></div>
      </div>
      
      {/* Renderiza o formulário, passando a função de submit e o estado de pending */}
      <CategoriaForm 
        onSubmit={handleSubmit} 
        isSubmitting={mutation.isPending} 
      />
    </div>
  );
};

export default NovaCategoria; 