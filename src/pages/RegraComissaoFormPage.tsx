import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { RegraComissaoForm } from '@/components/comissoes/regras/RegraComissaoForm';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ErrorDisplay from '@/components/ui/error-display';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { getRegraComissaoById, createRegraComissao, updateRegraComissao } from '@/services/regrasComissaoService';
import { RegraComissaoInput, RegraComissao } from '@/types/comissao';
import { RegraComissaoFormData } from '@/schemas/regraComissaoSchema';

const RegraComissaoFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id) && id !== 'nova';

  const { data: regraData, isLoading, isError, error } = useQuery<RegraComissao | null, Error>({
    queryKey: ['regraComissao', id],
    queryFn: () => (isEditing && id ? getRegraComissaoById(id) : Promise.resolve(null)),
    enabled: isEditing,
  });

  const mutation = useMutation({
    mutationFn: (data: { input: RegraComissaoInput; id?: string }) => {
      if (data.id) {
        return updateRegraComissao(data.id, data.input);
      } else {
        return createRegraComissao(data.input);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regrasComissao'] });
      toast.success(`Regra de comissão ${isEditing ? 'atualizada' : 'criada'} com sucesso!`);
      navigate('/app/comissoes/regras');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar regra: ${error.message}`);
    },
  });

  const handleSubmit = async (formData: RegraComissaoInput) => {
    await mutation.mutateAsync({ input: formData, id: isEditing ? id : undefined });
  };

  if (isLoading && isEditing) {
    return <LoadingSpinner className="mt-20" />;
  }

  if (isError && isEditing) {
    return <ErrorDisplay error={error} title="Erro ao carregar regra para edição" />;
  }
  
  // Prepara dados iniciais para o formulário (parsear datas se vierem do DB)
  const initialFormData = isEditing && regraData ? {
      ...regraData,
      periodo_vigencia_inicio: regraData.periodo_vigencia_inicio ? new Date(regraData.periodo_vigencia_inicio.replace(/-/g, '/')+'T00:00:00') : null,
      periodo_vigencia_fim: regraData.periodo_vigencia_fim ? new Date(regraData.periodo_vigencia_fim.replace(/-/g, '/')+'T00:00:00') : null,
  } : undefined;


  return (
    <div className="container mx-auto py-8">
       <div className="mb-6 pb-4 border-b">
        <h2 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">
          {isEditing ? 'Editar Regra de Comissão' : 'Nova Regra de Comissão'}
        </h2>
        <p className="text-muted-foreground mt-1">
          {isEditing ? 'Modifique os detalhes da regra selecionada.' : 'Crie uma nova regra para cálculo de comissão.'}
        </p>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Detalhes da Regra</CardTitle>
        </CardHeader>
        <CardContent>
          <RegraComissaoForm 
            onSubmit={handleSubmit}
            initialData={initialFormData as RegraComissaoFormData | null | undefined} // Cast para o tipo esperado pelo form
            isSubmitting={mutation.isPending}
            onCancel={() => navigate('/app/comissoes/regras')}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default RegraComissaoFormPage; 