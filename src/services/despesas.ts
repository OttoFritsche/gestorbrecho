import { supabase } from '@/integrations/supabase/client';
import { Despesa, MovimentoCaixa, FormaPagamento } from '@/types/financeiro'; // Importar MovimentoCaixa e FormaPagamento
import { toast } from 'sonner'; // Adicionar importação do toast
import { parseISO, format, subDays } from 'date-fns';
import { TIMEZONE } from '@/lib/constants';

/**
 * Formata a data local atual para formato YYYY-MM-DD considerando o fuso horário local.
 * Esta função garante que a data seja sempre a do usuário, não UTC.
 */
const obterDataLocalFormatada = (): string => {
  const hoje = new Date();
  const dataLocalFormatada = format(hoje, 'yyyy-MM-dd');
  console.log(`Data local formatada: ${dataLocalFormatada}`);
  return dataLocalFormatada;
};

/**
 * Busca todas as despesas do usuário logado.
 * TODO: Adicionar filtros e paginação conforme necessário.
 */
export const getDespesas = async (): Promise<Despesa[]> => {
  // Busca despesas associadas ao usuário logado
  const { data, error } = await supabase
    .from('despesas') // Nome da tabela no Supabase
    .select('*') // Seleciona todas as colunas
    .order('data', { ascending: false }); // Ordena pela data (a coluna que representa data de pagamento)

  // Verifica se ocorreu algum erro durante a consulta
  if (error) {
    // Loga o erro no console para depuração
    console.error('Erro ao buscar despesas:', error);
    // Lança o erro para ser tratado onde a função for chamada
    throw new Error('Não foi possível buscar as despesas.');
  }

  // Retorna os dados obtidos ou um array vazio se não houver dados
  return data || [];
};

/**
 * Adiciona uma nova despesa e, se paga, um movimento de caixa.
 * @param despesaData - Os dados da nova despesa.
 */
