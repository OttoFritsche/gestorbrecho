import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns'; // Import parseISO to handle potential string dates

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose // Importar DialogClose
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { despesaSchema, DespesaFormData } from '@/lib/validations/despesaSchema'; // Importa o esquema e o tipo
import { Despesa } from '@/types/financeiro'; // Importa o tipo Despesa
import { addDespesa, updateDespesa } from '@/services/despesas'; // Importa funções do serviço

// Importar a logo
import logoSrc from '@/assets/logo/3.png'; // Ajuste o caminho se necessário

// Importa o novo componente
import CategoriaSelect from '@/components/categorias/CategoriaSelect';

// Define um tipo para os dados do formulário com datas formatadas como string
type FormattedDespesaData = Omit<DespesaFormData, 'data' | 'data_vencimento'> & {
  data: string; // Data principal como string
  data_vencimento: string | null; // Data de vencimento como string ou null
};

// Props esperadas pelo componente de diálogo
interface DespesaFormDialogProps {
  open: boolean; // Controla se o diálogo está aberto
  onOpenChange: (open: boolean) => void; // Função para fechar o diálogo
  despesaToEdit?: Despesa | null; // Dados da despesa para edição (opcional)
}

// Componente do Diálogo/Formulário
const DespesaFormDialog: React.FC<DespesaFormDialogProps> = ({ open, onOpenChange, despesaToEdit }) => {
  // Log 3: Verificar props recebidas
  console.log('[DespesaFormDialog] Props recebidas:', { open, despesaToEditId: despesaToEdit?.id });

  // Hook para invalidar queries após mutação
  const queryClient = useQueryClient();
  // Determina se está no modo de edição
  const isEditMode = !!despesaToEdit;

  // Configuração do formulário com react-hook-form e Zod
  const form = useForm<DespesaFormData>({
    resolver: zodResolver(despesaSchema), // Usa o resolver do Zod
    defaultValues: { // Valores padrão do formulário
      descricao: '',
      valor: 0,
      data: new Date(), // Data atual como padrão
      categoria_id: '',
      pago: false,
      data_vencimento: null,
      observacoes: '',
      comprovante_url: '', // Inicialmente vazio
    },
  });

  // Efeito para resetar o formulário e preencher com dados de edição quando necessário
  useEffect(() => {
    // Log 4: Verificar execução do useEffect
    console.log(`[DespesaFormDialog] useEffect executado. open: ${open}, isEditMode: ${isEditMode}`);
    if (open) { // Executa apenas quando o diálogo abre
      if (isEditMode && despesaToEdit) {
        // Log 5: Entrou no modo de edição
        console.log('[DespesaFormDialog] useEffect - Modo Edição');
        // Se está editando, preenche o formulário com os dados existentes
        form.reset({
          descricao: despesaToEdit.descricao,
          valor: despesaToEdit.valor,
          // Garante que as datas sejam objetos Date
          data: despesaToEdit.data ? parseISO(despesaToEdit.data) : new Date(),
          data_vencimento: despesaToEdit.data_vencimento ? parseISO(despesaToEdit.data_vencimento) : null,
          categoria_id: despesaToEdit.categoria_id,
          pago: despesaToEdit.pago,
          observacoes: despesaToEdit.observacoes ?? '', // Usa ?? para tratar null/undefined
          comprovante_url: despesaToEdit.comprovante_url ?? '',
        });
      } else {
        // Log 6: Entrou no modo de adição/reset
        console.log('[DespesaFormDialog] useEffect - Modo Adição/Reset');
        // Se está adicionando, reseta para os valores padrão
        form.reset();
      }
    }
  }, [open, isEditMode, despesaToEdit, form]); // Dependências do efeito

  // Mutação para adicionar despesa
  const addMutation = useMutation({
    mutationFn: addDespesa, 
    onSuccess: () => {
      toast.success('Despesa adicionada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['despesas'] }); // Invalida cache de despesas
      queryClient.invalidateQueries({ queryKey: ['dashboardFinanceiroData'] }); // <<< Invalidar dashboard
      onOpenChange(false); // Fecha o diálogo
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar despesa: ${error.message}`);
    },
  });

  // Mutação para atualizar despesa
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<FormattedDespesaData> }) => 
      updateDespesa(id, updates),
    onSuccess: () => {
      toast.success('Despesa atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['despesas'] }); // Invalida cache de despesas
      queryClient.invalidateQueries({ queryKey: ['dashboardFinanceiroData'] }); // <<< Invalidar dashboard
      onOpenChange(false); // Fecha o diálogo
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar despesa: ${error.message}`);
    },
  });

  // Função chamada ao submeter o formulário
  const onSubmit = (data: DespesaFormData) => {
    // Formata as datas para o formato ISO (YYYY-MM-DD) antes de enviar
    // CORREÇÃO: Usar o tipo FormattedDespesaData para a variável
    const formattedData: FormattedDespesaData = {
      ...data,
      // form.getValues('data') pega o valor atual do campo (que é um objeto Date)
      data: format(form.getValues('data'), 'yyyy-MM-dd'), 
      data_vencimento: data.data_vencimento ? format(data.data_vencimento, 'yyyy-MM-dd') : null,
    };

    if (isEditMode && despesaToEdit) {
      // Se está editando, chama a mutação de atualização
      // CORREÇÃO: O tipo de formattedData agora corresponde ao esperado pela mutação
      updateMutation.mutate({ id: despesaToEdit.id, updates: formattedData });
    } else {
      // Se está adicionando, chama a mutação de adição
      // CORREÇÃO: Usar asserção de tipo para compatibilizar com o esperado por addDespesa
      // Assumindo que addDespesa espera Omit<Despesa, 'id' | 'created_at' | 'user_id'>
      // e que formattedData tem a estrutura correta em runtime.
      addMutation.mutate(formattedData as Omit<Despesa, "id" | "created_at" | "user_id">);
    }
  };

  // Verifica se alguma mutação está em andamento
  const isSubmitting = addMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="flex flex-row justify-between items-center space-x-4">
          <div> 
            <DialogTitle>{isEditMode ? 'Editar Despesa' : 'Adicionar Nova Despesa'}</DialogTitle>
            <DialogDescription>
              Preencha os detalhes da despesa abaixo.
            </DialogDescription>
          </div>
          <img src={logoSrc} alt="Logo" className="h-16 w-auto" />
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Aluguel Escritório" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <CategoriaSelect 
                        value={field.value} 
                        onChange={field.onChange} 
                        tipo="despesa" 
                        placeholder="Selecione a categoria"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

             <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Pagamento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Escolha uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="data_vencimento"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Vencimento (Opcional)</FormLabel>
                     <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Escolha uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ?? undefined}
                          onSelect={(date) => field.onChange(date ?? null)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Alguma anotação extra sobre esta despesa..."
                      className="resize-none"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="comprovante_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comprovante (URL - Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="http://exemplo.com/comprovante.pdf" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pago"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                   <FormControl>
                     <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Despesa Paga?
                    </FormLabel>
                    <FormMessage />
                   </div>
                 </FormItem>
              )}
            />

            <DialogFooter>
               <DialogClose asChild>
                 <Button type="button" variant="outline">Cancelar</Button>
               </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                 {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 {isSubmitting ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Adicionar Despesa')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default DespesaFormDialog; 