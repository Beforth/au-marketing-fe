import React, { useState } from 'react';
import { cn } from '../../lib/utils';

interface AvatarProps {
  src?: string | null;
  name: string;
  className?: string;
  imgClassName?: string;
}

/** Renders a photo when `src` loads; falls back to initials (from `name`) otherwise. */
export const Avatar: React.FC<AvatarProps> = ({ src, name, className, imgClassName }) => {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?';

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className={cn('object-cover shrink-0', className, imgClassName)}
      />
    );
  }

  return (
    <div className={cn('flex items-center justify-center shrink-0 font-bold', className)}>
      <span>{initials}</span>
    </div>
  );
};
