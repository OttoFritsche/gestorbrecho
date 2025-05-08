import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIA } from '@/contexts/IAContext';

/**
 * Componente de entrada de texto para o chat
 * Permite que o usuário digite e envie mensagens para a IA
 */
const ChatInput: React.FC = () => {
  // Estado local para o texto de entrada
  const [input, setInput] = useState('');
  
  // Referência para o input de texto para foco automático
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Acessa o contexto de IA para enviar mensagens
  const { sendMessage, isLoading } = useIA();
  
  // Auto-ajusta a altura do textarea conforme o conteúdo
  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (!textarea) return;
    
    // Reset altura para calcular corretamente
    textarea.style.height = 'auto';
    
    // Define a nova altura baseada no conteúdo (min 40px, max 150px)
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 40), 150);
    textarea.style.height = `${newHeight}px`;
  };
  
  // Ajusta a altura quando o input muda
  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);
  
  // Foca no input quando o componente é montado
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Limpa o input
  const clearInput = () => {
    setInput('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Envia a mensagem
  const handleSendMessage = async () => {
    if (input.trim() && !isLoading) {
      await sendMessage(input);
      setInput('');
    }
  };
  
  // Monitora a tecla Enter para enviar a mensagem (Shift+Enter para nova linha)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="border-t bg-white p-4">
      <div className="relative flex items-center space-x-2">
        {/* Campo de texto para a mensagem */}
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua pergunta aqui..."
          className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
          style={{ minHeight: '40px', maxHeight: '150px' }}
          disabled={isLoading}
        />
        
        {/* Botão para limpar o input (apenas visível quando há texto) */}
        {input && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-12 text-muted-foreground hover:text-foreground"
            onClick={clearInput}
            type="button"
          >
            <XCircle className="h-5 w-5" />
            <span className="sr-only">Limpar</span>
          </Button>
        )}
        
        {/* Botão para enviar a mensagem */}
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isLoading}
          onClick={handleSendMessage}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          <SendIcon className="h-5 w-5" />
          <span className="sr-only">Enviar mensagem</span>
        </Button>
      </div>
      
      {/* Texto auxiliar */}
      <p className="mt-2 text-xs text-muted-foreground">
        Pressione Enter para enviar, Shift+Enter para nova linha
      </p>
    </div>
  );
};

export default ChatInput; 