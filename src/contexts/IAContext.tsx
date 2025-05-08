import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useIAChat } from '@/hooks/useIAChat';
import { ChatMessage } from '@/services/iaService';

// Tipos
export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

// Interface para o contexto da IA
interface IAContextType {
  // Estado do chat
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  
  // Ações
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  
  // Estado da UI
  isChatOpen: boolean;
  toggleChat: () => void;
  isWidgetVisible: boolean;
  resetChat: () => void;
  setWidgetVisibility: (visible: boolean) => void;
}

// Criação do contexto com valor inicial
const IAContext = createContext<IAContextType | undefined>(undefined);

// Props para o provider
interface IAProviderProps {
  children: ReactNode;
}

/**
 * Provider para o contexto de IA
 * Encapsula a lógica do chat e gerencia o estado da UI do chat
 */
export const IAProvider: React.FC<IAProviderProps> = ({ children }) => {
  // Utiliza o hook para gerenciar o chat
  const { messages, isLoading, error, sendMessage, clearChat } = useIAChat();
  
  // Estado para controlar se o chat está aberto ou fechado
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isWidgetVisible, setIsWidgetVisible] = useState(true);
  
  // Função para alternar o estado do chat
  const toggleChat = useCallback(() => setIsChatOpen(prev => !prev), []);
  
  // Função para resetar o chat
  const resetChat = useCallback(() => {
    // Mantém apenas a mensagem de boas-vindas
    const welcomeMessage: ChatMessage = {
      id: 'welcome-' + Date.now().toString(),
      role: 'assistant',
      content: 'Olá! Sou o assistente IA do Brechó. Como posso ajudar você hoje?',
      timestamp: new Date()
    };
    
    localStorage.removeItem('chat_messages');
  }, []);

  // Definir a visibilidade do widget
  const setWidgetVisibility = useCallback((visible: boolean) => {
    setIsWidgetVisible(visible);
  }, []);
  
  // Valor do contexto
  const value: IAContextType = {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    isChatOpen,
    toggleChat,
    isWidgetVisible,
    resetChat,
    setWidgetVisibility
  };
  
  return (
    <IAContext.Provider value={value}>
      {children}
    </IAContext.Provider>
  );
};

/**
 * Hook para acessar o contexto de IA
 * @returns O contexto de IA
 * @throws Error se usado fora de um IAProvider
 */
export const useIA = (): IAContextType => {
  const context = useContext(IAContext);
  
  if (context === undefined) {
    throw new Error('useIA deve ser usado dentro de um IAProvider');
  }
  
  return context;
}; 