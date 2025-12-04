import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = 'default', className, text }) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        default: 'w-8 h-8',
        lg: 'w-12 h-12'
    };

    return (
        <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
            <Loader2 className={cn('animate-spin text-blue-600', sizeClasses[size])} />
            {text && <p className="text-sm text-gray-500">{text}</p>}
        </div>
    );
}