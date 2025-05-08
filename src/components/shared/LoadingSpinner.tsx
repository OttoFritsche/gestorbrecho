import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Componente que exibe um spinner de carregamento
 * Usado para indicar operações em andamento
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  className 
}) => {
  // Mapeia o tamanho para classes CSS
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin text-amber-500',
        sizeClasses[size],
        className
      )} 
    />
  );
}; 