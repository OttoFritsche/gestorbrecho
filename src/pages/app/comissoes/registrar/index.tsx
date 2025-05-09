import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Save, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";

import { getVendedores } from "@/services/vendedorService";
import { fetchSales } from "@/services/saleService";
import { getRegrasComissao } from "@/services/regrasComissaoService";
import { createComissao } from "@/services/comissaoService";

export default function RegistrarComissaoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Estados para o formulário
  const [vendaId, setVendaId] = useState<string>("");
  const [vendedorId, setVendedorId] = useState<string>("");
  const [regraId, setRegraId] = useState<string>("");
  const [valorCalculado, setValorCalculado] = useState<string>("");
  const [observacoes, setObservacoes] = useState<string>("");
  const [isCalculando, setIsCalculando] = useState<boolean>(false);

  // Queries para carregar dados
  const {
    data: vendas = [],
    isLoading: isLoadingVendas,
    isError: isErrorVendas,
    error: errorVendas,
  } = useQuery({
    queryKey: ["vendas"],
    queryFn: fetchSales,
  });

  const {
    data: vendedores = [],
    isLoading: isLoadingVendedores,
    isError: isErrorVendedores,
    error: errorVendedores,
  } = useQuery({
    queryKey: ["vendedores"],
    queryFn: getVendedores,
  });

  const {
    data: regras = [],
    isLoading: isLoadingRegras,
    isError: isErrorRegras,
    error: errorRegras,
  } = useQuery({
    queryKey: ["regras-comissao"],
    queryFn: getRegrasComissao,
  });

  // Mutation para salvar a comissão
  const salvarComissaoMutation = useMutation({
    mutationFn: (comissaoData: any) => createComissao(comissaoData),
    onSuccess: () => {
      toast.success("Comissão registrada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["comissoes"] });
      navigate("/app/comissoes/relatorio");
    },
    onError: (error: any) => {
      toast.error(
        "Erro ao registrar comissão",
        { description: error.message || "Tente novamente" }
      );
    },
  });

  // Efeito para preencher a venda do parâmetro de consulta
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const vendaParam = queryParams.get("venda");
    
    if (vendaParam && vendas.length > 0) {
      const vendaExiste = vendas.some(v => v.id === vendaParam);
      if (vendaExiste) {
        setVendaId(vendaParam);
      } else {
        toast.error("Venda não encontrada", {
          description: "A venda indicada no link não foi localizada."
        });
      }
    }
  }, [location.search, vendas]);

  // Efeito para preencher o vendedor quando a venda for selecionada
  useEffect(() => {
    if (vendaId) {
      const vendaSelecionada = vendas.find((v) => v.id === vendaId);
      if (vendaSelecionada?.vendedor_id) {
        setVendedorId(vendaSelecionada.vendedor_id);
      }
    }
  }, [vendaId, vendas]);

  // Função para calcular comissão com base na regra
  const calcularComissao = () => {
    const venda = vendas.find((v) => v.id === vendaId);
    const regra = regras.find((r) => r.id === regraId);
    
    if (!venda || !regra) {
      toast.error("Selecione a venda e a regra para calcular");
      return;
    }

    setIsCalculando(true);
    
    try {
      let valorComissao = 0;
      const valorVenda = venda.valor_total || 0;
      
      // Cálculo baseado no tipo de regra
      switch (regra.tipo_calculo) {
        case 'porcentagem':
          valorComissao = (valorVenda * regra.valor) / 100;
          break;
        case 'valor_fixo':
          valorComissao = regra.valor;
          break;
        // Adicionar outros tipos de cálculo conforme necessário
        default:
          valorComissao = 0;
      }
      
      setValorCalculado(valorComissao.toFixed(2));
      toast.success("Valor calculado com base na regra selecionada");
    } catch (error) {
      toast.error("Erro ao calcular comissão");
      console.error("Erro ao calcular comissão:", error);
    } finally {
      setIsCalculando(false);
    }
  };

  // Função para registrar a comissão
  const registrarComissao = () => {
    if (!vendaId || !vendedorId || !valorCalculado) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const valor = parseFloat(valorCalculado);
    if (isNaN(valor) || valor <= 0) {
      toast.error("O valor da comissão deve ser maior que zero");
      return;
    }

    const comissaoData = {
      venda_id: vendaId,
      vendedor_id: vendedorId,
      regra_aplicada_id: regraId || null,
      valor_calculado: valor,
      observacoes: observacoes || null,
      data_calculo: new Date().toISOString(),
    };

    salvarComissaoMutation.mutate(comissaoData);
  };

  // Status de carregamento global
  const isLoading = isLoadingVendas || isLoadingVendedores || isLoadingRegras || salvarComissaoMutation.isPending;
  
  // Verificar erros
  const isError = isErrorVendas || isErrorVendedores || isErrorRegras;
  const errorMessage = isErrorVendas
    ? errorVendas instanceof Error
      ? errorVendas.message
      : "Erro ao carregar vendas"
    : isErrorVendedores
    ? errorVendedores instanceof Error
      ? errorVendedores.message
      : "Erro ao carregar vendedores"
    : isErrorRegras
    ? errorRegras instanceof Error
      ? errorRegras.message
      : "Erro ao carregar regras de comissão"
    : "";

  // Mostrar detalhes da venda selecionada
  const vendaSelecionada = vendas.find((v) => v.id === vendaId);
  const vendedorSelecionado = vendedores.find((v) => v.id === vendedorId);

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Registrar Comissão | Gestor Brechó</title>
      </Helmet>

      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b w-full">
        {/* Botão Voltar */}
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate(-1)} 
          aria-label="Voltar"
          className="flex-shrink-0" 
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        {/* Bloco Título/Subtítulo Centralizado */}
        <div className="flex-grow text-center px-4"> 
          <h1 className="text-3xl font-bold font-serif text-[#92400e]">
            Registrar Comissão
          </h1>
          <p className="text-muted-foreground mt-1">
            Registre comissões para vendedores com base nas vendas realizadas.
          </p>
        </div>

        {/* Espaço reservado para manter a centralização */}
        <div className="w-[40px] flex-shrink-0"></div>
      </div>

      {isError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            {errorMessage || "Ocorreu um erro ao carregar os dados necessários."}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dados da Comissão</CardTitle>
          <CardDescription>
            Preencha os dados para registrar uma nova comissão.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seleção de Venda */}
          <div className="space-y-2">
            <Label htmlFor="venda">Venda</Label>
            <Select
              value={vendaId}
              onValueChange={setVendaId}
              disabled={isLoading}
            >
              <SelectTrigger id="venda">
                <SelectValue placeholder="Selecione uma venda" />
              </SelectTrigger>
              <SelectContent>
                {vendas.map((venda) => (
                  <SelectItem key={venda.id} value={venda.id}>
                    {format(new Date(venda.data_venda), "dd/MM/yyyy")} - {venda.clientes?.nome || "Cliente não identificado"} - {formatCurrency(venda.valor_total)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {vendaSelecionada && (
            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-medium mb-2">Detalhes da Venda</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-semibold">Cliente:</span> {vendaSelecionada.clientes?.nome || "Cliente não identificado"}
                </div>
                <div>
                  <span className="font-semibold">Data:</span> {format(new Date(vendaSelecionada.data_venda), "dd/MM/yyyy")}
                </div>
                <div>
                  <span className="font-semibold">Valor Total:</span> {formatCurrency(vendaSelecionada.valor_total)}
                </div>
                <div>
                  <span className="font-semibold">Forma de Pagamento:</span> {vendaSelecionada.formas_pagamento?.nome || "Não especificada"}
                </div>
              </div>
            </div>
          )}

          {/* Seleção de Vendedor */}
          <div className="space-y-2">
            <Label htmlFor="vendedor">Vendedor</Label>
            <Select
              value={vendedorId}
              onValueChange={setVendedorId}
              disabled={isLoading}
            >
              <SelectTrigger id="vendedor">
                <SelectValue placeholder="Selecione um vendedor" />
              </SelectTrigger>
              <SelectContent>
                {vendedores.map((vendedor) => (
                  <SelectItem key={vendedor.id} value={vendedor.id}>
                    {vendedor.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {vendedorSelecionado && (
            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-medium mb-2">Detalhes do Vendedor</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-semibold">Nome:</span> {vendedorSelecionado.nome}
                </div>
                <div>
                  <span className="font-semibold">Email:</span> {vendedorSelecionado.email || "Não informado"}
                </div>
                <div>
                  <span className="font-semibold">Telefone:</span> {vendedorSelecionado.telefone || "Não informado"}
                </div>
              </div>
            </div>
          )}

          {/* Regra de Comissão */}
          <div className="space-y-2">
            <Label htmlFor="regra">Regra de Comissão (opcional)</Label>
            <div className="flex gap-2">
              <Select
                value={regraId}
                onValueChange={setRegraId}
                disabled={isLoading}
                className="flex-grow"
              >
                <SelectTrigger id="regra">
                  <SelectValue placeholder="Selecione uma regra de comissão" />
                </SelectTrigger>
                <SelectContent>
                  {regras
                    .filter(r => r.ativa)
                    .map((regra) => (
                    <SelectItem key={regra.id} value={regra.id}>
                      {regra.nome} ({regra.tipo_calculo === 'porcentagem' ? `${regra.valor}%` : formatCurrency(regra.valor)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                onClick={calcularComissao} 
                disabled={!regraId || !vendaId || isCalculando}
                variant="outline"
              >
                {isCalculando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Calcular
              </Button>
            </div>
          </div>

          {/* Valor da Comissão */}
          <div className="space-y-2">
            <Label htmlFor="valor" className="flex items-center gap-1">
              Valor da Comissão
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={valorCalculado}
              onChange={(e) => setValorCalculado(e.target.value)}
              disabled={isLoading}
              className="font-medium"
              required
            />
            <p className="text-xs text-muted-foreground">
              Valor calculado ou informado manualmente.
            </p>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações sobre a comissão..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate("/app/comissoes/relatorio")}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={registrarComissao}
            disabled={isLoading || !vendaId || !vendedorId || !valorCalculado}
            className="bg-[#92400e] hover:bg-[#7d3609]"
          >
            {salvarComissaoMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Registrar Comissão
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 