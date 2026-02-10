
import React from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DeleteButtonProps {
    onClick: (e: React.MouseEvent) => void;
    className?: string;
    size?: number;
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({
    onClick,
    className,
    size = 14
}) => {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex justify-center items-center text-slate-900 hover:text-rose-600 transition-colors p-1 rounded-md hover:bg-rose-50/50 active:scale-95",
                className
            )}
            title="Delete"
        >
            <Trash2 size={size} />
        </button>
    );
};
