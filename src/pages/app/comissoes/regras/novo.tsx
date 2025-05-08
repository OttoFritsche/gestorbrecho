import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Calendar as CalendarIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
    regraComissaoSchema, 
    RegraComissaoFormData, 
    tiposCalculoComissao 
} from "@/lib/validations/regraComissaoSchema";
import { createRegraComissao } from "@/services/regrasComissaoService";
import { cn } from "@/lib/utils";

export default function NovaRegraComissaoPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Configuração do formulário com React Hook Form e Zod
  const form = useForm<RegraComissaoFormData>({
    resolver: zodResolver(regraComissaoSchema),
    defaultValues: {
      nome: "",
      tipo_calculo: undefined, // Começa sem tipo selecionado
      valor: 0,
      criterio_aplicacao: null,
      periodo_vigencia_inicio: null,
      periodo_vigencia_fim: null,
      ativa: true, // Padrão ativa
    },
  });

  // Mutation para criar a regra
  const createMutation = useMutation({
    mutationFn: createRegraComissao,
    onSuccess: () => {
      toast.success("Regra de comissão criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["regrasComissao"] });
      navigate("/app/comissoes/regras"); // Volta para a lista
    },
    onError: (error) => {
      console.error("Erro ao criar regra de comissão:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro desconhecido ao criar regra."
      );
    },
  });

  // Handler de submissão
  const onSubmit = (data: RegraComissaoFormData) => {
    // Opcional: Tratar criterio_aplicacao antes de enviar (ex: parse JSON)
    // const submitData = {
    //     ...data,
    //     criterio_aplicacao: data.criterio_aplicacao ? JSON.parse(data.criterio_aplicacao) : null // Exemplo
    // };
    console.log("Dados a serem enviados:", data);
    createMutation.mutate(data);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Nova Regra de Comissão | Gestor Brechó</title>
      </Helmet>

      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/app/comissoes/regras")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">
            Nova Regra de Comissão
          </h1>
        </div>
        <p className="text-muted-foreground">
          Defina os detalhes para uma nova regra de cálculo de comissão.
        </p>
      </div>

      {/* Formulário */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Regra</CardTitle>
              <CardDescription>
                Preencha as informações para criar a regra.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nome da Regra */}
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Regra *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Comissão Padrão 5%" {...field} />
                    </FormControl>
                    <FormDescription>
                      Um nome claro para identificar a regra.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo de Cálculo */}
                <FormField
                  control={form.control}
                  name="tipo_calculo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Cálculo *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione como calcular" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tiposCalculoComissao.map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>
                              {/* Melhorar a exibição do tipo aqui */}
                              {tipo === 'porcentagem' && 'Porcentagem (%)'}
                              {tipo === 'valor_fixo' && 'Valor Fixo (R$)'}
                              {tipo === 'por_item' && 'Por Item (R$)'}
                              {tipo === 'por_categoria' && 'Por Categoria'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Define como o valor/taxa será aplicado.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Valor/Taxa */}
                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor / Taxa (%) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" // Permite decimais
                          placeholder={form.watch('tipo_calculo') === 'porcentagem' ? "Ex: 5 (para 5%)" : "Ex: 10.50"} 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        {form.watch('tipo_calculo') === 'porcentagem' 
                          ? 'A porcentagem a ser aplicada.' 
                          : 'O valor fixo em R$.'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Critério de Aplicação (JSON/Texto) */}
              <FormField
                control={form.control}
                name="criterio_aplicacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Critérios de Aplicação (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Opcional. Ex: {\"categoria_id\": \"uuid...\"} ou notas sobre a aplicação.'
                        className="resize-none"
                        {...field}
                        value={field.value || ''} // Garante que o valor seja sempre string ou vazio
                        onChange={(e) => field.onChange(e.target.value || null)} // Envia null se vazio
                      />
                    </FormControl>
                    <FormDescription>
                      Condições específicas (em formato JSON ou texto) para esta regra ser aplicada.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Período Vigência Início */}
                 <FormField
                  control={form.control}
                  name="periodo_vigencia_inicio"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Início da Vigência (Opcional)</FormLabel>
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
                            // disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        A regra só será aplicada a partir desta data.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                 {/* Período Vigência Fim */}
                 <FormField
                  control={form.control}
                  name="periodo_vigencia_fim"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fim da Vigência (Opcional)</FormLabel>
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
                            // disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        A regra não será aplicada após esta data.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Status Ativa */}
               <FormField
                control={form.control}
                name="ativa"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Regra Ativa</FormLabel>
                      <FormDescription>
                        Marque para que esta regra seja considerada nos cálculos de comissão.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
              <Button type="button" variant="outline" onClick={() => navigate("/app/comissoes/regras")}>
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
                  "Salvar Regra"
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
} 