import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, InfoIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { cn, formatCurrencyInput, formatCurrency } from '@/lib/utils'; // cn para merge de classes, formatCurrencyInput para input de valor, formatCurrency para exibição
import { despesaSchema, DespesaFormData } from '@/lib/validations/despesaSchema';
import { addDespesa, updateDespesa, getCategoriasDespesa, getDespesaById } from '@/services/despesas';
import { getFormasPagamento } from '@/services/formasPagamento';
import { Despesa, Categoria, FormaPagamento } from '@/types/financeiro';
import { format, parseISO } from 'date-fns'; // Para formatar datas
import { ptBR } from 'date-fns/locale'; // Importar locale ptBR
import { Calendar as CalendarIcon } from 'lucide-react'; // Renomear para evitar conflito
import { ensureOutrasDespesasExists, getCategorias as getCategoriasService } from '@/services/categoriaService';

// Opções para Tipo de Despesa
const opcoesTipoDespesa = [
  { value: 'negocio', label: 'Negócio' },
  { value: 'pessoal', label: 'Pessoal' },
];

const DespesaFormPage: React.FC = () => {
  // DEBUG: Log no início do componente
  console.log("DespesaFormPage: Componente renderizando...");

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);
  const [outrasDespesasCat, setOutrasDespesasCat] = useState<Categoria | null>(null);
  const [initialSetupDone, setInitialSetupDone] = useState(false);

  useEffect(() => {
    const setupInitialCategory = async () => {
      try {
        console.log('Verificando/Criando categoria "Outras Despesas"...');
        const categoriaPadrao = await ensureOutrasDespesasExists();
        setOutrasDespesasCat(categoriaPadrao);
        await queryClient.invalidateQueries({ queryKey: ['categoriasDespesa'] });
        console.log('Categoria "Outras Despesas" assegurada:', categoriaPadrao);
      } catch (error) {
        console.error('Falha ao assegurar categoria "Outras Despesas":', error);
        toast.error('Erro ao configurar categorias padrão. A opção "Outras Despesas" pode não estar disponível.');
      }
      setInitialSetupDone(true);
    };

    if (!initialSetupDone) {
        setupInitialCategory();
    }
  }, [queryClient, initialSetupDone]);

  const pageTitle = isEditing ? 'Editar Despesa' : 'Adicionar Nova Despesa';
  const pageDescription = isEditing
    ? 'Modifique os detalhes da despesa existente.'
    : 'Registre uma nova despesa para controle financeiro.';

  // --- Busca de Dados --- 

  const { data: categorias, isLoading: isLoadingCategorias, error: errorCategorias } = 
    useQuery<Categoria[], Error>({ 
      queryKey: ['categoriasDespesa'], 
      queryFn: () => getCategoriasService('despesa', true), 
      enabled: initialSetupDone,
    });

  // Buscar formas de pagamento
  const { data: formasPagamento, isLoading: isLoadingFormas, error: errorFormas } = 
    useQuery<FormaPagamento[], Error>({ 
      queryKey: ['formasPagamento'],
      queryFn: getFormasPagamento,
    });

  // Buscar dados da despesa se estiver editando
  const { data: despesaAtual, isLoading: isLoadingDespesa, error: errorDespesa } = useQuery<Despesa | null, Error>({ // Permite null
    queryKey: ['despesa', id], // Inclui ID na chave
    queryFn: () => id ? getDespesaById(id) : Promise.resolve(null), // Só busca se houver ID
    enabled: isEditing, // Só habilita a query se estiver editando
    staleTime: 5 * 60 * 1000, // 5 minutos de cache para dados de edição
  });

  // --- Configuração do Formulário --- 
  const form = useForm<DespesaFormData>({
    resolver: zodResolver(despesaSchema),
    defaultValues: {
      descricao: '',
      valor: 0,
      categoria_id: '',
      data: null,
      pago: false,
      data_vencimento: null,
      forma_pagamento_id: null,
      tipo_despesa: 'negocio',
    },
  });

  // Observar valores relevantes do formulário
  const isPago = form.watch('pago');

  // Efeito para preencher o formulário no modo de edição
  useEffect(() => {
    if (isEditing && despesaAtual && form.reset) {
      form.reset({
        descricao: despesaAtual.descricao,
        valor: Number(despesaAtual.valor) || 0,
        categoria_id: despesaAtual.categoria_id,
        data: despesaAtual.data ? parseISO(despesaAtual.data) : new Date(),
        pago: despesaAtual.pago,
        data_vencimento: despesaAtual.data_vencimento ? parseISO(despesaAtual.data_vencimento) : null,
        forma_pagamento_id: despesaAtual.forma_pagamento_id,
        tipo_despesa: despesaAtual.tipo_despesa,
      });
    }
  }, [isEditing, despesaAtual, form.reset]);

  // --- Mutações para Adicionar/Atualizar --- 
  const mutation = useMutation({ 
    mutationFn: (data: DespesaFormData) => {
      // DEBUG: Log no início da mutationFn
      console.log("mutationFn Recebido:", { 
        data_pagamento: data.data, 
        data_vencimento: data.data_vencimento 
      });

      // Garantir que todas as datas estejam em formato ISO
      const prepararData = (d: Date | null | undefined): string | null => {
        // Checagem mais robusta: verifica se é nulo/undefined, se é instância de Date e se é uma data válida
        if (!d || !(d instanceof Date) || isNaN(d.getTime())) {
           console.log("prepararData: Recebeu valor inválido ou nulo", d); // Log adicionado
           return null;
        }
        // Só chama toISOString se for um Date válido
        console.log("prepararData: Preparando data válida", d); // Log adicionado
        return d.toISOString();
      };
      
      // Criar objeto para envio
      const dataToSend = {
        ...data,
        forma_pagamento_id: data.pago ? data.forma_pagamento_id : null,
        data: prepararData(data.data),
        data_vencimento: prepararData(data.data_vencimento),
        // TODO: Corrigir hardcoding para despesas recorrentes!
        // Estas propriedades precisam vir do formulário quando for recorrente
        recorrente: false, 
        frequencia: null
      };

      // Sempre assegurar que campos estejam corretos
      if (!dataToSend.pago) {
        // Não enviar forma_pagamento_id se não estiver pago
        dataToSend.forma_pagamento_id = null;
      }

      console.log("Dados sendo enviados para o servidor:", dataToSend);

      if (isEditing && id) {
        return updateDespesa(id, dataToSend);
      } else {
        return addDespesa(dataToSend);
      }
    },
    onSuccess: (data) => {
      toast.success(`Despesa ${isEditing ? 'atualizada' : 'adicionada'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      queryClient.invalidateQueries({ queryKey: ['despesa', data.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardFinanceiroData'] });

      navigate('/app/despesas');
    },
    onError: (error) => {
      toast.error(`Erro ao ${isEditing ? 'atualizar' : 'adicionar'} despesa: ${error.message}`);
    },
  });

  // --- Lógica de Submissão --- 
  const onSubmit = (data: DespesaFormData) => {
    // DEBUG: Log inicial em onSubmit
    console.log("onSubmit - Dados recebidos do form:", {
       data_pagamento_inicial: data.data,
       data_vencimento_inicial: data.data_vencimento,
       pago: data.pago
    });

    // Criar cópia para evitar mutação direta do objeto original do form
    const dataProcessada = { ...data };

    // Garantir que a data de vencimento esteja definida se não foi fornecida
    if (!dataProcessada.data_vencimento) {
      console.log("onSubmit: data_vencimento inicial está vazia.");
      // Lógica mais segura: 
      // Se pago=true, data.data DEVE existir (por causa do Zod). 
      // Se pago=false, usamos new Date().
      if (dataProcessada.pago && dataProcessada.data instanceof Date && !isNaN(dataProcessada.data.getTime())) {
         console.log("onSubmit: Definindo data_vencimento com base na data de pagamento.");
         dataProcessada.data_vencimento = dataProcessada.data;
      } else {
         console.log("onSubmit: Definindo data_vencimento como new Date().");
         dataProcessada.data_vencimento = new Date();
      }
    }
    
    // Garantir que os valores estejam corretos antes de enviar
    const dataToSubmit = {
      ...dataProcessada,
      // Se não estiver pago, garantir que forma_pagamento_id seja null
      forma_pagamento_id: dataProcessada.pago ? dataProcessada.forma_pagamento_id : null,
      // Garantir que data de pagamento seja null se não estiver pago
      data: dataProcessada.pago ? dataProcessada.data : null, 
      data_vencimento: dataProcessada.data_vencimento // Já foi garantido acima
    };

    // DEBUG: Log antes de chamar mutate
    console.log("onSubmit - Dados finais a serem enviados (dataToSubmit):", {
       data_pagamento_final: dataToSubmit.data,
       data_vencimento_final: dataToSubmit.data_vencimento,
       pago: dataToSubmit.pago
    });

    // Enviar os dados para a mutação
    mutation.mutate(dataToSubmit);
  };
  
  // --- Renderização --- 

  // Loading states
  const isLoading = !initialSetupDone || isLoadingCategorias || isLoadingFormas || (isEditing && isLoadingDespesa);
  // Erros
  const queryError = errorCategorias || errorFormas || (isEditing && errorDespesa);

  if (isLoading) {
     return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /> Carregando...</div>;
  }
   
  if (queryError) {
     return <div className="text-red-500 text-center py-10">Erro ao carregar dados: {queryError.message}</div>;
  }
  
  // Se estiver editando e a despesa não for encontrada após o carregamento
  if (isEditing && !isLoadingDespesa && !despesaAtual) {
      return <div className="text-red-500 text-center py-10">Despesa não encontrada.</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Cabeçalho com botão voltar à esquerda e título/subtítulo centralizado */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b w-full">
        {/* Botão Voltar */}
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate(-1)} 
          aria-label="Voltar"
          className="flex-shrink-0" 
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        {/* Bloco Título/Subtítulo Centralizado */}
        <div className="flex-grow text-center px-4"> 
          <h2 className="text-3xl font-bold font-serif text-[#92400e]">{pageTitle}</h2> 
          <p className="text-muted-foreground mt-1">{pageDescription}</p>
        </div>

        {/* Espaço reservado para manter a centralização */}
        <div className="w-[40px] flex-shrink-0"></div> {/* Largura igual ao botão ícone */}

      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Descrição */}
          <div className="grid grid-cols-1">
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Aluguel Escritório, Compra de Material" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Linha 3: Valor, Categoria e Tipo Despesa */} 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Campo Valor (ocupa 1/3) */} 
            <FormField
              control={form.control}
              name="valor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
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
                      onBlur={() => {
                        field.onBlur();
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Campo Categoria (ocupa 1/3) */} 
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
                      {!isLoadingCategorias && categorias?.length === 0 && (
                         <div className="text-center text-sm text-muted-foreground p-4">Nenhuma categoria encontrada.</div>
                       )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Tipo Despesa (NOVO - ocupa 1/3) */} 
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

          {/* Linha 4: Status de Pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Campo Pago? */} 
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
                    <FormLabel>Pago?</FormLabel>
                    <FormDescription>Marque se já foi paga.</FormDescription>
                  </div>
                </FormItem>
              )}
            />
              
            {/* Campo Forma de Pagamento (Só exibido se estiver pago) */} 
            {isPago && (
              <FormField
                control={form.control}
                name="forma_pagamento_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma Pagamento</FormLabel>
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
            )}
          </div>

          {/* Linha 5: Campos de Data (dois campos separados) */}
          {/* DEBUG: Log antes de renderizar campos de data */}
          {console.log("DespesaFormPage: Renderizando campos de data. isPago:", isPago)}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Campo de Data de Vencimento - Sempre visível */}
            <FormField
              control={form.control}
              name="data_vencimento"
              render={({ field }) => (
                <FormItem className="flex flex-col pt-2"> 
                  <FormLabel>Quando vence? <span className="text-red-500">*</span></FormLabel>
                  <FormDescription>
                    A data limite para o pagamento desta despesa.
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
                        onSelect={(date) => {
                          field.onChange(date);
                        }}
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
            
            {/* Campo de Data de Pagamento - Só visível se estiver pago */}
            {isPago && (
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem className="flex flex-col pt-2"> 
                    <FormLabel>Quando foi pago? <span className="text-red-500">*</span></FormLabel>
                    <FormDescription>
                      A data em que o pagamento desta despesa foi realizado.
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
            )}
            
            {/* Informação adicional quando não está pago */}
            {!isPago && (
              <div className="flex items-center">
                <div className="bg-blue-50 p-4 rounded-md flex items-start space-x-3 h-full w-full">
                  <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-700">
                      Quando esta despesa for paga, você poderá registrar a data exata do pagamento.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botões de Submit/Cancelar */} 
          <div className="flex justify-end mt-8">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} className="mr-4" disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} 
              {isEditing ? 'Salvar Alterações' : 'Adicionar Despesa'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

// Exporta o componente para ser usado nas rotas.
export default DespesaFormPage; 