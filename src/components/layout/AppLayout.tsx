import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import { useIA } from '@/contexts/IAContext';
import FloatingChatIcon from '@/components/ia/FloatingChatIcon';
import ChatWidget from '@/components/ia/ChatWidget';

const AppLayout = () => {
  // Obter o estado e as funções do contexto de IA
  const { isChatOpen, toggleChat, messages, isLoading, sendMessage } = useIA();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <AppHeader />
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
        
        {/* Componentes do chat flutuante */}
        <FloatingChatIcon onClick={toggleChat} unreadCount={0} />
        <ChatWidget 
          isOpen={isChatOpen} 
          onClose={toggleChat} 
          initialMessages={messages}
          onSendMessage={sendMessage}
          isLoading={isLoading}
        />
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
