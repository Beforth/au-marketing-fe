import React from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '../lib/utils';

export interface IconProps extends LucideIcons.LucideProps {
  name: keyof typeof LucideIcons;
}

export function Icon({ name, className, ...props }: IconProps) {
  const LucideIcon = LucideIcons[name] as LucideIcons.LucideIcon;
  
  if (!LucideIcon) return null;

  return (
    <LucideIcon 
      className={cn('transition-all duration-200', className)} 
      strokeWidth={2.5}
      {...props} 
    />
  );
}
