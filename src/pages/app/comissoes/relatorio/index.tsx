import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Helmet } from "react-helmet-async";
import { Calendar as CalendarIcon, Loader2, Search, FileText, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getComissoes } from "@/services/comissaoService";
import { getVendedores } from "@/services/vendedorService";
import { fetchSales } from "@/services/saleService";

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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate, formatCurrency, cn } from "@/lib/utils";

export default function RelatorioComissoesPage() {
  // Estados para filtros
  const [vendedorId, setVendedorId] = useState<string>("");
  const [dataInicio, setDataInicio] = useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = useState<Date | undefined>(undefined);
  const [busca, setBusca] = useState<string>("");
  const navigate = useNavigate();

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
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Data da Venda</TableHead>
                    <TableHead>Valor da Venda</TableHead>
                    <TableHead>Valor da Comissão</TableHead>
                    <TableHead>Data do Cálculo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comissoesFiltradas.map((comissao) => (
                    <TableRow key={comissao.id}>
                      <TableCell className="font-medium">
                        {comissao.vendedor_nome}
                      </TableCell>
                      <TableCell>
                        {comissao.venda_data
                          ? formatDate(new Date(comissao.venda_data))
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {comissao.venda_valor
                          ? formatCurrency(comissao.venda_valor)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(comissao.valor_calculado)}
                      </TableCell>
                      <TableCell>
                        {formatDate(new Date(comissao.data_calculo))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3}>Total</TableCell>
                    <TableCell className="font-medium text-primary">
                      {formatCurrency(totalComissoes)}
                    </TableCell>
                    <TableCell></TableCell>
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