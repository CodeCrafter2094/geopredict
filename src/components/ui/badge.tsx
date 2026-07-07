import * as React from 'react';
import { cn } from '@/lib/utils';
import { CATEGORY_COLORS, type Category } from '@/lib/types';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'category' | 'destructive';
  category?: Category;
}

export function Badge({
  className,
  variant = 'default',
  category,
  ...props
}: BadgeProps) {
  const categoryColor = category ? CATEGORY_COLORS[category] : undefined;

  return (
      <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        {
          'bg-primary text-primary-foreground': variant === 'default',
          'bg-secondary text-secondary-foreground': variant === 'secondary',
          'border border-border text-foreground': variant === 'outline',
          'bg-destructive/20 text-destructive border border-destructive/30': variant === 'destructive',
        },
        className
      )}
      style={
        variant === 'category' && categoryColor
          ? {
              backgroundColor: `${categoryColor}20`,
              color: categoryColor,
              borderWidth: '1px',
              borderColor: categoryColor,
            }
          : undefined
      }
      {...props}
    />
  );
}
