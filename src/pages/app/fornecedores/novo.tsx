import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { createFornecedor } from "@/services/fornecedorService";
import { FornecedorForm } from "@/components/fornecedores/FornecedorForm";
import { Fornecedor } from "@/lib/validations/fornecedorSchema";

export default function NovoFornecedorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Mutation para criar fornecedor
  const createMutation = useMutation({
    mutationFn: (data: Omit<Fornecedor, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => 
      createFornecedor(data),
    onSuccess: () => {
      toast.success("Fornecedor cadastrado com sucesso!");
      // Invalida a query de fornecedores para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      // Redireciona para a lista de fornecedores
      navigate("/app/fornecedores");
    },
    onError: (error) => {
      console.error("Erro ao cadastrar fornecedor:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Erro ao cadastrar fornecedor. Tente novamente."
      );
    }
  });
  
  // Handler de submissão do formulário
  const handleSubmit = async (data: Omit<Fornecedor, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      await createMutation.mutateAsync(data);
    } catch (error) {
      // Erro já é tratado no onError da mutation
    }
  };

  // Handler para voltar
  const handleVoltar = () => {
    navigate(-1); // Volta para a página anterior
  };

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 pt-6 pb-8">
      <Helmet>
        <title>Novo Fornecedor | Gestor Brechó</title>
      </Helmet>
      
      <div className="flex flex-col pb-4 border-b w-full mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="outline" size="icon" onClick={handleVoltar} aria-label="Voltar">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">Cadastrar Novo Fornecedor</h2>
        </div>
        <p className="text-muted-foreground ml-14">
          Preencha os dados para cadastrar um novo fornecedor no sistema.
        </p>
      </div>
      
      <FornecedorForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isLoading}
      />
    </div>
  );
} 