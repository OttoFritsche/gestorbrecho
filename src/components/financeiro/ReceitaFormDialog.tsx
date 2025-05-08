import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Usar RadioGroup para o tipo
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { receitaSchema, ReceitaFormData } from '@/lib/validations/receitaSchema';
import { Receita } from '@/types/financeiro';
import { addReceita, updateReceita, getFormasPagamento } from '@/services/receitas';

// Importar a logo
import logoSrc from '@/assets/logo/3.png'; // Ajuste o caminho se necessário

// Importa o novo componente
import CategoriaSelect from '@/components/categorias/CategoriaSelect';

// Interface para os dados do formulário INTERNO (usando Date)
interface ReceitaFormInternalData extends Omit<ReceitaFormData, 'data'> {
  data: Date;
}

interface ReceitaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receitaToEdit?: Receita | null;
}

const ReceitaFormDialog: React.FC<ReceitaFormDialogProps> = ({ open, onOpenChange, receitaToEdit }) => {
  const queryClient = useQueryClient();
  const isEditMode = !!receitaToEdit;

  // Usar o tipo interno com Date aqui
  const form = useForm<ReceitaFormInternalData>({
    // Não usar o resolver Zod aqui diretamente se ele espera string
    // A validação ocorrerá antes do submit com os dados formatados
    // resolver: zodResolver(receitaSchema), // Remover ou ajustar
    defaultValues: {
      descricao: '',
      valor: 0,
      data: new Date(), // Usar Date
      categoria_id: '',
      tipo: 'outro', // Padrão para 'outro'
      forma_pagamento_id: null,
    },
  });

  // Busca formas de pagamento
  const { data: formasPagamento = [], isLoading: isLoadingFormas } = useQuery<{ id: string; nome: string }[]>({ // Especifica tipo
    queryKey: ['formasPagamento'],
    queryFn: getFormasPagamento,
  });

  // Preenche o formulário ao editar
  useEffect(() => {
    if (open) {
      if (isEditMode && receitaToEdit) {
        // Usar parseISO para converter string da API para Date
        form.reset({
          descricao: receitaToEdit.descricao,
          valor: receitaToEdit.valor,
          data: receitaToEdit.data ? parseISO(receitaToEdit.data) : new Date(), // Usar Date
          categoria_id: receitaToEdit.categoria_id,
          tipo: receitaToEdit.tipo,
          forma_pagamento_id: receitaToEdit.forma_pagamento_id ?? null,
        });
      } else {
        // Reset para valores padrão (com new Date())
        form.reset({
          descricao: '',
          valor: 0,
          data: new Date(), // Usar Date
          categoria_id: '',
          tipo: 'outro',
          forma_pagamento_id: null,
        });
      }
    }
    // Limpar erros ao abrir/resetar (opcional, mas boa prática)
    form.clearErrors();
  }, [open, isEditMode, receitaToEdit, form]);

  // Mutação para adicionar
  const addMutation = useMutation({
    // A função addReceita espera ReceitaFormData (com data: string)
    mutationFn: (data: ReceitaFormData) => addReceita(data),
    onSuccess: () => {
      toast.success('Receita adicionada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['receitas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardFinanceiroData'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar receita: ${error.message}`);
    },
  });

  // Mutação para atualizar
  const updateMutation = useMutation({
    // A função updateReceita espera Partial<ReceitaFormData> (com data?: string)
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ReceitaFormData> }) => updateReceita(id, updates),
    onSuccess: () => {
      toast.success('Receita atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['receitas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardFinanceiroData'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar receita: ${error.message}`);
    },
  });

  // Handler de submit
  const onSubmit = (data: ReceitaFormInternalData) => {
    // 1. Formatar data para string ANTES da validação e submissão
    const formattedDataForValidation: ReceitaFormData = {
      ...data,
      data: format(data.data, 'yyyy-MM-dd'), // Formatar Date para string
      // Garante que forma_pagamento_id seja null se vazio, ou string se preenchido
      forma_pagamento_id: data.forma_pagamento_id || null,
    };

    // 2. Validar com Zod usando os dados formatados
    const validationResult = receitaSchema.safeParse(formattedDataForValidation);

    if (!validationResult.success) {
      // Mapear erros Zod para o react-hook-form
      validationResult.error.errors.forEach((err) => {
        form.setError(err.path[0] as keyof ReceitaFormInternalData, { // Usar keyof do tipo interno
          type: 'manual',
          message: err.message,
        });
      });
      toast.error('Por favor, corrija os erros no formulário.');
      return; // Impedir submissão se inválido
    }

    // 3. Usar os dados validados (validationResult.data) que já estão com 'data' como string
    const dataToSubmit = validationResult.data;

    // Omitir venda_id manualmente se existir (embora não deva no tipo ReceitaFormData)
    const { venda_id, ...finalData } = dataToSubmit as any; // Usar 'as any' com cuidado

    if (isEditMode && receitaToEdit) {
      // Passar os dados validados e formatados (com data: string)
      updateMutation.mutate({ id: receitaToEdit.id, updates: finalData });
    } else {
      // Passar os dados validados e formatados (com data: string)
      addMutation.mutate(finalData);
    }
  };

  const isSubmitting = addMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="flex flex-row justify-between items-center space-x-4">
          <div>
            <DialogTitle>{isEditMode ? 'Editar Receita' : 'Adicionar Nova Receita'}</DialogTitle>
            <DialogDescription>
              Preencha os detalhes da receita abaixo.
            </DialogDescription>
          </div>
          <img src={logoSrc} alt="Logo" className="h-16 w-auto" />
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Tipo de Receita */}
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-sm font-semibold text-gray-700">Tipo de Receita *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
                    >
                      {/* Opções Atualizadas */}
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="servicos" />
                        </FormControl>
                        <FormLabel className="font-normal">Serviços</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="alugueis" />
                        </FormControl>
                        <FormLabel className="font-normal">Aluguéis</FormLabel>
                      </FormItem>
                       <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="comissao" />
                        </FormControl>
                        <FormLabel className="font-normal">Comissão</FormLabel>
                      </FormItem>
                       <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="doacao" />
                        </FormControl>
                        <FormLabel className="font-normal">Doação</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="outro" />
                        </FormControl>
                        <FormLabel className="font-normal">Outro</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Descrição */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Consultoria / Aluguel\n                    " {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Linha com Valor e Data */}
            <div className="grid grid-cols-2 gap-4">
              {/* Campo Valor */}
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      {/* Garantir que o valor seja tratado como número */}
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value ?? 0} // Default para 0 se null/undefined
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)} // Converter para número
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Campo Data - Agora field.value é Date, corrigindo o erro do Calendar */}
               <FormField
                control={form.control}
                name="data" // Este campo agora é do tipo Date internamente
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Recebimento</FormLabel>
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
                            {/* field.value agora é Date, formatar para exibição */}
                            {field.value ? (
                              format(field.value, "PPP") // Formata Date
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
                          selected={field.value} // Passa Date
                          onSelect={(date) => field.onChange(date || new Date())} // Atualiza com Date ou now()
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Linha com Categoria e Forma de Pagamento */}
            <div className="grid grid-cols-2 gap-4">
              {/* Campo Categoria */}
              <FormField
                control={form.control}
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      {/* Usa o CategoriaSelect para tipo 'receita' */}
                      <CategoriaSelect 
                        value={field.value} 
                        onChange={field.onChange} 
                        tipo="receita" 
                        placeholder="Selecione a categoria"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               {/* Campo Forma de Pagamento */}
               <FormField
                control={form.control}
                name="forma_pagamento_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? undefined} >
                      <FormControl>
                        <SelectTrigger disabled={isLoadingFormas}>
                          <SelectValue placeholder={isLoadingFormas ? "Carregando..." : "Selecione (opcional)"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {formasPagamento.map(forma => (
                          <SelectItem key={forma.id} value={forma.id}>{forma.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isEditMode ? 'Salvar Alterações' : 'Adicionar Receita'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ReceitaFormDialog; 