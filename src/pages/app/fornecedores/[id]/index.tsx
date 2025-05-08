import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, PencilLine, Building2, Phone, Mail, MapPin, Loader2, Package } from "lucide-react";

import { getFornecedorById } from "@/services/fornecedorService";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { formatCPFOrCNPJ } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function DetalheFornecedorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
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
  
  // Query para buscar produtos associados ao fornecedor (implementação futura)
  const [produtosCount, setProdutosCount] = useState(0);
  
  // Handler para voltar à listagem
  const handleVoltar = () => {
    navigate("/app/fornecedores");
  };
  
  // Handler para editar o fornecedor
  const handleEditar = () => {
    navigate(`/app/fornecedores/${id}/editar`);
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

  // Composição do endereço completo
  const enderecoCompleto = [
    fornecedor?.endereco_logradouro,
    fornecedor?.endereco_numero && `Nº ${fornecedor.endereco_numero}`,
    fornecedor?.endereco_complemento,
    fornecedor?.endereco_bairro,
    fornecedor?.endereco_cidade,
    fornecedor?.endereco_estado,
    fornecedor?.endereco_cep && formatarCEP(fornecedor.endereco_cep)
  ].filter(Boolean).join(", ");
  
  // Função para formatar CEP
  function formatarCEP(cep: string) {
    if (!cep) return "";
    return cep.replace(/^(\d{5})(\d{3})$/, "$1-$2");
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 pt-6 pb-8">
      <Helmet>
        <title>
          {fornecedor?.nome_razao_social 
            ? `${fornecedor.nome_razao_social} | Fornecedor` 
            : "Detalhes do Fornecedor"} | Gestor Brechó
        </title>
      </Helmet>
      
      {/* Cabeçalho */}
      <div className="flex flex-col items-center justify-center pb-4 border-b w-full mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">
            {fornecedor?.nome_razao_social}
          </h2>
        </div>
        {fornecedor?.nome_fantasia && (
          <p className="text-muted-foreground mt-1 mb-4">
            {fornecedor.nome_fantasia}
          </p>
        )}
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleVoltar}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button onClick={handleEditar} className="bg-[#a16207] hover:bg-[#854d0e] text-white">
            <PencilLine className="h-4 w-4 mr-2" />
            Editar Fornecedor
          </Button>
        </div>
      </div>
      
      {/* Conteúdo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card de Informações Gerais */}
        <Card className="md:col-span-2">
          <CardHeader className="bg-[#fef3c7]">
            <CardTitle className="flex items-center gap-2 text-[#92400e]">
              <Building2 className="h-5 w-5" />
              Informações Gerais
            </CardTitle>
            <CardDescription>
              Dados principais do fornecedor
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6">
            <div className="grid sm:grid-cols-2 gap-4">
              {/* CNPJ/CPF */}
              {fornecedor?.cnpj_cpf && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {fornecedor.cnpj_cpf.length <= 11 ? "CPF" : "CNPJ"}
                  </h3>
                  <p className="text-base font-medium">
                    {formatCPFOrCNPJ(fornecedor.cnpj_cpf)}
                  </p>
                </div>
              )}
              
              {/* IE/RG */}
              {fornecedor?.ie_rg && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {fornecedor.cnpj_cpf?.length <= 11 ? "RG" : "Inscrição Estadual"}
                  </h3>
                  <p className="text-base font-medium">{fornecedor.ie_rg}</p>
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Contato */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Informações de Contato
              </h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Contato Principal */}
                {fornecedor?.contato_principal && (
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-0.5">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-medium">{fornecedor.contato_principal}</p>
                      <p className="text-sm text-muted-foreground">Contato Principal</p>
                    </div>
                  </div>
                )}
                
                {/* Telefone */}
                {fornecedor?.telefone && (
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-0.5">
                      <Phone className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-medium">{fornecedor.telefone}</p>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                    </div>
                  </div>
                )}
                
                {/* Email */}
                {fornecedor?.email && (
                  <div className="flex items-start gap-2 col-span-full">
                    <span className="text-muted-foreground mt-0.5">
                      <Mail className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-medium">{fornecedor.email}</p>
                      <p className="text-sm text-muted-foreground">Email</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <Separator />
            
            {/* Endereço */}
            {enderecoCompleto && (
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground mt-0.5">
                  <MapPin className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Endereço
                  </h3>
                  <p className="font-medium">{enderecoCompleto}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Card de Estatísticas e Produtos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produtos e Estatísticas
            </CardTitle>
            <CardDescription>
              Informações sobre produtos e atividades do fornecedor
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-lg text-center">
                <span className="text-2xl font-bold">{produtosCount}</span>
                <p className="text-sm text-muted-foreground">Produtos</p>
              </div>
              <div className="bg-muted p-4 rounded-lg text-center">
                <span className="text-2xl font-bold">
                  {fornecedor?.created_at ? new Date(fornecedor.created_at).getFullYear() : "-"}
                </span>
                <p className="text-sm text-muted-foreground">Desde</p>
              </div>
            </div>
            
            {fornecedor?.observacoes && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Observações
                  </h3>
                  <p className="text-sm">{fornecedor.observacoes}</p>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-2">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate("/app/estoque?fornecedor=" + id)}
            >
              <Package className="h-4 w-4 mr-2" />
              Ver Produtos
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleEditar}
            >
              <PencilLine className="h-4 w-4 mr-2" />
              Editar Fornecedor
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 