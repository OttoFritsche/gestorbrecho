import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps extends React.HTMLAttributes<SVGSVGElement> {
  size?: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className, size = 24, ...props }) => {
  return (
    <div className={cn("flex justify-center items-center w-full h-full", className)}> 
        <Loader2 
            className="animate-spin text-primary" 
            size={size} 
            {...props} 
        />
    </div>
   
  );
};

export default LoadingSpinner; 