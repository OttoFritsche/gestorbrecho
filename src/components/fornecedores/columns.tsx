import { ColumnDef } from "@tanstack/react-table";
import { Fornecedor } from "@/lib/validations/fornecedorSchema";
import { formatCPFOrCNPJ } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { DataTableRowActions } from "./data-table-row-actions";

// Definição das colunas da tabela de fornecedores
export const columns: ColumnDef<Fornecedor>[] = [
  // Coluna de Nome/Razão Social
  {
    accessorKey: "nome_razao_social",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nome/Razão Social
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const value = row.getValue("nome_razao_social") as string;
      const nomeFantasia = row.original.nome_fantasia as string | undefined;
      
      return (
        <div className="flex flex-col">
          <span className="font-medium">{value}</span>
          {nomeFantasia && (
            <span className="text-xs text-muted-foreground">{nomeFantasia}</span>
          )}
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false,
  },
  
  // Coluna de CNPJ/CPF
  {
    accessorKey: "cnpj_cpf",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          CNPJ/CPF
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const value = row.getValue("cnpj_cpf") as string | undefined;
      
      if (!value) return <span className="text-muted-foreground">-</span>;
      
      return <span>{formatCPFOrCNPJ(value)}</span>;
    },
    enableSorting: true,
    enableHiding: true,
  },
  
  // Coluna de Contato Principal
  {
    accessorKey: "contato_principal",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Contato
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const value = row.getValue("contato_principal") as string | undefined;
      
      if (!value) return <span className="text-muted-foreground">-</span>;
      
      return <span>{value}</span>;
    },
    enableSorting: true,
    enableHiding: true,
  },
  
  // Coluna de Telefone
  {
    accessorKey: "telefone",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Telefone
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const value = row.getValue("telefone") as string | undefined;
      
      if (!value) return <span className="text-muted-foreground">-</span>;
      
      return <span>{value}</span>;
    },
    enableSorting: true,
    enableHiding: true,
  },
  
  // Coluna de Email
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const value = row.getValue("email") as string | undefined;
      
      if (!value) return <span className="text-muted-foreground">-</span>;
      
      return <span>{value}</span>;
    },
    enableSorting: true,
    enableHiding: true,
  },
  
  // Coluna de Cidade/UF
  {
    id: "cidade_uf",
    header: "Cidade/UF",
    cell: ({ row }) => {
      const cidade = row.original.endereco_cidade as string | undefined;
      const uf = row.original.endereco_estado as string | undefined;
      
      if (!cidade && !uf) return <span className="text-muted-foreground">-</span>;
      
      return (
        <div className="flex gap-1 items-center">
          {cidade && <span>{cidade}</span>}
          {cidade && uf && <span>/</span>}
          {uf && <Badge variant="outline" className="font-medium">{uf}</Badge>}
        </div>
      );
    },
    enableSorting: false,
    enableHiding: true,
  },
  
  // Coluna de Estado (UF) - necessária para filtro
  {
    accessorKey: "endereco_estado",
    header: "UF",
    cell: ({ row }) => {
      const uf = row.original.endereco_estado as string | undefined;
      return uf ? <span>{uf}</span> : <span className="text-muted-foreground">-</span>;
    },
    enableSorting: true,
    enableHiding: true, // Pode ser ocultada pelo usuário
  },
  
  // Coluna de Ações
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]; 