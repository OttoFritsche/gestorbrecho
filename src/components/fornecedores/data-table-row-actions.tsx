import { Row } from "@tanstack/react-table";
import { Copy, MoreHorizontal, Pencil, Trash2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Fornecedor } from "@/lib/validations/fornecedorSchema";
import { formatCPFOrCNPJ } from "@/lib/utils";
import { useCallback } from "react";

interface DataTableRowActionsProps {
  row: Row<Fornecedor>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const fornecedor = row.original;
  const navigate = useNavigate();

  // Função para copiar o CNPJ/CPF para a área de transferência
  const copyToClipboard = useCallback((text: string | undefined, label: string) => {
    if (!text) {
      toast.error(`${label} não disponível`);
      return;
    }
    
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`${label} copiado para a área de transferência`))
      .catch(() => toast.error(`Erro ao copiar ${label.toLowerCase()}`));
  }, []);

  // Função para navegar para a página de edição
  const handleEdit = useCallback(() => {
    navigate(`/app/fornecedores/${fornecedor.id}/editar`);
  }, [navigate, fornecedor.id]);

  // Função para visualizar os detalhes do fornecedor
  const handleView = useCallback(() => {
    navigate(`/app/fornecedores/${fornecedor.id}`);
  }, [navigate, fornecedor.id]);

  // Função para excluir o fornecedor (será implementada via Mutation em FornecedoresPage)
  const handleDelete = useCallback(() => {
    // Essa função é apenas um placeholder - a exclusão real será implementada
    // na página pai, onde temos acesso ao mutation do TanStack Query
    const event = new CustomEvent('delete-fornecedor', { detail: { id: fornecedor.id } });
    document.dispatchEvent(event);
  }, [fornecedor.id]);

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
        
        <DropdownMenuItem onClick={handleView}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Ver detalhes
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {fornecedor.cnpj_cpf && (
          <DropdownMenuItem 
            onClick={() => copyToClipboard(
              formatCPFOrCNPJ(fornecedor.cnpj_cpf), 
              fornecedor.cnpj_cpf?.length <= 11 ? "CPF" : "CNPJ"
            )}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copiar {fornecedor.cnpj_cpf?.length <= 11 ? "CPF" : "CNPJ"}
          </DropdownMenuItem>
        )}
        
        {fornecedor.email && (
          <DropdownMenuItem onClick={() => copyToClipboard(fornecedor.email, "Email")}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar email
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 