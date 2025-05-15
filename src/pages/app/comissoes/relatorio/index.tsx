import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Helmet } from "react-helmet-async";
import { Calendar as CalendarIcon, Loader2, Search, FileText, MoreHorizontal, Eye, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getComissoes } from "@/services/comissaoService";
import { getVendedores } from "@/services/vendedorService";
import { fetchSales } from "@/services/saleService";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import DarBaixaComissaoDialog from "@/components/comissoes/DarBaixaComissaoDialog";

// Interface para armazenar os dados da comissão selecionada para dar baixa
interface ComissaoParaBaixa {
  id: string;
  valor: number;
  vendedorNome: string;
}

// Função auxiliar para determinar a variante do Badge com base no status
const getStatusVariant = (status: string | undefined | null): "default" | "destructive" | "outline" | "secondary" => {
  switch (status) {
    case 'paga':
      return 'default'; // Verde (shadcn default é geralmente primário, pode ser customizado para verde)
    case 'pendente':
      return 'outline'; // Amarelo/Laranja (outline pode ser usado com borda colorida)
    case 'aprovada':
      return 'secondary'; // Azul claro/Cinza (secondary é uma boa opção para estados intermediários)
    case 'estornada':
      return 'destructive'; // Vermelho
    default:
      return 'secondary';
  }
};

