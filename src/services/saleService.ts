import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { MovimentoCaixa } from '@/types/financeiro'
import { updateProduto, getProdutoById, atualizarQuantidadeProduto } from './produtoService'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Sale } from '@/types/sales'
import { SaleItem } from '@/types/sales'
// Removido SaleWithRelations, pois não é diretamente usada aqui, mas pode ser necessária em tipos
// Se tipos específicos para Create/Update não existirem, podem ser definidos aqui ou em types/sales
// Exemplo de tipos inline para clareza (idealmente estariam em types/sales.ts)
interface SaleItemInput {
  produto_id?: string | null
  descricao_manual?: string | null
  quantidade: number
  preco_unitario: number
  subtotal: number
  user_id: string // Adicionado user_id
}

interface SaleDataInput {
  data_venda: string
  cliente_id: string | null
  forma_pagamento_id: string | null // Permitir null temporariamente se a lógica permitir
  categoria_id: string | null // Adicionado categoria_id
  valor_total: number
  items: SaleItemInput[]
  observacoes: string | null
  user_id: string // Adicionado user_id
  num_parcelas?: number | null // Ajustado para permitir null
  primeiro_vencimento?: string | null // Ajustado para permitir null e string
}

// Lista de nomes de formas de pagamento consideradas "à vista" (entrada imediata no caixa)
const FORMAS_PAGAMENTO_A_VISTA = ['Dinheiro', 'PIX', 'Cartão de Débito', 'Cartão de Crédito'] // Adicionado Cartão de Crédito

/* 
 * CORREÇÃO: Problema na sincronização de vendas e fluxo de caixa
 * Quando uma venda tem sua data alterada, em vez de apenas atualizar os dados
 * do movimento de caixa, agora o sistema remove o movimento antigo e cria um
 * novo movimento na data correta. Isso garante que o fluxo de caixa seja
 * corretamente atualizado para refletir a venda na nova data.
 */

// Função auxiliar para garantir que o registro fluxo_caixa exista e retornar o ID
async function getOrCreateFluxoCaixaId(data: string, user_id: string): Promise<string> {
  console.log(`[getOrCreateFluxoCaixaId] Iniciando... Data recebida: "${data}", User ID: ${user_id}`);
  // Log para verificar o tipo e formato da data recebida
  console.log(` -> Tipo da data recebida: ${typeof data}`); 
  if (typeof data === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      console.warn(` -> ATENÇÃO: Data recebida "${data}" não está no formato YYYY-MM-DD esperado!`);
  }
  
  // 1. Tenta buscar o registro existente para a data EXATA fornecida
  console.log(` -> 1. Buscando fluxo_caixa existente para data = "${data}" E user_id = ${user_id}`);
  let { data: fluxoDoDia, error: fetchError } = await supabase
    .from('fluxo_caixa')
    .select('id, data') // Selecionar data para confirmar
    .eq('data', data) // Comparação direta com a string YYYY-MM-DD
    .eq('user_id', user_id)
    .maybeSingle();

  if (fetchError) {
    console.error("[getOrCreateFluxoCaixaId] Erro ao BUSCAR fluxo_caixa:", fetchError);
    throw new Error(`Erro ao buscar fluxo de caixa para ${data}: ${fetchError.message}`);
  }

  // 2. Se encontrou, retorna o ID
  if (fluxoDoDia?.id) {
    console.log(` -> 2. Registro existente ENCONTRADO. ID: ${fluxoDoDia.id}, Data no DB: ${fluxoDoDia.data}. Retornando ID.`);
    return fluxoDoDia.id;
  }

  // 3. Se não encontrou, tenta criar um novo registro mínimo
  console.log(` -> 3. Registro não encontrado para data "${data}". Tentando criar...`);
  const insertData = { data: data, user_id: user_id };
  console.log(`    -> Dados para inserção:`, insertData);
  const { data: novoFluxo, error: insertError } = await supabase
    .from('fluxo_caixa')
    .insert(insertData)
    .select('id, data') // Selecionar ID e data inserida
    .single();

  if (insertError || !novoFluxo?.id) {
    console.error("[getOrCreateFluxoCaixaId] Erro ao CRIAR novo fluxo_caixa:", insertError);
    // Tenta buscar novamente caso tenha sido criado por concorrência ou trigger lento?
    console.log("[getOrCreateFluxoCaixaId] Tentando buscar novamente após falha/sucesso na criação...");
    let { data: fluxoAposTentativa, error: fetchAgainError } = await supabase
      .from('fluxo_caixa')
      .select('id, data')
      .eq('data', data)
      .eq('user_id', user_id)
      .maybeSingle();
      
    if (fetchAgainError || !fluxoAposTentativa?.id) {
       console.error("[getOrCreateFluxoCaixaId] Falha ao criar e buscar novamente o fluxo_caixa.", fetchAgainError);
       toast.error("Erro crítico: Não foi possível criar ou encontrar o registro diário de caixa.");
       throw new Error(`Não foi possível garantir o registro de fluxo de caixa para ${data}. Erro Insert: ${insertError?.message}. Erro FetchAgain: ${fetchAgainError?.message}`);
    }
    console.log(` -> 3.1. Registro encontrado na SEGUNDA BUSCA. ID: ${fluxoAposTentativa.id}, Data no DB: ${fluxoAposTentativa.data}. Retornando ID.`);
    return fluxoAposTentativa.id; // Retorna o ID encontrado na segunda busca
  }

  // 4. Se a criação foi bem-sucedida e retornou o ID
  console.log(` -> 4. Novo registro criado com SUCESSO. ID: ${novoFluxo.id}, Data inserida no DB: ${novoFluxo.data}. Retornando ID.`);
  return novoFluxo.id;
}

