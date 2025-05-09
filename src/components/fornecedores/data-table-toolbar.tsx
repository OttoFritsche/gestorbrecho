import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  estados: string[];
  isFiltered: boolean;
}

export function DataTableToolbar<TData>({
  table,
  estados,
  isFiltered,
}: DataTableToolbarProps<TData>) {
  // Obtém o valor global de filtro
  const globalFilter = table.getState().globalFilter || "";

  // Atualiza o filtro global
  const setGlobalFilter = (value: string) => {
    table.setGlobalFilter(value);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {/* Campo de busca */}
        <div className="relative w-full sm:w-64 md:w-80">
          <Input
            placeholder="Buscar fornecedores..."
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="w-full"
          />
          {globalFilter && (
            <button
              onClick={() => setGlobalFilter("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filtro de estado */}
        {estados.length > 0 && (
          <div className="hidden md:flex">
            <Select
              value={table.getColumn("endereco_estado")?.getFilterValue() as string || ""}
              onValueChange={(value) => {
                if (value) {
                  table.getColumn("endereco_estado")?.setFilterValue(value);
                } else {
                  table.getColumn("endereco_estado")?.setFilterValue(undefined);
                }
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filtrar por UF" />
              </SelectTrigger>
              <SelectContent>
                {estados.map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Botão para limpar filtros */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              setGlobalFilter("");
            }}
            className="h-8 px-2 lg:px-3"
          >
            Limpar
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Opções de visibilidade das colunas */}
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
                  {/* Tenta usar o header da coluna como label, se for string */}
                  {typeof column.columnDef.header === 'string' 
                    ? column.columnDef.header 
                    : column.id} 
                </DropdownMenuCheckboxItem>
              )
            })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 