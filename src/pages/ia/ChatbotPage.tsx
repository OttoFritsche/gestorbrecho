import React, { useRef, useEffect, useState } from 'react';
import { Bot, Trash2, Send, ChevronDown, Plus, Search, Zap, Image, MessageSquareText, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useIA } from '@/contexts/IAContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logo from '@/assets/logo/5.png'; // Importar a imagem do logo
import logo3Url from '@/assets/logo/3.png?url'; // Importar a URL da logo 3.png
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Importar Avatar

/**
 * Versão da página de chat inspirada no design do ChatGPT, 
 * mas mantendo as cores padrão do sistema
 */
const ChatbotPage: React.FC = () => {
  // Estado para controlar o input do usuário
  const [inputMessage, setInputMessage] = useState<string>('');
  
  // Acessa o contexto de IA
  const { messages, isLoading, sendMessage, clearChat } = useIA();
  
  // Para navegação
  const navigate = useNavigate();
  
  // Referências para rolagem automática e foco no input
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Rolagem automática ao receber novas mensagens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Executa rolagem automática quando novas mensagens chegam
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Foca no input quando a página carrega
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Auto-ajusta a altura do textarea conforme o conteúdo
  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (!textarea) return;
    
    // Reset altura para calcular corretamente
    textarea.style.height = 'auto';
    
    // Define a nova altura baseada no conteúdo (min 48px, max 200px)
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 48), 200);
    textarea.style.height = `${newHeight}px`;
  };
  
  // Ajusta a altura quando o input muda
  useEffect(() => {
    adjustTextareaHeight();
  }, [inputMessage]);
  
  // Monitora a tecla Enter para enviar a mensagem (Shift+Enter para nova linha)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Envia a mensagem
  const handleSendMessage = async () => {
    if (inputMessage.trim() && !isLoading) {
      await sendMessage(inputMessage);
      setInputMessage('');
      
      // Reajusta a altura do textarea após enviar
      setTimeout(() => {
        adjustTextareaHeight();
        inputRef.current?.focus();
      }, 0);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(err => console.error("Copy failed", err));
  };

  // Renderiza um bloco de mensagem do chat
  const renderMessage = (message: any) => {
    const isUser = message.role === 'user';
    const formattedTime = format(new Date(message.timestamp), 'HH:mm', { locale: ptBR });
    
    return (
      <div 
        key={message.id}
        className={cn("w-full py-6 px-4 md:px-6 flex", isUser ? "justify-end" : "justify-start")}
      >
        <div className={cn("flex gap-3 max-w-[85%]", isUser ? "flex-row-reverse" : "flex-row")}>
          {/* Avatar ou Logo */}
           <div className="w-8 h-8 flex-shrink-0 flex items-start pt-1">
             {isUser ? (
               <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium bg-amber-600 flex-shrink-0 mt-1")}>
                  U
               </div>
             ) : (
               // Usar <img> diretamente para a logo do assistente
               <img src={logo3Url} alt="Assistente" className="w-8 h-8 object-contain mt-1" />
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
              {isUser ? 'Você' : 'Assistente IA'}
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
  };

  return (
    <div className="flex flex-col mx-auto bg-amber-50/30 border border-amber-200 rounded-lg shadow-lg h-[85vh] max-w-4xl overflow-hidden">
      {/* Cabeçalho Clean */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-amber-100 bg-white relative shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          className="text-amber-800 absolute left-2 top-1/2 -translate-y-1/2"
          onClick={() => navigate('/app')}
        >
          <ChevronDown className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex items-center justify-center gap-2">
          <img src={logo} alt="Logo" className="h-5 w-auto" /> 
          <span className="font-semibold text-amber-900 text-base">Seu Gerente Inteligente</span>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="ghost"
              size="icon" 
              className="text-amber-600 hover:text-red-600 absolute right-2 top-1/2 -translate-y-1/2"
              disabled={messages.length <= 1 && !isLoading}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Limpar histórico?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação apagará toda a conversa atual.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={clearChat}>Limpar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </header>
      
      {/* Área de mensagens com mais respiro */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto bg-gradient-to-b from-amber-50/10 to-amber-100/20"
      >
        {messages.length === 0 || (messages.length === 1 && messages[0].role === 'assistant' && !isLoading) ? (
          // Tela inicial mais clean
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-lg">
              <MessageSquareText className="h-12 w-12 text-amber-400 mb-4 mx-auto" />
              <h2 className="text-2xl font-semibold mb-3 text-amber-900">Como posso ajudar?</h2>
              <p className="text-gray-500 mb-8">
                Faça perguntas sobre vendas, estoque, clientes ou finanças.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left text-sm">
                {[ "Vendas do último mês?", "Produtos com estoque baixo?", "Clientes mais frequentes?", "Lucro do último trimestre?"].map((prompt) => (
                   <Button 
                    key={prompt}
                    variant="outline"
                    className="h-auto py-3 px-4 justify-start border-amber-200 bg-white hover:bg-amber-100/50 text-amber-900 font-normal leading-snug"
                    onClick={() => setInputMessage(prompt)}
                  >
                    <Zap className="h-4 w-4 mr-2.5 text-amber-500 flex-shrink-0" />
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Renderiza mensagens
          <>
            {messages.map(message => renderMessage(message))}
            {isLoading && (
              <div className="w-full py-6 px-4 md:px-6 flex justify-start">
                 <div className="flex gap-3 max-w-[85%] flex-row">
                    {/* Avatar/Logo do assistente carregando */}
                     <div className="w-8 h-8 flex-shrink-0 flex items-start pt-1">
                         <img src={logo3Url} alt="Assistente Carregando" className="w-8 h-8 object-contain mt-1" />
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
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Área de input mais clean e fixa */}
      <div className="w-full border-t border-amber-100 p-3 sm:p-4 bg-white shadow-inner">
        <div className="max-w-3xl mx-auto relative">
          <div className="flex items-end border rounded-xl border-amber-200 bg-white focus-within:ring-2 focus-within:ring-amber-300 focus-within:border-amber-300 overflow-hidden transition-all duration-200 shadow-sm">
            <textarea 
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite uma mensagem..."
              className="flex-1 resize-none px-4 py-3 outline-none text-sm bg-transparent placeholder:text-gray-400"
              style={{ height: '48px' }} // Altura inicial corresponde a py-3 * 2 + line-height
              rows={1}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="icon"
              className={cn(
                "h-9 w-9 rounded-lg mr-1.5 mb-1.5 transition-colors duration-200",
                inputMessage.trim() && !isLoading
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Enviar</span>
            </Button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2 px-2">
            O Gerente Inteligente pode cometer erros. Considere verificar informações importantes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage; 