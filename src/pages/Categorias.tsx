import React, { useState, useMemo } from 'react';
// Importa useQuery para buscar dados
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// Importa useNavigate para navegação
import { useNavigate } from 'react-router-dom';
// Importa componentes da UI ( Shadcn/UI )
import { Button } from '@/components/ui/button';
// Importações para DataTable personalizado
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// Fim das importações para DataTable personalizado
import { DataTable } from '@/components/ui/data-table'; // Original, mas não será usado
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, PlusCircle, ChevronDown } from 'lucide-react'; // Ícones
import { Categoria, CategoriaTipo, categoriaTipos } from '@/lib/types/categoria';
import { getCategorias, deleteCategoria } from '@/services/categoriaService';
// Importa componentes para Dropdown (ações)
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge'; // Para exibir o tipo visualmente
import { toast } from 'sonner'; // Para feedback ao usuário
import LoadingSpinner from '@/components/ui/loading-spinner'; // Componente de loading (assumindo existência)
import ErrorDisplay from '@/components/ui/error-display'; // Componente de erro (assumindo existência)
// Importa componentes do AlertDialog
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  // AlertDialogTrigger, // Não usaremos trigger direto, abriremos programaticamente
} from "@/components/ui/alert-dialog";
import { handleSupabaseError } from '@/lib/utils/supabase-error-handler';
// Importa Select para o filtro
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label'; // Para o label do Select
import { useSelectionState } from '@/hooks/useSelectionState'; // Importar hook
import { Checkbox } from "@/components/ui/checkbox"; // Importação do Checkbox

// Função para capitalizar a primeira letra (usado para Tipos)
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// --- Definição das Colunas --- 
// Adaptado para receber props de seleção do hook
interface CategoriaColumnsProps {
  onOpenDeleteDialog: (categoria: Categoria) => void;
  // Props de seleção
  selectedItems: Set<string>;
  onSelectAll: (checked: boolean | 'indeterminate') => void;
  onSelectSingle: (itemId: string, checked: boolean | 'indeterminate') => void;
  selectAllState: boolean | 'indeterminate';
}

