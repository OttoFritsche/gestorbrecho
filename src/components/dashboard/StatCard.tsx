import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

const StatCard = ({
  title,
  value,
  icon,
  description,
  trend,
  trendValue,
}: StatCardProps) => {
  return (
    <Card className="border-amber-200/60">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-amber-800/70">{title}</p>
            <h3 className="text-2xl font-bold mt-1 text-amber-900">{value}</h3>
            {description && <p className="text-xs text-amber-700/60 mt-1">{description}</p>}
            
            {trend && trendValue && (
              <div className={`flex items-center mt-2 text-xs font-medium ${
                trend === 'up' ? 'text-amber-700' : 
                trend === 'down' ? 'text-red-600' : 'text-amber-500'
              }`}>
                {trend === 'up' && '↑ '}
                {trend === 'down' && '↓ '}
                {trendValue}
              </div>
            )}
          </div>
          <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
