import { supabase } from '@/integrations/supabase/client';
import { FluxoCaixa, MovimentoCaixa } from '@/types/financeiro';
import { format, parseISO, eachDayOfInterval, startOfDay, isEqual, subDays, addDays } from 'date-fns';
import { handleSupabaseError } from '@/lib/utils/supabase-error-handler';
import { formatInTimeZone, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { TIMEZONE } from '@/lib/constants';

const timeZone = 'America/Sao_Paulo'; // Manter consistente

/**
 * Busca os registros diários de fluxo de caixa para um período específico,
 * garantindo que todos os dias do intervalo sejam retornados e com saldos corretos.
 * @param dataInicioISO - Data de início do período (formato ISO 8601 UTC representando o início do dia local).
 * @param dataFimISO - Data de fim do período (formato ISO 8601 UTC representando o início do dia local).
 */
export const getFluxoCaixaPeriodo = async (dataInicioISO: string, dataFimISO: string): Promise<FluxoCaixa[]> => {
  console.log(`[getFluxoCaixaPeriodo] DEBUG: Iniciando. Recebido: dataInicioISO=${dataInicioISO}, dataFimISO=${dataFimISO}`);
  try {
    // Validação básica das datas recebidas
    if (!dataInicioISO || !dataFimISO) {
      console.warn('[getFluxoCaixaPeriodo] DEBUG: Datas ISO de início ou fim inválidas ou vazias.');
      return [];
    }
    
    const dataInicioObj = startOfDay(parseISO(dataInicioISO));
    const dataFimObj = startOfDay(parseISO(dataFimISO));
    const dataInicioFormatada = format(dataInicioObj, 'yyyy-MM-dd');
    const dataFimFormatada = format(dataFimObj, 'yyyy-MM-dd');
    console.log(`[getFluxoCaixaPeriodo] DEBUG: Datas formatadas para query: inicio=${dataInicioFormatada}, fim=${dataFimFormatada}`);

    // 1. Busca registros existentes
    console.log('[getFluxoCaixaPeriodo] DEBUG: Executando query para buscar registros existentes...');
    const { data: registrosExistentes, error } = await supabase
      .from('fluxo_caixa')
      .select('*')
      .gte('data', dataInicioFormatada)
      .lte('data', dataFimFormatada)
      .order('data', { ascending: true });
    console.log('[getFluxoCaixaPeriodo] DEBUG: Query de registros concluída.');

    if (error) {
      console.error('[getFluxoCaixaPeriodo] Erro ao buscar fluxo de caixa:', error);
      throw error; // Lança o erro para ser pego pelo catch externo
    }
    console.log(`[getFluxoCaixaPeriodo] DEBUG: Registros existentes encontrados no DB: ${registrosExistentes?.length ?? 0}`);
    // Log detalhado dos registros encontrados
    if (registrosExistentes && registrosExistentes.length > 0) {
      console.log('[getFluxoCaixaPeriodo] DEBUG: Detalhes dos registros encontrados:', JSON.stringify(registrosExistentes, null, 2));
    } else if (!registrosExistentes) {
       console.log('[getFluxoCaixaPeriodo] DEBUG: \"registrosExistentes\" é null ou undefined após a query.');
    }

    // 2. Busca saldo inicial ANTES do primeiro dia
    const dataAnteriorInicio = subDays(dataInicioObj, 1);
    const dataAnteriorInicioISO = dataAnteriorInicio.toISOString(); 
    console.log(` -> Buscando saldo inicial para data anterior: ${format(dataAnteriorInicio, 'yyyy-MM-dd')} (ISO: ${dataAnteriorInicioISO})`);
    const saldoInicialPeriodo = await getSaldoInicialPeriodo(dataAnteriorInicioISO);
    console.log(` -> Saldo inicial ANTES de ${dataInicioFormatada}: ${saldoInicialPeriodo}`);

    // 3. Cria mapa de registros existentes
    const registrosPorData = new Map<string, FluxoCaixa>();
    if (registrosExistentes) {
      registrosExistentes.forEach(registro => {
        const dataKey = registro.data;
        // Validação extra antes de adicionar ao mapa
        if (!dataKey) {
          console.warn('[getFluxoCaixaPeriodo] DEBUG: Registro existente sem \"data\" encontrado:', registro);
          return; // Pular este registro
        }
        registrosPorData.set(dataKey, {
          ...registro,
          entradas: registro.entradas ?? 0,
          saidas: registro.saidas ?? 0,
          saldo_inicial: registro.saldo_inicial ?? 0,
          saldo_final: registro.saldo_final ?? 0
        });
      });
    }
    console.log(`[getFluxoCaixaPeriodo] DEBUG: Mapa de registros criado com ${registrosPorData.size} entradas.`);

    // 4. Gera dias do intervalo
    const diasIntervalo = eachDayOfInterval({
      start: dataInicioObj,
      end: dataFimObj
    });
    console.log('[getFluxoCaixaPeriodo] DEBUG: Dias no intervalo gerados:', diasIntervalo.map(d => format(d, 'yyyy-MM-dd')));

    // 5. Itera e calcula
    let saldoAcumuladoDiaAnterior = saldoInicialPeriodo;
    const resultadoFinal: FluxoCaixa[] = [];
    console.log(`[getFluxoCaixaPeriodo] DEBUG: Iniciando iteração com saldo acumulado inicial: ${saldoAcumuladoDiaAnterior}`);

    for (const dia of diasIntervalo) {
      const dataFormatadaDiaLoop = format(dia, 'yyyy-MM-dd');
      const registroExistenteDiaLoop = registrosPorData.get(dataFormatadaDiaLoop);
      console.log(`[getFluxoCaixaPeriodo] DEBUG: ---- Processando dia do loop: ${dataFormatadaDiaLoop} ----`);
      console.log(`[getFluxoCaixaPeriodo] DEBUG: Registro encontrado no mapa para ${dataFormatadaDiaLoop}?`, !!registroExistenteDiaLoop);

      let saldoInicialDia = saldoAcumuladoDiaAnterior;
      let entradasDia = 0;
      let saidasDia = 0;
      let idDia = `temp-${dataFormatadaDiaLoop}`; 
      let createdAtDia = dia.toISOString(); 
      let userIdDia = "sistema"; 

      if (registroExistenteDiaLoop) {
        //console.log(`    -> Registro encontrado para ${dataFormatadaDiaLoop}:`, registroExistenteDiaLoop);
        entradasDia = registroExistenteDiaLoop.entradas;
        saidasDia = registroExistenteDiaLoop.saidas;
        idDia = registroExistenteDiaLoop.id; 
        createdAtDia = registroExistenteDiaLoop.created_at; 
        userIdDia = registroExistenteDiaLoop.user_id; 
        console.log(`[getFluxoCaixaPeriodo] DEBUG: Usando Entradas=${entradasDia}, Saidas=${saidasDia} do registro.`);
      } else {
        console.log(`[getFluxoCaixaPeriodo] DEBUG: Nenhum registro encontrado no mapa para ${dataFormatadaDiaLoop}. Usando entradas=0, saidas=0.`);
      }
      
      const saldoFinalDia = saldoInicialDia + entradasDia - saidasDia;
      console.log(`[getFluxoCaixaPeriodo] DEBUG: Calculado: Saldo Inicial=${saldoInicialDia}, Entradas=${entradasDia}, Saidas=${saidasDia} => Saldo Final=${saldoFinalDia}`);

      const diaAtual: FluxoCaixa = {
        id: idDia,
        data: dataFormatadaDiaLoop,
        saldo_inicial: saldoInicialDia,
        entradas: entradasDia,
        saidas: saidasDia,
        saldo_final: saldoFinalDia,
        created_at: createdAtDia,
        user_id: userIdDia
      };

      resultadoFinal.push(diaAtual);
      saldoAcumuladoDiaAnterior = saldoFinalDia; // Prepara para o próximo dia
      // console.log(`    -> Saldo acumulado atualizado para ${saldoAcumuladoDiaAnterior}`);
    }
    console.log('[getFluxoCaixaPeriodo] DEBUG: Iteração concluída. Resultado final a ser retornado:', JSON.stringify(resultadoFinal, null, 2));
    return resultadoFinal;

  } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`[getFluxoCaixaPeriodo] ERRO INESPERADO: ${error.message}`, error);
      return []; 
  }
};

