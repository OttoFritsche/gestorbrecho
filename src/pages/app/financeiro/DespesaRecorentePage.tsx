import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, CalendarIcon, InfoIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { cn, formatCurrencyInput, formatCurrency } from '@/lib/utils';
import { despesaSchema, DespesaFormData } from '@/lib/validations/despesaSchema';
import { addDespesa } from '@/services/despesas';
import { getFormasPagamento } from '@/services/formasPagamento';
import { Categoria, FormaPagamento } from '@/types/financeiro';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ensureOutrasDespesasExists, getCategorias as getCategoriasService } from '@/services/categoriaService';

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

// Dias da semana para o seletor semanal 
const diasSemana = [
  { value: '0', label: 'Domingo' },
  { value: '1', label: 'Segunda-feira' },
  { value: '2', label: 'Terça-feira' },
  { value: '3', label: 'Quarta-feira' },
  { value: '4', label: 'Quinta-feira' },
  { value: '5', label: 'Sexta-feira' },
  { value: '6', label: 'Sábado' },
];

// Opções para Tipo de Despesa
const opcoesTipoDespesa = [
  { value: 'negocio', label: 'Negócio' },
  { value: 'pessoal', label: 'Pessoal' },
];

const DespesaRecorrentePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [outrasDespesasCat, setOutrasDespesasCat] = useState<Categoria | null>(null);
  const [initialSetupDone, setInitialSetupDone] = useState(false);
  const [diaMensal, setDiaMensal] = useState<string>('1');

  useEffect(() => {
    const setupInitialCategory = async () => {
      try {
        const categoriaPadrao = await ensureOutrasDespesasExists();
        setOutrasDespesasCat(categoriaPadrao);
        await queryClient.invalidateQueries({ queryKey: ['categoriasDespesa'] });
      } catch (error) {
        console.error('Falha ao assegurar categoria "Outras Despesas":', error);
        toast.error('Erro ao configurar categorias padrão.');
      }
      setInitialSetupDone(true);
    };

    if (!initialSetupDone) {
      setupInitialCategory();
    }
  }, [queryClient, initialSetupDone]);

  // --- Busca de Dados --- 
  const { data: categorias, isLoading: isLoadingCategorias } = 
    useQuery<Categoria[], Error>({ 
      queryKey: ['categoriasDespesa'], 
      queryFn: () => getCategoriasService('despesa', true), 
      enabled: initialSetupDone,
    });

  // Buscar formas de pagamento
  const { data: formasPagamento, isLoading: isLoadingFormas } = 
    useQuery<FormaPagamento[], Error>({ 
      queryKey: ['formasPagamento'],
      queryFn: getFormasPagamento,
    });

  // --- Configuração do Formulário --- 
  const form = useForm<DespesaFormData>({
    resolver: zodResolver(despesaSchema),
    defaultValues: {
      descricao: '',
      valor: 0,
      categoria_id: '',
      data: null, // Data de pagamento inicialmente nula (será preenchida apenas quando pago=true)
      pago: false,
      data_vencimento: new Date(), // A data de vencimento é obrigatória para despesas recorrentes
      forma_pagamento_id: null,
      recorrente: true, // Sempre true nesta página
      frequencia: 'mensal', // Default para mensal
      tipo_despesa: 'negocio',
    },
  });

  // Observar valores relevantes do formulário
  const isPago = form.watch('pago');
  const frequencia = form.watch('frequencia');

  // Efeito para gerenciar a data de pagamento quando o status pago mudar
  useEffect(() => {
    // Se marcar como pago, definir a data de pagamento como hoje
    // Se desmarcar como pago, limpar a data de pagamento
    if (isPago) {
      form.setValue('data', new Date());
    } else {
      form.setValue('data', null);
    }
  }, [isPago, form]);

  // --- Mutações para Adicionar --- 
  const mutation = useMutation({ 
    mutationFn: (data: DespesaFormData) => {
      
      // Helper robusto para preparar datas
      const prepararData = (d: Date | null | undefined): string | null => {
        if (!d) {
          console.warn("Data indefinida detectada ao preparar dados");
          return null;
        }
        
        if (!(d instanceof Date)) {
          console.warn("Valor não é uma instância de Date ao preparar dados");
          return null;
        }
        
        if (isNaN(d.getTime())) {
          console.warn("Data inválida (NaN) detectada ao preparar dados");
          return null;
        }
        
        return d.toISOString();
      };
      
      // Verificação adicional para data_vencimento antes de preparar
      if (!data.data_vencimento) {
        console.log("Usando data atual como vencimento porque estava indefinida");
        data.data_vencimento = new Date();
      }
      
      // Verificação adicional para garantir que a frequência está definida
      if (!data.frequencia) {
        console.log("Frequência indefinida no mutationFn, definindo como 'mensal'");
        data.frequencia = 'mensal';
      }
      
      // Preparar os dados para envio
      const dataToSend = {
        ...data,
        // Remover forma_pagamento_id se não estiver pago
        forma_pagamento_id: data.pago ? data.forma_pagamento_id : null,
        // Usar helper para ambas as datas
        data: prepararData(data.data),
        data_vencimento: prepararData(data.data_vencimento),
        // Garantir que recorrente seja true (esta página só cria recorrentes)
        recorrente: true, 
        // Garantir que a frequência selecionada seja passada e nunca seja nula
        frequencia: data.frequencia || 'mensal'
      };
      
      // Limpar forma_pagamento_id explicitamente se não estiver pago
      if (!dataToSend.pago) {
          dataToSend.forma_pagamento_id = null;
      }
      
      // Log detalhado para depuração da data
      console.log("Dados da data de vencimento:", {
        original: data.data_vencimento,
        isDate: data.data_vencimento instanceof Date,
        isValid: data.data_vencimento instanceof Date ? !isNaN(data.data_vencimento.getTime()) : false,
        processada: dataToSend.data_vencimento
      });
      
      // Log detalhado para depuração da frequência
      console.log("Dados da frequência:", {
        original: data.frequencia,
        processada: dataToSend.frequencia
      });
      
      // Validação final com mensagem detalhada
      if (!dataToSend.data_vencimento) {
        console.error("Erro: Data de vencimento é nula ao tentar enviar despesa recorrente.", {
          dataOriginal: data.data_vencimento,
          dataProcessada: dataToSend.data_vencimento
        });
        throw new Error("Data de vencimento é obrigatória para despesas recorrentes.");
      }
      
      // Validação final para frequência com mensagem detalhada
      if (!dataToSend.frequencia) {
        console.error("Erro: Frequência é nula ao tentar enviar despesa recorrente.", {
          frequenciaOriginal: data.frequencia,
          frequenciaProcessada: dataToSend.frequencia
        });
        throw new Error("Frequência é obrigatória para despesas recorrentes.");
      }
      
      // Remover campos que não existem ou não devem ser enviados para addDespesa
      // (Ajustar conforme a definição EXATA de addDespesa)
      const { id, created_at, user_id, categoria_nome, forma_pagamento_nome, ...finalDataToSend } = dataToSend as any;

      console.log("Dados finais sendo enviados para addDespesa:", finalDataToSend);

      // TODO: Idealmente, teríamos uma função addDespesaRecorrente ou addDespesa 
      //       seria atualizada para aceitar e processar 'recorrente' e 'frequencia'.
      //       A função addDespesa foi atualizada para incluir recorrente e frequencia.
      return addDespesa(finalDataToSend);
    },
    onSuccess: () => {
      toast.success(`Despesa recorrente adicionada com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardFinanceiroData'] });
      navigate('/app/despesas');
    },
    onError: (error) => {
      console.error("Erro ao cadastrar despesa recorrente:", error);
      toast.error(`Erro ao adicionar despesa recorrente: ${error.message}. Verifique todos os campos obrigatórios.`);
    },
  });

  // --- Lógica de Submissão --- 
  const onSubmit = (data: DespesaFormData) => {
    // Garantir que data_vencimento esteja definida
    if (!data.data_vencimento) {
      data.data_vencimento = new Date();
      console.log("Definindo data de vencimento padrão");
    }
    
    // Verificação adicional para garantir que é uma data válida
    if (!(data.data_vencimento instanceof Date) || isNaN(data.data_vencimento.getTime())) {
      console.log("Corrigindo data de vencimento inválida");
      data.data_vencimento = new Date();
    }
    
    mutation.mutate(data);
  };

  // Ajustar o dia mensal
  const handleDiaMensalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setDiaMensal('');
      return;
    }
    
    const num = parseInt(value);
    if (!isNaN(num) && num >= 1 && num <= 31) {
      setDiaMensal(num.toString());
      
      // Atualizar apenas a data de vencimento com o novo dia do mês
      const dataVencimento = form.getValues('data_vencimento') || new Date();
      const novaDataVencimento = new Date(dataVencimento);
      novaDataVencimento.setDate(num);
      form.setValue('data_vencimento', novaDataVencimento);
      
      // Se estiver pago, pode atualizar também a data de pagamento
      if (isPago) {
        const dataPagamento = form.getValues('data') || new Date();
        const novaDataPagamento = new Date(dataPagamento);
        novaDataPagamento.setDate(num);
        form.setValue('data', novaDataPagamento);
      }
    }
  };
  
  // --- Renderização --- 
  // Loading states
  const isLoading = !initialSetupDone || isLoadingCategorias || isLoadingFormas;

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /> Carregando...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Cabeçalho com botão voltar à esquerda e título/subtítulo centralizado */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b w-full">
        {/* Botão Voltar */}
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate('/app/despesas/nova')}
          aria-label="Voltar para despesa não recorrente"
          className="flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        {/* Bloco Título/Subtítulo Centralizado */}
        <div className="flex-grow text-center px-4">
          <h2 className="text-3xl font-bold font-serif text-[#92400e]">Despesa Recorrente</h2>
          <p className="text-muted-foreground mt-1">Configure uma despesa que se repete regularmente.</p>
        </div>

        {/* Espaço reservado para manter a centralização, se necessário (pode ser ajustado/removido) */}
        <div className="w-[40px] flex-shrink-0"></div>

      </div>

      {/* --- Formulário --- */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow space-y-6">
          
          {/* Banner de Despesa Recorrente */}
          <div className="bg-orange-50 p-4 rounded-md mb-4 flex items-start space-x-3 border border-orange-200">
            <InfoIcon className="h-6 w-6 text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-orange-800 mb-1">Configurando uma Despesa Recorrente</h3>
              <p className="text-sm text-orange-700">
                Você está cadastrando uma despesa que se repetirá regularmente, como uma mensalidade escolar ou assinatura.
                Preencha os detalhes abaixo para configurar como e quando esta despesa se repetirá.
              </p>
            </div>
          </div>
          
          {/* Descrição */} 
          <div className="grid grid-cols-1">
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Mensalidade Escola, Assinatura Netflix" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Valor */} 
          <div className="grid grid-cols-1">
            <FormField
              control={form.control}
              name="valor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Mensal</FormLabel>
                  <FormControl>
                    <Input 
                      type="text"
                      placeholder="R$ 0,00"
                      value={field.value !== null && field.value !== undefined ? formatCurrency(field.value) : ''}
                      onChange={(e) => {
                        // Transformar o valor formatado em número
                        const formatted = e.target.value.replace(/\D/g, '');
                        const numberValue = parseInt(formatted, 10) / 100 || 0;
                        field.onChange(numberValue);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Linha: Categorias e Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Campo Categoria */} 
            <FormField
              control={form.control}
              name="categoria_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingCategorias ? "Carregando..." : "Selecione a categoria"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categorias?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Tipo Despesa */} 
            <FormField
              control={form.control}
              name="tipo_despesa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo da Despesa</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ""} 
                    defaultValue={field.value || ""} 
                  > 
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {opcoesTipoDespesa.map((opcao) => (
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
          </div>

          {/* --- Configuração da Recorrência --- */}
          <div className="border-t border-b py-4 my-4">
            <h3 className="text-lg font-medium mb-4">Configuração da Recorrência</h3>
            
            {/* Frequência */}
            <div className="mb-6">
              <FormField
                control={form.control}
                name="frequencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Com que frequência esta despesa se repete?</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value} 
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
            </div>

            {/* Configuração específica baseada na frequência */}
            {frequencia === 'mensal' && (
              <div className="mb-6">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Qual o dia do pagamento mensal?</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={diaMensal}
                      onChange={handleDiaMensalChange}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">Digite um número entre 1 e 31</span>
                  </div>
                </div>
              </div>
            )}

            {frequencia === 'semanal' && (
              <div className="mb-6">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Em que dia da semana?</label>
                  <Select 
                    onValueChange={(value) => {
                      // Atualizar a data no formulário para refletir o dia da semana selecionado
                      const dataAtual = new Date();
                      const diaAtual = dataAtual.getDay();
                      const diaSelecionado = parseInt(value);
                      const diff = diaSelecionado - diaAtual;
                      dataAtual.setDate(dataAtual.getDate() + diff);
                      form.setValue('data', dataAtual);
                    }} 
                    defaultValue="1"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o dia" />
                    </SelectTrigger>
                    <SelectContent>
                      {diasSemana.map((dia) => (
                        <SelectItem key={dia.value} value={dia.value}>
                          {dia.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* --- Próximo Pagamento --- */}
          <div className="border-b pb-4 mb-4">
            <h3 className="text-lg font-medium mb-4">Configuração de Datas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Data de Vencimento */}
              <FormField
                control={form.control}
                name="data_vencimento"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="font-medium text-orange-800">Data de Vencimento *</FormLabel>
                    <FormDescription>
                      Quando esta despesa vence todo mês (ex: dia 10 de cada mês)
                    </FormDescription>
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
                          onSelect={(date) => {
                            field.onChange(date);
                            // Se for mensal, atualizar o dia do mês no input
                            if (frequencia === 'mensal' && date) {
                              setDiaMensal(date.getDate().toString());
                            }
                          }}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campo Pago? e Forma de Pagamento num combo */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="pago"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Esta parcela já foi paga?</FormLabel>
                        <FormDescription>Marque se já realizou o primeiro pagamento</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {isPago && (
                  <>
                    {/* Data de Pagamento - só exibida quando a despesa está marcada como paga */}
                    <FormField
                      control={form.control}
                      name="data"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data do Pagamento</FormLabel>
                          <FormDescription>
                            Quando o pagamento foi realizado
                          </FormDescription>
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
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                initialFocus
                                locale={ptBR}
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
                            value={field.value || ""} 
                            defaultValue={field.value || ""} 
                          > 
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a forma de pagamento" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {formasPagamento?.map((fp) => (
                                <SelectItem key={fp.id} value={fp.id}>
                                  {fp.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Observação sobre funcionalidade futura */}
          <div className="bg-blue-50 p-4 rounded-md mb-4 flex items-start space-x-3">
            <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-700">
                As próximas parcelas desta despesa recorrente serão geradas automaticamente conforme a frequência configurada.
                Você poderá marcar cada parcela como paga quando o pagamento for realizado.
              </p>
            </div>
          </div>

          {/* Botões de Submit/Cancelar */} 
          <div className="flex justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/app/despesas/nova')} 
              className="mr-4" 
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-orange-500 hover:bg-orange-600" 
              disabled={mutation.isPending}
            >
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} 
              Adicionar Despesa Recorrente
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default DespesaRecorrentePage; 