export const fetchSales = async () => {
  const { data: salesData, error: salesError } = await supabase
    .from('vendas')
    .select(`
      *,
      clientes ( id, nome ),
      formas_pagamento ( id, nome ),
      categorias ( id, nome ),
      vendas_items ( 
        *,
        produtos ( * ),
        descricao_manual,
        subtotal
      )
    `)
    .order('data_venda', { ascending: false })

  if (salesError) throw salesError
  return salesData || []
}

export const fetchSaleById = async (saleId: string) => {
  if (!saleId) return null;
  
  const { data, error } = await supabase
    .from('vendas')
    .select(`
      *,
      clientes ( id, nome ),
      formas_pagamento ( * ), 
      categorias ( id, nome ),
      vendas_items ( *, produtos ( * ) ),
      pagamentos_prazo ( * ) 
    `)
    .eq('id', saleId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      toast.error('Venda não encontrada.');
      console.error("Venda não encontrada:", saleId);
      return null;
    }
    throw error;
  }
  
  return data;
}

export const deleteSale = async (saleId: string) => {
  // Considerar deletar itens e parcelas aqui também ou usar CASCADE no DB
  const { error } = await supabase
    .from('vendas')
    .delete()
    .match({ id: saleId });

  if (error) throw error;
}

export const updateParcelaStatus = async (parcelaId: string, newStatus: 'pago' | 'aguardando' | 'cancelado') => {
  // Primeiro atualiza o status da parcela
  const { data: parcelaAtualizada, error: updateError } = await supabase
    .from('pagamentos_prazo')
    .update({ status: newStatus })
    .eq('id', parcelaId)
    .select('*')
    .single();

  if (updateError) throw updateError;

  // Não é mais necessário criar movimento de caixa aqui
  // O trigger 'on_pagamento_prazo_status_change' no banco de dados já faz isso automaticamente
  // Manter apenas o código para atualizar o status da parcela

  return parcelaAtualizada;
}

// --- Funções Adicionadas ---

