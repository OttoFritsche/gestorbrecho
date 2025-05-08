import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { Loader2 } from "lucide-react";

import { getFornecedorById, updateFornecedor } from "@/services/fornecedorService";
import { FornecedorForm } from "@/components/fornecedores/FornecedorForm";
import { Fornecedor } from "@/lib/validations/fornecedorSchema";
import { Button } from "@/components/ui/button";

export default function EditarFornecedorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Redirecionar se não houver ID
  useEffect(() => {
    if (!id) {
      toast.error("ID do fornecedor não informado");
      navigate("/app/fornecedores");
    }
  }, [id, navigate]);
  
  // Query para buscar o fornecedor
  const { 
    data: fornecedor, 
    isLoading,
    error,
    isError
  } = useQuery({
    queryKey: ["fornecedor", id],
    queryFn: () => id ? getFornecedorById(id) : Promise.reject("ID não fornecido"),
    enabled: !!id,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
  
  // Mutation para atualizar o fornecedor
  const updateMutation = useMutation({
    mutationFn: (data: Omit<Fornecedor, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => 
      id ? updateFornecedor(id, data) : Promise.reject("ID não fornecido"),
    onSuccess: () => {
      toast.success("Fornecedor atualizado com sucesso!");
      // Invalida a query de fornecedores e do fornecedor específico
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      queryClient.invalidateQueries({ queryKey: ["fornecedor", id] });
      // Redireciona para a lista de fornecedores
      navigate("/app/fornecedores");
    },
    onError: (error) => {
      console.error("Erro ao atualizar fornecedor:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Erro ao atualizar fornecedor. Tente novamente."
      );
    }
  });
  
  // Handler de submissão do formulário
  const handleSubmit = async (data: Omit<Fornecedor, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      await updateMutation.mutateAsync(data);
    } catch (error) {
      // Erro já é tratado no onError da mutation
    }
  };
  
  // Handler para voltar à listagem
  const handleVoltar = () => {
    navigate("/app/fornecedores");
  };
  
  // Renderiza mensagem de erro se houver
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 space-y-4">
        <Helmet>
          <title>Erro | Gestor Brechó</title>
        </Helmet>
        
        <div className="text-destructive text-lg font-semibold">
          {error instanceof Error ? error.message : "Erro ao carregar fornecedor"}
        </div>
        
        <Button onClick={handleVoltar} className="bg-[#a16207] hover:bg-[#854d0e] text-white">
          Voltar para lista de fornecedores
        </Button>
      </div>
    );
  }
  
  // Renderiza loader enquanto carrega
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16">
        <Helmet>
          <title>Carregando... | Gestor Brechó</title>
        </Helmet>
        
        <Loader2 className="h-8 w-8 animate-spin text-[#a16207]" />
        <p className="mt-2 text-muted-foreground">Carregando dados do fornecedor...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 pt-6 pb-8">
      <Helmet>
        <title>Editar Fornecedor | Gestor Brechó</title>
      </Helmet>
      
      <div className="flex flex-col items-center justify-center pb-4 border-b w-full mb-6">
        <h2 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">Editar Fornecedor</h2>
        <p className="text-muted-foreground mt-1">
          Atualize os dados do fornecedor: {fornecedor?.nome_razao_social}
        </p>
      </div>
      
      {fornecedor && (
        <FornecedorForm
          initialData={fornecedor}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isLoading}
        />
      )}
    </div>
  );
} 