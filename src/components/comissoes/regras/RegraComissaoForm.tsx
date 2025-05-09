"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from "date-fns/locale";

import { RegraComissaoFormData, regraComissaoSchema } from '@/schemas/regraComissaoSchema';
import { RegraComissaoInput } from '@/types/comissao';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface RegraComissaoFormProps {
  onSubmit: (data: RegraComissaoInput) => Promise<void>;
  initialData?: RegraComissaoFormData | null;
  isSubmitting: boolean;
  onCancel: () => void;
}

export const RegraComissaoForm: React.FC<RegraComissaoFormProps> = ({ 
  onSubmit,
  initialData,
  isSubmitting,
  onCancel
}) => {
  const form = useForm<RegraComissaoFormData>({
    resolver: zodResolver(regraComissaoSchema),
    defaultValues: initialData || {
      nome: '',
      descricao: '',
      tipo_calculo: undefined, // Forçar seleção
      valor: undefined,
      ativa: true,
      periodo_vigencia_inicio: null,
      periodo_vigencia_fim: null,
    },
  });

  const handleFormSubmit = async (data: RegraComissaoFormData) => {
    // Converte datas para o formato correto ou null se necessário antes de enviar
    const dataToSubmit: RegraComissaoInput = {
      ...data,
      valor: Number(data.valor), // Garante que valor seja número
      periodo_vigencia_inicio: data.periodo_vigencia_inicio ? format(data.periodo_vigencia_inicio, 'yyyy-MM-dd') : null,
      periodo_vigencia_fim: data.periodo_vigencia_fim ? format(data.periodo_vigencia_fim, 'yyyy-MM-dd') : null,
    };
    await onSubmit(dataToSubmit);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Regra *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Comissão Padrão Vendedor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Descreva brevemente o propósito desta regra..." {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="tipo_calculo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Cálculo *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="porcentagem">Porcentagem (%)</SelectItem>
                    <SelectItem value="valor_fixo">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="valor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor / Percentual *</FormLabel>
                <FormControl>
                  {/* O preprocess no Zod cuida da conversão para number */}
                  <Input type="number" step="0.01" placeholder="Ex: 5 ou 50.00" {...field} />
                </FormControl>
                <FormDescription>
                  {form.watch('tipo_calculo') === 'porcentagem' ? 'Insira apenas o número (ex: 5 para 5%)' : 'Insira o valor em R$'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ativa"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-8">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Regra Ativa?</FormLabel>
                  <FormDescription>
                    Marque para que esta regra possa ser utilizada.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="periodo_vigencia_inicio"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Início da Vigência</FormLabel>
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
                      selected={field.value ?? undefined} // Passa undefined se null
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="periodo_vigencia_fim"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fim da Vigência</FormLabel>
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
                      selected={field.value ?? undefined}
                      onSelect={field.onChange}
                      disabled={(date) => 
                        date < new Date("1900-01-01") || 
                        (form.getValues("periodo_vigencia_inicio") ? date < form.getValues("periodo_vigencia_inicio")! : false)
                      }
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-[#a16207] hover:bg-[#854d0e] text-white">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Salvando..." : "Salvar Regra"}
          </Button>
        </div>
      </form>
    </Form>
  );
}; 