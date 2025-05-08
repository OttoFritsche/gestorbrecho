import React, { useState } from 'react';
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, Eye, AlertTriangle, CheckCircle2, Calendar, CalendarClock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Produto } from '@/lib/types/produto';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getStatusVariant } from './produtoUtils'; // Helper para cor do status
import { DataTable } from '@/components/ui/data-table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Definir interface das Props incluindo as de seleção
interface ProdutoDataTableProps {
  data: Produto[];
  onEdit: (produto: Produto) => void;
  onDelete: (produto: Produto) => void;
  onAction: (produto: Produto) => void;
  isLoading: boolean;
  // Props de seleção
  selectedItems: Set<string>;
  onSelectAll: (checked: boolean | 'indeterminate') => void;
  onSelectSingle: (itemId: string, checked: boolean | 'indeterminate') => void;
  selectAllState: boolean | 'indeterminate';
}

// Função getColumns agora aceita as props de seleção
const getColumns = ({
  onEdit,
  onDelete,
  onAction,
  selectedItems,
  onSelectAll,
  onSelectSingle,
  selectAllState
}: ProdutoDataTableProps): ColumnDef<Produto>[] => [
  // Coluna de Checkbox
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={selectAllState}
        onCheckedChange={onSelectAll}
        aria-label="Selecionar todas as linhas"
        className="border-stone-400"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={selectedItems.has(row.original.id)}
        onCheckedChange={(checked) => onSelectSingle(row.original.id, checked)}
        aria-label="Selecionar linha"
        className="border-stone-400"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "codigo_barras",
    header: "Cód. Barras",
    cell: ({ row }) => row.getValue("codigo_barras") || '-',
  },
  {
    accessorKey: "nome",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Nome
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("nome")}</div>,
  },
  {
    accessorKey: "categoria_id", // Usar categoria.nome se disponível no futuro
    header: "Categoria",
    cell: ({ row }) => row.original.categorias?.nome ?? 'Sem categoria',
  },
  {
    accessorKey: "quantidade",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Qtd.
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
        const qtd = row.getValue("quantidade") as number;
        const status = row.getValue("status") as string;
        const quantidadeReservada = row.original.quantidade_reservada || 0;
        const quantidadeDisponivel = qtd - quantidadeReservada;
        
        let badgeVariant: "default" | "destructive" | "secondary" | "outline" | "warning" | "success" = "secondary";
        let tooltipText = "";
        
        // Definir variante baseada na quantidade, status e reservas
        if (qtd <= 0) {
            badgeVariant = "destructive";
            tooltipText = "Sem estoque";
        } else if (quantidadeDisponivel <= 0 && quantidadeReservada > 0) {
            badgeVariant = "warning";
            tooltipText = `Todo o estoque está reservado (${quantidadeReservada} unid.)`;
        } else if (quantidadeReservada > 0) {
            badgeVariant = "warning";
            tooltipText = `${quantidadeReservada} unid. reservadas, ${quantidadeDisponivel} disponíveis`;
        } else if (qtd <= (row.original.quantidade_minima ?? 0)) {
            badgeVariant = "destructive";
            tooltipText = "Estoque crítico";
        } else if (qtd < (row.original.quantidade_minima ?? 0) * 1.5) {
            badgeVariant = "outline";
            tooltipText = "Estoque baixo";
        } else {
            badgeVariant = "success";
            tooltipText = "Estoque adequado";
        }
        
        // Mostrar informação adicional baseada no status
        if (status === 'inativo') {
            badgeVariant = "outline";
            tooltipText = `Produto inativo (Qtd: ${qtd})`;
        }
        
        // Texto claro sobre disponibilidade
        let displayText = "";
        if (quantidadeReservada > 0) {
            if (quantidadeDisponivel <= 0) {
                displayText = "0 disp.";
            } else {
                displayText = `${quantidadeDisponivel} disp.`;
            }
        } else {
            displayText = `${qtd} unid.`;
        }
        
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col gap-1">
                  <Badge variant={badgeVariant} className="whitespace-nowrap">
                    {displayText}
                  </Badge>
                  {quantidadeReservada > 0 && (
                    <Badge variant="outline" className="bg-amber-50 text-xs">
                      {quantidadeReservada} reserv.
                    </Badge>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltipText}</p>
                {quantidadeReservada > 0 && (
                  <p className="text-xs mt-1">
                    Total: {qtd} | Reservado: {quantidadeReservada} | Disponível: {quantidadeDisponivel}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
    },
  },
  {
    accessorKey: "preco_venda",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="justify-end w-full"
      >
        Preço Venda
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-right">{formatCurrency(row.getValue("preco_venda"))}</div>,
  },
  {
    accessorKey: "data_entrada",
    header: "Data Entrada",
    cell: ({ row }) => formatDate(row.getValue("data_entrada") as string),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const qtd = row.getValue("quantidade") as number;
      const quantidadeReservada = row.original.quantidade_reservada || 0;
      const quantidadeDisponivel = qtd - quantidadeReservada;
      const temReserva = quantidadeReservada > 0;
      
      let statusDisplay = "";
      let tooltipText = "";
      let badgeVariant = getStatusVariant(status);
      
      // Exibição simplificada e mais clara do status
      if (status === 'disponivel') {
        if (temReserva) {
          if (quantidadeDisponivel <= 0) {
            statusDisplay = 'Reservado';
            badgeVariant = 'warning';
          } else {
            statusDisplay = 'Parcial';
            badgeVariant = 'warning';
          }
        } else {
          statusDisplay = 'Disponível';
          badgeVariant = 'success';
        }
        
        tooltipText = temReserva 
          ? `${quantidadeReservada} unid. reservadas, ${quantidadeDisponivel} disponíveis de um total de ${qtd}` 
          : `${qtd} unidades em estoque`;
      } else if (status === 'reservado') {
        statusDisplay = 'Reservado';
        tooltipText = `${quantidadeReservada} unidades reservadas de um total de ${qtd}`;
      } else if (status === 'vendido') {
        statusDisplay = 'Vendido';
        tooltipText = "Produto já comercializado";
      } else if (status === 'inativo') {
        statusDisplay = 'Inativo';
        tooltipText = "Produto não disponível para venda";
      } else {
        statusDisplay = status;
      }
      
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Badge variant={badgeVariant}>
                  {statusDisplay}
                </Badge>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltipText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Ações</div>,
    cell: ({ row }) => (
      <div className="flex justify-end space-x-1">
        <Button 
          variant="ghost" 
          size="icon" 
          title="Ações e Reservas"
          onClick={() => onAction(row.original)}
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
        >
          <CalendarClock className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          title="Editar"
          onClick={() => onEdit(row.original)}
        >
          <Pencil className="h-4 w-4 text-orange-500" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          title="Inativar"
          onClick={() => onDelete(row.original)}
          className="text-red-600 hover:text-red-700 hover:bg-red-100"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];

// Componente DataTable agora recebe e passa as props de seleção
const ProdutoDataTable: React.FC<ProdutoDataTableProps> = ({
  data,
  onEdit,
  onDelete,
  onAction,
  isLoading,
  selectedItems,
  onSelectAll,
  onSelectSingle,
  selectAllState
}) => {
  // Passa as props relevantes para getColumns
  const columns = getColumns({ 
    onEdit, 
    onDelete, 
    onAction,
    selectedItems, 
    onSelectAll, 
    onSelectSingle, 
    selectAllState, 
    data, // Passa data se for necessário em getColumns (não parece ser o caso aqui)
    isLoading // Passa isLoading se for necessário
  });

  return (
    <DataTable 
      columns={columns} 
      data={data} 
      // Passar props adicionais para DataTable se necessário (ex: filtros)
    />
  );
};

export default ProdutoDataTable; 