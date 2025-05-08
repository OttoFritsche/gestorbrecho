import React from 'react';
import { Outlet } from 'react-router-dom';
import { IAProvider, useIA } from '@/contexts/IAContext';
import FloatingChatIcon from '@/components/ia/FloatingChatIcon';
import ChatWidget from '@/components/ia/ChatWidget';

/**
 * Componente interno que usa o contexto de IA
 */
const LayoutContent: React.FC = () => {
  // Consumir o contexto de IA
  const { isChatOpen, toggleChat, messages, isLoading, sendMessage } = useIA();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Conteúdo principal */}
      <main>
        <Outlet />
      </main>
      
      {/* Widget de Chat Flutuante */}
      <FloatingChatIcon onClick={toggleChat} />
      
      {/* Widget de Chat */}
      <ChatWidget 
        isOpen={isChatOpen} 
        onClose={toggleChat}
        initialMessages={messages}
        onSendMessage={sendMessage}
        isLoading={isLoading}
      />
    </div>
  );
};

/**
 * Layout principal que envolve toda a aplicação quando o usuário está autenticado
 * Inclui o contexto de IA e o widget de chat flutuante
 */
const MainLayout: React.FC = () => {
  return (
    <IAProvider>
      <LayoutContent />
    </IAProvider>
  );
};

export default MainLayout; 