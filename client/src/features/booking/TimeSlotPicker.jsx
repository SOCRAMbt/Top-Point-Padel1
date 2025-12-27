import React from 'react';
import { cn } from '@/utils/cn';
import { format, addMinutes, parse, isBefore } from 'date-fns';

export default function TimeSlotPicker({ date, duration = 60, bookedSlots = [], onSelect, selectedTime }) {
    // Generate slots from 8:00 to 23:00
    const slots = [];
    let startTime = parse('08:00', 'HH:mm', new Date());
    const endTime = parse('23:00', 'HH:mm', new Date());

    while (isBefore(startTime, endTime)) {
        const timeString = format(startTime, 'HH:mm');

        // Check if slot is booked (simplified overlap logic for UI)
        // Real validation happens on backend
        const isBooked = bookedSlots.some(slot => {
            // Simple check: if slot start matches or is inside a booked range
            return timeString >= slot.start && timeString < slot.end;
        });

        slots.push({
            time: timeString,
            available: !isBooked
        });

        startTime = addMinutes(startTime, 30); // 30 min granularity
    }

    return (
        <div className="grid grid-cols-4 gap-3">
            {slots.map((slot) => (
                <button
                    key={slot.time}
                    disabled={!slot.available}
                    onClick={() => onSelect(slot.time)}
                    className={cn(
                        "py-2 px-1 rounded-lg text-sm font-medium transition-all",
                        slot.available && selectedTime !== slot.time && "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700",
                        slot.available && selectedTime === slot.time && "bg-lime-500 text-slate-900 border-lime-500 shadow-[0_0_15px_rgba(132,204,22,0.4)] transform scale-105",
                        !slot.available && "bg-slate-900/50 text-slate-600 cursor-not-allowed border border-slate-800/50 decoration-slate-600"
                    )}
                >
                    {slot.time}
                </button>
            ))}
        </div>
    );
}
