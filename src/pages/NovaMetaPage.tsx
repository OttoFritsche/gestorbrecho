import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import MetaForm, { MetaFormSubmitPayload } from '@/components/financeiro/MetaForm';
import { addMeta } from '@/services/metas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const NovaMetaPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Mutação para adicionar a meta
  const addMutation = useMutation({
    mutationFn: addMeta,
    onSuccess: () => {
      toast.success('Meta adicionada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['metas'] }); // Invalida a lista de metas
      navigate('/app/metas'); // Volta para a lista após sucesso
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar meta: ${error.message}`);
      // O erro já é tratado no serviço e/ou no formulário (Zod)
      // Podemos adicionar logs mais detalhados aqui se necessário
      console.error("Erro detalhado ao adicionar meta:", error);
    },
  });

  // Função chamada pelo formulário ao submeter
  const handleCreateMeta = async (data: MetaFormSubmitPayload) => {
    // O profile_id será adicionado automaticamente pela RLS no Supabase, se configurado
    // Se não, teria que pegar o id do usuário do context e adicionar aqui
    await addMutation.mutateAsync(data);
  };

  return (
    <div className="container mx-auto py-6">
      {/* Cabeçalho com botão voltar à esquerda e título/subtítulo centralizado */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b w-full">
        {/* Botão Voltar */}
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate('/app/metas')} 
          aria-label="Voltar para Metas"
          className="flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        {/* Bloco Título/Subtítulo Centralizado */}
        <div className="flex-grow text-center px-4"> 
          <h2 className="text-3xl font-bold font-serif text-[#92400e]">Criar Nova Meta</h2>
          <p className="text-muted-foreground mt-1">Defina seu novo objetivo financeiro.</p>
        </div>

        {/* Espaço reservado para manter a centralização - REINSERIDO */}
        <div className="w-[40px] flex-shrink-0"></div> 

      </div> {/* Div do cabeçalho fechado corretamente */}

      {/* Card do formulário fora do cabeçalho */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Meta</CardTitle>
          <CardDescription>Defina os detalhes para seu novo objetivo financeiro.</CardDescription>
        </CardHeader>
        <CardContent>
          <MetaForm
            onSubmit={handleCreateMeta}
            isSubmitting={addMutation.isPending}
            submitButtonText="Criar Meta"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default NovaMetaPage; 