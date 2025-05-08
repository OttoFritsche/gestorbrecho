import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Client, PaymentMethod } from '@/types/sales'
import { Produto } from '@/lib/types/produto'
import { toast } from 'sonner'
import { getProdutosDisponiveisParaVenda } from '@/services/produtoService'

// Tipo simplificado para Produto no dropdown (incluindo quantidade disponível)
export interface ProdutoParaVenda {
  id: string;
  nome: string;
  preco_venda: number;
  quantidade: number;
  quantidade_disponivel: number;
}

// Ajustar tipo para usar 'nome' como esperado pela seleção
type ProfileClient = {
    id: string;
    nome: string; // Usar a coluna 'nome' selecionada
}

export const useFormData = () => {
  // Usar o tipo ajustado para clientes
  const [clients, setClients] = useState<ProfileClient[]>([])
  // Usar os tipos importados para os outros
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]) 
  const [products, setProducts] = useState<ProdutoParaVenda[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch clients da tabela 'clientes' usando a coluna 'nome'
      const { data: clientsData, error: clientsError } = await supabase
        .from('clientes') 
        .select('id, nome') 
        .eq('ativo', true) // Adiciona filtro para buscar apenas clientes ativos
        .order('nome', { ascending: true })

      if (clientsError) throw clientsError
      // Fazer cast para ProfileClient[] - assume que id e nome são suficientes aqui
      setClients((clientsData as any[]) || []) 

      // Fetch payment methods - Selecionar todas as colunas esperadas por PaymentMethod
      // (Assumindo que PaymentMethod requer id, nome, created_at, user_id baseado no erro)
      const { data: paymentMethodsData, error: paymentMethodsError } = await supabase
        .from('formas_pagamento')
        .select('*') // Selecionar tudo para garantir compatibilidade com o tipo
      if (paymentMethodsError) throw paymentMethodsError
      setPaymentMethods(paymentMethodsData || [])

      // Fetch products usando a função de serviço correta - já retorna produtos com quantidade_disponivel
      const productsData = await getProdutosDisponiveisParaVenda();
      setProducts(productsData || [])

    } catch (error: any) {
      console.error("Erro ao carregar dados no useFormData:", error); 
      toast.error('Erro ao carregar dados do formulário', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return { clients, paymentMethods, products, loading }
}