export const createSale = async (saleData: SaleDataInput) => {
  console.log("[createSale] --- INÍCIO CRIAÇÃO --- Dados Recebidos:", JSON.stringify(saleData));

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado.');
  saleData.user_id = user.id; // Garante que user_id está nos dados principais

  // <<<<<<<<<<<<<<<<<< INÍCIO: Validação de Estoque >>>>>>>>>>>>>>>>>>>>
  console.log("[createSale] Validando estoque dos produtos...");
  const produtosParaAtualizar: { id: string; quantidadeAtual: number; quantidadeVendida: number }[] = [];

  for (const item of saleData.items) {
    if (item.produto_id) {
      const { data: produtoDB, error: fetchProdutoError } = await supabase
        .from('produtos')
        .select('id, nome, quantidade, status')
        .eq('id', item.produto_id)
        .eq('user_id', user.id) // Garante que o produto pertence ao usuário
        .single();

      if (fetchProdutoError || !produtoDB) {
        console.error(`[createSale] Erro ao buscar produto ${item.produto_id} para validação:`, fetchProdutoError);
        throw new Error(`Produto com ID ${item.produto_id} não encontrado ou inacessível.`);
      }

      if (produtoDB.status !== 'disponivel') {
         throw new Error(`O produto "${produtoDB.nome}" não está disponível para venda (Status: ${produtoDB.status}).`);
      }

      if (produtoDB.quantidade < item.quantidade) {
        throw new Error(`Estoque insuficiente para "${produtoDB.nome}". Disponível: ${produtoDB.quantidade}, Solicitado: ${item.quantidade}.`);
      }
      
      // Armazena dados para atualização posterior
      produtosParaAtualizar.push({ 
        id: produtoDB.id, 
        quantidadeAtual: produtoDB.quantidade, 
        quantidadeVendida: item.quantidade 
      });
    }
  }
  console.log("[createSale] Validação de estoque concluída com sucesso.");
  // <<<<<<<<<<<<<<<<<< FIM: Validação de Estoque >>>>>>>>>>>>>>>>>>>>

  // <<<<<<<<<<< Tratamento de data/hora da venda >>>>>>>>>>>
  // Garante que temos uma data/hora válida (UTC) para a venda
  let dataVendaISO = saleData.data_venda;
  
  // Se não tiver data, usar a data atual (fallback)
  if (!dataVendaISO) {
    dataVendaISO = new Date().toISOString();
    console.log("[createSale] Nenhuma data fornecida, usando data atual:", dataVendaISO);
  } else {
    // Importante: NÃO criar um novo Date() aqui, pois perderia o horário escolhido pelo usuário
    console.log("[createSale] Usando a data/hora fornecida pelo usuário:", dataVendaISO);
  }
  
  // Calcula a data local em formato YYYY-MM-DD para uso em relatórios
  // O objeto Date() vai interpretar corretamente o ISO string com timezone
  const dataVendaObj = new Date(dataVendaISO);
  const options = { 
    timeZone: 'America/Sao_Paulo', 
    year: 'numeric' as const, 
    month: '2-digit' as const, 
    day: '2-digit' as const 
  };
  const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(dataVendaObj);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const dataVendaLocalStr = `${year}-${month}-${day}`; // Formato YYYY-MM-DD
  
  console.log("[createSale - Service] Dados de data processados:",
    "\n -> data_venda (ISO/UTC):", dataVendaISO,
    "\n -> data_venda_local (YYYY-MM-DD):", dataVendaLocalStr
  );

  // 1. Insere a venda principal
  const { data: vendaResult, error: vendaError } = await supabase
    .from('vendas')
    .insert({ 
      data_venda: dataVendaISO, // Timestamp em UTC
      data_venda_local: dataVendaLocalStr, // Data local (apenas para relatórios)
      cliente_id: saleData.cliente_id, 
      forma_pagamento_id: saleData.forma_pagamento_id,
      categoria_id: saleData.categoria_id,
      valor_total: saleData.valor_total,
      observacoes: saleData.observacoes,
      user_id: saleData.user_id,
      num_parcelas: saleData.num_parcelas,
      primeiro_vencimento: saleData.primeiro_vencimento,
      status: 'pendente'
    })
    .select('id')
    .single();

  if (vendaError || !vendaResult) { 
    console.error("Erro ao inserir venda:", vendaError);
    throw vendaError || new Error("Não foi possível obter o ID da nova venda."); 
  }
  const newVendaId = vendaResult.id;
  console.log("[createSale] Venda principal inserida com ID:", newVendaId);

  // 2. Insere os itens da venda
  const itensParaInserir = saleData.items.map(item => ({ 
    ...item, 
    venda_id: newVendaId,
    user_id: saleData.user_id // Garante user_id nos itens
  }));
  
  const { error: itensError } = await supabase.from('vendas_items').insert(itensParaInserir);
  if (itensError) { 
    console.error("[createSale] Erro ao inserir itens:", itensError);
    // Tenta deletar a venda recém-criada em caso de erro nos itens (rollback manual)
    await supabase.from('vendas').delete().eq('id', newVendaId); 
    throw itensError; 
  }
  console.log("[createSale] Itens da venda inseridos com sucesso.");

  // <<<<<<<<<<<<<<<<<< INÍCIO: Atualização de Estoque (Quantidade e Status) >>>>>>>>>>>>>>>>>>>>
  console.log("[createSale] Atualizando estoque dos produtos vendidos...");
  for (const prodInfo of produtosParaAtualizar) {
    try {
      const novaQuantidade = prodInfo.quantidadeAtual - prodInfo.quantidadeVendida;
      
      console.log(`[createSale] Atualizando produto ID: ${prodInfo.id}. Reduzindo em: ${prodInfo.quantidadeVendida} unidades`);
      
      // Usa a nova função que gerencia automaticamente o status com base na quantidade
      await atualizarQuantidadeProduto(
        prodInfo.id, 
        novaQuantidade, 
        `Venda ID: ${newVendaId}`
      );
      
      console.log(`[createSale] Estoque do produto ID ${prodInfo.id} atualizado com sucesso.`);
    } catch (error) {
      console.error(`[createSale] Erro inesperado ao tentar atualizar estoque do produto ID ${prodInfo.id}:`, error);
      toast.error(`Erro inesperado ao atualizar estoque para o produto ID ${prodInfo.id}. Verifique manualmente.`);
    }
  }
  console.log("[createSale] Atualização de estoque concluída (com possíveis avisos).");
  // <<<<<<<<<<<<<<<<<< FIM: Atualização de Estoque >>>>>>>>>>>>>>>>>>>>

  // 3. Criar a Receita correspondente
  console.log("[createSale] Criando registro na tabela 'receitas'...");
  try {
    const receitaParaInserir = {
      user_id: saleData.user_id,
      descricao: `Receita referente à Venda #${newVendaId.substring(0, 8)}`,
      valor: saleData.valor_total,
      data: dataVendaLocalStr, // Usar a data local da venda (YYYY-MM-DD)
      categoria_id: saleData.categoria_id, // Usar a categoria definida na venda
      venda_id: newVendaId, // Link para a venda
      forma_pagamento_id: saleData.forma_pagamento_id, // Pode ser útil ter na receita também
      tipo: 'venda' as const, // Definir o tipo como 'venda'
      recorrente: false, // Venda não é recorrente
      frequencia: null,
    };

    const { error: receitaError } = await supabase
      .from('receitas')
      .insert([receitaParaInserir]);

    if (receitaError) {
      console.error("[createSale] Erro ao inserir receita correspondente:", receitaError);
      // Não lançar erro fatal, mas avisar o usuário
      toast.warning("Venda registrada, mas houve um problema ao criar a receita associada para relatórios.");
    } else {
      console.log("[createSale] Receita correspondente criada com sucesso.");
    }
  } catch (error) {
      console.error("[createSale] Exceção ao criar receita correspondente:", error);
      toast.error("Erro inesperado ao tentar criar a receita associada à venda.");
  }

  // 4. Registrar no Fluxo de Caixa (se for pagamento à vista)
  if (saleData.forma_pagamento_id && FORMAS_PAGAMENTO_A_VISTA.includes(saleData.forma_pagamento_id)) {
    console.log(`[createSale] Forma de pagamento "${saleData.forma_pagamento_id}" é à vista. Registrando no fluxo de caixa...`);
    try {
      const dataVendaStr = dataVendaLocalStr; // Usa a data local para o fluxo de caixa
      console.log(` -> Data para movimento de caixa: "${dataVendaStr}" (data local)`);
      const movimento: Omit<MovimentoCaixa, 'id' | 'fluxo_caixa_id'> = {
        data: dataVendaStr,
        descricao: `Venda #${newVendaId.substring(0, 8)}`, 
        created_at: new Date().toISOString(), 
        tipo: 'entrada',
        valor: saleData.valor_total,
        user_id: saleData.user_id,
        venda_id: newVendaId,
        forma_pagamento_id: saleData.forma_pagamento_id,
        receita_id: null,
        despesa_id: null
      };
      // Chama a função auxiliar que usa a data para achar/criar o fluxo_caixa
      await registrarMovimentoCaixa(movimento); 
      console.log("[createSale] Movimento de caixa registrado com sucesso.");
    } catch (caixaError) {
      console.error("[createSale] Erro ao registrar movimento no caixa:", caixaError);
      toast.error("Atenção: Venda registrada, mas falha ao atualizar o fluxo de caixa. Verifique manualmente.");
      // Não fazer rollback da venda por erro no caixa, apenas avisar.
    }
  } else {
    console.log(`[createSale] Forma de pagamento "${saleData.forma_pagamento_id || 'N/A'}" não é considerada à vista. Não registrando no fluxo de caixa agora.`);
  }

  console.log("[createSale] --- FIM CRIAÇÃO --- Retornando ID:", newVendaId);
  // Retorna o ID da venda criada
  return newVendaId; 
};

