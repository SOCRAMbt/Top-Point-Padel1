import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, parse, addDays, isBefore, startOfDay } from 'date-fns';
import es from 'date-fns/locale/es';
import { ChevronLeft, ChevronRight, Clock, CreditCard, Calendar as CalendarIcon, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { api } from '@/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ReservationSuccessModal from '@/features/booking/components/ReservationSuccessModal';

const STEPS = ['Fecha', 'Horario', 'Pago'];

// Generate next 14 days for horizontal date picker
const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
        dates.push(addDays(today, i));
    }
    return dates;
};

export default function BookingWizard() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [date, setDate] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [duration, setDuration] = useState(60);
    const [paymentMethod, setPaymentMethod] = useState('mercadopago');
    const [showDurationModal, setShowDurationModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastReservation, setLastReservation] = useState(null);

    const dateOptions = useMemo(() => generateDateOptions(), []);

    // Fetch reservations for the day
    const { data: reservations = [], isLoading } = useQuery({
        queryKey: ['reservations', format(date, 'yyyy-MM-dd')],
        queryFn: async () => {
            try {
                const res = await api.get('/reservations');
                if (!Array.isArray(res.data)) return [];
                return res.data.filter(r => r.date === format(date, 'yyyy-MM-dd') && r.status !== 'cancelled');
            } catch (e) {
                console.error("Fetch error:", e);
                return [];
            }
        }
    });

    const createReservationMutation = useMutation({
        mutationFn: (data) => api.post('/reservations', data),
        onSuccess: (response) => {
            const { init_point, reservation } = response.data;
            if (init_point && !init_point.includes('mock=true')) {
                window.location.href = init_point;
            } else {
                setLastReservation(reservation);
                setShowSuccessModal(true);
            }
        },
        onError: (err) => {
            alert('Error al crear reserva: ' + (err.response?.data?.error || err.message));
        }
    });

    const timeSlots = useMemo(() => {
        const slots = [];
        let start = 8 * 60; // 8:00 AM
        const end = 23 * 60; // 11:00 PM
        const now = new Date();
        const isToday = format(date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        if (!Array.isArray(reservations)) return [];

        // Helper to convert HP:mm(:ss) string to minutes
        const toMinutes = (timeStr) => {
            if (!timeStr) return -1;
            const parts = timeStr.split(':');
            return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        };

        while (start < end) {
            const h = Math.floor(start / 60);
            const m = start % 60;
            const timeString = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            const slotStartMinutes = start;

            // Skip past times for today
            if (isToday && slotStartMinutes <= currentMinutes + 30) {
                start += 30;
                continue;
            }

            // Check if occupied using integer comparison (Robust check)
            const isOccupied = reservations.some(r => {
                const rStart = toMinutes(r.start_time);
                const rEnd = toMinutes(r.end_time);

                // If invalid times, skip
                if (rStart === -1 || rEnd === -1) return false;

                // Logic: Slot is occupied if it falls efficiently within a reservation
                // Strict: slotTime >= rStart && slotTime < rEnd
                return (slotStartMinutes >= rStart && slotStartMinutes < rEnd);
            });

            // Calculate max duration based on next reservation or closing time
            let maxDur = 90;

            // Find the closest future reservation
            const nextResMinutes = reservations
                .map(r => toMinutes(r.start_time))
                .filter(t => t > slotStartMinutes)
                .sort((a, b) => a - b)[0];

            if (nextResMinutes !== undefined) {
                const gap = nextResMinutes - slotStartMinutes;
                if (gap < 60) maxDur = 0;
                else if (gap < 90) maxDur = 60;
            } else {
                const gap = end - slotStartMinutes;
                if (gap < 60) maxDur = 0;
                else if (gap < 90) maxDur = 60;
            }

            slots.push({
                time: timeString,
                maxDuration: maxDur,
                isOccupied,
                // Helper to distinguish why it's disabled
                status: isOccupied ? 'occupied' : (maxDur === 0 ? 'short_gap' : 'available')
            });

            start += 30;
        }
        return slots;
    }, [reservations, date]);

    const handleSlotClick = (slot) => {
        if (slot.isOccupied || slot.maxDuration === 0) return;
        setSelectedSlot(slot);
        setDuration(60);
        setShowDurationModal(true);
    };

    const confirmDuration = () => {
        setShowDurationModal(false);
        setStep(1);
    };

    const handleConfirmPayment = () => {
        createReservationMutation.mutate({
            date: format(date, 'yyyy-MM-dd'),
            start_time: selectedSlot.time + ':00',
            duration,
            payment_method: paymentMethod
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 safe-area-top">
                <div className="flex items-center gap-3 max-w-lg mx-auto">
                    <button
                        onClick={() => step === 0 ? navigate('/') : setStep(s => s - 1)}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="font-bold text-lg">Reservar Cancha</h1>
                        <div className="flex gap-1.5 mt-1.5">
                            {STEPS.map((_, i) => (
                                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i <= step ? 'w-8 bg-lime-500' : 'w-2 bg-slate-800'}`} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 py-6 max-w-lg mx-auto">
                {/* Step 0: Date & Time Selection (Combined for mobile) */}
                {step === 0 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* Horizontal Date Picker */}
                        <div>
                            <h2 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4" />
                                Elegí el día
                            </h2>
                            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                                {dateOptions.map((d, i) => {
                                    const isSelected = format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                                    const isToday = i === 0;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setDate(d)}
                                            className={`flex-shrink-0 w-16 py-3 rounded-2xl border-2 transition-all duration-200 ${isSelected
                                                ? 'bg-lime-500 border-lime-500 text-slate-900 shadow-lg shadow-lime-500/30'
                                                : 'bg-slate-900/50 border-white/10 hover:border-lime-500/50'
                                                }`}
                                        >
                                            <p className={`text-xs font-medium ${isSelected ? 'text-slate-800' : 'text-slate-400'}`}>
                                                {isToday ? 'Hoy' : format(d, 'EEE', { locale: es })}
                                            </p>
                                            <p className={`text-xl font-bold ${isSelected ? 'text-slate-900' : 'text-white'}`}>
                                                {format(d, 'd')}
                                            </p>
                                            <p className={`text-xs ${isSelected ? 'text-slate-700' : 'text-slate-500'}`}>
                                                {format(d, 'MMM', { locale: es })}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Time Slots Grid */}
                        <div>
                            <h2 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Horarios disponibles
                            </h2>

                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <LoadingSpinner />
                                </div>
                            ) : timeSlots.filter(s => !s.isOccupied && s.maxDuration > 0).length === 0 ? (
                                <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-white/5">
                                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                                        <Clock className="w-8 h-8 text-slate-500" />
                                    </div>
                                    <p className="text-slate-400 font-medium">No hay turnos disponibles</p>
                                    <p className="text-slate-500 text-sm mt-1">Probá con otra fecha</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-2">
                                    {timeSlots.map((slot) => {
                                        const isDisabled = slot.isOccupied || slot.maxDuration === 0;
                                        return (
                                            <button
                                                key={slot.time}
                                                onClick={() => handleSlotClick(slot)}
                                                disabled={isDisabled}
                                                className={`relative py-3 px-2 rounded-xl transition-all duration-200 ${isDisabled
                                                    ? 'bg-slate-900/30 text-slate-600 cursor-not-allowed opacity-40'
                                                    : 'bg-slate-900/50 border border-lime-500/20 hover:bg-lime-500 hover:text-slate-900 hover:border-lime-500 hover:shadow-lg hover:shadow-lime-500/20 hover:scale-105 active:scale-95'
                                                    }`}
                                            >
                                                <span className="block text-base font-bold">{slot.time}</span>
                                                {!isDisabled && slot.maxDuration === 60 && (
                                                    <span className="text-[9px] text-amber-400 font-medium">60m máx</span>
                                                )}
                                                {isDisabled && (
                                                    <span className="text-[9px] text-slate-600">
                                                        {slot.status === 'occupied' ? 'Ocupado' : 'No disponible'}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 1: Payment Summary */}
                {step === 1 && selectedSlot && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Summary Card */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl border border-white/10 space-y-4 shadow-2xl">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-lg text-white">Tu Reserva</h3>
                                <div className="px-3 py-1 bg-lime-500/20 rounded-full">
                                    <span className="text-lime-400 text-xs font-bold">CONFIRMANDO</span>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-slate-400 text-sm">Fecha</span>
                                    <span className="font-medium capitalize">{format(date, "EEEE d 'de' MMMM", { locale: es })}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-slate-400 text-sm">Horario</span>
                                    <span className="font-bold text-lime-400 text-xl">{selectedSlot.time} hs</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-slate-400 text-sm">Duración</span>
                                    <span className="font-medium">{duration} minutos</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 bg-slate-950/50 -mx-6 -mb-6 px-6 py-4 rounded-b-3xl">
                                <span className="font-bold text-lg">Total</span>
                                <span className="font-black text-3xl text-lime-400">${duration === 60 ? '12.000' : '16.000'}</span>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                            <div className="flex items-center space-x-4 bg-slate-900/50 p-4 rounded-2xl border-2 border-lime-500/50 cursor-pointer transition-all shadow-lg shadow-lime-500/5">
                                <RadioGroupItem value="mercadopago" id="mp" checked className="border-lime-500" />
                                <Label htmlFor="mp" className="flex-1 cursor-pointer">
                                    <span className="block font-bold text-white">Mercado Pago</span>
                                    <span className="block text-xs text-slate-400 mt-0.5">Tarjetas, Débito, Dinero en cuenta</span>
                                </Label>
                                <div className="flex items-center gap-1 text-lime-400">
                                    <Zap className="w-4 h-4" />
                                    <span className="text-xs font-bold">Instantáneo</span>
                                </div>
                            </div>
                        </RadioGroup>

                        {/* Confirm Button */}
                        <Button
                            className="w-full h-16 bg-lime-500 hover:bg-lime-400 text-slate-900 font-black text-lg rounded-2xl shadow-xl shadow-lime-500/30 transition-all hover:shadow-lime-500/50 hover:scale-[1.02] active:scale-[0.98]"
                            onClick={handleConfirmPayment}
                            disabled={createReservationMutation.isPending}
                        >
                            {createReservationMutation.isPending ? (
                                <div className="flex items-center gap-3">
                                    <LoadingSpinner size="sm" className="border-slate-900" />
                                    <span>Procesando...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <CreditCard className="w-5 h-5" />
                                    <span>Confirmar y Pagar</span>
                                </div>
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* Duration Modal */}
            <Dialog open={showDurationModal} onOpenChange={setShowDurationModal}>
                <DialogContent className="bg-slate-900 border border-white/10 text-white sm:max-w-sm mx-4 rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-center">¿Cuánto tiempo?</DialogTitle>
                        <DialogDescription className="text-center text-slate-400">
                            Turno de las <span className="text-lime-400 font-bold">{selectedSlot?.time}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-3 py-4">
                        <button
                            onClick={() => { setDuration(60); confirmDuration(); }}
                            className="bg-slate-800 p-5 rounded-2xl border-2 border-transparent hover:border-lime-500 hover:bg-slate-700 transition-all flex flex-col items-center gap-2 active:scale-95"
                        >
                            <Clock className="w-8 h-8 text-lime-500" />
                            <span className="font-bold text-xl">60 min</span>
                            <span className="text-lime-400 font-bold">$12.000</span>
                        </button>

                        <button
                            onClick={() => { setDuration(90); confirmDuration(); }}
                            disabled={selectedSlot?.maxDuration < 90}
                            className={`p-5 rounded-2xl border-2 border-transparent transition-all flex flex-col items-center gap-2 ${selectedSlot?.maxDuration < 90
                                ? 'bg-slate-800/30 opacity-40 cursor-not-allowed'
                                : 'bg-slate-800 hover:border-lime-500 hover:bg-slate-700 active:scale-95'
                                }`}
                        >
                            <Clock className={`w-8 h-8 ${selectedSlot?.maxDuration < 90 ? 'text-slate-600' : 'text-blue-400'}`} />
                            <span className="font-bold text-xl">90 min</span>
                            <span className={selectedSlot?.maxDuration < 90 ? 'text-slate-600' : 'text-blue-400 font-bold'}>
                                {selectedSlot?.maxDuration < 90 ? 'No disponible' : '$16.000'}
                            </span>
                        </button>
                    </div>

                    {selectedSlot?.maxDuration < 90 && (
                        <p className="text-xs text-amber-400 text-center bg-amber-500/10 p-3 rounded-xl">
                            ⚠️ Solo 60 min disponibles por un turno posterior
                        </p>
                    )}
                </DialogContent>
            </Dialog>

            {/* Success Modal */}
            <ReservationSuccessModal
                open={showSuccessModal}
                onOpenChange={setShowSuccessModal}
                reservation={lastReservation}
            />
        </div>
    );
}