/**
 * Busca o saldo final do último dia anterior à data especificada.
 * @param dataReferenciaISO - Data de referência (ISO 8601 UTC) ANTES da qual buscar o saldo.
 * @returns O saldo final do último dia encontrado antes da data de referência ou 0.
 */
export const getSaldoInicialPeriodo = async (dataReferenciaISO: string): Promise<number> => {
  const dataReferenciaFormatada = format(parseISO(dataReferenciaISO), 'yyyy-MM-dd');
  console.log(`[getSaldoInicialPeriodo] Buscando último saldo em ou antes de ${dataReferenciaFormatada}`);

  const { data, error } = await supabase
    .from('fluxo_caixa')
    .select('saldo_final, data')
    .lte('data', dataReferenciaFormatada)
    .order('data', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('[getSaldoInicialPeriodo] Erro ao buscar saldo inicial:', error);
    return 0;
  }

  if (data) {
    console.log(` -> Saldo encontrado na data ${data.data}: ${data.saldo_final}`);
    return data.saldo_final ?? 0;
  } else {
    console.log(` -> Nenhum registro encontrado em ou antes de ${dataReferenciaFormatada}, retornando saldo 0.`);
    return 0;
  }
};

/**
 * Atualiza (ou cria, se não existir) um registro de fluxo de caixa para uma data específica.
 * Esta função é útil quando você precisa atualizar o fluxo depois de uma venda ou outro movimento.
 * @param data - Data do fluxo de caixa no formato YYYY-MM-DD.
 * @param userId - ID do usuário proprietário do registro.
 * @param dadosAtualizacao - Dados a serem atualizados (entradas, saidas, etc).
 */
