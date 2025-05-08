import React from 'react';
import { MessageSquareText, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from 'react-router-dom';

interface FloatingChatIconProps {
  onClick: () => void;
  unreadCount?: number;
}

const FloatingChatIcon: React.FC<FloatingChatIconProps> = ({ 
  onClick,
  unreadCount = 0
}) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-2">
      {/* Botão principal do chat */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onClick}
              size="lg"
              className="h-14 w-14 rounded-full bg-amber-800 hover:bg-amber-700 shadow-lg transition-all duration-300 hover:scale-105"
            >
              <MessageSquareText className="h-6 w-6 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Abrir Seu Gerente Inteligente</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default FloatingChatIcon; 