import React, { useState, useRef, useEffect } from 'react';
import { Send, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logo3 from '@/assets/logo/3.png';
import logo3Url from '@/assets/logo/3.png?url';

// Tipos para as mensagens de chat
type MessageRole = 'user' | 'assistant' | 'system';

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  initialMessages?: ChatMessage[];
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
  userName?: string;
  assistantName?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  initialMessages = [],
  onSendMessage,
  isLoading = false,
  userName = 'Você',
  assistantName = 'Assistente IA' // Usado apenas como fallback
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim() === '' || isLoading || isSending) return;
    setIsSending(true);
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    if (onSendMessage) {
      onSendMessage(inputValue.trim());
    }
    setInputValue('');
    setIsSending(false);
    setTimeout(() => {
      textareaRef.current?.focus();
      adjustTextareaHeight();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(err => console.error("Copy failed", err));
  };

  // Auto-ajusta a altura do textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 48), 150); // min-h-12, max 150px
    textarea.style.height = `${newHeight}px`;
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  return (
    <div className="flex flex-col h-full bg-amber-50/30">
      {/* Área de Mensagens com mais respiro */}
      <ScrollArea className="flex-1 overflow-y-auto bg-gradient-to-b from-amber-50/10 to-amber-100/20">
        <div className="p-4 space-y-6">
          {/* Mensagem de boas-vindas (caso não haja mensagens) */}
          {messages.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              Inicie uma conversa...
            </div>
          )}

          {/* Lista de mensagens */}
          {messages.map((message) => {
            const isUser = message.role === 'user';
            const formattedTime = format(new Date(message.timestamp), 'HH:mm', { locale: ptBR });
            
            return (
              <div 
                key={message.id}
                className={cn("w-full flex", isUser ? "justify-end" : "justify-start")}
              >
                <div className={cn("flex gap-3 max-w-[85%]", isUser ? "flex-row-reverse" : "flex-row")}>
                  {/* Avatar ou Logo */}
                  <div className="w-8 h-8 flex-shrink-0 flex items-start pt-1">
                    {isUser ? (
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium bg-amber-600")}>
                         U
                      </div>
                    ) : (
                      // Usar <img> diretamente para a logo do assistente
                      <img src={logo3Url} alt="Assistente" className="w-8 h-8 object-contain" />
                    )}
                  </div>
                  
                  {/* Conteúdo da mensagem */}
                  <div className={cn(
                    "rounded-xl px-4 py-3 shadow-sm",
                    isUser 
                      ? "bg-amber-100 text-amber-950"
                      : "bg-white text-gray-800 border border-amber-100"
                  )}>
                    <p className="text-sm font-semibold mb-1.5">
                      {isUser ? userName : assistantName}
                    </p>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                    {/* Ícones de Interação (apenas para assistente) */}
                    {!isUser && (
                      <div className="flex justify-end items-center mt-2 space-x-1 border-t border-amber-100 pt-2 -mx-4 px-3">
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-amber-700 hover:bg-amber-100/50 rounded-full" onClick={() => copyToClipboard(message.content)}>
                                <Copy size={14} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom"><p>Copiar</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-green-600 hover:bg-green-100/50 rounded-full">
                                <ThumbsUp size={14} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom"><p>Gostei</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                         <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                               <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-100/50 rounded-full">
                                <ThumbsDown size={14} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom"><p>Não gostei</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                    <div className={cn(
                        "text-[10px] opacity-60 mt-1.5 text-right",
                        isUser ? "text-amber-700" : "text-gray-500"
                     )}>
                      {formattedTime}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Indicador de digitando/carregando */}
          {isLoading && (
             <div className="w-full flex justify-start">
                 <div className="flex gap-3 max-w-[85%] flex-row">
                    {/* Avatar/Logo do assistente carregando */}
                     <div className="w-8 h-8 flex-shrink-0 flex items-start pt-1">
                        <img src={logo3Url} alt="Assistente Carregando" className="w-8 h-8 object-contain" />
                     </div>
                    <div className="rounded-xl px-4 py-3 shadow-sm bg-white border border-amber-100 flex items-center">
                        <div className="flex space-x-1.5 items-center">
                          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                  </div>
              </div>
          )}

          {/* Referência para o scroll automático */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Área de input/entrada de texto mais clean */}
      <div className="w-full border-t border-amber-100 p-3 bg-white shadow-inner">
        <div className="relative">
          <div className="flex items-end border rounded-xl border-amber-200 bg-white focus-within:ring-2 focus-within:ring-amber-300 focus-within:border-amber-300 overflow-hidden transition-all duration-200 shadow-sm">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onInput={adjustTextareaHeight} // Ajusta altura ao digitar
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              className="flex-1 resize-none px-4 py-3 outline-none text-sm bg-transparent placeholder:text-gray-400 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[48px] max-h-[150px]"
              style={{ height: '48px' }}
              rows={1}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={inputValue.trim() === '' || isLoading || isSending}
              size="icon"
               className={cn(
                "h-9 w-9 rounded-lg mr-1.5 mb-1.5 transition-colors duration-200 self-end", // self-end para alinhar com textarea
                inputValue.trim() && !isLoading
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              <Send size={16} />
            </Button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2 px-2">
            O Gerente Inteligente pode cometer erros.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface; 