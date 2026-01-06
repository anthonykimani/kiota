/**
 * Stat Card Component
 * Displays a key metric with optional trend indicator
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  className,
}: StatCardProps) {
  const isPositive = trend && trend.value > 0;
  const isNegative = trend && trend.value < 0;

  return (
    <Card className={cn('card-shadow', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 mt-2 text-xs font-medium',
              isPositive && 'text-green-600',
              isNegative && 'text-red-600',
              !isPositive && !isNegative && 'text-muted-foreground'
            )}
          >
            {isPositive && <ArrowUpIcon className="h-3 w-3" />}
            {isNegative && <ArrowDownIcon className="h-3 w-3" />}
            <span>
              {isPositive && '+'}
              {trend.value.toFixed(2)}% {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