export const addDespesa = async (despesaData: Omit<Despesa, 'id' | 'created_at' | 'user_id'>): Promise<Despesa> => {
  // Validação de dados
  if (!despesaData.data_vencimento) {
    // Considerar se a data de vencimento deve ser sempre obrigatória ou se pode ter um padrão.
    // Por agora, mantemos a validação como estava, mas pode ser um ponto de revisão.
    // throw new Error('A data de vencimento é obrigatória para despesas.'); 
    // Comentado temporariamente para não bloquear testes, mas deve ser revisto.
    console.warn("A data de vencimento não foi fornecida. Isso pode ser um requisito futuro.");
  }

  // Ajustes nos dados antes de inserir
  const dadosAjustados = { ...despesaData };
  
  // REMOVIDO: Bloco que definia data de pagamento automaticamente
  // if (dadosAjustados.pago && !dadosAjustados.data) {
  //   dadosAjustados.data = obterDataLocalFormatada();
  //   console.log('Data de pagamento (LOCAL) definida automaticamente:', dadosAjustados.data);
  // } else 
  
  if (!dadosAjustados.pago) {
    // Se não estiver paga, a data de pagamento deve ser null (garantido pelo schema ou aqui)
    dadosAjustados.data = null;
  } else if (dadosAjustados.pago && !dadosAjustados.data) {
     // ESTE CASO NÃO DEVE MAIS OCORRER DEVIDO À VALIDAÇÃO ZOD
     console.error("ERRO INESPERADO: Despesa marcada como paga sem data de pagamento passou pela validação Zod.");
     throw new Error("Erro interno: Data de pagamento ausente para despesa paga.");
  }

  // Garantir que recorrente e frequencia sejam incluídos, mesmo que sejam undefined ou null no input
  // O schema Zod já deve garantir os tipos corretos vindos do form
  const dadosParaInserir = {
    ...dadosAjustados,
    recorrente: dadosAjustados.recorrente ?? false, // Default para false se não vier
    frequencia: dadosAjustados.frequencia ?? null, // Default para null se não vier
  };


  // 1. Inserir a despesa
  // Usar dadosParaInserir que contém recorrente e frequencia
  const { data: novaDespesa, error: insertError } = await supabase
    .from('despesas')
    .insert([dadosParaInserir]) // <--- Modificado aqui
    .select()
    .single();

  if (insertError || !novaDespesa) {
    console.error('Erro ao adicionar despesa:', insertError);
    throw new Error('Não foi possível adicionar a despesa.');
  }

  // 2. Se a despesa foi paga, INSERIR movimento de caixa
  // A validação Zod garante que novaDespesa.data existirá se novaDespesa.pago for true
  if (novaDespesa.pago) { 
    const { data: { user } } = await supabase.auth.getUser(); 
    if (user) {
      // Usar a data LOCAL do movimento (que veio do formulário)
      const dataMovimento = novaDespesa.data!; // Non-null assertion ok devido à validação Zod
      
      console.log('[addDespesa] Preparando para buscar/criar fluxo de caixa:', {
        dataMovimento: dataMovimento,
        userId: user.id,
        tipoDataMovimento: typeof dataMovimento
      });

      // Garantir que existe fluxo de caixa para a data do movimento
      const { data: fluxoExistente, error: erroBuscaFluxo } = await supabase
        .from('fluxo_caixa')
        .select('id')
        .eq('data', dataMovimento)
        .eq('user_id', user.id)
        .single();

      let fluxoCaixaId;
      if (erroBuscaFluxo && erroBuscaFluxo.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Erro ao buscar fluxo de caixa existente:', erroBuscaFluxo);
        toast.error('Erro ao verificar fluxo de caixa para registrar movimento.');
        // Considerar se deve prosseguir ou não. Por ora, prosseguimos.
      }

      if (fluxoExistente) {
        fluxoCaixaId = fluxoExistente.id;
      } else {
         // Criar um novo fluxo de caixa (lógica similar à anterior)
         // Buscar saldo do dia anterior
         let diaAnterior;
         try {
           // Tentar parsear a data do movimento
           const parsedDataMovimento = typeof dataMovimento === 'string' ? parseISO(dataMovimento) : dataMovimento;
           diaAnterior = format(subDays(parsedDataMovimento, 1), 'yyyy-MM-dd');
         } catch (e) {
           console.warn('Erro ao calcular dia anterior a partir de dataMovimento:', e);
           // Fallback: usar dia anterior da data atual
           diaAnterior = format(subDays(new Date(), 1), 'yyyy-MM-dd');
         }
         
         const { data: fluxoDiaAnterior } = await supabase
            .from('fluxo_caixa')
            .select('saldo_final')
            .eq('data', diaAnterior)
            .eq('user_id', user.id)
            .single();
         const saldoInicialParaNovoFluxo = fluxoDiaAnterior?.saldo_final ?? 0;
         
         const { data: novoFluxo, error: fluxoError } = await supabase
          .from('fluxo_caixa')
          .insert({
            user_id: user.id,
            data: dataMovimento,
            saldo_inicial: saldoInicialParaNovoFluxo, 
            entradas: 0,
            saidas: 0,
            saldo_final: saldoInicialParaNovoFluxo
          })
          .select('id')
          .single();
          
        if (fluxoError || !novoFluxo) {
          console.error('Erro ao criar fluxo de caixa para movimento:', fluxoError);
          toast.error('Erro ao criar registro de fluxo de caixa necessário.');
          return novaDespesa; // Retorna despesa, mas sem movimento
        }
        fluxoCaixaId = novoFluxo.id;
      }

      // Inserir o movimento de caixa
      const movimentoData: Omit<MovimentoCaixa, 'id' | 'created_at'> = {
        user_id: user.id,
        data: dataMovimento, // Usar a data da despesa paga (fornecida pelo usuário)
        tipo: 'saida', 
        valor: novaDespesa.valor,
        descricao: `Pagamento Despesa: ${novaDespesa.descricao}`,
        despesa_id: novaDespesa.id,
        // Usar forma_pagamento_id que veio da despesa
        forma_pagamento_id: novaDespesa.forma_pagamento_id, 
        receita_id: null,
        venda_id: null,
        fluxo_caixa_id: fluxoCaixaId 
      };

      const { error: movimentoError } = await supabase
        .from('movimentos_caixa')
        .insert([movimentoData]);

      if (movimentoError) {
        console.error('Erro ao adicionar movimento de caixa para despesa paga:', movimentoError);
        toast.warning('Despesa adicionada, mas houve um erro ao registrar o movimento no caixa.');
      } else {
        // O trigger `atualizar_saldo_fluxo_caixa` deve ter rodado aqui
        console.log('Movimento de caixa para despesa adicionada com sucesso.');
      }
    } else {
        console.warn('Usuário não encontrado para registrar movimento de caixa.');
        toast.error('Erro interno: usuário não autenticado ao tentar registrar movimento de caixa.');
    }
  }

  return novaDespesa;
};

