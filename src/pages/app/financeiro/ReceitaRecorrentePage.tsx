import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Loader2, Calendar as CalendarIcon } from 'lucide-react';

import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn, formatCurrencyInput } from '@/lib/utils';

import { receitaSchema, ReceitaFormData } from '@/lib/validations/receitaSchema';
import { Receita } from '@/types/financeiro';
import { addReceita, getFormasPagamento } from '@/services/receitas';
import CategoriaSelect from '@/components/categorias/CategoriaSelect';
import { ensureReceitasCategoriesExist } from '@/services/categoriaService';

// Opções de Frequência para o Select
const opcoesFrequencia = [
  { value: 'diaria', label: 'Diária' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quinzenal', label: 'Quinzenal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'bimestral', label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
];

// Interface para os dados do formulário interno (usando Date)
interface ReceitaFormInternalData extends Omit<ReceitaFormData, 'data'> {
  data: Date;
}

const ReceitaRecorrentePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [initialSetupDone, setInitialSetupDone] = useState(false);

  // Inicialização para categorias padrão
  useEffect(() => {
    const setupInitialCategories = async () => {
      try {
        console.log('Verificando/Criando categorias padrão de receita...');
        const categoriasPadrao = await ensureReceitasCategoriesExist();
        console.log('Categorias padrão de receita verificadas:', categoriasPadrao.length);
        // Invalida a query de categorias para garantir que serão recarregadas
        await queryClient.invalidateQueries({ queryKey: ['categorias', 'receita'] });
      } catch (error) {
        console.error('Falha ao verificar categorias padrão de receita:', error);
        toast.error('Erro ao configurar categorias padrão. Algumas opções podem não estar disponíveis.');
      }
      setInitialSetupDone(true);
    };

    if (!initialSetupDone) {
      setupInitialCategories();
    }
  }, [queryClient, initialSetupDone]);

  // Usar o tipo interno com Date aqui
  const form = useForm<ReceitaFormInternalData>({
    defaultValues: {
      descricao: '',
      valor: 0,
      data: new Date(),
      categoria_id: '',
      tipo: 'outro',
      forma_pagamento_id: null,
      recorrente: true,
      frequencia: 'mensal',
    },
  });

  // Busca formas de pagamento
  const { data: formasPagamento = [], isLoading: isLoadingFormas } = useQuery<{ id: string; nome: string }[]>({
    queryKey: ['formasPagamento'],
    queryFn: getFormasPagamento,
  });

  // Mutação para adicionar
  const mutation = useMutation({
    mutationFn: (data: ReceitaFormInternalData) => {
      // Formatar data para string para a API
      const formattedData: ReceitaFormData = {
        ...data,
        data: format(data.data, 'yyyy-MM-dd'),
        forma_pagamento_id: data.forma_pagamento_id || null,
        recorrente: true,
      };

      return addReceita(formattedData);
    },
    onSuccess: () => {
      toast.success('Receita recorrente adicionada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['receitas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardFinanceiroData'] });
      navigate('/app/receitas');
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar receita recorrente: ${error.message}`);
    },
  });

  // Handler de submit
  const onSubmit = (data: ReceitaFormInternalData) => {
    mutation.mutate(data);
  };

  // Verificar estado de carregamento
  const isLoading = isLoadingFormas;

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /> Carregando...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Cabeçalho com botão voltar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b w-full">
        {/* Botão Voltar */}
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate('/app/receitas')} 
          aria-label="Voltar"
          className="flex-shrink-0" 
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        {/* Bloco Título/Subtítulo Centralizado */}
        <div className="flex-grow text-center px-4">
          <h1 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">Adicionar Receita Recorrente</h1>
          <p className="text-muted-foreground">Registre uma receita que se repete regularmente.</p>
        </div>
        
        {/* Espaço vazio para manter alinhamento */}
        <div className="w-10"></div>
      </div>
      
      {/* Formulário */}
      <div className="max-w-3xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Card de Informações Básicas */}
            <div className="bg-white rounded-lg shadow p-6 border">
              <h2 className="text-lg font-medium mb-4">Informações da Receita Recorrente</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Campo Descrição */}
                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Aluguel de espaço" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo Valor */}
                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                          <Input
                            type="text"
                            placeholder="0,00"
                            className="pl-10"
                            value={formatCurrencyInput(field.value)}
                            onChange={(e) => {
                              const formatted = e.target.value.replace(/\D/g, '');
                              const numberValue = parseInt(formatted, 10) / 100 || 0;
                              field.onChange(numberValue);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Frequência */}
                <FormField
                  control={form.control}
                  name="frequencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequência de Recorrência *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || 'mensal'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a frequência" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {opcoesFrequencia.map((opcao) => (
                            <SelectItem key={opcao.value} value={opcao.value}>
                              {opcao.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo Data */}
                <FormField
                  control={form.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data Inicial *</FormLabel>
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
                                <span>Selecione uma data</span>
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
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Forma de Pagamento */}
                <FormField
                  control={form.control}
                  name="forma_pagamento_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a forma de pagamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {formasPagamento.map((forma) => (
                            <SelectItem key={forma.id} value={forma.id}>
                              {forma.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Seleção de Categoria */}
                <FormField
                  control={form.control}
                  name="categoria_id"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Categoria *</FormLabel>
                      <FormControl>
                        <CategoriaSelect
                          value={field.value}
                          onChange={field.onChange}
                          tipo="receita"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/app/receitas')}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                className="bg-[#a16207] hover:bg-[#854d0e] text-white"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  'Adicionar Receita Recorrente'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ReceitaRecorrentePage; 