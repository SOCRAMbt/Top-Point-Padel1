import React from 'react';
import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/utils/cn';
import TimeSlot from './TimeSlot';

const generateTimeSlots = (startHour = 8, endHour = 22) => {
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
        slots.push(`${String(hour).padStart(2, '0')}:00`);
        slots.push(`${String(hour).padStart(2, '0')}:30`);
    }
    return slots;
};

export default function DayColumn({
    date,
    reservations = [],
    blocks = [],
    userEmail,
    onSlotClick,
    isAdmin = false,
    compact = false,
    startHour = 8,
    endHour = 22
}) {
    const timeSlots = generateTimeSlots(startHour, endHour);
    const isPastDay = isBefore(startOfDay(date), startOfDay(new Date()));

    const getSlotData = (time) => {
        // Check if blocked
        const block = blocks.find(b => {
            if (b.is_full_day) return true;
            const blockStart = b.start_time;
            const blockEnd = b.end_time;
            return time >= blockStart && time < blockEnd;
        });

        // Check for reservation that covers this time
        const reservation = reservations.find(r => {
            return time >= r.start_time && time < r.end_time;
        });

        return { block, reservation };
    };

    const isSlotStart = (time, reservation) => {
        return reservation && reservation.start_time === time;
    };

    return (
        <div className={cn(
            'flex flex-col',
            compact ? 'min-w-[100px]' : 'min-w-[140px]'
        )}>
            {/* Header */}
            <div className={cn(
                'sticky top-0 z-10 p-3 text-center border-b bg-white/80 backdrop-blur-sm',
                isToday(date) && 'bg-blue-50/80'
            )}>
                <p className={cn(
                    'text-xs uppercase tracking-wide',
                    isToday(date) ? 'text-blue-600 font-semibold' : 'text-gray-500'
                )}>
                    {format(date, 'EEE', { locale: es })}
                </p>
                <p className={cn(
                    'text-lg font-bold',
                    isToday(date) ? 'text-blue-700' : 'text-gray-800'
                )}>
                    {format(date, 'd')}
                </p>
                {isToday(date) && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] bg-blue-600 text-white rounded-full">
                        Hoy
                    </span>
                )}
            </div>

            {/* Time slots */}
            <div className="flex-1 p-2 space-y-1">
                {timeSlots.map((time) => {
                    const { block, reservation } = getSlotData(time);
                    const showSlot = !reservation || isSlotStart(time, reservation);
                    const isOwn = reservation && reservation.user_email === userEmail;

                    // Skip slots that are in the middle of a reservation
                    if (reservation && !isSlotStart(time, reservation)) {
                        return null;
                    }

                    return (
                        <TimeSlot
                            key={time}
                            time={time}
                            reservation={reservation}
                            block={block}
                            isOwn={isOwn}
                            isAdmin={isAdmin}
                            compact={compact}
                            onClick={() => {
                                if (!block && !reservation && !isPastDay) {
                                    onSlotClick(date, time);
                                } else if (isAdmin && reservation) {
                                    onSlotClick(date, time, reservation);
                                }
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
}
