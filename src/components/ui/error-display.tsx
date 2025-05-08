import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  error: Error | null | unknown;
  title?: string;
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
    error,
    title = "Ocorreu um Erro", 
    className 
}) => {
  if (!error) return null;

  let errorMessage = "Erro desconhecido.";
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
      // Tenta pegar a mensagem de objetos de erro genéricos
      errorMessage = error.message;
  }

  return (
    <Alert variant="destructive" className={cn("my-4", className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {errorMessage}
      </AlertDescription>
    </Alert>
  );
};

export default ErrorDisplay; 