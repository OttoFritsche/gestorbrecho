import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

import { getVendedores, deleteVendedor, Vendedor } from "@/services/vendedorService";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardFooter, 
  CardHeader, 
  CardTitle 
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDate } from "@/lib/utils";

export default function VendedoresPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Estado para exclusão
  const [vendedorToDelete, setVendedorToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Query para buscar vendedores
  const { 
    data: vendedores,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ["vendedores"],
    queryFn: getVendedores,
    retry: 1, // Limita o número de tentativas automáticas
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
  
  // Mutation para excluir vendedor
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVendedor(id),
    onSuccess: () => {
      toast.success("Vendedor excluído com sucesso");
      queryClient.invalidateQueries({ queryKey: ["vendedores"] });
      setIsDeleteDialogOpen(false);
      setVendedorToDelete(null);
    },
    onError: (error) => {
      console.error("Erro ao excluir vendedor:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Erro ao excluir vendedor"
      );
      setIsDeleteDialogOpen(false);
    }
  });

  // Handler para adicionar vendedor
  const handleAddVendedor = () => {
    navigate("/app/vendedores/novo");
  };

  // Handler para editar vendedor
  const handleEditVendedor = (id: string) => {
    navigate(`/app/vendedores/${id}/editar`);
  };

  // Handler para confirmar exclusão
  const handleDeleteVendedor = (id: string) => {
    setVendedorToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Handler para confirmar exclusão
  const confirmDelete = () => {
    if (vendedorToDelete) {
      deleteMutation.mutate(vendedorToDelete);
    }
  };

  // Renderiza mensagem de erro
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Helmet>
          <title>Vendedores | Gestor Brechó</title>
        </Helmet>
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative">
          <strong className="font-bold">Erro!</strong>
          <span className="block sm:inline"> Não foi possível carregar os vendedores.</span>
          <p className="text-sm mt-2">
            {error instanceof Error ? error.message : "Erro desconhecido"}
          </p>
          <Button 
            variant="outline" 
            className="mt-2" 
            onClick={() => refetch()}
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
        <title>Vendedores | Gestor Brechó</title>
      </Helmet>
      
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">Vendedores</h1>
          <p className="text-muted-foreground">
            Gerencie os vendedores da sua loja
          </p>
        </div>
        
        {/* Botão de adicionar */}
        <Button onClick={handleAddVendedor} className="bg-[#a16207] hover:bg-[#854d0e] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Novo Vendedor
        </Button>
      </div>
      
      {/* Conteúdo principal */}
      <Card>
        <CardHeader>
          <CardTitle>Vendedores Cadastrados</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os seus vendedores. Aqui você pode adicionar novos vendedores, editar existentes ou excluir registros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#a16207]" />
              <span className="ml-2 text-lg text-muted-foreground">Carregando vendedores...</span>
            </div>
          ) : vendedores && vendedores.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Data de Contratação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendedores.map((vendedor) => (
                  <TableRow key={vendedor.id}>
                    <TableCell className="font-medium">{vendedor.nome}</TableCell>
                    <TableCell>{vendedor.email || '-'}</TableCell>
                    <TableCell>{vendedor.telefone || '-'}</TableCell>
                    <TableCell>
                      {vendedor.data_contratacao 
                        ? formatDate(new Date(vendedor.data_contratacao)) 
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditVendedor(vendedor.id)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteVendedor(vendedor.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum vendedor cadastrado.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleAddVendedor}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Vendedor
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <p className="text-xs text-muted-foreground">
            Cadastre seus vendedores para vinculá-los às vendas realizadas no sistema e acompanhar suas performances.
          </p>
        </CardFooter>
      </Card>
      
      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O vendedor será excluído permanentemente do sistema.
              As vendas associadas a este vendedor serão mantidas, mas o vínculo com o vendedor será removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Sim, excluir vendedor"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 