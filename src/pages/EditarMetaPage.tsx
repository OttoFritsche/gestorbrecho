import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import MetaForm, { MetaFormSubmitPayload } from '@/components/financeiro/MetaForm';
import { getMetaById, updateMeta } from '@/services/metas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Meta } from '@/types/financeiro'; // Para tipar o dado da query

const EditarMetaPage: React.FC = () => {
  const navigate = useNavigate();
  const { metaId } = useParams<{ metaId: string }>();
  const queryClient = useQueryClient();

  // Verificar se metaId existe
  if (!metaId) {
    // Redirecionar ou mostrar erro se o ID não estiver presente
    navigate('/app/metas');
    toast.error('ID da meta não fornecido.');
    return null; // Evita renderização adicional
  }

  // Busca os dados da meta a ser editada
  const { data: meta, isLoading: isLoadingMeta, error: loadError } = useQuery<Meta | null>({
    queryKey: ['meta', metaId],
    queryFn: () => getMetaById(metaId),
    enabled: !!metaId, // Só executa se metaId existir
  });

  // Mutação para atualizar a meta
  const updateMutation = useMutation({
    // Ajustar o tipo esperado pelo updateMeta
    mutationFn: (data: MetaFormSubmitPayload) => updateMeta(metaId, data),
    onSuccess: () => {
      toast.success('Meta atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['metas'] }); // Invalida a lista
      queryClient.invalidateQueries({ queryKey: ['meta', metaId] }); // Invalida o cache desta meta
      navigate('/app/metas'); // Volta para a lista após sucesso
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar meta: ${error.message}`);
      console.error("Erro detalhado ao atualizar meta:", error);
    },
  });

  // Função chamada pelo formulário ao submeter
  const handleUpdateMeta = async (data: MetaFormSubmitPayload) => {
    await updateMutation.mutateAsync(data);
  };

  // Tratamento de estados de carregamento e erro
  if (isLoadingMeta) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Carregando dados da meta...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container mx-auto py-8 text-center text-red-600">
        <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
        <p>Erro ao carregar dados da meta: {loadError.message}</p>
        <Button onClick={() => navigate('/app/metas')} variant="outline" className="mt-4">
          Voltar para Metas
        </Button>
      </div>
    );
  }

  if (!meta) {
      return (
          <div className="container mx-auto py-8 text-center text-muted-foreground">
              <p>Meta não encontrada.</p>
              <Button onClick={() => navigate('/app/metas')} variant="outline" className="mt-4">
                  Voltar para Metas
              </Button>
          </div>
      );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Cabeçalho com Voltar */}
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate('/app/metas')} className="mr-4">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold font-serif">Editar Meta Financeira</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar Informações da Meta</CardTitle>
          <CardDescription>Modifique os detalhes do seu objetivo financeiro.</CardDescription>
        </CardHeader>
        <CardContent>
          <MetaForm
            onSubmit={handleUpdateMeta}
            initialData={meta} // Passa os dados carregados para o formulário
            isSubmitting={updateMutation.isPending}
            submitButtonText="Salvar Alterações"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default EditarMetaPage; 