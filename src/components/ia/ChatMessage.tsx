import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ChatMessage as ChatMessageType } from '@/contexts/IAContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Props para o componente de mensagem
interface ChatMessageProps {
  message: ChatMessageType;
}

/**
 * Componente que renderiza uma mensagem individual no chat
 * Exibe de forma diferente dependendo se é uma mensagem do usuário ou do assistente
 */
const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  // Formatação da data da mensagem (ex: "14:30")
  const formattedTime = format(message.timestamp, 'HH:mm', { locale: ptBR });
  
  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-4",
        isUser ? "flex-row-reverse" : ""
      )}
    >
      {/* Avatar da mensagem - Logo para assistente, usuário para user */}
      <Avatar className={cn("h-9 w-9", isUser ? "bg-amber-100" : "bg-amber-600")}>
        {isUser ? (
          <>
            <AvatarFallback>U</AvatarFallback>
            <AvatarImage src="/avatar-placeholder.png" />
          </>
        ) : (
          <>
            <AvatarFallback>IA</AvatarFallback>
            <AvatarImage src="/ia-logo.png" />
          </>
        )}
      </Avatar>
      
      {/* Balão da mensagem */}
      <div 
        className={cn(
          "rounded-lg px-4 py-3 max-w-[75%] text-sm",
          isUser 
            ? "bg-amber-500 text-white rounded-tr-none" 
            : "bg-gray-100 text-gray-800 rounded-tl-none"
        )}
      >
        {/* Conteúdo da mensagem */}
        <div className="space-y-2">
          <div className="whitespace-pre-wrap">{message.content}</div>
          
          {/* Horário da mensagem */}
          <div 
            className={cn(
              "text-[10px] select-none opacity-70 text-right",
              isUser ? "text-amber-100" : "text-gray-500"
            )}
          >
            {formattedTime}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage; 