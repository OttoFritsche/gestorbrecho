import React from 'react';
import { Cliente } from '@/services/clienteService'; 
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, ToggleLeft, ToggleRight, UserX, UserCheck } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

// Interface Cliente simplificada
interface Cliente {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  ativo: boolean;
  cpf_cnpj?: string;
}

// Definir interface das Props incluindo as de seleção
interface ClientesTableProps {
    clientes: Cliente[];
    onEdit: (clienteId: string) => void;
    onToggleStatus: (cliente: Cliente) => void;
    // Props de seleção
    selectedItems: Set<string>;
    onSelectAll: (checked: boolean | 'indeterminate') => void;
    onSelectSingle: (itemId: string, checked: boolean | 'indeterminate') => void;
    selectAllState: boolean | 'indeterminate';
}

const ClientesTable: React.FC<ClientesTableProps> = ({ 
    clientes, 
    onEdit, 
    onToggleStatus,
    // Desestruturar props de seleção
    selectedItems,
    onSelectAll,
    onSelectSingle,
    selectAllState
}) => {
  const navigate = useNavigate();

  const handleDetails = (clienteId: string) => {
    // Navega para a página de detalhes do cliente
    navigate(`/app/clientes/${clienteId}`);
    // toast({ title: "Ação Pendente", description: `Ver detalhes do cliente: ${clienteId}` });
    // console.log("Ver detalhes do cliente:", clienteId);
  };

  return (
    <Table>
      <TableCaption>Lista de clientes cadastrados.</TableCaption>
      <TableHeader>
        <TableRow>
          {/* Cabeçalho Checkbox */}
          <TableHead className="w-[40px] px-2">
             <Checkbox
                checked={selectAllState}
                onCheckedChange={onSelectAll}
                aria-label="Selecionar todos os clientes"
                className="border-stone-400"
             />
          </TableHead>
          <TableHead className="text-[#92400e] bg-[#fef3c7]">Nome</TableHead>
          <TableHead className="text-[#92400e] bg-[#fef3c7]">Telefone</TableHead>
          <TableHead className="text-[#92400e] bg-[#fef3c7]">Email</TableHead>
          <TableHead className="text-[#92400e] bg-[#fef3c7]">CPF/CNPJ</TableHead>
          <TableHead className="text-[#92400e] bg-[#fef3c7]">Status</TableHead>
          <TableHead className="text-right text-[#92400e] bg-[#fef3c7]">Ações</TableHead> 
        </TableRow>
      </TableHeader>
      <TableBody>
        {clientes.map((cliente) => (
          <TableRow 
            key={cliente.id}
            data-state={selectedItems.has(cliente.id) ? "selected" : ""}
            className={selectedItems.has(cliente.id) ? 'bg-blue-50' : ''}
          >
            {/* Célula Checkbox */}
            <TableCell className="px-2">
               <Checkbox
                  checked={selectedItems.has(cliente.id)}
                  onCheckedChange={(checked) => onSelectSingle(cliente.id, checked)}
                  aria-label={`Selecionar cliente ${cliente.nome}`}
                  className="border-stone-400"
               />
            </TableCell>
            <TableCell className="font-medium">{cliente.nome}</TableCell>
            <TableCell>{cliente.telefone || '-'}</TableCell>
            <TableCell>{cliente.email || '-'}</TableCell>
            <TableCell>{cliente.cpf_cnpj || '-'}</TableCell>
            <TableCell>
              <Badge variant={cliente.ativo ? "default" : "secondary"}>
                {cliente.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </TableCell>
            <TableCell className="text-right space-x-1">
              {/* Botão Detalhes */}
              <Button 
                variant="ghost" 
                size="icon" 
                title="Detalhes"
                onClick={() => handleDetails(cliente.id)}
              >
                <Eye className="h-4 w-4 text-blue-600" />
              </Button>
              
              {/* Botão Editar */}
              <Button 
                variant="ghost" 
                size="icon" 
                title="Editar"
                onClick={() => onEdit(cliente.id)}
                disabled={!cliente.ativo}
              >
                <Edit className="h-4 w-4 text-orange-500" />
              </Button>
              
              {/* Botão Inativar/Reativar */}
              <Button 
                variant="ghost" 
                size="icon" 
                title={cliente.ativo ? 'Inativar' : 'Reativar'}
                onClick={() => onToggleStatus(cliente)}
                className={cliente.ativo ? "text-red-600 hover:text-red-700 hover:bg-red-100" : "text-green-600 hover:text-green-700 hover:bg-green-100"}
              >
                {cliente.ativo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ClientesTable; 