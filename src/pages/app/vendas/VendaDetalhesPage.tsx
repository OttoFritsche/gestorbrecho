import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useVendaDetalhes } from '@/hooks/useVendaDetalhes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle, Circle, Clock, AlertCircle, Terminal } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const DescriptionListItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
    <dd className="mt-1 text-sm text-foreground">{value || '-'}</dd>
  </div>
);

const VendaDetalhesPage = () => {
  const { saleId } = useParams<{ saleId: string }>()
  const { detailedSale, loadingDetail, fetchSaleDetails, updateParcelaStatus } = useVendaDetalhes()
  const navigate = useNavigate();
  
  const [parcelaToPay, setParcelaToPay] = useState<any | null>(null);
  const [isPayConfirmationOpen, setIsPayConfirmationOpen] = useState(false);

  useEffect(() => {
    if (saleId) {
      fetchSaleDetails(saleId)
    }
  }, [saleId, fetchSaleDetails])

  const handleConfirmPayment = async () => {
    if (!parcelaToPay) return;
    try {
      await updateParcelaStatus(parcelaToPay.id, 'pago');
      setIsPayConfirmationOpen(false);
      setParcelaToPay(null);
    } catch (error) {
      // Erro já é tratado no hook com toast
    }
  }

  const getStatusBadge = (status: string, dataVencimentoStr?: string | null) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zera horas para comparar apenas o dia

    switch (status) {
        case 'pago':
            return <Badge className="border-transparent bg-green-100 text-green-800 hover:bg-green-100/80"><CheckCircle className="h-3 w-3 mr-1"/> Pago</Badge>;
        case 'aguardando':
            try {
                if (dataVencimentoStr) {
                    const dataVencimento = new Date(dataVencimentoStr.replace(/-/g, '/'));
                    dataVencimento.setHours(0, 0, 0, 0); // Zera horas

                    if (dataVencimento < today) {
                        // Atrasado
                        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1"/> Atrasado</Badge>;
                    }
                }
            } catch (e) {
                console.error("Erro ao parsear data de vencimento para status:", dataVencimentoStr, e);
            }
            // Se não estiver atrasado ou erro no parse, retorna Aguardando
            return <Badge className="border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80"><Clock className="h-3 w-3 mr-1"/> Aguardando</Badge>;
        case 'cancelado': // Exemplo de outro status
             return <Badge variant="secondary"><Circle className="h-3 w-3 mr-1"/> Cancelado</Badge>;
        default:
            return <Badge variant="secondary">{status || 'Desconhecido'}</Badge>;
    }
  }

  if (loadingDetail) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Skeleton className="h-8 w-40 mb-6" />
        <Skeleton className="h-10 w-3/4" />
        
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-3/5"/>
            <Skeleton className="h-4 w-1/3 mt-1"/>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><Skeleton className="h-7 w-1/4"/></CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>

         <Card>
          <CardHeader><Skeleton className="h-7 w-1/3"/></CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!detailedSale) {
    return (
        <div className="container mx-auto py-10 space-y-6">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Venda Não Encontrada</AlertTitle>
                <AlertDescription>
                    Não foi possível carregar os detalhes para a venda com o ID fornecido.
                </AlertDescription>
            </Alert>
        </div>
    )
  }

  const isAPrazo = detailedSale.formas_pagamento?.nome === 'A Prazo (Fiado)';

  return (
    <div className="container mx-auto py-10 space-y-6">
      <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Button>

      <h1 className="text-3xl font-bold font-serif text-[#92400e]">Detalhes da Venda</h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Informações Gerais</CardTitle>
          <CardDescription>
            ID: {detailedSale.id.substring(0, 8)}... | Data: {detailedSale.data_venda ? formatDate(detailedSale.data_venda) : '-'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 text-sm">
            <DescriptionListItem 
              label="Cliente" 
              value={detailedSale.clientes?.nome || 'Não identificado'} 
            />
             <DescriptionListItem 
               label="Forma de Pagamento" 
               value={detailedSale.formas_pagamento?.nome || 'Não informada'} 
             />
             <DescriptionListItem 
               label="Valor Total" 
               value={<span className="font-semibold text-base">{formatCurrency(detailedSale.valor_total)}</span>} 
             />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Itens da Venda</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[#57534e]">Produto/Descrição</TableHead>
                <TableHead className="text-[#57534e]">Qtd.</TableHead>
                <TableHead className="text-[#57534e]">Preço Unit.</TableHead>
                <TableHead className="text-right text-[#57534e]">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailedSale.vendas_items?.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{item.produtos?.nome || item.descricao_manual || 'Item inválido'}</TableCell>
                  <TableCell>{item.quantidade}</TableCell>
                  <TableCell>{formatCurrency(item.preco_unitario)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isAPrazo && detailedSale.pagamentos_prazo?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Parcelamento (A Prazo)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[#57534e]">Parcela</TableHead>
                  <TableHead className="text-[#57534e]">Vencimento</TableHead>
                  <TableHead className="text-[#57534e]">Valor</TableHead>
                  <TableHead className="text-[#57534e]">Status</TableHead>
                  <TableHead className="text-right text-[#57534e]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...detailedSale.pagamentos_prazo]
                  .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())
                  .map((parcela: any, index: number) => (
                  <TableRow key={parcela.id}>
                    <TableCell>{index + 1}/{detailedSale.pagamentos_prazo.length}</TableCell>
                    <TableCell>{formatDate(parcela.data_vencimento)}</TableCell>
                    <TableCell>{formatCurrency(parcela.valor)}</TableCell>
                    <TableCell>{getStatusBadge(parcela.status, parcela.data_vencimento)}</TableCell>
                    <TableCell className="text-right">
                      {parcela.status === 'aguardando' && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => { 
                                setParcelaToPay(parcela);
                                setIsPayConfirmationOpen(true);
                             }}
                             className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700 gap-1"
                        >
                          <CheckCircle className="h-4 w-4" />
                           Dar Baixa
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={isPayConfirmationOpen} onOpenChange={setIsPayConfirmationOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-serif">Confirmar Pagamento da Parcela</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja marcar esta parcela como paga?
                {parcelaToPay && (
                  <span className="block mt-2 text-sm text-muted-foreground">
                     Vencimento: {formatDate(parcelaToPay.data_vencimento)} | Valor: {formatCurrency(parcelaToPay.valor)}
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setParcelaToPay(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmPayment} className="bg-green-600 hover:bg-green-700">Confirmar Pagamento</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

    </div>
  )
}

export default VendaDetalhesPage
