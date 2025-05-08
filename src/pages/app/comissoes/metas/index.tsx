import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { Plus, Pencil, Trash2, Loader2, Target } from "lucide-react";

import { getMetasVenda, deleteMetaVenda } from "@/services/metaVendaService";
import { getVendedores } from "@/services/vendedorService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDate, formatCurrency } from "@/lib/utils";

// Interface para combinar dados do vendedor e meta
interface MetaVendaComVendedor {
  id: string;
  vendedor_id: string;
  nome_vendedor: string;
  periodo_inicio: string;
  periodo_fim: string;
  meta_valor: number | null;
  meta_quantidade: number | null;
  observacoes: string | null;
}

export default function MetasVendaPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Estado para confirmação de exclusão
  const [metaToDeleteId, setMetaToDeleteId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Query para buscar as metas de venda
  const {
    data: metas = [],
    isLoading: isLoadingMetas,
    isError: isErrorMetas,
    error: errorMetas,
    refetch: refetchMetas
  } = useQuery({
    queryKey: ["metasVenda"],
    queryFn: getMetasVenda,
  });

  // Query para buscar os vendedores
  const {
    data: vendedores = [],
    isLoading: isLoadingVendedores,
    isError: isErrorVendedores,
    error: errorVendedores
  } = useQuery({
    queryKey: ["vendedores"],
    queryFn: getVendedores,
  });

  // Mutation para excluir meta
  const deleteMutation = useMutation({
    mutationFn: deleteMetaVenda,
    onSuccess: () => {
      toast.success("Meta de venda excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["metasVenda"] });
      setIsDeleteDialogOpen(false);
      setMetaToDeleteId(null);
    },
    onError: (err) => {
      console.error("Erro ao excluir meta de venda:", err);
      toast.error(
        err instanceof Error ? err.message : "Erro desconhecido ao excluir a meta."
      );
      setIsDeleteDialogOpen(false);
    },
  });

  // Combine dados de metas e vendedores
  const metasComVendedor: MetaVendaComVendedor[] = metas.map(meta => {
    const vendedor = vendedores.find(v => v.id === meta.vendedor_id);
    return {
      ...meta,
      nome_vendedor: vendedor ? vendedor.nome : "Vendedor não encontrado"
    };
  });

  // Handlers
  const handleAddMeta = () => {
    navigate("/app/comissoes/metas/novo");
  };

  const handleEditMeta = (id: string) => {
    navigate(`/app/comissoes/metas/${id}/editar`);
  };

  const handleDeleteMeta = (id: string) => {
    setMetaToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (metaToDeleteId) {
      deleteMutation.mutate(metaToDeleteId);
    }
  };

  // Status de carregamento
  const isLoading = isLoadingMetas || isLoadingVendedores;
  
  // Estado de erro para qualquer uma das queries
  const isError = isErrorMetas || isErrorVendedores;
  const errorMessage = isErrorMetas 
    ? (errorMetas instanceof Error ? errorMetas.message : "Erro ao carregar metas de venda") 
    : (errorVendedores instanceof Error ? errorVendedores.message : "Erro ao carregar vendedores");

  // Exibe mensagem de erro se houver
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Helmet>
          <title>Metas de Venda | Gestor Brechó</title>
        </Helmet>
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative">
          <strong className="font-bold">Erro!</strong>
          <span className="block sm:inline"> Não foi possível carregar os dados necessários.</span>
          <p className="text-sm mt-2">{errorMessage}</p>
          <Button variant="outline" className="mt-2" onClick={() => refetchMetas()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Metas de Venda | Gestor Brechó</title>
      </Helmet>

      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">Metas de Venda</h1>
          <p className="text-muted-foreground">
            Defina e gerencie metas de venda para seus vendedores.
          </p>
        </div>
        <Button onClick={handleAddMeta} className="bg-[#a16207] hover:bg-[#854d0e] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      {/* Conteúdo Principal */}
      <Card>
        <CardHeader>
          <CardTitle>Metas Cadastradas</CardTitle>
          <CardDescription>
            Visualize, edite ou exclua as metas de venda existentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#a16207]" />
              <span className="ml-2 text-lg text-muted-foreground">Carregando dados...</span>
            </div>
          ) : metasComVendedor.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Meta de Valor</TableHead>
                  <TableHead>Meta de Quantidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metasComVendedor.map((meta) => {
                  // Calcular se é meta atual (período atual)
                  const hoje = new Date();
                  const dataInicio = new Date(meta.periodo_inicio);
                  const dataFim = new Date(meta.periodo_fim);
                  const isAtual = hoje >= dataInicio && hoje <= dataFim;
                  
                  return (
                    <TableRow key={meta.id}>
                      <TableCell className="font-medium">{meta.nome_vendedor}</TableCell>
                      <TableCell>
                        {formatDate(new Date(meta.periodo_inicio))} - {formatDate(new Date(meta.periodo_fim))}
                      </TableCell>
                      <TableCell>
                        {meta.meta_valor !== null ? formatCurrency(meta.meta_valor) : "-"}
                      </TableCell>
                      <TableCell>
                        {meta.meta_quantidade !== null ? meta.meta_quantidade : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isAtual ? "default" : "secondary"} className={isAtual ? "bg-green-600" : ""}>
                          {isAtual ? 'Atual' : 'Fora do período'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditMeta(meta.id)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteMeta(meta.id)}
                            title="Excluir"
                            disabled={deleteMutation.isPending && metaToDeleteId === meta.id}
                          >
                             {deleteMutation.isPending && metaToDeleteId === meta.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Target className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma meta de venda cadastrada</h3>
              <p className="mt-1 text-sm text-gray-500">Comece cadastrando sua primeira meta.</p>
              <div className="mt-6">
                 <Button
                    variant="outline"
                    onClick={handleAddMeta}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Meta
                  </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <p className="text-xs text-muted-foreground">
            As metas dentro do período atual são destacadas e consideradas ativas.
          </p>
        </CardFooter>
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta meta de venda?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Sim, Excluir Meta"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 