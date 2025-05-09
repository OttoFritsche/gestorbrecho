// Este arquivo contém os serviços de IA para comunicação com o backend n8n
import { supabase } from '@/integrations/supabase/client';
import { MessageRole, ChatMessage } from '@/contexts/IAContext';

// Tipos para as mensagens e respostas do chat
export interface SQLQueryResult {
  query: string;
  data: any[];
  columns: string[];
  error?: string;
}

// Endpoint do n8n (webhook URL)
//const N8N_API_ENDPOINT = 'https://ottofritsche.app.n8n.cloud/webhook/c325c91a-ed02-4d56-8f31-2c1c986f0bbb';//
const N8N_API_ENDPOINT = 'https://ottofritsche.app.n8n.cloud/webhook-test/c325c91a-ed02-4d56-8f31-2c1c986f0bbb';

// Flag para ativar o modo de simulação em desenvolvimento
const USE_SIMULATION = true;

/**
 * Envia uma mensagem para o backend (n8n) e retorna a resposta
 * @param message - Conteúdo da mensagem do usuário
 * @param chatHistory - Histórico de mensagens para contexto
 * @returns A resposta da IA
 */
export const sendMessageToIA = async (
  message: string,
  chatHistory: ChatMessage[]
): Promise<{ content: string; error?: string }> => {
  try {
    // Obter o usuário atual para incluir o ID (mesmo em simulação)
    const userId = process.env.NODE_ENV === 'development' || USE_SIMULATION 
      ? "mock-user-id" 
      : (await supabase.auth.getSession()).data.session?.user.id;

    if (!userId) {
      return {
        content: '',
        error: 'Usuário não autenticado. Por favor, faça login novamente.',
      };
    }

    // Preparar os dados para enviar ao n8n
    const payload = {
      idCliente: userId,
      mensagem: message,
      // Enviar apenas as últimas 5 mensagens para manter o contexto sem sobrecarregar
      historico: chatHistory.slice(-5).map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    };

    // Chamada à API do n8n
    try {
      console.log('Enviando mensagem para o webhook n8n:', N8N_API_ENDPOINT);
      
      const response = await fetch(N8N_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Verifica se a resposta foi bem-sucedida
      if (!response.ok) {
        throw new Error(`Falha na chamada ao webhook: ${response.status}`);
      }

      // Parse da resposta
      const data = await response.json();
      
      // Se estamos em produção, salvar a interação no banco
      if (!(process.env.NODE_ENV === 'development' || USE_SIMULATION)) {
        await saveMessageToHistory({
          user_id: userId,
          user_message: message,
          assistant_message: data.resposta || data.response || "Sem resposta",
          created_at: new Date().toISOString(),
        });
      }

      return { content: data.resposta || data.response || "Recebi sua mensagem, mas não consegui processar uma resposta." };
    } catch (webhookError) {
      console.error('Erro ao chamar webhook n8n:', webhookError);
      
      // Se estamos em modo de simulação, vamos usar a resposta simulada como fallback
      if (process.env.NODE_ENV === 'development' || USE_SIMULATION) {
        console.log('Fallback: Usando resposta simulada após falha do webhook');
        
        // Aguardar um tempo para simular o processamento
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Gerar resposta simulada baseada no conteúdo da mensagem
        let simulatedResponse = '';
        
        if (message.toLowerCase().includes('venda')) {
          simulatedResponse = 'Suas vendas têm sido consistentes nos últimos meses. O total de vendas do mês atual é 15% maior que o mês anterior. Aqui está uma análise rápida dos últimos 3 meses:\n\n- Mês atual: R$ 15.780,00\n- Mês anterior: R$ 13.700,00\n- Dois meses atrás: R$ 12.450,00\n\nOs produtos mais vendidos foram roupas femininas (65%), seguido por acessórios (20%).';
        } else if (message.toLowerCase().includes('estoque')) {
          simulatedResponse = 'Você tem 157 itens em estoque. As categorias mais representativas são: Roupas (65%), Acessórios (20%) e Calçados (15%).\n\nItens com baixo estoque (menos de 5 unidades):\n- Vestidos de Verão: 3 unidades\n- Calças Jeans Premium: 4 unidades\n- Bolsas de Couro: 2 unidades';
        } else if (message.toLowerCase().includes('cliente')) {
          simulatedResponse = 'Você tem 78 clientes registrados. Os 5 clientes mais frequentes são:\n\n1. Maria Silva - 12 compras (R$ 2.450,00)\n2. João Pereira - 8 compras (R$ 1.780,00)\n3. Ana Costa - 7 compras (R$ 1.350,00)\n4. Carlos Santos - 6 compras (R$ 1.120,00)\n5. Juliana Lima - 5 compras (R$ 980,00)';
        } else if (message.toLowerCase().includes('lucro') || message.toLowerCase().includes('financ')) {
          simulatedResponse = 'Resumo financeiro dos últimos 3 meses:\n\n- Receitas: R$ 41.930,00\n- Despesas: R$ 28.540,00\n- Lucro: R$ 13.390,00\n\nMargens de lucro por categoria:\n- Roupas: 38%\n- Acessórios: 45%\n- Calçados: 30%';
        } else {
          simulatedResponse = `Olá! Estou aqui para ajudar com a gestão do seu brechó. Você pode me perguntar sobre vendas, estoque, clientes, finanças e mais. Alguns exemplos:\n\n- "Quais foram as vendas do último mês?"\n- "Quais produtos estão com estoque baixo?"\n- "Quem são meus clientes mais ativos?"\n- "Qual foi meu lucro recente?"`;
        }
        
        return { content: simulatedResponse };
      } else {
        // Em produção, retornamos um erro para o usuário
        throw webhookError;
      }
    }
  } catch (error) {
    console.error('Erro ao enviar mensagem para a IA:', error);
    return {
      content: '',
      error: 'Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente mais tarde.',
    };
  }
};

/**
 * Salva a interação usuário-IA no banco de dados para histórico
 * @param interaction - Dados da interação
 */
interface ChatInteraction {
  user_id: string;
  user_message: string;
  assistant_message: string;
  created_at: string;
}

const saveMessageToHistory = async (interaction: ChatInteraction): Promise<void> => {
  if (process.env.NODE_ENV === 'development' || USE_SIMULATION) {
    console.log('Simulando salvamento no histórico:', interaction);
    return;
  }
  
  try {
    const { error } = await supabase
      .from('ia_chat_historico')
      .insert([interaction]);

    if (error) {
      console.error('Erro ao salvar interação no histórico:', error);
    }
  } catch (error) {
    console.error('Erro no salvamento da interação:', error);
  }
};

/**
 * Carrega o histórico de interações do usuário
 * @param limit - Número máximo de interações para retornar
 * @returns Lista de interações
 */
export const loadChatHistory = async (limit = 50): Promise<ChatMessage[]> => {
  if (process.env.NODE_ENV === 'development' || USE_SIMULATION) {
    console.log('Simulando carregamento do histórico');
    // Retorna um array vazio para criar uma nova conversa
    return [];
  }
  
  try {
    // Obter o usuário atual
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return [];
    }

    // Buscar histórico no banco de dados
    const { data, error } = await supabase
      .from('ia_chat_historico')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao carregar histórico:', error);
      return [];
    }

    // Converter para o formato de mensagens do chat
    const messages: ChatMessage[] = [];
    
    // Processar as interações para criar as mensagens
    data.forEach(interaction => {
      // Adicionar a mensagem do usuário
      messages.push({
        id: `user-${interaction.created_at}`,
        role: 'user' as MessageRole,
        content: interaction.user_message,
        timestamp: new Date(interaction.created_at),
      });
      
      // Adicionar a resposta da IA
      messages.push({
        id: `assistant-${interaction.created_at}`,
        role: 'assistant' as MessageRole,
        content: interaction.assistant_message,
        timestamp: new Date(interaction.created_at),
      });
    });

    // Ordenar por timestamp (do mais antigo para o mais recente)
    return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    return [];
  }
};

/**
 * Executa uma consulta SQL diretamente no Supabase
 * Esta função é um fallback para testes iniciais antes da integração com n8n
 * @param query - Consulta SQL a ser executada
 */
export const executeDirectQuery = async (query: string): Promise<SQLQueryResult> => {
  try {
    const { data, error } = await supabase.rpc('execute_safe_query', {
      query_text: query
    });
    
    if (error) throw error;
    
    return {
      query,
      data: data.rows || [],
      columns: data.columns || []
    };
  } catch (error: any) {
    console.error('Erro ao executar consulta SQL:', error);
    return {
      query,
      data: [],
      columns: [],
      error: error.message || 'Erro ao executar consulta'
    };
  }
};

/**
 * Salva o histórico de conversa no Supabase
 * @param messages - Lista de mensagens para salvar
 * @param userId - ID do usuário dono da conversa
 */
export const saveChatHistory = async (messages: ChatMessage[], userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('ia_chat_historico')
      .insert(
        messages.map(msg => ({
          user_id: userId,
          content: msg.content,
          role: msg.role,
          created_at: msg.timestamp.toISOString()
        }))
      );
    
    if (error) throw error;
  } catch (error) {
    console.error('Erro ao salvar histórico de chat:', error);
  }
}; 