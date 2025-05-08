import React from 'react';
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

// Reutiliza ou importa a interface HistoricoPonto
interface HistoricoPonto {
  id: string;
  data_operacao: string;
  pontos: number;
  tipo_operacao: 'credito' | 'debito';
  observacao: string | null;
}

interface HistoricoPontosTableProps {
  historico: HistoricoPonto[];
}

// Helper para formatar datas
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '-';
  try {
    // Usar toLocaleString para incluir hora pode ser útil aqui
    return new Date(dateString).toLocaleString('pt-BR');
  } catch (e) {
    return 'Data inválida';
  }
}

const HistoricoPontosTable: React.FC<HistoricoPontosTableProps> = ({ historico }) => {
  return (
    <Table>
      <TableCaption>Histórico de movimentação de pontos.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="text-right">Pontos</TableHead>
          <TableHead>Observação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {historico.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{formatDate(item.data_operacao)}</TableCell>
            <TableCell>
              <Badge variant={item.tipo_operacao === 'credito' ? "default" : "secondary"}>
                {item.tipo_operacao === 'credito' ? 'Crédito' : 'Débito'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">{item.pontos}</TableCell>
            <TableCell>{item.observacao || '-'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default HistoricoPontosTable; 