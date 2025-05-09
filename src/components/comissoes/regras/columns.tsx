"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown, ToggleLeft, ToggleRight, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { format } from 'date-fns';
import { ptBR } from "date-fns/locale";
import { formatCurrency } from '@/lib/utils';

import { RegraComissao } from "@/types/comissao"

// Interface para as props das colunas, incluindo as funções de callback
interface ColumnsProps {
  onEdit: (id: string) => void;
  onToggleStatus: (id: string, nome: string, currentStatus: boolean) => void;
}

export const columns = ({ onEdit, onToggleStatus }: ColumnsProps): ColumnDef<RegraComissao>[] => [
  // Coluna de Seleção (opcional, se precisar de ações em lote)
  // {
  //   id: "select",
  //   header: ({ table }) => (
  //     <Checkbox
  //       checked={table.getIsAllPageRowsSelected()}
  //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //       aria-label="Selecionar todos"
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       checked={row.getIsSelected()}
  //       onCheckedChange={(value) => row.toggleSelected(!!value)}
  //       aria-label="Selecionar linha"
  //     />
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  // },

  {
    accessorKey: "nome",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nome da Regra
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("nome")}</div>,
  },
  {
    accessorKey: "tipo_calculo",
    header: "Tipo",
    cell: ({ row }) => {
      const tipo = row.getValue("tipo_calculo") as string;
      const formatted = tipo === 'porcentagem' ? 'Porcentagem' : tipo === 'valor_fixo' ? 'Valor Fixo' : tipo;
      return <Badge variant="outline">{formatted}</Badge>;
    },
  },
  {
    accessorKey: "valor",
    header: () => <div className="text-right">Valor/Percentual</div>,
    cell: ({ row }) => {
      const valor = parseFloat(row.getValue("valor"))
      const tipo = row.getValue("tipo_calculo") as string;
      const formatted = tipo === 'porcentagem' ? `${valor.toFixed(2)}%` : formatCurrency(valor);
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "ativa",
    header: "Status",
    cell: ({ row }) => {
      const ativa = row.getValue("ativa") as boolean;
      return ativa ? <Badge variant="success">Ativa</Badge> : <Badge variant="secondary">Inativa</Badge>;
    },
  },
  {
    accessorKey: "periodo_vigencia_inicio",
    header: "Início Vigência",
    cell: ({ row }) => {
      const date = row.getValue("periodo_vigencia_inicio") as string | null;
      return date ? format(new Date(date), "P", { locale: ptBR }) : <span className="text-muted-foreground">-</span>;
    },
  },
  {
    accessorKey: "periodo_vigencia_fim",
    header: "Fim Vigência",
    cell: ({ row }) => {
      const date = row.getValue("periodo_vigencia_fim") as string | null;
      return date ? format(new Date(date), "P", { locale: ptBR }) : <span className="text-muted-foreground">-</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const regra = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(regra.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleStatus(regra.id, regra.nome, regra.ativa)}>
              {regra.ativa ? <ToggleLeft className="mr-2 h-4 w-4 text-red-500" /> : <ToggleRight className="mr-2 h-4 w-4 text-green-500" />}
              {regra.ativa ? "Desativar" : "Ativar"}
            </DropdownMenuItem>
            {/* Adicionar opção de Excluir se implementado o delete físico */}
            {/* <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">Excluir</DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 