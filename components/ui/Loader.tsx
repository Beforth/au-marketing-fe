import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface LoaderProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'primary' | 'white' | 'slate';
}

export const Loader: React.FC<LoaderProps> = ({ 
  size = 'md', 
  variant = 'primary',
  className 
}) => {
  const sizeClasses = {
    xs: 'h-3 w-3 border-[1.5px]',
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
    xl: 'h-16 w-16 border-4',
  };

  const variantClasses = {
    primary: 'border-indigo-600/20 border-t-indigo-600',
    white: 'border-white/20 border-t-white',
    slate: 'border-slate-200 border-t-slate-500',
  };

  return (
    <div className={cn('flex items-center justify-center', className)} role="status">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        className={cn(
          'rounded-full border-solid',
          sizeClasses[size],
          variantClasses[variant]
        )}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Loader;
