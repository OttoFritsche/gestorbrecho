import { useState, useEffect, useCallback } from 'react';
import { 
  sendMessageToIA,
  loadChatHistory
} from '@/services/iaService';
import { useAuth } from '@/hooks/useAuth'; // Presumo que este hook existe para obter o usuário logado
import { MessageRole, ChatMessage } from '@/contexts/IAContext';

// Verificar se estamos em modo de simulação
const USE_SIMULATION = true;

// Mock do hook useAuth para uso em desenvolvimento
const useMockAuth = () => {
  return {
    user: {
      id: "mock-user-id",
      email: "usuario@example.com",
      user_metadata: {
        name: "Usuário Simulado"
      }
    },
    isLoading: false,
    error: null
  };
};

/**
 * Hook personalizado para gerenciar a interação com o chatbot de IA
 * 
 * Fornece:
 * - Gerenciamento do histórico de mensagens
 * - Envio de mensagens para a IA
 * - Estados de carregamento e erro
 * - Persistência do histórico
 */
export function useIAChat() {
  // Estado para armazenar mensagens do chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Estado para controlar o carregamento durante o envio de mensagens
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para armazenar erros
  const [error, setError] = useState<string | null>(null);
  
  // Obtém o usuário atual para associar as mensagens
  // Se estamos em modo de simulação, usa o mock
  const auth = (process.env.NODE_ENV === 'development' || USE_SIMULATION) 
    ? useMockAuth() 
    : useAuth();
  const { user } = auth;
  
  // Carregar histórico de mensagens ao inicializar
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        
        // Verificar se há histórico no localStorage
        const savedMessages = localStorage.getItem('chat_messages');
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages);
          // Converter as strings de data em objetos Date
          const formattedMessages = parsedMessages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(formattedMessages);
          setIsLoading(false);
          return;
        }
        
        // Se não houver no localStorage, tenta carregar do backend
        const history = await loadChatHistory();
        
        // Se não houver histórico, adiciona mensagem de boas-vindas
        if (history.length === 0) {
          const welcomeMessage: ChatMessage = {
            id: 'welcome-' + Date.now().toString(),
            role: 'assistant',
            content: 'Olá! Sou o assistente IA do Brechó. Como posso ajudar você hoje?',
            timestamp: new Date()
          };
          setMessages([welcomeMessage]);
          
          // Salvar no localStorage
          localStorage.setItem('chat_messages', JSON.stringify([welcomeMessage]));
        } else {
          setMessages(history);
          
          // Salvar no localStorage
          localStorage.setItem('chat_messages', JSON.stringify(history));
        }
      } catch (err) {
        console.error('Erro ao carregar histórico:', err);
        setError('Não foi possível carregar o histórico de mensagens.');
        
        // Adicionar mensagem de boas-vindas mesmo com erro
        const welcomeMessage: ChatMessage = {
          id: 'welcome-' + Date.now().toString(),
          role: 'assistant',
          content: 'Olá! Sou o assistente IA do Brechó. Como posso ajudar você hoje?',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHistory();
  }, []);
  
  // Salvar mensagens no localStorage quando elas mudarem
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chat_messages', JSON.stringify(messages));
    }
  }, [messages]);
  
  // Função para enviar mensagem para o serviço de IA
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    try {
      setError(null);
      setIsLoading(true);
      
      // Adiciona mensagem do usuário ao estado local
      const userMessage: ChatMessage = {
        id: 'user-' + Date.now().toString(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Envia mensagem para o serviço de IA
      const response = await sendMessageToIA(content.trim(), messages);
      
      // Se houver um erro na resposta
      if (response.error) {
        setError(response.error);
        const errorMessage: ChatMessage = {
          id: 'error-' + Date.now().toString(),
          role: 'system',
          content: response.error,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }
      
      // Adiciona resposta da IA ao estado local
      const assistantMessage: ChatMessage = {
        id: 'assistant-' + Date.now().toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      
      // Adiciona mensagem de erro ao estado local
      const errorMessage: ChatMessage = {
        id: 'error-' + Date.now().toString(),
        role: 'system',
        content: 'Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente mais tarde.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setError('Ocorreu um erro ao processar sua mensagem.');
    } finally {
      setIsLoading(false);
    }
  }, [messages]);
  
  // Função para limpar o histórico de chat
  const clearChat = useCallback(() => {
    // Adicionar uma nova mensagem de boas-vindas
    const welcomeMessage: ChatMessage = {
      id: 'welcome-' + Date.now().toString(),
      role: 'assistant',
      content: 'Histórico limpo. Como posso ajudar você hoje?',
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    setError(null);
    
    // Limpar localStorage
    localStorage.setItem('chat_messages', JSON.stringify([welcomeMessage]));
  }, []);
  
  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat
  };
} 