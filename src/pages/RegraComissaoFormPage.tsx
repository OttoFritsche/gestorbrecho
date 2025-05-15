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

  // Função utilitária para converter string YYYY-MM-DD para objeto Date local
  const parseDateStringAsLocal = (dateString: string | null | undefined): Date | null => {
    if (!dateString || typeof dateString !== 'string' || !dateString.includes('-')) {
      // console.log(`[RegraComissaoFormPage] parseDateStringAsLocal: Entrada inválida ou nula: ${dateString}`);
      return null;
    }
    // console.log(`[RegraComissaoFormPage] parseDateStringAsLocal: Tentando parsear: ${dateString}`);
    const parts = dateString.split('-').map(s => parseInt(s, 10));
    
    if (parts.length === 3 && !parts.some(isNaN)) {
      const year = parts[0];
      const monthIndex = parts[1] - 1; // Mês em JS é 0-11
      const day = parts[2];

      if (year < 1900 || year > 3000 || monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) {
          console.error(`[RegraComissaoFormPage] Componentes da data fora do intervalo ao parsear: ${dateString}. Ano: ${year}, Mês (JS): ${monthIndex}, Dia: ${day}`);
          return null; 
      }
      
      const newDate = new Date(year, monthIndex, day);
      if (isNaN(newDate.getTime())) {
        console.error(`[RegraComissaoFormPage] new Date(${year}, ${monthIndex}, ${day}) resultou em Invalid Date. String original: '${dateString}'`);
        return null;
      }
      // console.log(`[RegraComissaoFormPage] parseDateStringAsLocal: Data parseada com sucesso:`, newDate.toISOString());
      return newDate;
    }
    console.error(`[RegraComissaoFormPage] Formato de string de data inválido ao parsear: ${dateString}. Parts:`, parts);
    return null;
  };

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
  
  const initialFormData = isEditing && regraData ? {
      ...regraData,
      periodo_vigencia_inicio: parseDateStringAsLocal(regraData.periodo_vigencia_inicio),
      periodo_vigencia_fim: parseDateStringAsLocal(regraData.periodo_vigencia_fim),
  } : undefined;

  // console.log("[RegraComissaoFormPage] initialFormData preparado:", initialFormData);

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