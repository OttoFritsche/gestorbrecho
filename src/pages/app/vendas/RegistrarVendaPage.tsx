import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, ArrowLeft } from "lucide-react"
import { VendaItemForm } from '@/components/vendas/VendaItemForm'
import { ParcelasForm } from '@/components/vendas/ParcelasForm'
import { useVendaForm, VendaFormValues, vendaFormSchema } from '@/hooks/useVendaForm'
import { createSale as createVenda } from '@/services/saleService'
import { DateTimePicker } from '@/components/ui/date-time-picker'

export function RegistrarVendaPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { clientesData, formasPagamentoData, produtosData, isLoading, error } = useVendaForm();

  const form = useForm<VendaFormValues>({
    resolver: zodResolver(vendaFormSchema),
    defaultValues: {
      cliente_id: null,
      forma_pagamento_id: '',
      observacoes: '',
      itens: [{ produto_id: null, descricao_manual: null, quantidade: 1, preco_unitario: 0, subtotal: 0, isManual: false }],
      num_parcelas: undefined,
      primeiro_vencimento: undefined,
      data_venda: new Date(),
    },
  });

  const watchedItens = form.watch("itens");
  const valorTotal = watchedItens.reduce((acc, item) => acc + (item.subtotal || 0), 0);

  useEffect(() => {
    watchedItens.forEach((item, index) => {
      const qty = item.quantidade || 0;
      const price = item.preco_unitario || 0;
      const newSubtotal = qty * price;
      if (item.subtotal !== newSubtotal) {
        form.setValue(`itens.${index}.subtotal`, newSubtotal, { shouldValidate: false });
      }
    });
  }, [watchedItens, form]);

  const watchedFormaPagamentoId = form.watch("forma_pagamento_id");
  const formaPagamentoSelecionada = formasPagamentoData?.find(f => f.id === watchedFormaPagamentoId);
  const isAPrazo = formaPagamentoSelecionada?.nome === 'A Prazo (Fiado)';

  const { mutate: submitVenda, isPending: isSubmittingVenda } = useMutation({
    mutationFn: (data: any) => createVenda(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      toast.success('Venda registrada com sucesso!');
      navigate('/app/vendas');
    },
    onError: (error) => {
      toast.error('Erro ao registrar venda. Por favor, tente novamente mais tarde.');
    },
  });

  function onSubmit(data: VendaFormValues) {
    const itensLimpos = data.itens.map(({ isManual, ...rest }) => rest);
    
    // Garantir que a data escolhida pelo usuário seja preservada
    const dataVendaEscolhida = data.data_venda;
    console.log("[VendaFormPage - handleSubmit] Data escolhida pelo usuário:", dataVendaEscolhida);
    
    const finalData = {
      cliente_id: data.cliente_id === '' ? null : data.cliente_id,
      forma_pagamento_id: data.forma_pagamento_id,
      observacoes: data.observacoes,
      itens: itensLimpos,
      valor_total: valorTotal,
      status: 'pendente',
      num_parcelas: isAPrazo ? data.num_parcelas : undefined,
      primeiro_vencimento: isAPrazo ? data.primeiro_vencimento : undefined,
      data_venda: data.data_venda.toISOString(),
    };
    console.log("[VendaFormPage - handleSubmit] saleDataObject final:", finalData);
    submitVenda(finalData as any);
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Skeleton className="h-8 w-36 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-3/5"/>
            <Skeleton className="h-4 w-4/5 mt-1"/>
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-8 w-1/4 ml-auto" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-28" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Button variant="outline" size="sm" asChild>
          <Link to="/app/vendas">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Vendas
          </Link>
        </Button>
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar Dados</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os dados necessários para registrar a venda (clientes, formas de pagamento, produtos). Tente novamente mais tarde.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="w-full flex justify-start">
        <Button variant="outline" size="sm" asChild>
          <Link to="/app/vendas">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Vendas
          </Link>
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center pb-4 border-b w-full mb-6">
        <h2 className="text-3xl font-bold font-serif text-[#92400e]">Registrar Nova Venda</h2>
        <p className="text-muted-foreground mt-1 mb-4">
          Preencha os dados abaixo para criar uma nova venda.
        </p>
      </div>

      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <CardContent className="pt-6 space-y-6">
              <FormField
                control={form.control}
                name="data_venda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data e Hora da Venda</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        date={field.value}
                        setDate={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cliente_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente (Opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Nenhum (Consumidor Final)</SelectItem>
                        {clientesData?.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.nome_completo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="forma_pagamento_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a forma de pagamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {formasPagamentoData?.map((forma) => (
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

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Alguma observação sobre a venda? (Opcional)"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isAPrazo && <ParcelasForm />}

              <VendaItemForm produtosData={produtosData} />

              <div className="text-right text-xl font-bold pt-4 border-t">
                Valor Total: R$ {valorTotal.toFixed(2)}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmittingVenda}>
                {isSubmittingVenda ? "Salvando..." : "Registrar Venda"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
