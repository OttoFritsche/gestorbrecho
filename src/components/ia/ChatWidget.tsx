import React, { useState, useEffect } from 'react';
import { X, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ChatInterface from './ChatInterface';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessages?: any[];
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({
  isOpen,
  onClose,
  initialMessages = [],
  onSendMessage,
  isLoading = false,
}) => {
  const [mounted, setMounted] = useState(false);

  // Efeito de animação ao montar/desmontar
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
    } else {
      // Tempo para a animação de saída
      const timer = setTimeout(() => {
        setMounted(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <div 
      className={`fixed bottom-24 right-6 z-50 w-[90%] max-w-md transition-all duration-300 transform ${
        isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
      }`}
    >
      <Card className="shadow-xl border-amber-200 overflow-hidden rounded-2xl">
        {/* Cabeçalho com botões de ação */}
        <div className="flex justify-between items-center p-3 bg-amber-50 border-b border-amber-200">
          <h3 className="font-medium text-amber-800">Seu Gerente Inteligente</h3>
          <div className="flex space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/app/assistente">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-amber-100">
                      <Maximize2 className="h-4 w-4 text-amber-800" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Abrir em tela cheia</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full hover:bg-amber-100"
              onClick={onClose}
            >
              <X className="h-4 w-4 text-amber-800" />
            </Button>
          </div>
        </div>
        
        {/* Componente de chat com altura reduzida */}
        <div className="h-[500px]">
          <ChatInterface 
            initialMessages={initialMessages}
            onSendMessage={onSendMessage}
            isLoading={isLoading}
            assistantName="Assistente do Brechó"
          />
        </div>
      </Card>
    </div>
  );
};

export default ChatWidget; 