// Função auxiliar para registrar movimento no caixa (pode já existir em outro serviço)
async function registrarMovimentoCaixa(movimento: Omit<MovimentoCaixa, 'id' | 'fluxo_caixa_id'>) {
    console.log("[registrarMovimentoCaixa] Recebido movimento com data ISO:", movimento.data);

    // Formata a data ISO (ex: '2024-05-03T18:00:00.000Z') para YYYY-MM-DD
    const dataFormatada = movimento.data.split('T')[0];
    console.log(`[registrarMovimentoCaixa] Data formatada para YYYY-MM-DD: "${dataFormatada}"`);

    // Se o movimento é de uma venda, adicionar informações do cliente
    if (movimento.venda_id) {
        try {
            // Buscar os dados do cliente associado à venda
            const { data: vendaData } = await supabase
                .from('vendas')
                .select('cliente_id, clientes(nome)')
                .eq('id', movimento.venda_id)
                .maybeSingle();

            // Verificação de tipo mais segura e melhorada
            let nomeCliente = null;
            
            // Primeira tentativa: buscar pelo relacionamento clientes (com tratamento de tipo seguro)
            if (vendaData?.clientes) {
                const clientesData = vendaData.clientes as any; // Usar any para evitar problemas de tipo
                try {
                    // Tentar acessar como objeto
                    if (clientesData && typeof clientesData === 'object' && !Array.isArray(clientesData) && clientesData.nome) {
                        nomeCliente = clientesData.nome;
                        console.log(`[registrarMovimentoCaixa] Cliente encontrado via objeto: "${nomeCliente}"`);
                    } 
                    // Tentar acessar como array
                    else if (Array.isArray(clientesData) && clientesData.length > 0) {
                        const primeiroCliente = clientesData[0];
                        if (primeiroCliente && typeof primeiroCliente === 'object' && primeiroCliente.nome) {
                            nomeCliente = primeiroCliente.nome;
                            console.log(`[registrarMovimentoCaixa] Cliente encontrado via array: "${nomeCliente}"`);
                        }
                    }
                } catch (typeError) {
                    console.error('[registrarMovimentoCaixa] Erro ao acessar propriedade nome:', typeError);
                }
            }
            // Segunda tentativa: buscar diretamente pela tabela clientes usando cliente_id
            else if (vendaData?.cliente_id) {
                const { data: clienteData } = await supabase
                    .from('clientes')
                    .select('nome')
                    .eq('id', vendaData.cliente_id)
                    .maybeSingle();
                
                if (clienteData?.nome) {
                    nomeCliente = clienteData.nome;
                    console.log(`[registrarMovimentoCaixa] Cliente encontrado via consulta direta: "${nomeCliente}"`);
                }
            }
            
            // Adicionar o nome do cliente à descrição
            if (nomeCliente) {
                movimento.descricao = `${movimento.descricao} - Cliente: ${nomeCliente}`;
                console.log(`[registrarMovimentoCaixa] Adicionado cliente "${nomeCliente}" à descrição do movimento.`);
            } else {
                console.log('[registrarMovimentoCaixa] Cliente não encontrado para a venda');
                movimento.descricao = `${movimento.descricao} - Cliente: Cliente não encontrado`;
                
                // Log adicional para debug
                console.log(`[registrarMovimentoCaixa] DEBUG - dados recuperados:`, JSON.stringify(vendaData));
            }
        } catch (clienteError) {
            console.error('[registrarMovimentoCaixa] Erro ao buscar cliente da venda:', clienteError);
            // Continua sem adicionar o cliente em caso de erro
        }
    }

    // Chama getOrCreateFluxoCaixaId passando a data FORMATADA
    const fluxo_caixa_id = await getOrCreateFluxoCaixaId(dataFormatada, movimento.user_id);
    console.log(`[registrarMovimentoCaixa] Usando fluxo_caixa_id: ${fluxo_caixa_id} para inserir movimento.`);

    const { error } = await supabase
        .from('movimentos_caixa')
        // Usa a data formatada também para o registro do movimento, se a coluna for DATE
        // Se a coluna movimentos_caixa.data for TIMESTAMPTZ, usar movimento.data original
        .insert({ ...movimento, data: dataFormatada, fluxo_caixa_id: fluxo_caixa_id }); // Ajuste aqui se necessário

    if (error) {
        console.error("[registrarMovimentoCaixa] Erro ao inserir movimento:", error);
        // Verifica se o erro é sobre a coluna 'data_movimento' para dar uma mensagem mais específica
        if (error.message.includes('data_movimento')) {
             throw new Error(`Erro ao registrar movimento no caixa: Coluna 'data_movimento' não encontrada. O nome correto é 'data'.`);
        } else {
            throw new Error(`Erro ao registrar movimento no caixa: ${error.message}`);
        }
    }
    console.log("[registrarMovimentoCaixa] Movimento inserido com sucesso.");
}

