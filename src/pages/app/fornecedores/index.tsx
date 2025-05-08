import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, FilterIcon } from "lucide-react";

import { columns } from "@/components/fornecedores/columns";
import { FornecedoresDataTable } from "@/components/fornecedores/FornecedoresDataTable";
import { Button } from "@/components/ui/button";
import { deleteFornecedor, getFornecedores, getEstadosFornecedores } from "@/services/fornecedorService";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function FornecedoresPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Estados para paginação e filtros
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEstado, setSelectedEstado] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  
  // Estado para exclusão
  const [fornecedorToDelete, setFornecedorToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Query para buscar fornecedores
  const { 
    data: fornecedoresData,
    isLoading,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ["fornecedores", { page: pageIndex, pageSize, searchTerm, estado: selectedEstado }],
    queryFn: () => getFornecedores({ 
      page: pageIndex,
      pageSize,
      searchTerm,
      estado: selectedEstado || undefined
    }),
    staleTime: 1000 * 60 * 3, // 3 minutos
    keepPreviousData: true
  });
  
  // Query para buscar estados para filtro
  const { data: estados = [] } = useQuery({
    queryKey: ["estados-fornecedores"],
    queryFn: getEstadosFornecedores,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
  
  // Mutation para excluir fornecedor
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFornecedor(id),
    onSuccess: () => {
      toast.success("Fornecedor excluído com sucesso");
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      setIsDeleteDialogOpen(false);
      setFornecedorToDelete(null);
    },
    onError: (error) => {
      console.error("Erro ao excluir fornecedor:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Erro ao excluir fornecedor"
      );
      setIsDeleteDialogOpen(false);
    }
  });
  
  // Ouvir evento de exclusão disparado pelo menu de contexto na linha da tabela
  useEffect(() => {
    const handleDeleteEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.id) {
        setFornecedorToDelete(customEvent.detail.id);
        setIsDeleteDialogOpen(true);
      }
    };
    
    document.addEventListener('delete-fornecedor', handleDeleteEvent);
    return () => {
      document.removeEventListener('delete-fornecedor', handleDeleteEvent);
    };
  }, []);
  
  // Handler para mudança na paginação
  const handlePaginationChange = (newPageIndex: number, newPageSize: number) => {
    setPageIndex(newPageIndex);
    setPageSize(newPageSize);
  };
  
  // Handler para busca
  const handleSearch = () => {
    setIsSearching(true);
    setPageIndex(1); // Volta para a primeira página
    refetch().finally(() => setIsSearching(false));
  };
  
  // Handler para limpar filtros
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedEstado("");
    setPageIndex(1);
  };
  
  // Handler para adicionar novo fornecedor
  const handleAddFornecedor = () => {
    navigate("/app/fornecedores/novo");
  };
  
  // Handler para confirmar exclusão
  const handleConfirmDelete = () => {
    if (fornecedorToDelete) {
      deleteMutation.mutate(fornecedorToDelete);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col items-center justify-center mb-6 pb-4 border-b w-full">
        <h2 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">Fornecedores</h2>
        <p className="text-muted-foreground mt-1 mb-4">
          Gerencie os fornecedores de produtos para o seu brechó.
        </p>
        
        <div className="flex items-center gap-2">
          {/* Botão de filtros em telas menores */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 lg:hidden">
                <FilterIcon className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtrar fornecedores</SheetTitle>
              </SheetHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="mobile-search" className="text-sm font-medium">
                    Buscar
                  </label>
                  <Input
                    id="mobile-search"
                    placeholder="Nome, CNPJ/CPF, Contato..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {estados.length > 0 && (
                  <div className="space-y-2">
                    <label htmlFor="mobile-estado" className="text-sm font-medium">
                      Estado (UF)
                    </label>
                    <Select
                      value={selectedEstado}
                      onValueChange={setSelectedEstado}
                    >
                      <SelectTrigger id="mobile-estado">
                        <SelectValue placeholder="Todos os estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos os estados</SelectItem>
                        {estados.map((estado) => (
                          <SelectItem key={estado} value={estado}>
                            {estado}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="flex justify-between pt-4">
                  <Button 
                    variant="outline" 
                    onClick={handleClearFilters}
                  >
                    Limpar
                  </Button>
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? "Buscando..." : "Aplicar filtros"}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Botão de adicionar */}
          <Button onClick={handleAddFornecedor} className="bg-[#a16207] hover:bg-[#854d0e] text-white gap-2">
            <Plus className="h-4 w-4 mr-2" />
            Novo Fornecedor
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Fornecedores Cadastrados</CardTitle>
          <CardDescription>
            Visualize, filtre e gerencie todos os seus fornecedores. Aqui você pode adicionar novos fornecedores, editar existentes ou excluir registros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FornecedoresDataTable
            data={fornecedoresData?.data || []}
            columns={columns}
            pageCount={fornecedoresData?.totalPages || 1}
            pageIndex={pageIndex}
            pageSize={pageSize}
            isLoading={isLoading || isRefetching}
            onPaginationChange={handlePaginationChange}
            estados={estados}
          />
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <p className="text-xs text-muted-foreground">
            Registro de fornecedores. Utilize a tabela acima para gerenciar seus fornecedores.
            Ao excluir um fornecedor, todos os dados relacionados a ele serão mantidos, mas a associação será removida.
          </p>
        </CardFooter>
      </Card>
      
      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fornecedor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.
              {deleteMutation.isError && (
                <p className="mt-2 text-destructive">
                  {deleteMutation.error instanceof Error 
                    ? deleteMutation.error.message 
                    : "Erro ao excluir fornecedor"}
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isLoading ? "Excluindo..." : "Excluir fornecedor"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 