import React, { useState, useMemo } from 'react';
import { addDays, startOfWeek, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import DayColumn from './DayColumn';

export default function WeekCalendar({
    reservations = [],
    blocks = [],
    userEmail,
    onSlotClick,
    isAdmin = false,
    startHour = 8,
    endHour = 22
}) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarOpen, setCalendarOpen] = useState(false);

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    }, [weekStart]);

    const goToPreviousWeek = () => setCurrentDate(addDays(currentDate, -7));
    const goToNextWeek = () => setCurrentDate(addDays(currentDate, 7));
    const goToToday = () => setCurrentDate(new Date());

    const getReservationsForDay = (date) => {
        return reservations.filter(r => r.date === format(date, 'yyyy-MM-dd'));
    };

    const getBlocksForDay = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayOfWeek = date.getDay();

        return blocks.filter(b => {
            if (b.date === dateStr) return true;
            if (b.recurring && b.recurring_day === dayOfWeek) return true;
            return false;
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={goToPreviousWeek}
                        className="rounded-full"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={goToNextWeek}
                        className="rounded-full"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToToday}
                        className="ml-2 text-blue-600 hover:text-blue-700"
                    >
                        Hoy
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-800">
                        {format(weekStart, "d MMM", { locale: es })} - {format(addDays(weekStart, 6), "d MMM yyyy", { locale: es })}
                    </h2>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="icon" className="rounded-full">
                                <CalendarIcon className="w-4 h-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={currentDate}
                                onSelect={(date) => {
                                    if (date) {
                                        setCurrentDate(date);
                                        setCalendarOpen(false);
                                    }
                                }}
                                locale={es}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex overflow-x-auto">
                {/* Time labels */}
                <div className="flex-shrink-0 w-16 bg-gray-50 border-r">
                    <div className="h-[76px] border-b" /> {/* Header spacer */}
                    <div className="p-2 space-y-1">
                        {Array.from({ length: (endHour - startHour) * 2 }, (_, i) => {
                            const hour = Math.floor(i / 2) + startHour;
                            const isHalfHour = i % 2 === 1;
                            return (
                                <div key={i} className="h-[68px] flex items-start justify-end pr-2">
                                    {!isHalfHour && (
                                        <span className="text-xs text-gray-400 font-medium">
                                            {String(hour).padStart(2, '0')}:00
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Days */}
                <div className="flex flex-1">
                    {weekDays.map((date) => (
                        <DayColumn
                            key={date.toISOString()}
                            date={date}
                            reservations={getReservationsForDay(date)}
                            blocks={getBlocksForDay(date)}
                            userEmail={userEmail}
                            onSlotClick={onSlotClick}
                            isAdmin={isAdmin}
                            startHour={startHour}
                            endHour={endHour}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}