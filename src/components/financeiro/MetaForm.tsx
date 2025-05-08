import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { metaSchema, MetaFormData } from '@/lib/validations/metaSchema';
import { Meta } from '@/types/financeiro';
// TODO: Importar categorias se o campo categoria_id for usado no form
// import CategoriaSelect from '@/components/categorias/CategoriaSelect'; // Exemplo

// Tipagem para o payload esperado pelo serviço (datas como string)
export type MetaFormSubmitPayload = Omit<MetaFormData, 'data_inicio'|'data_fim'> & {
  data_inicio: string;
  data_fim: string;
};

interface MetaFormProps {
  /** Função a ser chamada ao submeter o formulário com dados válidos e formatados */
  onSubmit: (data: MetaFormSubmitPayload) => Promise<void> | void;
  /** Dados iniciais para preencher o formulário (usado na edição) */
  initialData?: Meta | null;
  /** Indica se o formulário está em processo de envio */
  isSubmitting?: boolean;
  /** Texto do botão de submissão (padrão: Salvar) */
  submitButtonText?: string;
}

const MetaForm: React.FC<MetaFormProps> = ({
  onSubmit: onSubmitProp,
  initialData = null,
  isSubmitting = false,
  submitButtonText = "Salvar Meta"
}) => {
  const isEditMode = !!initialData;

  const form = useForm<MetaFormData>({
    resolver: zodResolver(metaSchema),
    defaultValues: {
      nome: initialData?.nome ?? '',
      descricao: initialData?.descricao ?? '',
      tipo: initialData?.tipo ?? 'receita',
      periodo: initialData?.periodo ?? 'mensal',
      valor_meta: initialData?.valor_meta ?? 0,
      data_inicio: initialData?.data_inicio ? parseISO(initialData.data_inicio) : new Date(),
      data_fim: initialData?.data_fim ? parseISO(initialData.data_fim) : new Date(new Date().setMonth(new Date().getMonth() + 1)),
      observacoes: initialData?.observacoes ?? '',
      categoria_id: initialData?.categoria_id ?? null,
      profile_id: initialData?.profile_id ?? null,
    },
  });

  // Reseta o formulário se os dados iniciais mudarem (caso de edição onde os dados chegam depois)
  useEffect(() => {
    if (initialData) {
      form.reset({
        nome: initialData.nome,
        descricao: initialData.descricao ?? '',
        tipo: initialData.tipo,
        periodo: initialData.periodo,
        valor_meta: initialData.valor_meta,
        data_inicio: initialData.data_inicio ? parseISO(initialData.data_inicio) : new Date(),
        data_fim: initialData.data_fim ? parseISO(initialData.data_fim) : new Date(),
        observacoes: initialData.observacoes ?? '',
        categoria_id: initialData.categoria_id ?? null,
        profile_id: initialData.profile_id ?? null,
      });
    } else {
      // Reset com valores padrão para nova meta se initialData for null
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
  }, [initialData, form]);

  // Handler de submit interno que formata e chama o onSubmit externo
  const handleFormSubmit = (data: MetaFormData) => {
    if (!data.nome) {
      form.setError('nome', { message: 'Nome é obrigatório' });
      return;
    }

    // Formata as datas antes de enviar
    const formattedData: MetaFormSubmitPayload = {
      nome: data.nome,
      descricao: data.descricao,
      tipo: data.tipo,
      periodo: data.periodo,
      valor_meta: data.valor_meta,
      data_inicio: format(data.data_inicio, 'yyyy-MM-dd'),
      data_fim: format(data.data_fim, 'yyyy-MM-dd'),
      observacoes: data.observacoes,
      categoria_id: data.categoria_id === 'none' ? null : data.categoria_id,
      profile_id: data.profile_id || null, // Mantém profile_id se existir nos dados do form
    };

    onSubmitProp(formattedData); // Chama a função passada por props
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6"> {/* Aumentar espaçamento */}
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
              <FormDescription>
                Um nome claro para identificar o objetivo.
              </FormDescription>
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
                <Textarea placeholder="Detalhes sobre a meta, critérios de sucesso..." {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Linha com Tipo e Período */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Responsivo */}
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
                    <SelectItem value="economia">Economia</SelectItem>
                    <SelectItem value="despesa">Despesa (Limite)</SelectItem>
                    <SelectItem value="venda">Venda (Qtd ou Valor)</SelectItem>
                     <SelectItem value="lucro">Lucro</SelectItem>
                     <SelectItem value="outros">Outros</SelectItem>
                    {/* TODO: Adicionar mais tipos se necessário */}
                  </SelectContent>
                </Select>
                 <FormDescription>Indica sobre o que é a meta.</FormDescription>
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
                <FormLabel>Período de Apuração</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="diario">Diário</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                    <SelectItem value="unico">Período Único (definido pelas datas)</SelectItem>
                  </SelectContent>
                </Select>
                 <FormDescription>Frequência de avaliação da meta.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

         {/* Linha com Valor Meta e Categoria (Opcional) */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Valor Meta */}
           <FormField
             control={form.control}
             name="valor_meta"
             render={({ field }) => (
               <FormItem>
                 <FormLabel>Valor Alvo</FormLabel>
                 <FormControl>
                   <Input
                     type="number"
                     placeholder="0.00"
                     step="0.01" // Permite centavos
                     {...field}
                     onChange={event => field.onChange(+event.target.value)} // Converte para número
                   />
                 </FormControl>
                  <FormDescription>O valor numérico a ser atingido.</FormDescription>
                 <FormMessage />
               </FormItem>
             )}
           />
           {/* Categoria (Se aplicável) - Exemplo com CategoriaSelect */}
           {/*
           <FormField
             control={form.control}
             name="categoria_id"
             render={({ field }) => (
               <FormItem>
                 <FormLabel>Categoria (Opcional)</FormLabel>
                 <FormControl>
                   <CategoriaSelect
                      categoriaTipo="receita" // Ou 'despesa', ou dinâmico baseado no tipo selecionado
                      value={field.value ?? undefined}
                      onChange={field.onChange}
                   />
                 </FormControl>
                 <FormDescription>Vincular a uma categoria específica.</FormDescription>
                 <FormMessage />
               </FormItem>
             )}
           />
           */}
         </div>


        {/* Linha com Datas Início e Fim */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Data Início */}
          <FormField
            control={form.control}
            name="data_inicio"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Início</FormLabel>
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
                          format(field.value, "PPP", { locale: ptBR })
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
                        // date > new Date() || date < new Date("1900-01-01") // Exemplo de restrição
                        false
                      }
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                 <FormDescription>Quando a meta começa a valer.</FormDescription>
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
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: ptBR })
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
                        // Impede selecionar data anterior à data de início selecionada
                        (form.getValues("data_inicio") && date < form.getValues("data_inicio"))
                      }
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>Prazo final para atingir a meta.</FormDescription>
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
                <Textarea placeholder="Qualquer informação adicional relevante..." {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botão de Submissão */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? 'Salvando...' : submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default MetaForm; 