export const atualizarFluxoCaixa = async (
  data: string, 
  userId: string, 
  dadosAtualizacao: Partial<FluxoCaixa>
): Promise<FluxoCaixa> => {
  // 1. Verificar se já existe registro para esta data
  const { data: registroExistente, error: errorConsulta } = await supabase
    .from('fluxo_caixa')
    .select('*')
    .eq('data', data)
    .eq('user_id', userId)
    .maybeSingle();

  if (errorConsulta && errorConsulta.code !== 'PGRST116') {
    console.error('Erro ao consultar fluxo de caixa existente:', errorConsulta);
    throw new Error('Não foi possível verificar o registro de fluxo de caixa.');
  }

  // 2. Se existir, atualiza; senão, cria
  if (registroExistente) {
    // Busca o saldo final do dia anterior para usar como saldo inicial
    const dataObj = parseISO(data + 'T00:00:00Z'); // Assume UTC ou converte para objeto Date
    const saldoInicial = await getSaldoInicialPeriodo(dataObj.toISOString());

    // Calcula novo saldo final (agora com o saldo inicial correto)
    const entradas = dadosAtualizacao.entradas ?? registroExistente.entradas ?? 0;
    const saidas = dadosAtualizacao.saidas ?? registroExistente.saidas ?? 0;
    const novoSaldoFinal = saldoInicial + entradas - saidas;

    const dadosCompletos = {
      ...dadosAtualizacao,
      saldo_inicial: saldoInicial, // Sempre atualiza o saldo inicial baseado no dia anterior
      saldo_final: novoSaldoFinal,
      updated_at: new Date().toISOString() // Adiciona timestamp de atualização
    };

    const { data: registroAtualizado, error: errorAtualizacao } = await supabase
      .from('fluxo_caixa')
      .update(dadosCompletos)
      .eq('id', registroExistente.id)
      .select('*')
      .single();

    if (errorAtualizacao) {
      console.error('Erro ao atualizar fluxo de caixa:', errorAtualizacao);
      throw new Error('Não foi possível atualizar o registro de fluxo de caixa.');
    }

    return registroAtualizado;
  } else {
    // Busca saldo final anterior para usar como saldo inicial
    // IMPORTANTE: A data para buscar o saldo inicial deve ser a data do registro que estamos criando,
    // pois getSaldoInicialPeriodo busca ANTES da data fornecida.
    const dataObj = parseISO(data + 'T00:00:00Z'); 
    const saldoInicial = await getSaldoInicialPeriodo(dataObj.toISOString());
    
    // Prepara dados completos para inserção
    const entradas = dadosAtualizacao.entradas ?? 0;
    const saidas = dadosAtualizacao.saidas ?? 0;
    const saldoFinal = saldoInicial + entradas - saidas;

    const dadosCompletos = {
      data,
      user_id: userId,
      saldo_inicial: saldoInicial,
      entradas: entradas,
      saidas: saidas,
      saldo_final: saldoFinal,
      // created_at é gerado automaticamente pelo Supabase
      ...dadosAtualizacao,
    };

    const { data: novoRegistro, error: errorInsercao } = await supabase
      .from('fluxo_caixa')
      .insert(dadosCompletos)
      .select('*')
      .single();

    if (errorInsercao) {
      console.error('Erro ao criar fluxo de caixa:', errorInsercao);
      throw new Error('Não foi possível criar o registro de fluxo de caixa.');
    }

    return novoRegistro;
  }
};

