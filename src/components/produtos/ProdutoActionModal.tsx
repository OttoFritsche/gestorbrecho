import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, Package, User, CalendarDays, Tag, Check, Timer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { Produto } from '@/lib/types/produto';
import { atualizarQuantidadeProduto, reservarProduto, cancelarReservaProduto } from '@/services/produtoService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProdutoActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto: Produto | null;
}

const ProdutoActionModal: React.FC<ProdutoActionModalProps> = ({ 
  open, 
  onOpenChange, 
  produto 
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('detalhes');
  const [qtdReserva, setQtdReserva] = useState<number>(1);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteContato, setClienteContato] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [isReservando, setIsReservando] = useState(false);
  const [isAtualizando, setIsAtualizando] = useState(false);
  const [isCancelando, setIsCancelando] = useState(false);
  const [novaQuantidade, setNovaQuantidade] = useState<number | undefined>(undefined);
  const [qtdCancelamento, setQtdCancelamento] = useState<number>(0);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');

  // Resetar estados quando o modal é aberto com um novo produto
  useEffect(() => {
    if (produto) {
      setQtdReserva(1);
      setClienteNome('');
      setClienteContato('');
      setObservacoes('');
      setNovaQuantidade(produto.quantidade);
      setQtdCancelamento(produto.quantidade_reservada || 0);
      setMotivoCancelamento('');
      setActiveTab('detalhes');
    }
  }, [produto]);

  if (!produto) return null;

  // Calcular quantidades disponíveis e reservadas
  const quantidadeReservada = produto.quantidade_reservada || 0;
  const quantidadeDisponivel = produto.quantidade - quantidadeReservada;
  const temReserva = quantidadeReservada > 0;

  const handleReservar = async () => {
    if (!produto) return;
    if (!clienteNome.trim()) {
      toast.error('Informe o nome do cliente para a reserva');
      return;
    }
    if (qtdReserva <= 0) {
      toast.error('A quantidade precisa ser maior que zero');
      return;
    }
    if (qtdReserva > quantidadeDisponivel) {
      // Oferece a opção de continuar com a quantidade máxima disponível
      if (confirm(`A quantidade solicitada (${qtdReserva}) excede o disponível (${quantidadeDisponivel}). Deseja reservar a quantidade máxima disponível (${quantidadeDisponivel})?`)) {
        setQtdReserva(quantidadeDisponivel);
        // Continua com a quantidade ajustada
        try {
          setIsReservando(true);
          const produtoAtualizado = await reservarProduto(
            produto.id,
            quantidadeDisponivel,
            clienteNome,
            clienteContato,
            observacoes
          );

          toast.success(`${quantidadeDisponivel} unidade(s) de "${produto.nome}" reservada(s) para ${clienteNome}`);
          queryClient.invalidateQueries({ queryKey: ['produtos'] });
          onOpenChange(false);
        } catch (error) {
          console.error('Erro ao reservar produto:', error);
          toast.error(`Erro ao reservar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        } finally {
          setIsReservando(false);
        }
      }
      return;
    }

    try {
      setIsReservando(true);
      const produtoAtualizado = await reservarProduto(
        produto.id, 
        qtdReserva, 
        clienteNome,
        clienteContato,
        observacoes
      );

      toast.success(`${qtdReserva} unidade(s) de "${produto.nome}" reservada(s) para ${clienteNome}`);
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao reservar produto:', error);
      toast.error(`Erro ao reservar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsReservando(false);
    }
  };

  const handleCancelarReserva = async () => {
    if (!produto) return;
    if (quantidadeReservada <= 0) {
      toast.error('Não há reservas para cancelar');
      return;
    }
    if (qtdCancelamento <= 0 || qtdCancelamento > quantidadeReservada) {
      toast.error(`A quantidade deve ser entre 1 e ${quantidadeReservada}`);
      return;
    }

    try {
      setIsCancelando(true);
      await cancelarReservaProduto(
        produto.id,
        qtdCancelamento,
        motivoCancelamento || 'Cancelamento sem motivo específico'
      );
      
      toast.success(`Reserva de ${qtdCancelamento} unidade(s) de "${produto.nome}" cancelada com sucesso`);
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      toast.error(`Erro ao cancelar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsCancelando(false);
    }
  };

  const handleAtualizarQuantidade = async () => {
    if (!produto || novaQuantidade === undefined) return;

    try {
      setIsAtualizando(true);
      await atualizarQuantidadeProduto(
        produto.id, 
        novaQuantidade, 
        'Atualização manual via modal'
      );

      toast.success(`Quantidade de "${produto.nome}" atualizada para ${novaQuantidade}`);
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      toast.error(`Erro ao atualizar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsAtualizando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Package className="h-5 w-5" />
            {produto.nome}
          </DialogTitle>
          <DialogDescription>
            Código: {produto.codigo_barras || 'N/A'} | Categoria: {produto.categorias?.nome || 'Sem categoria'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="detalhes" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="reservar">Reservar</TabsTrigger>
            {temReserva && <TabsTrigger value="cancelar">Cancelar Reserva</TabsTrigger>}
            <TabsTrigger value="estoque">Atualizar Estoque</TabsTrigger>
          </TabsList>

          {/* Tab de Detalhes */}
          <TabsContent value="detalhes">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Produto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium">Preço de Venda</h3>
                    <p className="text-xl font-semibold">{formatCurrency(produto.preco_venda)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Estoque</h3>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="text-lg px-3 py-1">
                              {produto.quantidade}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Quantidade total no estoque</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <Badge variant={produto.status === 'disponivel' ? 'success' : produto.status === 'reservado' ? 'warning' : 'secondary'}>
                        {produto.status === 'disponivel' ? 'Disponível' : 
                        produto.status === 'reservado' ? 'Reservado' : 
                        produto.status === 'vendido' ? 'Vendido' : 'Inativo'}
                      </Badge>
                    </div>
                    
                    {/* Informações de reserva, se houver */}
                    {temReserva && (
                      <div className="mt-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reservado:</span>
                          <Badge variant="outline" className="bg-amber-50">
                            {quantidadeReservada}
                          </Badge>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-muted-foreground">Disponível:</span>
                          <Badge variant="outline" className="bg-green-50">
                            {quantidadeDisponivel}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {produto.descricao && (
                  <div>
                    <h3 className="text-sm font-medium">Descrição</h3>
                    <p className="text-sm text-muted-foreground mt-1">{produto.descricao}</p>
                  </div>
                )}

                {produto.imagem_url && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Imagem</h3>
                    <div className="relative w-full h-48 overflow-hidden rounded-md">
                      <img 
                        src={produto.imagem_url} 
                        alt={produto.nome} 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab de Reserva */}
          <TabsContent value="reservar">
            <Card>
              <CardHeader>
                <CardTitle>Reservar Produto</CardTitle>
                <CardDescription>
                  Reserve unidades deste produto para um cliente específico
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {produto.status !== 'disponivel' || quantidadeDisponivel <= 0 ? (
                  <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Produto não disponível</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        {quantidadeDisponivel <= 0 
                          ? 'Este produto está sem estoque disponível. Todas as unidades já estão reservadas ou vendidas.' 
                          : `Este produto já está marcado como "${produto.status}".`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="qtd-reserva">Quantidade para reserva</Label>
                        <Input
                          id="qtd-reserva"
                          type="number"
                          value={qtdReserva}
                          onChange={(e) => {
                            // Permite qualquer valor, mas garante que seja pelo menos 1
                            const valor = parseInt(e.target.value) || 0;
                            setQtdReserva(Math.max(1, valor));
                          }}
                          min={1}
                          // Removido o limite max para permitir qualquer entrada
                        />
                        <p className={`text-xs ${qtdReserva > quantidadeDisponivel ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                          {qtdReserva > quantidadeDisponivel 
                            ? `Atenção: Quantidade excede o disponível (${quantidadeDisponivel})`
                            : `Máximo disponível: ${quantidadeDisponivel} unidades`}
                        </p>
                      </div>
                      <div className="bg-muted p-3 rounded-md">
                        <h4 className="text-sm font-medium">Após a reserva:</h4>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm flex justify-between">
                            <span>Reservado:</span> 
                            <span className="font-medium">{quantidadeReservada + qtdReserva} unid.</span>
                          </p>
                          <p className="text-sm flex justify-between">
                            <span>Disponível:</span> 
                            <span className="font-medium">{Math.max(0, quantidadeDisponivel - qtdReserva)} unid.</span>
                          </p>
                          <Separator className="my-1" />
                          <p className="text-sm flex justify-between">
                            <span>Total no estoque:</span> 
                            <span className="font-medium">{produto.quantidade} unid.</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cliente-nome">Nome do cliente <span className="text-red-500">*</span></Label>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="cliente-nome"
                          value={clienteNome}
                          onChange={(e) => setClienteNome(e.target.value)}
                          placeholder="Nome do cliente que está reservando"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cliente-contato">Contato do cliente</Label>
                      <Input
                        id="cliente-contato"
                        value={clienteContato}
                        onChange={(e) => setClienteContato(e.target.value)}
                        placeholder="Telefone ou email para contato"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="observacoes">Observações</Label>
                      <Textarea
                        id="observacoes"
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Informações adicionais sobre a reserva"
                      />
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleReservar} 
                  disabled={isReservando || produto.status !== 'disponivel' || quantidadeDisponivel <= 0 || !clienteNome.trim()}
                  className="gap-2"
                >
                  {isReservando ? (
                    <>Reservando...</>
                  ) : (
                    <>
                      <Timer className="h-4 w-4" />
                      Confirmar Reserva
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Tab de Cancelamento de Reserva */}
          {temReserva && (
            <TabsContent value="cancelar">
              <Card>
                <CardHeader>
                  <CardTitle>Cancelar Reserva</CardTitle>
                  <CardDescription>
                    Libere unidades reservadas deste produto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-200 flex items-start gap-3 mb-4">
                    <div>
                      <h4 className="font-medium text-blue-800">Informações da Reserva</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Este produto possui {quantidadeReservada} unidade(s) reservada(s) de um total de {produto.quantidade}.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="qtd-cancelamento">Quantidade a liberar</Label>
                      <Input
                        id="qtd-cancelamento"
                        type="number"
                        value={qtdCancelamento}
                        onChange={(e) => setQtdCancelamento(Math.min(parseInt(e.target.value) || 0, quantidadeReservada))}
                        min={1}
                        max={quantidadeReservada}
                      />
                      <p className="text-xs text-muted-foreground">
                        Total reservado: {quantidadeReservada} unidades
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded-md">
                      <h4 className="text-sm font-medium">Após o cancelamento:</h4>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm flex justify-between">
                          <span>Reservado:</span> 
                          <span className="font-medium">{Math.max(0, quantidadeReservada - qtdCancelamento)} unid.</span>
                        </p>
                        <p className="text-sm flex justify-between">
                          <span>Disponível:</span> 
                          <span className="font-medium">{quantidadeDisponivel + qtdCancelamento} unid.</span>
                        </p>
                        <Separator className="my-1" />
                        <p className="text-sm flex justify-between">
                          <span>Total no estoque:</span> 
                          <span className="font-medium">{produto.quantidade} unid.</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motivo-cancelamento">Motivo do cancelamento</Label>
                    <Textarea
                      id="motivo-cancelamento"
                      value={motivoCancelamento}
                      onChange={(e) => setMotivoCancelamento(e.target.value)}
                      placeholder="Motivo para o cancelamento da reserva"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleCancelarReserva} 
                    disabled={isCancelando || qtdCancelamento <= 0 || qtdCancelamento > quantidadeReservada}
                    className="gap-2 bg-amber-600 hover:bg-amber-700"
                  >
                    {isCancelando ? (
                      <>Processando...</>
                    ) : (
                      <>
                        <X className="h-4 w-4" />
                        Cancelar Reserva
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          )}

          {/* Tab de Atualização de Estoque */}
          <TabsContent value="estoque">
            <Card>
              <CardHeader>
                <CardTitle>Atualizar Estoque</CardTitle>
                <CardDescription>
                  Ajuste a quantidade disponível deste produto no estoque
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantidade-atual">Quantidade atual</Label>
                    <Input
                      id="quantidade-atual"
                      type="number"
                      value={novaQuantidade !== undefined ? novaQuantidade : produto.quantidade}
                      onChange={(e) => setNovaQuantidade(parseInt(e.target.value) || 0)}
                      min={0}
                    />
                    <p className="text-xs text-muted-foreground">
                      Atual: {produto.quantidade} unidades
                    </p>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <h4 className="text-sm font-medium">Status após atualização:</h4>
                    <div className="mt-2">
                      <Badge variant={novaQuantidade === undefined || novaQuantidade > 0 ? 'success' : 'destructive'}>
                        {novaQuantidade === undefined || novaQuantidade > 0 
                          ? (produto.status === 'reservado' ? 'Reservado' : 'Disponível') 
                          : 'Sem Estoque'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-2">
                        {novaQuantidade === 0 
                          ? 'O produto será marcado como vendido se quantidade for zero' 
                          : 'Quantidade positiva manterá o produto como disponível'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAtualizarQuantidade} 
                  disabled={isAtualizando || novaQuantidade === undefined || novaQuantidade === produto.quantidade}
                  className="gap-2"
                >
                  {isAtualizando ? (
                    <>Atualizando...</>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Atualizar Estoque
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProdutoActionModal; 