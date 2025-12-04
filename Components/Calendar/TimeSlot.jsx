import React from 'react';
import { cn } from '@/lib/utils';
import { Clock, User, Lock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const statusColors = {
    available: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 cursor-pointer',
    reserved: 'bg-blue-50 border-blue-200',
    paid: 'bg-blue-100 border-blue-300',
    blocked: 'bg-gray-100 border-gray-300',
    pending: 'bg-amber-50 border-amber-200',
    own: 'bg-indigo-100 border-indigo-300'
};

export default function TimeSlot({
    time,
    status = 'available',
    reservation = null,
    block = null,
    isOwn = false,
    onClick,
    isAdmin = false,
    compact = false
}) {
    const getStatusDisplay = () => {
        if (block) return 'blocked';
        if (isOwn) return 'own';
        if (reservation) {
            if (reservation.status === 'paid' || reservation.status === 'completed') return 'paid';
            if (reservation.status === 'pending_payment' || reservation.status === 'pending_manual_payment') return 'pending';
            return 'reserved';
        }
        return 'available';
    };

    const displayStatus = getStatusDisplay();
    const isClickable = displayStatus === 'available' || isAdmin;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        onClick={isClickable ? onClick : undefined}
                        className={cn(
                            'relative rounded-lg border-2 transition-all duration-200',
                            statusColors[displayStatus],
                            isClickable && 'cursor-pointer hover:shadow-md hover:scale-[1.02]',
                            !isClickable && 'cursor-not-allowed opacity-80',
                            compact ? 'p-2 min-h-[60px]' : 'p-3 min-h-[80px]'
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <span className={cn(
                                'font-semibold',
                                compact ? 'text-xs' : 'text-sm',
                                displayStatus === 'available' ? 'text-emerald-700' : 'text-gray-700'
                            )}>
                                {time}
                            </span>
                            {displayStatus === 'blocked' && <Lock className="w-4 h-4 text-gray-400" />}
                            {displayStatus === 'pending' && <AlertCircle className="w-4 h-4 text-amber-500" />}
                        </div>

                        {reservation && !compact && (
                            <div className="mt-2 space-y-1">
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <User className="w-3 h-3" />
                                    <span className="truncate">{reservation.user_name || reservation.user_email}</span>
                                </div>
                                <Badge variant="outline" className={cn(
                                    'text-[10px] px-1.5 py-0',
                                    reservation.status === 'paid' && 'bg-green-100 text-green-700 border-green-300',
                                    reservation.status === 'pending_payment' && 'bg-amber-100 text-amber-700 border-amber-300',
                                    reservation.status === 'pending_manual_payment' && 'bg-orange-100 text-orange-700 border-orange-300'
                                )}>
                                    {reservation.duration} min
                                </Badge>
                            </div>
                        )}

                        {displayStatus === 'available' && !compact && (
                            <div className="mt-2 text-xs text-emerald-600 font-medium">
                                Disponible
                            </div>
                        )}

                        {block && !compact && (
                            <div className="mt-2 text-xs text-gray-500">
                                {block.reason || 'Bloqueado'}
                            </div>
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                    {displayStatus === 'available' && <p>Click para reservar</p>}
                    {reservation && (
                        <div className="space-y-1">
                            <p className="font-medium">{reservation.user_name || 'Sin nombre'}</p>
                            <p className="text-xs">{reservation.user_email}</p>
                            <p className="text-xs">{reservation.start_time} - {reservation.end_time}</p>
                            <p className="text-xs capitalize">{reservation.status.replace('_', ' ')}</p>
                        </div>
                    )}
                    {block && <p>{block.reason || 'Horario bloqueado'}</p>}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}