/**
 * Busca todos os movimentos de caixa para uma data específica.
 * @param dataISO - Data no formato ISO string (YYYY-MM-DDTHH:mm:ssZ)
 * @returns Uma lista de movimentos de caixa para o dia especificado.
 */
export const getMovimentosCaixaPorDia = async (dataISO: string): Promise<MovimentoCaixa[]> => {
  console.log(`[getMovimentosCaixaPorDia] DEBUG: Iniciando. Recebido dataISO: ${dataISO}`);
  // 1. Converter a data ISO para objeto Date
  let dataObj: Date;
  try {
     dataObj = parseISO(dataISO);
  } catch (parseError) {
    console.error(`[getMovimentosCaixaPorDia] ERRO: Falha ao parsear dataISO: ${dataISO}`, parseError);
    return [];
  }
  
  // 2. Converter para data no fuso horário do Brasil (America/Sao_Paulo)
  let dataBrasil: Date;
  try {
    dataBrasil = utcToZonedTime(dataObj, TIMEZONE);
  } catch (tzError) {
    console.error(`[getMovimentosCaixaPorDia] ERRO: Falha ao converter para Timezone: ${dataObj}`, tzError);
    return [];
  }
  
  // 3. Extrair apenas a parte da data (YYYY-MM-DD) e descartar a hora
  const dataFormatada = format(dataBrasil, 'yyyy-MM-dd');
  
  console.log(`[getMovimentosCaixaPorDia] DEBUG: Data original recebida: ${dataISO}`);
  console.log(`[getMovimentosCaixaPorDia] DEBUG: Data Obj (parseISO): ${dataObj.toISOString()}`);
  console.log(`[getMovimentosCaixaPorDia] DEBUG: Data convertida para fuso BR: ${format(dataBrasil, 'yyyy-MM-dd HH:mm:ssXXX')}`);
  console.log(`[getMovimentosCaixaPorDia] DEBUG: Buscando movimentos no DB para data formatada: ${dataFormatada}`);

  try {
    // 4. Buscar movimentos onde o campo 'data' exatamente igual à data formatada no Brasil
    console.log('[getMovimentosCaixaPorDia] DEBUG: Executando query para buscar movimentos...');
    const { data: movimentos, error } = await supabase
      .from('movimentos_caixa')
      .select('*') // Seleciona tudo inicialmente para debug
      .eq('data', dataFormatada) // Compara com a data formatada
      .order('created_at', { ascending: true });
    console.log('[getMovimentosCaixaPorDia] DEBUG: Query de movimentos concluída.');

    if (error) {
      console.error(`[getMovimentosCaixaPorDia] Erro ao buscar movimentos: ${error.message}`);
      return []; // Retorna um array vazio em caso de erro
    }

    // Se não houver movimentos, retornar array vazio
    if (!movimentos || movimentos.length === 0) {
      console.log(`[getMovimentosCaixaPorDia] DEBUG: Nenhum movimento encontrado no DB para ${dataFormatada}.`);
      return [];
    }
    
    console.log(`[getMovimentosCaixaPorDia] DEBUG: ${movimentos.length} movimentos encontrados no DB para ${dataFormatada}. Detalhes:`, JSON.stringify(movimentos, null, 2));

    // 5. Para cada movimento, buscar informações complementares se necessário
    const movimentosEnriquecidos = await Promise.all(
      movimentos.map(async (movimento) => {
        try {
          // Buscar forma de pagamento se o ID estiver presente
          let formaPagamentoNome = null;
          if (movimento.forma_pagamento_id) {
            const { data: formaPagamento } = await supabase
              .from('formas_pagamento')
              .select('nome')
              .eq('id', movimento.forma_pagamento_id)
              .maybeSingle();
            
            if (formaPagamento) {
              formaPagamentoNome = formaPagamento.nome;
            }
          }

          // Buscar detalhes do pagamento de parcela, se for o caso
          if (movimento.pagamento_prazo_id) {
            const { data: parcelaData } = await supabase
              .from('pagamentos_prazo')
              .select('observacoes, status')
              .eq('id', movimento.pagamento_prazo_id)
              .maybeSingle();
              
            if (parcelaData?.observacoes) {
              // Adicionar ou atualizar a descrição com informações mais detalhadas da parcela
              movimento.descricao = movimento.descricao.includes(parcelaData.observacoes) 
                ? movimento.descricao
                : `${movimento.descricao} - ${parcelaData.observacoes}`;
            }
          }

          // Buscar detalhes da venda se o ID estiver presente
          let vendaDetalhes = null;
          let vendaItensDetalhes = null;
          if (movimento.venda_id) {
            const { data: vendaData } = await supabase
              .from('vendas')
              .select('cliente_id, valor_total, clientes(nome), observacoes')
              .eq('id', movimento.venda_id)
              .maybeSingle();
            
            if (vendaData) {
              vendaDetalhes = vendaData;
              
              // Atualizar a descrição com o nome do cliente, se disponível
              if (vendaData.clientes && vendaData.clientes.nome) {
                // Verificar se a descrição já contém informação do cliente
                if (!movimento.descricao.includes('Cliente:')) {
                  movimento.descricao = `${movimento.descricao} - Cliente: ${vendaData.clientes.nome}`;
                } else if (movimento.descricao.includes('Cliente: Cliente não encontrado')) {
                  // Substituir "Cliente não encontrado" pelo nome real
                  movimento.descricao = movimento.descricao.replace('Cliente: Cliente não encontrado', `Cliente: ${vendaData.clientes.nome}`);
                }
                console.log(`[getMovimentosCaixaPorDia] Cliente encontrado para venda ${movimento.venda_id}: ${vendaData.clientes.nome}. Descrição atualizada.`);
              } else {
                console.log(`[getMovimentosCaixaPorDia] Cliente não encontrado para venda ${movimento.venda_id}`);
              }
              
              // Buscar itens da venda
              const { data: itensData, error: itensError } = await supabase
                .from('vendas_items')
                .select('quantidade, produto_id, descricao_manual')
                .eq('venda_id', movimento.venda_id);

              if (itensError) {
                console.error(`[getMovimentosCaixaPorDia] Erro ao buscar itens para venda ${movimento.venda_id}:`, itensError);
                // Continue com o processamento mesmo com erro na busca de itens
                vendaItensDetalhes = null;
              } else if (itensData) {
                // Mapeia os itens para buscar os nomes dos produtos
                vendaItensDetalhes = await Promise.all(
                  itensData.map(async (item) => {
                    // Verificar primeiro descrição manual (para itens sem produto_id)
                    if (item.descricao_manual) {
                      return {
                        quantidade: item.quantidade,
                        produtos: { nome: item.descricao_manual }
                      };
                    }
                    
                    // Se não tiver descrição manual, busca o produto
                    let nomeProduto = 'Item sem descrição';
                    if (item.produto_id) {
                      const { data: produtoData, error: produtoError } = await supabase
                        .from('produtos')
                        .select('nome')
                        .eq('id', item.produto_id)
                        .maybeSingle();
                      if (produtoError) {
                        console.error(`[getMovimentosCaixaPorDia] Erro ao buscar nome do produto ${item.produto_id}:`, produtoError);
                      } else if (produtoData) {
                        nomeProduto = produtoData.nome || nomeProduto;
                      }
                    }
                    return {
                      quantidade: item.quantidade,
                      produtos: { nome: nomeProduto }
                    };
                  })
                );
              }
            }
          }

          // Retornar movimento enriquecido
          return {
            ...movimento,
            forma_pagamento_nome: formaPagamentoNome,
            venda_detalhes: vendaDetalhes,
            venda_itens_detalhes: vendaItensDetalhes
          };
        } catch (err) {
          console.error(`[getMovimentosCaixaPorDia] Erro ao enriquecer movimento ${movimento.id}:`, err);
          // Em caso de erro, retornar o movimento original sem enriquecimento
          return movimento;
        }
      })
    );

    // Log antes de retornar
    console.log(`[getMovimentosCaixaPorDia] DEBUG: Retornando ${movimentosEnriquecidos.length} movimentos enriquecidos.`);
    return movimentosEnriquecidos;

  } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`[getMovimentosCaixaPorDia] ERRO INESPERADO ao buscar movimentos para ${dataFormatada}: ${error.message}`, error);
      return []; 
  }
};

