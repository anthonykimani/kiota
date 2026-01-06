/**
 * Progress Bar Component
 * Shows goal or allocation progress with segments
 */

import { Progress } from '@/components/ui/progress';
import { calculateProgress } from '@/lib/utils/calculations';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  current: number;
  target: number;
  showLabel?: boolean;
  showPercentage?: boolean;
  className?: string;
}

export function ProgressBar({
  current,
  target,
  showLabel = true,
  showPercentage = true,
  className,
}: ProgressBarProps) {
  const progress = calculateProgress(current, target);
  const percentage = Math.min(progress, 100);

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          {showPercentage && (
            <span className="font-medium">{percentage.toFixed(0)}%</span>
          )}
        </div>
      )}
      <Progress value={percentage} className="h-2" />
    </div>
  );
}

interface SegmentedProgressBarProps {
  segments: Array<{
    value: number;
    color: string;
    label?: string;
  }>;
  height?: number;
  className?: string;
}

export function SegmentedProgressBar({
  segments,
  height = 8,
  className,
}: SegmentedProgressBarProps) {
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);

  return (
    <div className={cn('w-full', className)}>
      <div
        className="flex w-full overflow-hidden rounded-full bg-muted"
        style={{ height: `${height}px` }}
      >
        {segments.map((segment, index) => {
          const percentage = (segment.value / total) * 100;
          return (
            <div
              key={index}
              className="transition-all duration-300"
              style={{
                width: `${percentage}%`,
                backgroundColor: segment.color,
              }}
              title={segment.label}
            />
          );
        })}
      </div>
    </div>
  );
}
