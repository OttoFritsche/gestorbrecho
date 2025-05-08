import React, { useState } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

// Reutiliza ou importa a interface ResgatePonto
interface ResgatePonto {
  id: string;
  data_solicitacao: string;
  pontos_resgatados: number;
  descricao_premio: string;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado';
}

interface ResgatesTableProps {
  resgates: ResgatePonto[];
  clienteId: string;
}

// Helper para formatar datas
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString('pt-BR');
  } catch (e) {
    return 'Data inválida';
  }
}

// Mapeamento de status para variantes de Badge
const statusVariantMap: Record<ResgatePonto['status'], "default" | "secondary" | "destructive" | "outline"> = {
  pendente: "secondary",
  aprovado: "default",
  rejeitado: "destructive",
  cancelado: "outline",
};

const ResgatesTable: React.FC<ResgatesTableProps> = ({ resgates, clienteId }) => {
  const queryClient = useQueryClient();
  // Estado para controlar qual resgate está sendo processado
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAprovar = async (resgateId: string) => {
    setProcessingId(resgateId); // Inicia processamento para este ID
    try {
      const { data, error } = await supabase.functions.invoke('aprovar-resgate', {
        body: { resgateId },
      });

      if (error) throw error;

      toast({ title: "Sucesso!", description: data.message || "Resgate aprovado." });
      // Invalida a query de detalhes deste cliente para atualizar tudo
      queryClient.invalidateQueries({ queryKey: ['clienteDetalhes', clienteId] });
      // Pode invalidar a lista geral também, se fizer sentido
      // queryClient.invalidateQueries({ queryKey: ['clientes'] });

    } catch (error: any) {
      console.error("Erro ao aprovar resgate:", error);
      toast({
        title: "Erro!",
        description: error.message || "Não foi possível aprovar o resgate.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null); // Finaliza processamento
    }
  };

  const handleRejeitar = (resgateId: string) => {
    // TODO: Abrir modal para motivo e chamar Edge Function
    toast({ title: "Ação Pendente", description: `Rejeitar resgate: ${resgateId}` });
  };

  const handleCancelar = (resgateId: string) => {
    // TODO: Abrir modal para motivo e chamar Edge Function
    toast({ title: "Ação Pendente", description: `Cancelar resgate: ${resgateId}` });
  };

  return (
    <Table>
      <TableCaption>Solicitações de resgate de pontos.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Data Solicitação</TableHead>
          <TableHead>Prêmio</TableHead>
          <TableHead className="text-right">Pontos</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {resgates.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{formatDate(item.data_solicitacao)}</TableCell>
            <TableCell className="font-medium">{item.descricao_premio}</TableCell>
            <TableCell className="text-right">{item.pontos_resgatados}</TableCell>
            <TableCell>
              <Badge variant={statusVariantMap[item.status] || "secondary"}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)} 
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {item.status === 'pendente' && (
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleAprovar(item.id)}
                    disabled={processingId === item.id}
                  >
                    {processingId === item.id ? 'Aprovando...' : 'Aprovar'}
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleRejeitar(item.id)}
                    disabled={processingId !== null}
                  >
                    Rejeitar
                  </Button>
                </div>
              )}
              {item.status === 'aprovado' && (
                 <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={() => handleCancelar(item.id)}
                   disabled={processingId !== null}
                  >
                   Cancelar
                 </Button>
              )}
              {/* Status Rejeitado/Cancelado não têm ações diretas aqui */}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ResgatesTable; 