const getColumns = ({
  onOpenDeleteDialog,
  // Desestruturar props de seleção
  selectedItems,
  onSelectAll,
  onSelectSingle,
  selectAllState
}: CategoriaColumnsProps): ColumnDef<Categoria>[] => [
  // Coluna de Checkbox
  {
    id: 'select',
    header: () => (
      <Checkbox
        checked={selectAllState}
        onCheckedChange={onSelectAll}
        aria-label="Selecionar todas as categorias"
        className="border-stone-400"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={selectedItems.has(row.original.id)}
        onCheckedChange={(checked) => onSelectSingle(row.original.id, checked)}
        aria-label={`Selecionar categoria ${row.original.nome}`}
        className="border-stone-400"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "nome",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-amber-100 -ml-4" // Ajuste de margem se necessário
        >
          Nome
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("nome")}</div>,
  },
  {
    accessorKey: "tipo",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-amber-100 -ml-4"
          >
            Tipo
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    cell: ({ row }) => {
        const tipo = row.getValue("tipo") as CategoriaTipo;
        const cor = row.original.cor;
        return (
            <Badge variant="outline" className="flex items-center gap-2">
                {cor && (
                    <span 
                      className="inline-block w-2.5 h-2.5 rounded-full border"
                      style={{ backgroundColor: cor }}
                      title={`Cor definida: ${cor}`}
                    ></span>
                )}
                <span>{capitalize(tipo)}</span>
            </Badge>
        );
    },
    filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
  },
  {
    accessorKey: "cor",
    header: "Cor",
    cell: ({ row }) => {
      const cor = row.getValue("cor") as string | null;
      return cor ? (
        <div className="w-4 h-4 rounded border" style={{ backgroundColor: cor }}></div> 
      ) : (
        <span className="text-muted-foreground">N/A</span>
      );
    },
  },
   {
    accessorKey: "descricao",
    header: "Descrição",
    cell: ({ row }) => {
      const descricao = row.getValue("descricao") as string | null;
      const truncatedDesc = descricao ? (descricao.length > 50 ? descricao.substring(0, 47) + '...' : descricao) : '-';
      return <span className="text-sm text-muted-foreground">{truncatedDesc}</span>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Ações</div>,
    cell: ({ row }) => {
      const categoria = row.original;
      const navigate = useNavigate();

      return (
        <div className="flex justify-end space-x-1">
           <Button 
            variant="ghost" 
            size="icon" 
            title="Editar"
            onClick={() => navigate(`/app/categorias/${categoria.id}/editar`)}
          >
            <Pencil className="h-4 w-4 text-orange-500" />
          </Button>
          {/* Botão de exclusão única agora chama a função passada por props */}
          <Button 
            variant="ghost" 
            size="icon" 
            title="Excluir"
            onClick={() => onOpenDeleteDialog(categoria)} // Chama a função do componente pai
            className="text-red-600 hover:text-red-700 hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" /> 
          </Button>
        </div>
      );
    },
  },
];

// Componente DataTable customizado para a página de Categorias
const CustomDataTable = <TData, TValue>({
  columns,
  data,
  selectedItems,
  totalItems,
  onResetSelection,
  onOpenDeleteDialog,
  isDeletePending
}: {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  selectedItems: Set<string>
  totalItems: number
  onResetSelection: () => void
  onOpenDeleteDialog?: () => void
  isDeletePending?: boolean
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });

  return (
    <div>
      {/* Botão para Visibilidade de Colunas */}
      <div className="flex items-center justify-end py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Colunas <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {typeof column.columnDef.header === 'string'
                      ? column.columnDef.header
                      : column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabela Principal */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="text-[#92400e] font-semibold border-b bg-[#fef3c7]"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer personalizado com contagem correta e botões de paginação */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            {selectedItems.size} de {totalItems}
            {totalItems === 1 ? " categoria" : " categorias"}
            {selectedItems.size === 1 ? " selecionada" : " selecionadas"}
          </div>
          
          {selectedItems.size > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetSelection}
                className="text-xs h-7 px-3 ml-2"
              >
                Limpar seleção
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onOpenDeleteDialog && onOpenDeleteDialog()}
                className="ml-2 gap-2"
                disabled={isDeletePending}
              >
                <Trash2 className="h-4 w-4" />
                {isDeletePending ? 'Excluindo...' : `Excluir (${selectedItems.size})`}
              </Button>
            </>
          )}
        </div>

        {/* Botões de Paginação */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- Componente Principal --- 
const Categorias = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState<Categoria | null>(null);
  const [tipoFiltro, setTipoFiltro] = useState<CategoriaTipo | 'todos'>('todos');

  const { data: categorias = [], isLoading, isError, error } = useQuery<Categoria[]>({
    queryKey: ['categorias'],
    queryFn: () => getCategorias(undefined, true), 
  });

  // Usar o hook de seleção
  const {
    selectedItems: selectedCategorias, // Renomear
    handleSelectAll,
    handleSelectSingle,
    selectAllState,
    resetSelection
  } = useSelectionState(categorias);

  // Mutação para excluir (usada internamente)
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategoria(id),
    // onSuccess e onError tratados em handleConfirmDelete
    onError: (error) => {
      console.error("Erro interno ao tentar excluir categoria:", error);
    }
  });

  // Função para abrir o diálogo de confirmação (adaptada)
  const handleOpenDeleteDialog = (categoria?: Categoria) => {
    if (categoria) {
      setCategoriaParaExcluir(categoria); // Modo único
      resetSelection(); // Limpa seleção múltipla
    } else {
      setCategoriaParaExcluir(null); // Modo múltiplo
    }
    setIsAlertDialogOpen(true);
  };

  // Função para confirmar a exclusão (adaptada para bulk)
  const handleConfirmDelete = async () => {
    const isMultiple = selectedCategorias.size > 0 && !categoriaParaExcluir;
    const idsToDelete = isMultiple ? Array.from(selectedCategorias) : (categoriaParaExcluir ? [categoriaParaExcluir.id] : []);

    if (idsToDelete.length === 0) return;

    const results = await Promise.allSettled(idsToDelete.map(id => deleteMutation.mutateAsync(id)));

    const successfulDeletes = results.filter(result => result.status === 'fulfilled').length;
    const failedDeletes = results.filter(result => result.status === 'rejected');

    if (successfulDeletes > 0) {
      toast.success(`${successfulDeletes} categoria${successfulDeletes > 1 ? 's' : ''} excluída${successfulDeletes > 1 ? 's' : ''} com sucesso.`);
    }
    if (failedDeletes.length > 0) {
      const errorMessage = handleSupabaseError(failedDeletes[0].status === 'rejected' ? failedDeletes[0].reason : new Error("Erro desconhecido"), "Erro ao excluir categoria(s)");
      toast.error(errorMessage || `Falha ao excluir ${failedDeletes.length} categoria${failedDeletes.length > 1 ? 's' : ''}.`);
    }

    setIsAlertDialogOpen(false);
    setCategoriaParaExcluir(null);
    resetSelection();
    queryClient.invalidateQueries({ queryKey: ['categorias'] });
  };

  // Gera as colunas passando a função e as props de seleção
  const tableColumns = getColumns({ 
      onOpenDeleteDialog: handleOpenDeleteDialog, // Passa a função para abrir o diálogo
      selectedItems: selectedCategorias, 
      onSelectAll: handleSelectAll, 
      onSelectSingle: handleSelectSingle, 
      selectAllState: selectAllState 
  });

  const filteredCategorias = useMemo(() => {
    if (!categorias) return [];
    if (tipoFiltro === 'todos') {
      return categorias;
    }
    return categorias.filter(cat => cat.tipo === tipoFiltro);
  }, [categorias, tipoFiltro]);

  if (isLoading) {
    return <LoadingSpinner />; 
  }
  if (isError) {
    return <ErrorDisplay error={error as Error} />; // Cast para Error se necessário
  }

  return (
    <div className="container mx-auto py-8">
      {/* Cabeçalho centralizado com botões abaixo */}
      <div className="flex flex-col items-center justify-center mb-6 pb-4 border-b w-full">
        <h2 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">Categorias</h2>
        <p className="text-muted-foreground mt-1 mb-4">
          Gerencie as categorias de produtos do seu brechó.
        </p>
        
        {/* Filtros abaixo do título, já centralizados */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="filtro-tipo" className="mr-1">Filtrar por tipo:</Label>
            <Select
              value={tipoFiltro || ""}
              onValueChange={setTipoFiltro}
            >
              <SelectTrigger className="w-[180px]" id="filtro-tipo">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {categoriaTipos.map(tipo => (
                  <SelectItem key={tipo} value={tipo}>{capitalize(tipo)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {tipoFiltro !== 'todos' && (
            <Button 
              variant="ghost" 
              onClick={() => setTipoFiltro("todos")}
              className="h-8 px-2 text-xs"
            >
              Limpar filtro
            </Button>
          )}
          
          {/* Botão Nova Categoria ao lado do filtro */}
          <Button 
            onClick={() => navigate('/app/categorias/nova')} 
            className="bg-[#a16207] hover:bg-[#854d0e] text-white gap-2 ml-4"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        </div>
      </div>
      
      {categorias && (
        <CustomDataTable
          columns={tableColumns}
          data={filteredCategorias}
          selectedItems={selectedCategorias}
          totalItems={filteredCategorias.length}
          onResetSelection={resetSelection}
          onOpenDeleteDialog={() => handleOpenDeleteDialog()}
          isDeletePending={deleteMutation.isPending}
        />
      )}

      {/* AlertDialog para Confirmação de Exclusão (Adaptado) */}
      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
               {/* Título dinâmico */}
               {categoriaParaExcluir ? 'Confirmar Exclusão' : `Confirmar Exclusão (${selectedCategorias.size})`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {/* Descrição dinâmica */}
              {categoriaParaExcluir
                ? `Tem certeza que deseja excluir a categoria "${categoriaParaExcluir.nome}"? Esta ação marcará a categoria como inativa.`
                : `Tem certeza que deseja excluir as ${selectedCategorias.size} categorias selecionadas? Esta ação marcará as categorias como inativas.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoriaParaExcluir(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              disabled={deleteMutation.isPending} 
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Categorias;
