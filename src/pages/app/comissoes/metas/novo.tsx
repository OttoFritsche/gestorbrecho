import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Calendar as CalendarIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
    metaVendaSchema, 
    MetaVendaFormData
} from "@/lib/validations/metaVendaSchema";
import { createMetaVenda } from "@/services/metaVendaService";
import { getVendedores } from "@/services/vendedorService";
import { cn } from "@/lib/utils";

export default function NovaMetaVendaPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Buscar vendedores para o select
  const { 
    data: vendedores = [], 
    isLoading: isLoadingVendedores, 
    isError: isErrorVendedores,
    error: errorVendedores
  } = useQuery({
    queryKey: ["vendedores"],
    queryFn: getVendedores,
  });

  // Configuração do formulário com React Hook Form e Zod
  const form = useForm<MetaVendaFormData>({
    resolver: zodResolver(metaVendaSchema),
    defaultValues: {
      vendedor_id: "",
      periodo_inicio: undefined,
      periodo_fim: undefined,
      meta_valor: null,
      meta_quantidade: null,
      observacoes: null,
    },
  });

  // Mutation para criar a meta de venda
  const createMutation = useMutation({
    mutationFn: createMetaVenda,
    onSuccess: () => {
      toast.success("Meta de venda criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["metasVenda"] });
      navigate("/app/comissoes/metas"); // Volta para a lista
    },
    onError: (error) => {
      console.error("Erro ao criar meta de venda:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro desconhecido ao criar meta."
      );
    },
  });

  // Handler de submissão
  const onSubmit = (data: MetaVendaFormData) => {
    console.log("Dados a serem enviados:", data);
    createMutation.mutate(data);
  };

  // Verifica se houve erro ao carregar vendedores
  if (isErrorVendedores) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Helmet>
          <title>Nova Meta de Venda | Gestor Brechó</title>
        </Helmet>
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative">
          <strong className="font-bold">Erro!</strong>
          <span className="block sm:inline"> Não foi possível carregar a lista de vendedores.</span>
          <p className="text-sm mt-2">
            {errorVendedores instanceof Error ? errorVendedores.message : "Erro desconhecido"}
          </p>
          <Button variant="outline" className="mt-2" onClick={() => navigate("/app/comissoes/metas")}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Nova Meta de Venda | Gestor Brechó</title>
      </Helmet>

      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/app/comissoes/metas")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">
            Nova Meta de Venda
          </h1>
        </div>
        <p className="text-muted-foreground">
          Defina uma nova meta de venda para um vendedor.
        </p>
      </div>

      {/* Formulário */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Meta</CardTitle>
              <CardDescription>
                Preencha as informações para criar a meta de venda.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Seleção de Vendedor */}
              <FormField
                control={form.control}
                name="vendedor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendedor *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o vendedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingVendedores ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Carregando...</span>
                          </div>
                        ) : vendedores.length > 0 ? (
                          vendedores.map((vendedor) => (
                            <SelectItem key={vendedor.id} value={vendedor.id}>
                              {vendedor.nome}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            Nenhum vendedor encontrado
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Selecione o vendedor que terá esta meta atribuída.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Período de Início */}
                <FormField
                  control={form.control}
                  name="periodo_inicio"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Início do Período *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
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
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Data de início da meta.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Período de Fim */}
                <FormField
                  control={form.control}
                  name="periodo_fim"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fim do Período *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
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
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Data de fim da meta.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Meta de Valor */}
                <FormField
                  control={form.control}
                  name="meta_valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta de Valor (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="Ex: 5000.00" 
                          {...field} 
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : parseFloat(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Valor financeiro a ser atingido no período.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Meta de Quantidade */}
                <FormField
                  control={form.control}
                  name="meta_quantidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta de Quantidade</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="1"
                          placeholder="Ex: 50" 
                          {...field}
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : parseInt(e.target.value, 10);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Quantidade de itens a serem vendidos no período.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Observações (opcional) */}
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações ou detalhes adicionais sobre esta meta."
                        className="resize-none"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormDescription>
                      Informações adicionais ou critérios específicos para esta meta.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
              <Button type="button" variant="outline" onClick={() => navigate("/app/comissoes/metas")}>
                Cancelar
              </Button>
              <Button 
                type="submit"
                className="bg-[#a16207] hover:bg-[#854d0e] text-white"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Meta"
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
} 