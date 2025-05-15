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

  // Função utilitária para parsear field.value para Date
  const parseFieldValueToDate = (value: string | Date | null | undefined, fieldName: string): Date | undefined => {
    if (value === null || value === undefined || value === '') {
      // console.log(`[RegraComissaoForm] ${fieldName}: field.value é null, undefined ou string vazia.`);
      return undefined;
    }

    if (value instanceof Date) {
      // console.log(`[RegraComissaoForm] ${fieldName}: field.value já é Date:`, value);
      if (isNaN(value.getTime())) {
          console.error(`[RegraComissaoForm] ${fieldName}: field.value é um Invalid Date (instância Date recebida):`, value);
          return undefined;
      }
      return value;
    }

    if (typeof value === 'string' && value.includes('-')) {
      console.log(`[RegraComissaoForm] ${fieldName}: Tentando parsear string: '${value}'`);
      const parts = value.split('-').map(s => parseInt(s, 10)); // Usar parseInt com radix
      console.log(`[RegraComissaoForm] ${fieldName}: Parts após split e parseInt:`, parts);

      if (parts.length === 3 && !parts.some(isNaN)) {
        const year = parts[0];
        const monthJs = parts[1] - 1; // Mês para JS (0-11)
        const day = parts[2];
        
        // Validação básica de sanidade dos componentes da data
        if (year < 1900 || year > 3000 || monthJs < 0 || monthJs > 11 || day < 1 || day > 31) {
            console.error(`[RegraComissaoForm] ${fieldName}: Componentes da data fora do intervalo esperado. Ano: ${year}, Mês (JS): ${monthJs}, Dia: ${day}. String original: '${value}'`);
            return undefined;
        }

        console.log(`[RegraComissaoForm] ${fieldName}: Criando Date com: year=${year}, monthIndex=${monthJs}, day=${day}`);
        const newDate = new Date(year, monthJs, day);
        
        if (isNaN(newDate.getTime())) {
          console.error(`[RegraComissaoForm] ${fieldName}: new Date(${year}, ${monthJs}, ${day}) resultou em Invalid Date. String original: '${value}'`);
          return undefined;
        }
        // console.log(`[RegraComissaoForm] ${fieldName}: Date criado com sucesso:`, newDate.toISOString());
        return newDate;
      } else {
        console.error(`[RegraComissaoForm] ${fieldName}: Parts inválidos (não são 3) ou não numéricos da string: '${value}'. Parts:`, parts);
        return undefined;
      }
    }

    console.error(`[RegraComissaoForm] ${fieldName}: Tipo/formato inesperado para field.value que não é null/undefined/string vazia/Date/string com '-':`, value, `(Tipo: ${typeof value})`);
    return undefined;
  };

  const form = useForm<RegraComissaoFormData>({
    resolver: zodResolver(regraComissaoSchema),
    defaultValues: initialData || {
      nome: '',
      descricao: '',
      tipo_calculo: '',
      valor: null,
      ativa: true,
      periodo_vigencia_inicio: null, // Será processado por parseFieldValueToDate na renderização
      periodo_vigencia_fim: null,    // Será processado por parseFieldValueToDate na renderização
    },
  });

  // console.log('[RegraComissaoForm] InitialData recebido:', initialData);
  // console.log('[RegraComissaoForm] DefaultValues do formulário:', form.formState.defaultValues);

  const handleFormSubmit = async (data: RegraComissaoFormData) => {
    console.log("[RegraComissaoForm] Dados brutos do formulário no submit (data):", JSON.parse(JSON.stringify(data)));

    let p_inicio_str: string | null = null;
    if (data.periodo_vigencia_inicio) {
      const dateObjInicio = data.periodo_vigencia_inicio instanceof Date 
                           ? data.periodo_vigencia_inicio 
                           : parseFieldValueToDate(data.periodo_vigencia_inicio as string, "submit_handle_inicio");
      
      if (dateObjInicio && !isNaN(dateObjInicio.getTime())) {
        p_inicio_str = format(dateObjInicio, 'yyyy-MM-dd');
        console.log(`[RegraComissaoForm] SUBMIT periodo_vigencia_inicio formatado para string: ${p_inicio_str}`);
      } else {
        console.warn("[RegraComissaoForm] SUBMIT periodo_vigencia_inicio (valor original:", data.periodo_vigencia_inicio, ") não pôde ser formatado para string, será null.");
      }
    }

    let p_fim_str: string | null = null;
    if (data.periodo_vigencia_fim) {
      const dateObjFim = data.periodo_vigencia_fim instanceof Date
                         ? data.periodo_vigencia_fim
                         : parseFieldValueToDate(data.periodo_vigencia_fim as string, "submit_handle_fim");

      if (dateObjFim && !isNaN(dateObjFim.getTime())) {
        p_fim_str = format(dateObjFim, 'yyyy-MM-dd');
        console.log(`[RegraComissaoForm] SUBMIT periodo_vigencia_fim formatado para string: ${p_fim_str}`);
      } else {
        console.warn("[RegraComissaoForm] SUBMIT periodo_vigencia_fim (valor original:", data.periodo_vigencia_fim, ") não pôde ser formatado para string, será null.");
      }
    }

    // Cria um novo objeto para dataToSubmit para evitar modificar o 'data' original do react-hook-form
    // e para garantir a ordem correta de espalhamento e substituição.
    const { 
      periodo_vigencia_inicio: originalInicio, 
      periodo_vigencia_fim: originalFim, 
      ...restOfData 
    } = data;

    const dataToSubmit: RegraComissaoInput = {
      ...restOfData, // Espalha outros campos (nome, descricao, tipo_calculo, valor, ativa)
      periodo_vigencia_inicio: p_inicio_str,
      periodo_vigencia_fim: p_fim_str,
      // Garante que valor seja número ou 0. Se o campo for opcional e puder ser undefined/null no schema.
      valor: (typeof data.valor === 'number' && !isNaN(data.valor)) ? data.valor : 0, 
    };

    console.log("[RegraComissaoForm] Dados COMPLETOS para submeter (dataToSubmit):", JSON.parse(JSON.stringify(dataToSubmit)));
    
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
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="Ex: 5 ou 50.00" 
                    {...field} 
                    value={field.value === null ? '' : String(field.value)} // Convertido para string para o input
                    onChange={e => {
                      const val = e.target.value;
                      // Permite string vazia para limpar, senão parseia para float ou null
                      field.onChange(val === '' ? null : parseFloat(val)); 
                    }}
                  />
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
                        {field.value ? (() => {
                          const dateObject = parseFieldValueToDate(field.value, "periodo_vigencia_inicio (render button)");
                          if (dateObject) {
                            try {
                              return format(dateObject, "PPP", { locale: ptBR });
                            } catch (e) {
                              console.error(`[RegraComissaoForm] Erro ao formatar (PPP) periodo_vigencia_inicio para botão:`, dateObject, e);
                              return <span>Erro Data</span>;
                            }
                          }
                          return field.value === null || field.value === undefined || field.value === '' ? <span>Escolha uma data</span> : <span>Data Inválida</span>;
                        })() : (
                          <span>Escolha uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parseFieldValueToDate(field.value, "periodo_vigencia_inicio (calendar selected)")}
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
                        {field.value ? (() => {
                          const dateObject = parseFieldValueToDate(field.value, "periodo_vigencia_fim (render button)");
                          if (dateObject) {
                            try {
                              return format(dateObject, "PPP", { locale: ptBR });
                            } catch (e) {
                              console.error(`[RegraComissaoForm] Erro ao formatar (PPP) periodo_vigencia_fim para botão:`, dateObject, e);
                              return <span>Erro Data</span>;
                            }
                          }
                          return field.value === null || field.value === undefined || field.value === '' ? <span>Escolha uma data</span> : <span>Data Inválida</span>;
                        })() : (
                          <span>Escolha uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parseFieldValueToDate(field.value, "periodo_vigencia_fim (calendar selected)")}
                      onSelect={field.onChange}
                      disabled={(date) => 
                        date < new Date("1900-01-01") || 
                        (form.getValues("periodo_vigencia_inicio") ? date < (parseFieldValueToDate(form.getValues("periodo_vigencia_inicio"), "fim_disabled_check_inicio") || new Date(0)) : false)
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