export const updateSale = async (saleId: string, saleData: SaleDataInput) => {
  console.log(`[updateSale] --- INÍCIO ATUALIZAÇÃO --- ID: ${saleId}, Novos Dados:`, JSON.stringify(saleData));

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado.');
  saleData.user_id = user.id; // Garante user_id para operações

  // --- Obter dados ANTES da atualização --- 
  const { data: vendaAtual, error: fetchVendaError } = await supabase
    .from('vendas')
    .select('*, formas_pagamento(id, nome)') // Inclui forma de pagamento atual
    .eq('id', saleId)
    .single();

  if (fetchVendaError || !vendaAtual) {
      console.error("Erro ao buscar venda atual antes de atualizar:", fetchVendaError);
      throw new Error("Não foi possível encontrar a venda para atualizar.");
  }

  console.log("[updateSale] Dados da Venda ATUAL (antes da edicao):", JSON.stringify(vendaAtual));
  const formaPagamentoAntigaNome = vendaAtual.formas_pagamento?.nome;
  const eraAVista = formaPagamentoAntigaNome && FORMAS_PAGAMENTO_A_VISTA.includes(formaPagamentoAntigaNome);
  console.log(`[updateSale] Venda Atual: FormaPgto=${formaPagamentoAntigaNome}, Era à Vista=${eraAVista}, ValorAtual=${vendaAtual.valor_total}`);

  // --- Transação Simulada --- 
  try {
    // 1. Deletar itens antigos
    console.log("Deletando itens antigos...");
    const { error: deleteItemsError } = await supabase
      .from('vendas_items')
      .delete()
      .eq('venda_id', saleId);
    if (deleteItemsError) {
      console.error("Erro ao deletar itens antigos:", deleteItemsError);
      throw new Error(`Erro ao deletar itens antigos: ${deleteItemsError.message}`);
    }
    console.log("Itens antigos deletados.");

    // 2. Deletar parcelas antigas
    console.log("Deletando parcelas antigas...");
    const { error: deleteParcelasError } = await supabase
      .from('pagamentos_prazo')
      .delete()
      .eq('venda_id', saleId);
    // Não lançar erro se não houver parcelas para deletar (code PGRST116), mas logar outros erros
    if (deleteParcelasError && deleteParcelasError.code !== 'PGRST116') {
      console.error("Erro ao deletar parcelas antigas:", deleteParcelasError);
      throw new Error(`Erro ao deletar parcelas antigas: ${deleteParcelasError.message}`);
    }
     console.log("Parcelas antigas deletadas (ou não existiam).");

    // 3. Atualizar dados da venda principal
    console.log("[updateSale] Atualizando dados principais da venda...");
    
    // Tratamento consistente de data/hora como no createSale
    let dataVendaISO = saleData.data_venda;
    if (!dataVendaISO) {
      dataVendaISO = new Date().toISOString();
    }
    
    // Calcula a data local em formato YYYY-MM-DD para uso em relatórios
    const dataVendaObj = new Date(dataVendaISO);
    const options = { 
      timeZone: 'America/Sao_Paulo', 
      year: 'numeric' as const, 
      month: '2-digit' as const, 
      day: '2-digit' as const 
    };
    const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(dataVendaObj);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    const dataVendaLocalStr = `${year}-${month}-${day}`; // Formato YYYY-MM-DD
    
    console.log("[updateSale] Dados de data processados:",
      "\n -> data_venda (ISO/UTC):", dataVendaISO,
      "\n -> data_venda_local (YYYY-MM-DD):", dataVendaLocalStr
    );
    
    const { error: updateVendaError } = await supabase
      .from('vendas')
      .update({ 
        data_venda: dataVendaISO,
        data_venda_local: dataVendaLocalStr,
        cliente_id: saleData.cliente_id, 
        forma_pagamento_id: saleData.forma_pagamento_id,
        categoria_id: saleData.categoria_id,
        valor_total: saleData.valor_total,
        observacoes: saleData.observacoes,
        user_id: saleData.user_id, 
        num_parcelas: saleData.num_parcelas,
        primeiro_vencimento: saleData.primeiro_vencimento,
        status: 'pendente'
      })
      .eq('id', saleId);
    if (updateVendaError) {
       console.error("Erro ao atualizar venda principal:", updateVendaError);
      throw new Error(`Erro ao atualizar venda principal: ${updateVendaError.message}`);
    }
    console.log("Dados principais atualizados.");

    // 4. Inserir novos itens
    const itensParaInserir = saleData.items.map(item => ({ 
      ...item, 
      venda_id: saleId, // Usa o ID da venda existente
      user_id: saleData.user_id // Garante user_id nos itens
    }));
    
    console.log("Inserindo novos itens:", itensParaInserir);
    const { error: insertItensError } = await supabase.from('vendas_items').insert(itensParaInserir);
    if (insertItensError) { 
       console.error("Erro ao inserir novos itens:", insertItensError);
      // Considerar reverter a atualização da venda? Transação seria ideal.
      throw new Error(`Erro ao inserir novos itens: ${insertItensError.message}`); 
    }
    console.log("Novos itens inseridos.");

    // 5. Inserir novas parcelas (se aplicável)
    const { data: novaFormaPagamentoData, error: newFpError } = saleData.forma_pagamento_id
      ? await supabase.from('formas_pagamento').select('id, nome').eq('id', saleData.forma_pagamento_id).single()
      : { data: null, error: null };

    if (newFpError) throw new Error("Erro ao buscar nova forma de pagamento."); // Lançar erro aqui pois impacta lógica

    const novaFormaPagamentoNome = novaFormaPagamentoData?.nome;
    const novaIsAPrazo = novaFormaPagamentoNome === 'A Prazo (Fiado)';
    const novaEhAVista = novaFormaPagamentoNome && FORMAS_PAGAMENTO_A_VISTA.includes(novaFormaPagamentoNome);
    console.log(`[updateSale] Novos Dados: FormaPgto=${novaFormaPagamentoNome}, É Nova a Prazo=${novaIsAPrazo}, É Nova à Vista=${novaEhAVista}, NovoValor=${saleData.valor_total}`);

    if (novaIsAPrazo && saleData.num_parcelas && saleData.primeiro_vencimento) {
       console.log("Recalculando e inserindo novas parcelas...");
        const numParcelas = saleData.num_parcelas;
        const primeiroVencimento = new Date(saleData.primeiro_vencimento.replace(/-/g, '/')); // Parse para Date
        const valorParcela = saleData.valor_total / numParcelas;
        const parcelasParaInserir = [];

        if (isNaN(primeiroVencimento.getTime())) {
            console.error("Data do primeiro vencimento inválida na atualização:", saleData.primeiro_vencimento);
            // Transação seria ideal para rollback
            throw new Error("Data do primeiro vencimento inválida ao atualizar parcelas.");
        }

        for (let i = 0; i < numParcelas; i++) {
            const dataVencimento = new Date(primeiroVencimento);
            dataVencimento.setMonth(dataVencimento.getMonth() + i);
            
            parcelasParaInserir.push({
                venda_id: saleId,
                valor: parseFloat(valorParcela.toFixed(2)),
                data_vencimento: dataVencimento.toISOString().split('T')[0],
                status: 'aguardando',
                observacoes: `Parcela ${i + 1} de ${numParcelas}`,
                user_id: saleData.user_id, // Garante user_id nas parcelas
                forma_pagamento_id: saleData.forma_pagamento_id, // Adicionado
            });
        }
        
        console.log("Novas parcelas para inserir:", parcelasParaInserir);
        const { error: insertParcelasError } = await supabase
            .from('pagamentos_prazo')
            .insert(parcelasParaInserir);
            
        if (insertParcelasError) {
            console.error("Erro ao inserir novas parcelas:", insertParcelasError);
            // Transação seria ideal para rollback
            throw new Error(`Erro ao inserir novas parcelas: ${insertParcelasError.message}.`);
        }
         console.log("Novas parcelas inseridas.");
    }

    // 6. Ajustar movimento de caixa
    console.log("[updateSale] Verificando ajuste de Movimento Caixa...");
    if (eraAVista && !novaEhAVista) { // Deixou de ser à vista -> Remover movimento
        console.log(`[updateSale] Cenário: Deixou de ser à vista. Removendo movimento...`);
        const { error: deleteMovError } = await supabase.from('movimentos_caixa').delete().eq('venda_id', saleId);
        if (deleteMovError && deleteMovError.code !== 'PGRST116') { // Ignora erro se não havia movimento
            console.error("Erro ao DELETAR movimento ao mudar forma pgto venda:", deleteMovError);
            toast.warning("Venda atualizada, mas erro ao remover registro de caixa antigo.");
        }
    } else if (!eraAVista && novaEhAVista) { 
        console.log(`[updateSale] Cenário: Passou a ser à vista.`);
        try {
          console.log(` -> Data para novo movimento (dataVendaLocalStr): "${dataVendaLocalStr}" (data local)`);
          const movimentoData: Omit<MovimentoCaixa, 'id' | 'fluxo_caixa_id'> = {
              user_id: saleData.user_id,
              data: dataVendaLocalStr,
              tipo: 'entrada',
              valor: saleData.valor_total,
              descricao: `Venda #${saleId.substring(0, 6)} - ${novaFormaPagamentoNome}`,
              venda_id: saleId,
              forma_pagamento_id: saleData.forma_pagamento_id,
              receita_id: null,
              despesa_id: null,
              created_at: new Date().toISOString()
          };
          await registrarMovimentoCaixa(movimentoData); 
        } catch (error) {
            console.error("[updateSale] Falha ao ADICIONAR movimento.", error);
        }
    } else if (eraAVista && novaEhAVista) {
        console.log(`[updateSale] Cenário: Continua à vista. Atualizando movimento...`);
        const { data: movimentoExistente, error: fetchMovError } = await supabase
            .from('movimentos_caixa')
            .select('id, data, fluxo_caixa_id')
            .eq('venda_id', saleId)
            .maybeSingle();
        
        if (fetchMovError && fetchMovError.code !== 'PGRST116') {
             console.error("Erro ao buscar movimento existente para atualizar:", fetchMovError);
             toast.error("Erro ao buscar movimento de caixa para atualizar.");
        } else if (movimentoExistente) {
           console.log(` -> Movimento existente encontrado (ID: ${movimentoExistente.id}). Verificando data...`);
           let fluxo_id_final = movimentoExistente.fluxo_caixa_id;
           let data_final = movimentoExistente.data;

           if (movimentoExistente.data !== saleData.data_venda) {
              console.warn(` -> Data do movimento mudou de ${movimentoExistente.data} para ${saleData.data_venda}. Buscando/Criando novo fluxo_caixa...`);
              data_final = saleData.data_venda;
              try {
                 fluxo_id_final = await getOrCreateFluxoCaixaId(saleData.data_venda, saleData.user_id);
                 console.log(` -> Novo fluxo_caixa_id para atualização: ${fluxo_id_final}`);
              } catch (fluxoError) {
                 console.error(" -> Erro ao obter fluxo_id para nova data na atualização. Mantendo antigo.");
                 // Mantém o antigo ID do fluxo se der erro ao buscar/criar o novo
                 // fluxo_id_final continua sendo movimentoExistente.fluxo_caixa_id
              }
           }

           // Define os campos que podem ser atualizados
           const dadosUpdateMovimento: {
                valor?: number;
                data?: string;
                descricao?: string;
                fluxo_caixa_id?: string; 
            } = {
                valor: saleData.valor_total,
                data: data_final, 
                descricao: `Venda #${saleId.substring(0, 6)} - ${novaFormaPagamentoNome}`,
                fluxo_caixa_id: fluxo_id_final 
            };
            console.log(" -> Dados para Update do Movimento:", JSON.stringify(dadosUpdateMovimento));
            
            // MODIFICAÇÃO: Em vez de apenas atualizar, DELETAR e CRIAR NOVO se a data mudou
            if (movimentoExistente.data !== saleData.data_venda) {
                console.log(" -> [CORREÇÃO] A data mudou. Deletando o movimento antigo e criando um novo...");
                
                // 1. Deletar o movimento antigo
                const { error: deleteOldError } = await supabase
                    .from('movimentos_caixa')
                    .delete()
                    .eq('id', movimentoExistente.id);
                
                if (deleteOldError) {
                    console.error(" -> Erro ao deletar movimento antigo:", deleteOldError);
                    toast.warning("Erro ao atualizar o fluxo de caixa (remoção).");
                } else {
                    console.log(" -> Movimento antigo deletado com sucesso.");
                    
                    // 2. Criar um novo movimento com a data correta
                    const novoMovimento: Omit<MovimentoCaixa, 'id' | 'fluxo_caixa_id'> = {
                        user_id: saleData.user_id,
                        data: dataVendaLocalStr,
                        tipo: 'entrada',
                        valor: saleData.valor_total,
                        descricao: `Venda #${saleId.substring(0, 6)} - ${novaFormaPagamentoNome}`,
                        venda_id: saleId,
                        forma_pagamento_id: saleData.forma_pagamento_id,
                        receita_id: null,
                        despesa_id: null,
                        created_at: new Date().toISOString()
                    };
                    
                    try {
                        await registrarMovimentoCaixa(novoMovimento);
                        console.log(" -> Novo movimento criado com sucesso na data correta.");
                    } catch (createError) {
                        console.error(" -> Erro ao criar novo movimento:", createError);
                        toast.error("Falha ao registrar movimento de caixa na nova data.");
                    }
                }
            } else {
                // A data não mudou, apenas atualiza o valor e descrição
                const { error: updateMovError } = await supabase
                    .from('movimentos_caixa')
                    .update(dadosUpdateMovimento)
                    .eq('id', movimentoExistente.id);
                
                if (updateMovError) {
                    console.error("Erro ao ATUALIZAR movimento:", updateMovError);
                    toast.warning("Venda atualizada, mas erro ao atualizar registro no caixa.");
                } else {
                     console.log(`[updateSale] Movimento de caixa ${movimentoExistente.id} atualizado com SUCESSO.`);
                }
            }
        } else {
             console.warn("[updateSale] Era à vista e continua à vista, mas não encontrou movimento existente para atualizar?");
             // Considerar adicionar um novo movimento como fallback?
             // Por enquanto, apenas loga.
        }
    } else {
        console.log("[updateSale] Cenário: Nenhuma alteração necessária no movimento de caixa (ou não era/não passou a ser à vista, ou valor não mudou).");
    }

    console.log(`[updateSale] --- FIM ATUALIZAÇÃO --- Venda ${saleId} concluída.`);
    return { venda_id: saleId };

  } catch (error) {
    // Bloco catch restaurado
    console.error(`[updateSale] Erro na atualização da venda ${saleId}:`, error);
    toast.error(`Erro ao atualizar venda: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    throw error; // Re-lançar o erro
  }
}; // Fechamento da função updateSale

// Função para atualizar apenas o status de uma venda
export const updateSaleStatus = async (saleId: string, status: 'pendente' | 'pago' | 'cancelado') => {
  const { data, error } = await supabase
    .from('vendas')
    .update({ status: status, updated_at: new Date().toISOString() })
    .eq('id', saleId)
    .select() // Retorna os dados atualizados
    .single(); // Espera um único resultado

  if (error) {
    console.error("Erro ao atualizar status da venda:", error);
    toast.error(`Erro ao atualizar status: ${error.message}`);
    throw error;
  }

  return data;
};

// Garante que não há mais nada após o fechamento da função, a menos que haja outras exportações.
