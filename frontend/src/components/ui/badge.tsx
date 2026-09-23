import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'neutral';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-brand-primary text-white',
    secondary: 'bg-brand-primary-soft text-brand-primary border border-emerald-200/50',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    destructive: 'bg-rose-50 text-rose-700 border border-rose-200',
    outline: 'border border-zinc-200 text-zinc-700 bg-white',
    neutral: 'bg-zinc-100 text-zinc-700 border border-zinc-200/60',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
