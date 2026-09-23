import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'pill' | 'pill-active';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none';

    const variants = {
      default: 'bg-brand-primary text-white hover:bg-brand-primary-dark shadow-sm active:scale-[0.98]',
      outline: 'border border-zinc-200 bg-white text-brand-charcoal hover:bg-zinc-50 hover:border-zinc-300 shadow-2xs',
      secondary: 'bg-brand-primary-soft text-brand-primary hover:bg-emerald-100/80 font-semibold',
      ghost: 'text-zinc-600 hover:text-brand-charcoal hover:bg-zinc-100/80',
      destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-xs active:scale-[0.98]',
      pill: 'rounded-full bg-white border border-zinc-200/80 text-zinc-700 hover:bg-zinc-50 hover:text-brand-charcoal shadow-2xs',
      'pill-active': 'rounded-full bg-brand-primary text-white hover:bg-brand-primary-dark shadow-xs',
    };

    const sizes = {
      default: 'h-10 px-4 py-2 text-sm rounded-xl',
      sm: 'h-8 px-3 text-xs rounded-lg',
      lg: 'h-12 px-6 text-base rounded-2xl',
      icon: 'h-10 w-10 rounded-xl',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
