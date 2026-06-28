
import React from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Tooltip } from '../../UI/Tooltip';

interface DeleteButtonProps {
    onClick: (e: React.MouseEvent) => void;
    className?: string;
    size?: number;
    tooltip?: string;
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({
    onClick,
    className,
    size = 14,
    tooltip = 'Delete',
}) => {
    return (
        <Tooltip content={tooltip}>
            <button
                type="button"
                onClick={onClick}
                className={cn(
                    "flex justify-center items-center text-rose-500 p-1 rounded-md active:scale-95",
                    className
                )}
                title={tooltip}
            >
                <Trash2 size={size} />
            </button>
        </Tooltip>
    );
};
