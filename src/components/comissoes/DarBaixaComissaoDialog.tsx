import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarIcon, CheckCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction 
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/components/ui/use-toast";
import { darBaixaComissao } from "@/services/comissaoService";
import { cn, formatCurrency } from "@/lib/utils";

interface DarBaixaComissaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comissaoId: string;
  comissaoValor: number;
  vendedorNome: string;
  categoriaId: string;
  onSuccess?: () => void;
}

export default function DarBaixaComissaoDialog({
  open,
  onOpenChange,
  comissaoId,
  comissaoValor,
  vendedorNome,
  categoriaId,
  onSuccess
}: DarBaixaComissaoDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dataPagamento, setDataPagamento] = useState<Date>(new Date());
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      // Reset quando o diálogo abre
      setDataPagamento(new Date());
      setIsLoading(false);
    }
  }, [open]);

  const handleDarBaixa = async () => {
    if (!comissaoId || !categoriaId) {
      toast({
        title: "Erro",
        description: "Dados insuficientes para dar baixa na comissão.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Usar a data selecionada no calendário
      const dataFormatada = dataPagamento.toISOString();
      
      await darBaixaComissao(comissaoId, categoriaId, dataFormatada);
      
      // Recarregar dados
      queryClient.invalidateQueries({ queryKey: ["comissoes"] });
      queryClient.invalidateQueries({ queryKey: ["movimentacoes"] });
      
      toast({
        title: "Sucesso!",
        description: "Comissão registrada como paga e movimentação financeira criada.",
        variant: "default",
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao dar baixa na comissão:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao dar baixa na comissão.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">Dar Baixa em Comissão</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação irá registrar o pagamento da comissão e criar uma despesa no fluxo financeiro.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Vendedor</p>
            <p className="font-medium">{vendedorNome}</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Valor da Comissão</p>
            <p className="font-medium text-lg">{formatCurrency(comissaoValor)}</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Data de Pagamento</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataPagamento && "text-muted-foreground"
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataPagamento ? (
                    format(dataPagamento, "PPP", { locale: ptBR })
                  ) : (
                    <span>Escolha uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dataPagamento}
                  onSelect={(date) => date && setDataPagamento(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDarBaixa}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirmar Pagamento
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 