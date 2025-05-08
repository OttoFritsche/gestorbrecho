"use client";

import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

const formSchema = z.object({
  descricao: z.string().min(2, {
    message: "Descrição deve ter pelo menos 2 caracteres.",
  }),
  valor: z.coerce.number().positive({
    message: "Valor deve ser um número positivo.",
  }),
  data: z.date({
    required_error: "Por favor, selecione uma data.",
  }),
  categoria: z.string({
    required_error: "Por favor, selecione uma categoria.",
  }),
});

type ReceitaFormValues = z.infer<typeof formSchema>;

interface ReceitaFormProps {
  onSubmitSuccess?: (data: ReceitaFormValues) => void;
}

const ReceitaForm: React.FC<ReceitaFormProps> = ({ onSubmitSuccess }) => {
  const form = useForm<ReceitaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: "",
      categoria: undefined,
    },
  });

  function onSubmit(values: ReceitaFormValues) {
    console.log("Dados do formulário:", values);
    toast({
      title: "Receita (Simulada)",
      description: `Descrição: ${values.descricao}, Valor: ${values.valor}, Data: ${values.data.toLocaleDateString()}`,
    });
    if (onSubmitSuccess) {
      onSubmitSuccess(values);
    }
    // TODO: Integrar com API/Supabase quando disponível
    // TODO: Resetar o formulário ou fechar o Dialog
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Venda Camisa Floral" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="valor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor (R$)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="Ex: 150.75" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="data"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data da Receita</FormLabel>
              <FormControl>
                <DatePicker 
                  selected={field.value} 
                  onSelect={field.onChange} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Venda Produto">Venda Produto</SelectItem>
                  <SelectItem value="Vestuário">Vestuário</SelectItem>
                  <SelectItem value="Serviço">Serviço</SelectItem>
                  <SelectItem value="Outra Receita">Outra Receita</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit">Salvar Receita</Button>
      </form>
    </Form>
  );
};

export default ReceitaForm; 