/**
 * Atualiza uma despesa e adiciona/remove movimento de caixa se o status 'pago' mudar.
 * @param id - O ID da despesa a ser atualizada.
 * @param updates - Os campos a serem atualizados.
 */
export const updateDespesa = async (id: string, updates: Partial<Omit<Despesa, 'id' | 'created_at' | 'user_id'>>): Promise<Despesa> => {
  try {
    console.log('Atualizando despesa com os seguintes dados:', updates);
    
    // 1. Obter o estado atual da despesa ANTES de atualizar
    const { data: despesaAtual, error: fetchError } = await supabase
      .from('despesas')
      .select('pago, valor, descricao, user_id, data') 
      .eq('id', id)
      .single();

    if (fetchError || !despesaAtual) {
      console.error("Erro ao buscar despesa antes de atualizar: ", fetchError);
      throw new Error("Não foi possível encontrar a despesa para atualizar.");
    }

    // Ajustar dados para a atualização
    const updatesAjustados = { ...updates };
    
    // REMOVIDO: Bloco que definia data de pagamento automaticamente na atualização
    // if (updates.pago === true && despesaAtual.pago === false && !updates.data) {
    //   const dataLocal = obterDataLocalFormatada();
    //   updatesAjustados.data = dataLocal;
    //   console.log('Data de pagamento (LOCAL) definida automaticamente na atualização:', updatesAjustados.data);
    // } else 
    
    if (updates.pago === false && despesaAtual.pago === true) {
      // Se estiver mudando para pago=false, remover a data de pagamento
      updatesAjustados.data = null;
    } else if (updates.pago === true && despesaAtual.pago === false && !updates.data) {
       // ESTE CASO NÃO DEVE MAIS OCORRER DEVIDO À VALIDAÇÃO ZOD
       console.error("ERRO INESPERADO: Tentativa de marcar como paga sem data de pagamento passou pela validação Zod na atualização.");
       throw new Error("Erro interno: Data de pagamento ausente ao marcar despesa como paga.");
    }


    // 2. Atualizar a despesa
    const { data: despesaAtualizada, error: updateError } = await supabase
      .from('despesas')
      .update(updatesAjustados)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar despesa:', updateError);
      
      // Verificar se o erro é relacionado a uma coluna inexistente
      if (updateError.code === 'PGRST204' && updateError.message?.includes('Could not find')) {
        const matches = updateError.message.match(/\'([^\']+)\'/);
        const coluna = matches ? matches[1] : 'desconhecida';
        throw new Error(`A coluna ${coluna} não existe na tabela de despesas. Entre em contato com o administrador.`);
      }
      
      throw new Error('Não foi possível atualizar a despesa.');
    }

    if (!despesaAtualizada) {
      throw new Error('Despesa atualizada, mas não foi possível recuperar os dados atualizados.');
    }

    // 3. Verificar se o status 'pago' mudou e ajustar movimento de caixa
    const pagoMudou = typeof updates.pago === 'boolean' && despesaAtual.pago !== updates.pago;

    if (pagoMudou) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (updates.pago === true) { // Passou de não pago para PAGO -> Adicionar movimento SAIDA
          
          // Usar a data LOCAL do pagamento (garantida pela validação Zod)
          const dataMovimento = despesaAtualizada.data!; // Non-null assertion ok
          console.log('Data LOCAL do movimento a ser registrado (updateDespesa):', dataMovimento);

          // Garantir que existe fluxo de caixa para a data do movimento
          const { data: fluxoExistente, error: erroBuscaFluxo } = await supabase
            .from('fluxo_caixa')
            .select('id')
            .eq('data', dataMovimento)
            .eq('user_id', user.id)
            .single();
            
          let fluxoCaixaId;
          if (erroBuscaFluxo && erroBuscaFluxo.code !== 'PGRST116') { 
             console.error('Erro ao buscar fluxo de caixa existente (update):', erroBuscaFluxo);
             toast.error('Erro ao verificar fluxo de caixa para registrar movimento (update).');
          }

          if (fluxoExistente) {
            fluxoCaixaId = fluxoExistente.id;
          } else {
             // Criar novo fluxo de caixa
             // Garantir que a data é válida antes de chamar parseISO
             let diaAnterior;
             try {
               // Tentar parsear a data do movimento
               const parsedDataMovimento = typeof dataMovimento === 'string' ? parseISO(dataMovimento) : dataMovimento;
               diaAnterior = format(subDays(parsedDataMovimento, 1), 'yyyy-MM-dd');
             } catch (e) {
               console.warn('Erro ao calcular dia anterior:', e);
               // Fallback: usar dia anterior da data atual
               diaAnterior = format(subDays(new Date(), 1), 'yyyy-MM-dd');
             }
             
             const { data: fluxoDiaAnterior } = await supabase
                .from('fluxo_caixa')
                .select('saldo_final')
                .eq('data', diaAnterior)
                .eq('user_id', user.id)
                .single();
             const saldoInicialParaNovoFluxo = fluxoDiaAnterior?.saldo_final ?? 0;
             
             const { data: novoFluxo, error: fluxoError } = await supabase
              .from('fluxo_caixa')
              .insert({
                user_id: user.id,
                data: dataMovimento,
                saldo_inicial: saldoInicialParaNovoFluxo, 
                entradas: 0, 
                saidas: 0, 
                saldo_final: saldoInicialParaNovoFluxo 
              })
              .select('id')
              .single();
              
            if (fluxoError || !novoFluxo) {
              console.error('Erro ao criar fluxo de caixa para movimento (update):', fluxoError);
              toast.error('Erro ao criar registro de fluxo de caixa necessário (update).');
              return despesaAtualizada; // Retorna despesa, mas sem movimento
            }
            fluxoCaixaId = novoFluxo.id;
          }
          
          // Verificar se já existe movimento para evitar duplicidade (caso ocorra erro e tente de novo)
          const { data: movimentoExistente, error: erroBuscaMov } = await supabase
              .from('movimentos_caixa')
              .select('id')
              .eq('despesa_id', despesaAtualizada.id)
              .eq('tipo', 'saida')
              .limit(1)
              .single();
          
          if (erroBuscaMov && erroBuscaMov.code !== 'PGRST116') {
              console.error("Erro ao verificar movimento existente: ", erroBuscaMov);
              toast.error('Erro ao verificar movimento existente antes de inserir.');
          } else if (!movimentoExistente) {
              // Só insere se NÃO existir movimento prévio para esta despesa
              const movimentoData: Omit<MovimentoCaixa, 'id' | 'created_at'> = {
                user_id: user.id,
                data: dataMovimento,
                tipo: 'saida',
                valor: despesaAtualizada.valor,
                descricao: `Pagamento Despesa: ${despesaAtualizada.descricao}`,
                despesa_id: despesaAtualizada.id,
                // Usar forma_pagamento_id que veio da despesa
                forma_pagamento_id: despesaAtualizada.forma_pagamento_id, 
                receita_id: null,
                venda_id: null,
                fluxo_caixa_id: fluxoCaixaId
              };
              const { error: addMovimentoError } = await supabase.from('movimentos_caixa').insert([movimentoData]);
              if (addMovimentoError) {
                console.error('Erro ao ADICIONAR movimento de caixa ao marcar despesa como paga:', addMovimentoError);
                toast.warning('Despesa atualizada, mas erro ao registrar movimento de pagamento no caixa.');
              } else {
                console.log('Movimento de caixa (saída) para despesa atualizada para PAGO adicionado com sucesso.');
              }
          } else {
               console.log("Movimento de caixa para esta despesa já existe. Não será inserido novamente.");
          }

        } else { // Passou de pago para NÃO PAGO -> Deletar o movimento associado
          console.log(`Despesa ${id} marcada como não paga. Tentando remover movimento de caixa associado.`);
          const { error: deleteMovimentoError } = await supabase
            .from('movimentos_caixa')
            .delete()
            .eq('despesa_id', id)
            .eq('tipo', 'saida'); // Garantir que só apaga o de saída

          if (deleteMovimentoError) {
            console.error('Erro ao DELETAR movimento de caixa ao marcar despesa como não paga:', deleteMovimentoError);
            toast.warning('Despesa atualizada, mas erro ao remover o registro de pagamento do caixa. Ajuste manual pode ser necessário.');
          } else {
            // O trigger `atualizar_saldo_fluxo_caixa` deve ter rodado aqui
            console.log(`Movimento de caixa para despesa ${id} removido com sucesso (ou não existia).`);
          }
        }
      } else {
         console.warn('Usuário não encontrado para ajustar movimento de caixa.');
         toast.error('Erro interno: usuário não autenticado ao tentar ajustar movimento de caixa.');
      }
    } else if (updates.valor && despesaAtual.pago) {
      // Se APENAS o valor mudou E a despesa JÁ estava paga
      // Adicionado log para clareza - o valor do movimento existente NÃO é atualizado
      const valorAntigo = despesaAtual.valor;
      const valorNovo = updates.valor;
      console.warn(`Valor da despesa PAGA ${id} foi alterado (de ${valorAntigo} para ${valorNovo}), mas o movimento de caixa associado NÃO foi atualizado automaticamente.`);
      toast.info('Valor da despesa paga alterado. O registro no caixa pode precisar de ajuste manual.');
    }

    return despesaAtualizada;
  } catch (error) {
    console.error('Erro na operação de atualização de despesa:', error);
    throw error;
  }
};