/**
 * Exclui um movimento de caixa específico e atualiza o fluxo de caixa.
 * @param movimentoId - ID do movimento a ser excluído
 * @returns true se a exclusão foi bem-sucedida, false caso contrário
 */
export const excluirMovimentoCaixa = async (movimentoId: string): Promise<boolean> => {
  try {
    console.log(`[excluirMovimentoCaixa] Iniciando exclusão do movimento ID: ${movimentoId}`);
    
    // Verificar se o movimento existe antes de excluir
    const { data: movimento, error: errorBusca } = await supabase
      .from('movimentos_caixa')
      .select('*')
      .eq('id', movimentoId)
      .single();
      
    if (errorBusca) {
      console.error(`[excluirMovimentoCaixa] Erro ao buscar movimento: ${errorBusca.message}`);
      return false;
    }
    
    if (!movimento) {
      console.error(`[excluirMovimentoCaixa] Movimento ID: ${movimentoId} não encontrado`);
      return false;
    }
    
    console.log(`[excluirMovimentoCaixa] Movimento encontrado: ${JSON.stringify(movimento)}`);
    
    // Excluir o movimento
    const { error: errorExclusao } = await supabase
      .from('movimentos_caixa')
      .delete()
      .eq('id', movimentoId);
      
    if (errorExclusao) {
      console.error(`[excluirMovimentoCaixa] Erro ao excluir movimento: ${errorExclusao.message}`);
      return false;
    }
    
    console.log(`[excluirMovimentoCaixa] Movimento ID: ${movimentoId} excluído com sucesso`);
    return true;
  } catch (error) {
    console.error(`[excluirMovimentoCaixa] Erro inesperado: ${error}`);
    return false;
  }
};

// Adicionar aqui funções para CRUD de MovimentoCaixa se necessário
// ex: addMovimentoCaixa, updateMovimentoCaixa, deleteMovimentoCaixa

// TODO: Adicionar funções para buscar MovimentoCaixa detalhado se necessário
// export const getMovimentosDia = async (data: string): Promise<MovimentoCaixa[]> => { ... }; 