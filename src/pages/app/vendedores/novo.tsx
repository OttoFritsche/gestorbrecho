import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { vendedorSchema } from "@/lib/validations/vendedorSchema";
import { createVendedor } from "@/services/vendedorService";

// Tipo para os dados do formulário baseado no schema
type VendedorFormValues = z.infer<typeof vendedorSchema>;

export default function NovoVendedor() {
  const navigate = useNavigate();
  
  // Define o formulário com React Hook Form + Zod
  const form = useForm<VendedorFormValues>({
    resolver: zodResolver(vendedorSchema),
    defaultValues: {
      nome: "",
      email: null,
      telefone: null,
      data_contratacao: null,
    },
  });
  
  // Mutation para criar vendedor usando React Query
  const criarVendedorMutation = useMutation({
    mutationFn: createVendedor,
    onSuccess: () => {
      toast.success("Vendedor cadastrado com sucesso!");
      navigate("/app/vendedores");
    },
    onError: (error) => {
      console.error("Erro ao cadastrar vendedor:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Erro ao cadastrar vendedor. Tente novamente."
      );
    },
  });
  
  // Handler para submissão do formulário
  const onSubmit = (data: VendedorFormValues) => {
    criarVendedorMutation.mutate(data);
  };
  
  // Handler para cancelar e voltar para a listagem
  const handleCancel = () => {
    navigate("/app/vendedores");
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Novo Vendedor | Gestor Brechó</title>
      </Helmet>
      
      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/app/vendedores")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">
            Novo Vendedor
          </h1>
        </div>
        <p className="text-muted-foreground">
          Preencha o formulário abaixo para cadastrar um novo vendedor
        </p>
      </div>
      
      {/* Formulário */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Vendedor</CardTitle>
              <CardDescription>
                Informações básicas para o cadastro do vendedor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nome */}
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do vendedor" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nome completo do vendedor para identificação no sistema
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="email@exemplo.com" 
                          {...field} 
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormDescription>
                        Email para contato com o vendedor
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Telefone */}
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(00) 00000-0000" 
                          {...field} 
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormDescription>
                        Número de telefone para contato
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Data de contratação */}
              <FormField
                control={form.control}
                name="data_contratacao"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de contratação</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`w-full pl-3 text-left font-normal ${
                              !field.value ? "text-muted-foreground" : ""
                            }`}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Data em que o vendedor foi contratado
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button 
                type="submit"
                className="bg-[#a16207] hover:bg-[#854d0e] text-white"
                disabled={criarVendedorMutation.isPending}
              >
                {criarVendedorMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Vendedor"
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
} 