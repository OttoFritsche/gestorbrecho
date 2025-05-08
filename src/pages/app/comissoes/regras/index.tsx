import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { Plus, Pencil, Trash2, Loader2, ListChecks } from "lucide-react";

import { getRegrasComissao, deleteRegraComissao, RegraComissao } from "@/services/regrasComissaoService";
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
import { formatDate, formatCurrency } from "@/lib/utils"; // Usar formatDate

export default function RegrasComissaoPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Estado para confirmação de exclusão
  const [ruleToDeleteId, setRuleToDeleteId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Query para buscar as regras de comissão
  const { 
    data: regras = [], 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery<RegraComissao[], Error>({
    queryKey: ["regrasComissao"],
    queryFn: getRegrasComissao,
  });

  // Mutation para excluir regra
  const deleteMutation = useMutation({
    mutationFn: deleteRegraComissao,
    onSuccess: () => {
      toast.success("Regra de comissão excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["regrasComissao"] });
      setIsDeleteDialogOpen(false);
      setRuleToDeleteId(null);
    },
    onError: (err) => {
      console.error("Erro ao excluir regra de comissão:", err);
      toast.error(
        err instanceof Error ? err.message : "Erro desconhecido ao excluir a regra."
      );
      setIsDeleteDialogOpen(false);
    },
  });

  // Handlers
  const handleAddRule = () => {
    navigate("/app/comissoes/regras/novo"); // Ajuste a rota conforme necessário
  };

  const handleEditRule = (id: string) => {
    navigate(`/app/comissoes/regras/${id}/editar`); // Ajuste a rota conforme necessário
  };

  const handleDeleteRule = (id: string) => {
    setRuleToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (ruleToDeleteId) {
      deleteMutation.mutate(ruleToDeleteId);
    }
  };

  // Formata o tipo de cálculo para exibição
  const formatTipoCalculo = (tipo: string) => {
    switch (tipo) {
      case 'porcentagem': return 'Porcentagem (%)';
      case 'valor_fixo': return 'Valor Fixo (R$)';
      case 'por_item': return 'Por Item (R$)';
      case 'por_categoria': return 'Por Categoria (R$ ou %)'; // Ajustar conforme lógica
      default: return tipo;
    }
  };
  
  // Formata o valor baseado no tipo
  const formatValor = (valor: number, tipo: string) => {
      if (tipo === 'porcentagem') {
          return `${valor.toFixed(2)}%`; // Assumindo que valor já é a porcentagem (ex: 5 para 5%)
      }
      return formatCurrency(valor); // Para valor_fixo, por_item, etc.
  };

  // Formata período de vigência
  const formatVigencia = (inicio: string | null, fim: string | null) => {
    if (!inicio && !fim) return '-';
    const dataInicio = inicio ? formatDate(new Date(inicio)) : 'Início indefinido';
    const dataFim = fim ? formatDate(new Date(fim)) : 'Fim indefinido';
    return `${dataInicio} - ${dataFim}`;
  };

  // --- Renderização ---
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Helmet>
          <title>Regras de Comissão | Gestor Brechó</title>
        </Helmet>
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative">
          <strong className="font-bold">Erro!</strong>
          <span className="block sm:inline"> Não foi possível carregar as regras de comissão.</span>
          <p className="text-sm mt-2">
            {error instanceof Error ? error.message : "Erro desconhecido"}
          </p>
          <Button variant="outline" className="mt-2" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Regras de Comissão | Gestor Brechó</title>
      </Helmet>

      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">Regras de Comissão</h1>
          <p className="text-muted-foreground">
            Defina e gerencie as regras para cálculo de comissões dos vendedores.
          </p>
        </div>
        <Button onClick={handleAddRule} className="bg-[#a16207] hover:bg-[#854d0e] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nova Regra
        </Button>
      </div>

      {/* Conteúdo Principal */}
      <Card>
        <CardHeader>
          <CardTitle>Regras Cadastradas</CardTitle>
          <CardDescription>
            Visualize, edite ou exclua as regras de comissão existentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#a16207]" />
              <span className="ml-2 text-lg text-muted-foreground">Carregando regras...</span>
            </div>
          ) : regras && regras.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor/Taxa</TableHead>
                  <TableHead>Vigência</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regras.map((regra) => (
                  <TableRow key={regra.id}>
                    <TableCell className="font-medium">{regra.nome}</TableCell>
                    <TableCell>{formatTipoCalculo(regra.tipo_calculo)}</TableCell>
                    <TableCell>{formatValor(regra.valor, regra.tipo_calculo)}</TableCell>
                    <TableCell>{formatVigencia(regra.periodo_vigencia_inicio, regra.periodo_vigencia_fim)}</TableCell>
                    <TableCell>
                      <Badge variant={regra.ativa ? "default" : "destructive"} className={regra.ativa ? "bg-green-600" : ""}>
                        {regra.ativa ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditRule(regra.id)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteRule(regra.id)}
                          title="Excluir"
                          disabled={deleteMutation.isPending && ruleToDeleteId === regra.id}
                        >
                           {deleteMutation.isPending && ruleToDeleteId === regra.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <ListChecks className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma regra de comissão cadastrada</h3>
              <p className="mt-1 text-sm text-gray-500">Comece cadastrando sua primeira regra.</p>
              <div className="mt-6">
                 <Button
                    variant="outline"
                    onClick={handleAddRule}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Regra
                  </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <p className="text-xs text-muted-foreground">
            As regras ativas e dentro do período de vigência serão usadas para calcular comissões nas vendas.
          </p>
        </CardFooter>
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta regra de comissão?
              As comissões já calculadas com esta regra perderão a referência a ela (serão mantidas, mas sem link para a regra excluída).
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
                "Sim, Excluir Regra"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 