import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Para descrição e observações
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { metaSchema, MetaFormData } from '@/lib/validations/metaSchema';
import { Meta } from '@/types/financeiro';
import { addMeta, updateMeta } from '@/services/metas';
// TODO: Importar categorias se o campo categoria_id for usado no form

interface MetaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metaToEdit?: Meta | null;
}

const MetaFormDialog: React.FC<MetaFormDialogProps> = ({ open, onOpenChange, metaToEdit }) => {
  const queryClient = useQueryClient();
  const isEditMode = !!metaToEdit;

  const form = useForm<MetaFormData>({
    resolver: zodResolver(metaSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      tipo: 'receita', // Valor padrão
      periodo: 'mensal', // Valor padrão
      valor_meta: 0,
      data_inicio: new Date(),
      data_fim: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Padrão 1 mês a frente
      observacoes: '',
      categoria_id: null,
      profile_id: null, // Assumindo que não editamos isso diretamente
    },
  });

  // Preenche o formulário ao editar
  useEffect(() => {
    if (open) {
      if (isEditMode && metaToEdit) {
        form.reset({
          nome: metaToEdit.nome,
          descricao: metaToEdit.descricao ?? '',
          tipo: metaToEdit.tipo,
          periodo: metaToEdit.periodo,
          valor_meta: metaToEdit.valor_meta,
          data_inicio: metaToEdit.data_inicio ? parseISO(metaToEdit.data_inicio) : new Date(),
          data_fim: metaToEdit.data_fim ? parseISO(metaToEdit.data_fim) : new Date(),
          observacoes: metaToEdit.observacoes ?? '',
          categoria_id: metaToEdit.categoria_id ?? null,
          profile_id: metaToEdit.profile_id ?? null,
        });
      } else {
        // Reset com valores padrão para nova meta
        form.reset({
          nome: '',
          descricao: '',
          tipo: 'receita',
          periodo: 'mensal',
          valor_meta: 0,
          data_inicio: new Date(),
          data_fim: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          observacoes: '',
          categoria_id: null,
          profile_id: null,
        });
      }
    }
  }, [open, isEditMode, metaToEdit, form]);

  // Mutação para adicionar
  const addMutation = useMutation({
    mutationFn: addMeta,
    onSuccess: () => {
      toast.success('Meta adicionada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['metas'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar meta: ${error.message}`);
    },
  });

  // Mutação para atualizar
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { 
      id: string; 
      updates: Omit<MetaFormData, 'data_inicio'|'data_fim'> & {
        data_inicio: string;
        data_fim: string;
      }
    }) => updateMeta(id, updates),
    onSuccess: () => {
      toast.success('Meta atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['metas'] });
      queryClient.invalidateQueries({ queryKey: ['meta', metaToEdit?.id] }); // Invalida detalhe também
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar meta: ${error.message}`);
    },
  });

  // Handler de submit
  const onSubmit = (data: MetaFormData) => {
    if (!data.nome) {
      form.setError('nome', { message: 'Nome é obrigatório' });
      return;
    }

    // Formata as datas antes de enviar
    const formattedData = {
      nome: data.nome,
      descricao: data.descricao,
      tipo: data.tipo,
      periodo: data.periodo,
      valor_meta: data.valor_meta,
      data_inicio: format(data.data_inicio, 'yyyy-MM-dd'),
      data_fim: format(data.data_fim, 'yyyy-MM-dd'),
      observacoes: data.observacoes,
      categoria_id: data.categoria_id === 'none' ? null : data.categoria_id,
      profile_id: data.profile_id || null,
    };

    if (isEditMode && metaToEdit) {
      updateMutation.mutate({ id: metaToEdit.id, updates: formattedData });
    } else {
      // Excluir campos que não pertencem ao payload de criação se necessário
      // (Neste caso, MetaPayload já omite os campos certos)
      addMutation.mutate(formattedData);
    }
  };

  const isSubmitting = addMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]"> {/* Aumentar largura para mais campos */}
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Meta' : 'Adicionar Nova Meta'}</DialogTitle>
          <DialogDescription>
            Defina seus objetivos financeiros e acompanhe o progresso.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome */}
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Meta</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Economizar para viagem, Aumentar vendas mensais" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes sobre a meta..." {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Linha com Tipo e Período */}
            <div className="grid grid-cols-2 gap-4">
              {/* Tipo */}
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                        <SelectItem value="venda">Venda</SelectItem>
                        <SelectItem value="margem">Margem (%)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Período */}
              <FormField
                control={form.control}
                name="periodo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o período" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="trimestral">Trimestral</SelectItem>
                        <SelectItem value="semestral">Semestral</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

             {/* Linha com Valor Meta e Categoria (Opcional) */}
             <div className="grid grid-cols-2 gap-4">
               {/* Valor Meta */}
              <FormField
                control={form.control}
                name="valor_meta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Alvo (R$ ou %)</FormLabel>
                    <FormControl>
                      {/* Usar input tipo "text" para aceitar vírgula, validação Zod trata */}
                      <Input type="text" inputMode="decimal" placeholder="1000,00" {...field} />
                    </FormControl>
                    <FormDescription>
                       {form.getValues('tipo') === 'margem' ? 'Valor percentual (ex: 25)' : 'Valor monetário (ex: 1500,50)'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Categoria (TODO: Popular com dados reais) */}
              <FormField
                control={form.control}
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione (se aplicável)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {/* TODO: Mapear categorias reais aqui */}
                        {/* <SelectItem value="uuid-cat-receita-1">Vendas Online</SelectItem> */}
                        {/* <SelectItem value="uuid-cat-despesa-1">Aluguel</SelectItem> */}
                      </SelectContent>
                    </Select>
                     <FormDescription>Relacionar meta a uma categoria específica.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Linha com Data Início e Data Fim */}
            <div className="grid grid-cols-2 gap-4">
              {/* Data Início */}
              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Início</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : <span>Escolha uma data</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Data Fim */}
              <FormField
                control={form.control}
                name="data_fim"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Fim</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : <span>Escolha uma data</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Observações */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notas adicionais..." {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Adicionar Meta')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MetaFormDialog;