export default function RelatorioComissoesPage() {
  // Estados para filtros
  const [vendedorId, setVendedorId] = useState<string>("");
  const [dataInicio, setDataInicio] = useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = useState<Date | undefined>(undefined);
  const [busca, setBusca] = useState<string>("");
  const navigate = useNavigate();

  // Estado para o modal de dar baixa
  const [modalDarBaixaAberto, setModalDarBaixaAberto] = useState(false);
  const [comissaoSelecionada, setComissaoSelecionada] = useState<ComissaoParaBaixa | null>(null);
  const [categoriaComissaoId, setCategoriaComissaoId] = useState<string>("");

  // Query para buscar a categoria "Comissões de Vendedores"
  const {
    data: categoriaComissoes,
  } = useQuery({
    queryKey: ["categorias", "comissoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("id, nome")
        .eq("nome", "Comissões de Vendedores")
        .eq("tipo", "despesa")
        .single();
      
      if (error) {
        console.error("Erro ao buscar categoria 'Comissões de Vendedores':", error);
        // Não lançar erro aqui para não quebrar a página se a categoria não existir inicialmente
        // A lógica de `handleDarBaixa` e a renderização do Dialog já lidam com `categoriaComissaoId` vazio.
        return null; 
      }
      return data;
    }
  });

  // Atualizar o ID da categoria quando os dados forem carregados
  useEffect(() => {
    if (categoriaComissoes?.id) {
      setCategoriaComissaoId(categoriaComissoes.id);
    } else if (categoriaComissoes === null) {
      // Se a query retornou null (categoria não encontrada), define como string vazia
      // para evitar problemas de tipo e garantir que o Dialog não abra sem categoria.
      setCategoriaComissaoId("");
    }
  }, [categoriaComissoes]);

  // Função para abrir o modal de dar baixa
  const handleAbrirModalDarBaixa = (comissao: any) => {
    if (!categoriaComissaoId) {
      // Idealmente, teríamos um toast aqui informando que a categoria de despesa não foi configurada.
      // Por agora, vamos logar e impedir a abertura do modal.
      console.error("ID da categoria de comissões não encontrado. Não é possível dar baixa.");
      alert("Erro: A categoria para despesas de comissão não foi encontrada. Verifique as configurações do sistema.");
      return;
    }
    setComissaoSelecionada({
      id: comissao.id,
      valor: comissao.valor_calculado || 0,
      vendedorNome: comissao.vendedor_nome || "Vendedor"
    });
    setModalDarBaixaAberto(true);
  };

  // Função chamada após confirmar o pagamento com sucesso
  const handleBaixaSuccess = () => {
    // Aqui podemos fazer outras ações, se necessário
    refetchComissoes();
  };

  // Query para buscar vendedores
  const {
    data: vendedores = [],
    isLoading: isLoadingVendedores,
    isError: isErrorVendedores,
    error: errorVendedores,
  } = useQuery({
    queryKey: ["vendedores"],
    queryFn: getVendedores,
  });

  // Query para buscar vendas
  const {
    data: vendas = [],
    isLoading: isLoadingVendas,
    isError: isErrorVendas,
    error: errorVendas,
  } = useQuery({
    queryKey: ["vendas"],
    queryFn: fetchSales,
  });

  // Query para buscar comissões com filtros
  const {
    data: comissoes = [],
    isLoading: isLoadingComissoes,
    isError: isErrorComissoes,
    error: errorComissoes,
    refetch: refetchComissoes,
  } = useQuery({
    queryKey: [
      "comissoes",
      {
        vendedor_id: vendedorId,
        mes: dataInicio ? dataInicio.getMonth() + 1 : undefined,
        ano: dataInicio ? dataInicio.getFullYear() : undefined,
      },
    ],
    queryFn: () => {
      const mes = dataInicio ? dataInicio.getMonth() + 1 : undefined;
      const ano = dataInicio ? dataInicio.getFullYear() : undefined;
      return getComissoes({
        vendedor_id: vendedorId || undefined,
        mes: mes,
        ano: ano,
      });
    },
  });

  // Combinar dados de comissões, vendedores e vendas
  const comissoesCompletas = useMemo(() => {
    return comissoes.map((comissao) => {
      const vendedor = vendedores.find((v) => v.id === comissao.vendedor_id);
      const venda = vendas.find((v) => v.id === comissao.venda_id);

      return {
        ...comissao,
        vendedor_nome: vendedor ? vendedor.nome : "Vendedor não encontrado",
        venda_data: venda ? venda.data_venda : null,
        venda_valor: venda ? venda.valor_total : null,
      };
    });
  }, [comissoes, vendedores, vendas]);

  // Filtrar por busca textual (no nome do vendedor)
  const comissoesFiltradas = useMemo(() => {
    if (!busca) return comissoesCompletas;
    
    const termoBusca = busca.toLowerCase();
    return comissoesCompletas.filter(comissao => 
      comissao.vendedor_nome.toLowerCase().includes(termoBusca)
    );
  }, [comissoesCompletas, busca]);

  // Calcular total de comissões filtradas
  const totalComissoes = useMemo(() => {
    return comissoesFiltradas.reduce(
      (acc, comissao) => acc + (comissao.valor_calculado || 0),
      0
    );
  }, [comissoesFiltradas]);

  // Limpar filtros
  const limparFiltros = () => {
    setVendedorId("");
    setDataInicio(undefined);
    setDataFim(undefined);
    setBusca("");
  };

  // Status de carregamento
  const isLoading = isLoadingVendedores || isLoadingVendas || isLoadingComissoes;

  // Verificar erros
  const isError = isErrorVendedores || isErrorVendas || isErrorComissoes;
  const errorMessage = isErrorVendedores
    ? errorVendedores instanceof Error
      ? errorVendedores.message
      : "Erro ao carregar vendedores"
    : isErrorVendas
    ? errorVendas instanceof Error
      ? errorVendas.message
      : "Erro ao carregar vendas"
    : isErrorComissoes
    ? errorComissoes instanceof Error
      ? errorComissoes.message
      : "Erro ao carregar comissões"
    : "";

  // Renderizar erro
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Helmet>
          <title>Relatório de Comissões | Gestor Brechó</title>
        </Helmet>
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative">
          <strong className="font-bold">Erro!</strong>
          <span className="block sm:inline">
            {" "}
            Não foi possível carregar os dados necessários.
          </span>
          <p className="text-sm mt-2">{errorMessage}</p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => refetchComissoes()}
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Relatório de Comissões | Gestor Brechó</title>
      </Helmet>

      {/* Modal para dar baixa na comissão */}
      {comissaoSelecionada && categoriaComissaoId && (
        <DarBaixaComissaoDialog
          open={modalDarBaixaAberto}
          onOpenChange={setModalDarBaixaAberto}
          comissaoId={comissaoSelecionada.id}
          comissaoValor={comissaoSelecionada.valor}
          vendedorNome={comissaoSelecionada.vendedorNome}
          categoriaId={categoriaComissaoId}
          onSuccess={handleBaixaSuccess}
        />
      )}

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
          <CalendarIcon className="hidden" /> {/* Apenas para manter import, pode remover se não usar */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Button>
        {/* Bloco Título/Subtítulo Centralizado */}
        <div className="flex-grow text-center px-4"> 
          <h1 className="text-3xl font-bold font-serif text-[#92400e]">
            Relatório de Comissões
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize as comissões geradas e pagas.
          </p>
        </div>
        {/* Espaço reservado para manter a centralização */}
        <div className="w-[40px] flex-shrink-0"></div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
          <CardDescription>
            Refine os resultados por vendedor, período ou use a busca.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Filtro por Vendedor */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Vendedor</label>
              <Select
                value={vendedorId}
                onValueChange={setVendedorId}
                disabled={isLoadingVendedores}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os vendedores" />
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

            {/* Filtro de Data Inicial */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Inicial</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio ? (
                      format(dataInicio, "PPP", { locale: ptBR })
                    ) : (
                      <span>Escolha uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={setDataInicio}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Filtro de Data Final */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Final</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataFim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? (
                      format(dataFim, "PPP", { locale: ptBR })
                    ) : (
                      <span>Escolha uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataFim}
                    onSelect={setDataFim}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Busca por texto */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Busca</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome do vendedor"
                  className="pl-8"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t px-6 py-4">
          <Button variant="outline" onClick={limparFiltros}>
            Limpar Filtros
          </Button>
        </CardFooter>
      </Card>

      {/* Resumo de Comissões */}
      <div className="mb-4">
        <Badge variant="outline" className="text-base px-4 py-2 border-[#92400e]">
          <span className="font-semibold">Total de Comissões:</span>{" "}
          <span className="ml-2">{formatCurrency(totalComissoes)}</span>
        </Badge>
      </div>

      {/* Tabela de Comissões */}
      <Card>
        <CardHeader>
          <CardTitle>Comissões Calculadas</CardTitle>
          <CardDescription>
            Detalhes das comissões calculadas para vendedores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#a16207]" />
              <span className="ml-2 text-lg text-muted-foreground">
                Carregando dados...
              </span>
            </div>
          ) : comissoesFiltradas.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Data da Venda</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>ID da Venda</TableHead>
                    <TableHead className="text-right">Valor da Venda</TableHead>
                    <TableHead className="text-right">Valor da Comissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Pagamento</TableHead>
                    <TableHead className="text-center w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comissoesFiltradas.map((comissao) => (
                    <TableRow key={comissao.id}>
                      <TableCell className="font-medium">
                        {comissao.venda_data
                          ? formatDate(new Date(comissao.venda_data))
                          : "N/A"}
                      </TableCell>
                      <TableCell>{comissao.vendedor_nome}</TableCell>
                      <TableCell>
                        {comissao.venda_id ? (
                          <Button 
                            variant="link" 
                            className="p-0 h-auto text-blue-600 hover:underline"
                            onClick={() => navigate(`/app/vendas/${comissao.venda_id}`)}
                          >
                            {comissao.venda_id.substring(0, 8)}...
                          </Button>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {comissao.venda_valor !== null
                          ? formatCurrency(comissao.venda_valor)
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(comissao.valor_calculado || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(comissao.status)} className={cn(
                          comissao.status === 'pendente' && 'border-yellow-500 text-yellow-700 bg-yellow-50',
                          comissao.status === 'aprovada' && 'border-blue-500 text-blue-700 bg-blue-50',
                          comissao.status === 'paga' && 'border-green-500 text-green-700 bg-green-50',
                          comissao.status === 'estornada' && 'border-red-500 text-red-700 bg-red-50'
                        )}>
                          {comissao.status ? comissao.status.charAt(0).toUpperCase() + comissao.status.slice(1) : "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {comissao.data_pagamento 
                          ? formatDate(new Date(comissao.data_pagamento)) 
                          : '---'}
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigate(`/app/vendas/${comissao.venda_id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalhes da Venda
                            </DropdownMenuItem>
                            {(comissao.status === 'pendente' || comissao.status === 'aprovada') && categoriaComissaoId && (
                              <DropdownMenuItem onClick={() => handleAbrirModalDarBaixa(comissao)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Dar Baixa
                              </DropdownMenuItem>
                            )}
                            {/* Adicionar outras ações aqui no futuro, como "Estornar" */}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-medium">Total Comissões</TableCell><TableCell className="text-right font-semibold text-primary">
                      {formatCurrency(totalComissoes)}
                    </TableCell><TableCell colSpan={3}></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Nenhuma comissão encontrada
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Tente ajustar os filtros ou verificar se existem comissões cadastradas.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <p className="text-xs text-muted-foreground">
            Os valores exibidos correspondem às comissões calculadas conforme as regras aplicadas.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 