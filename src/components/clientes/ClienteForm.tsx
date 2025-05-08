"use client";

import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from 'lucide-react';

// Schema de validação Zod para Cliente
const formSchema = z.object({
  nome: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres." }),
  telefone: z.string().optional(),
  email: z.string().email({ message: "Email inválido." }).optional().or(z.literal('')),
  endereco: z.string().optional(),
  observacoes: z.string().optional(),
  classificacao: z.enum(['potencial', 'ativo', 'inativo', 'vip']).default('ativo'),
  limite_credito: z.coerce.number().min(0).optional().default(0),
  indicado_por: z.string().optional(),
  aceita_email: z.boolean().default(true),
  aceita_sms: z.boolean().default(true),
  aceita_whatsapp: z.boolean().default(true),
  // 'ativo' é gerenciado separadamente ou definido como true por padrão na criação
});

type ClienteFormValues = z.infer<typeof formSchema>;

// Reutiliza a interface Cliente (ou importa)
interface Cliente {
  id: string; 
  nome: string;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  observacoes: string | null;
  classificacao: string;
  limite_credito: number | null;
  indicado_por: string | null;
  aceita_email: boolean;
  aceita_sms: boolean;
  aceita_whatsapp: boolean;
  ativo: boolean;
}

interface ClienteFormProps {
  cliente?: Cliente | null;
  onSuccess?: () => void;
}

export function ClienteForm({ cliente, onSuccess }: ClienteFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: cliente?.nome ?? "",
      telefone: cliente?.telefone ?? "",
      email: cliente?.email ?? "",
      endereco: cliente?.endereco ?? "",
      observacoes: cliente?.observacoes ?? "",
      classificacao: (cliente?.classificacao as "potencial" | "ativo" | "inativo" | "vip") ?? "ativo",
      limite_credito: cliente?.limite_credito ?? 0,
      indicado_por: cliente?.indicado_por ?? "",
      aceita_email: cliente?.aceita_email ?? false,
      aceita_sms: cliente?.aceita_sms ?? false,
      aceita_whatsapp: cliente?.aceita_whatsapp ?? false,
    },
  });

  React.useEffect(() => {
    if (cliente) {
      form.reset({
        nome: cliente.nome ?? "",
        telefone: cliente.telefone ?? "",
        email: cliente.email ?? "",
        endereco: cliente.endereco ?? "",
        observacoes: cliente.observacoes ?? "",
        classificacao: (cliente.classificacao as "potencial" | "ativo" | "inativo" | "vip") ?? "ativo",
        limite_credito: cliente.limite_credito ?? 0,
        indicado_por: cliente.indicado_por ?? "",
        aceita_email: cliente.aceita_email ?? false,
        aceita_sms: cliente.aceita_sms ?? false,
        aceita_whatsapp: cliente.aceita_whatsapp ?? false,
      });
    } else {
      form.reset({
        nome: "",
        telefone: "",
        email: "",
        endereco: "",
        observacoes: "",
        classificacao: "ativo",
        limite_credito: 0,
        indicado_por: "",
        aceita_email: true,
        aceita_sms: true,
        aceita_whatsapp: true,
      });
    }
  }, [cliente, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const dataToSubmit = {
      ...values,
      nome: values.nome,
      limite_credito: Number(values.limite_credito) || 0,
    };

    try {
      let error = null;
      if (cliente?.id) {
        const { error: updateError } = await supabase
          .from("clientes")
          .update(dataToSubmit)
          .match({ id: cliente.id });
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("clientes")
          .insert([{ ...dataToSubmit, ativo: true }])
          .select();
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `Cliente ${cliente?.id ? 'atualizado' : 'cadastrado'} com sucesso.`,
      });
      onSuccess?.();
      if (!cliente?.id) {
        form.reset();
      }
    } catch (error: any) {
      console.error("Erro ao salvar cliente:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar o cliente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo*</FormLabel>
              <FormControl>
                <Input placeholder="Nome do Cliente" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="cliente@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="endereco"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input placeholder="Rua, Número, Bairro..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="classificacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Classificação</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="potencial">Potencial</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="limite_credito"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Limite de Crédito (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="indicado_por"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Indicado Por</FormLabel>
              <FormControl>
                <Input placeholder="Nome de quem indicou" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea placeholder="Anotações sobre o cliente..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-2">
          <FormLabel>Preferências de Contato</FormLabel>
          <div className="flex flex-wrap gap-4 items-center">
            <FormField
              control={form.control}
              name="aceita_email"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">Email</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="aceita_sms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">SMS</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="aceita_whatsapp"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">WhatsApp</FormLabel>
                </FormItem>
              )}
            />
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {cliente?.id ? "Salvar Alterações" : "Cadastrar Cliente"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default ClienteForm;