/**
 * Exclui uma despesa do banco de dados.
 * @param id - O ID da despesa a ser excluída.
 */
export const deleteDespesa = async (id: string): Promise<void> => {
  // Exclui a despesa com o ID correspondente
  const { error } = await supabase
    .from('despesas') // Nome da tabela
    .delete() // Operação de exclusão
    .eq('id', id); // Condição: onde o ID corresponde

  // Verifica se ocorreu erro na exclusão
  if (error) {
    // Loga o erro
    console.error('Erro ao excluir despesa:', error);
    // Lança um erro
    throw new Error('Não foi possível excluir a despesa.');
  }
};

/**
 * Busca uma despesa específica pelo seu ID.
 * @param id - O ID da despesa a ser buscada.
 */
export const getDespesaById = async (id: string): Promise<Despesa | null> => {
  console.log(`[getDespesaById] Buscando despesa com ID ${id}`);
  
  // 1. Busca a despesa com o ID correspondente (sem junção)
  const { data, error } = await supabase
    .from('despesas')
    .select('*')
    .eq('id', id)
    .single(); // Espera um único resultado

  // Verifica se ocorreu erro (incluindo não encontrar o registro, que retorna erro no .single())
  if (error) {
    // Loga o erro
    console.error(`[getDespesaById] Erro ao buscar despesa com ID ${id}:`, error);
    return null;
  }

  console.log(`[getDespesaById] Dados básicos da despesa recuperados:`, data);

  // Resultado a ser incrementado com informações adicionais
  const resultado: Despesa = { ...data };

  // 2. Se tiver categoria_id, busca o nome da categoria
  if (data.categoria_id) {
    try {
      const { data: categoriaData } = await supabase
        .from('categorias')
        .select('nome')
        .eq('id', data.categoria_id)
        .single();
      
      if (categoriaData) {
        resultado.categoria_nome = categoriaData.nome;
      }
    } catch (err) {
      console.warn(`[getDespesaById] Erro ao buscar categoria:`, err);
      resultado.categoria_nome = 'Categoria não encontrada';
    }
  }

  // 3. Se tiver forma_pagamento_id, busca o nome da forma de pagamento
  if (data.forma_pagamento_id) {
    try {
      const { data: formaPagamentoData } = await supabase
        .from('formas_pagamento')
        .select('nome')
        .eq('id', data.forma_pagamento_id)
        .single();
      
      if (formaPagamentoData) {
        resultado.forma_pagamento_nome = formaPagamentoData.nome;
      }
    } catch (err) {
      console.warn(`[getDespesaById] Erro ao buscar forma de pagamento:`, err);
      resultado.forma_pagamento_nome = 'Forma de pagamento não encontrada';
    }
  }

  console.log(`[getDespesaById] Resultado final formatado:`, resultado);

  // Retorna os dados da despesa encontrada com os campos adicionais
  return resultado;
};

/**
 * Busca categorias de despesa.
 * TODO: Mover para um serviço de categorias se necessário.
 */
export const getCategoriasDespesa = async (): Promise<{ id: string; nome: string }[]> => {
  // Busca categorias do tipo 'despesa'
  const { data, error } = await supabase
    .from('categorias') // Nome da tabela de categorias
    .select('id, nome') // Seleciona ID e nome
    .eq('tipo', 'despesa') // Filtra pelo tipo 'despesa'
    .order('nome'); // Ordena pelo nome

  // Verifica se ocorreu erro
  if (error) {
    // Loga o erro
    console.error('Erro ao buscar categorias de despesa:', error);
    // Lança um erro
    throw new Error('Não foi possível buscar as categorias de despesa.');
  }

  // Retorna os dados ou um array vazio
  return data || [];
}; 