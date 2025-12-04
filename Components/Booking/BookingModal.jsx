import React, { useState, useEffect } from 'react';
import { format, addMinutes, parse, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, Clock, Calendar, CreditCard, Building2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export default function BookingModal({
    isOpen,
    onClose,
    selectedDate,
    selectedTime,
    existingReservations = [],
    blocks = [],
    pricePerHour = 5000,
    bankAlias = '',
    onConfirm
}) {
    const [duration, setDuration] = useState(60);
    const [paymentMethod, setPaymentMethod] = useState('mercadopago');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setError('');
        setDuration(60);
    }, [selectedDate, selectedTime]);

    const calculateEndTime = (startTime, durationMin) => {
        const start = parse(startTime, 'HH:mm', new Date());
        return format(addMinutes(start, durationMin), 'HH:mm');
    };

    const checkAvailability = (startTime, durationMin) => {
        const endTime = calculateEndTime(startTime, durationMin);

        // Check against existing reservations
        for (const res of existingReservations) {
            if (res.date !== format(selectedDate, 'yyyy-MM-dd')) continue;
            if (res.status === 'cancelled') continue;

            // Check overlap: new.start < existing.end AND new.end > existing.start
            if (startTime < res.end_time && endTime > res.start_time) {
                return {
                    available: false,
                    message: `Ya hay una reserva de ${res.start_time} a ${res.end_time}`
                };
            }
        }

        // Check against blocks
        for (const block of blocks) {
            if (block.date !== format(selectedDate, 'yyyy-MM-dd')) continue;
            if (block.is_full_day) {
                return { available: false, message: 'Este día está bloqueado' };
            }
            if (startTime < block.end_time && endTime > block.start_time) {
                return {
                    available: false,
                    message: `Horario bloqueado de ${block.start_time} a ${block.end_time}`
                };
            }
        }

        return { available: true };
    };

    const availability = selectedTime ? checkAvailability(selectedTime, duration) : { available: true };
    const endTime = selectedTime ? calculateEndTime(selectedTime, duration) : '';
    const totalPrice = (duration / 60) * pricePerHour;

    const handleConfirm = async () => {
        if (!availability.available) {
            setError(availability.message);
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await onConfirm({
                date: format(selectedDate, 'yyyy-MM-dd'),
                start_time: selectedTime,
                end_time: endTime,
                duration,
                payment_method: paymentMethod,
                amount: totalPrice
            });
            onClose();
        } catch (err) {
            setError(err.message || 'Error al crear la reserva');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-white text-xl font-bold">
                            Nueva Reserva
                        </DialogTitle>
                        <DialogDescription className="text-blue-100">
                            Confirma los detalles de tu reserva
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-200" />
                            <span className="font-medium">
                                {selectedDate && format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-200" />
                            <span className="font-medium">{selectedTime}</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Duration Selection */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-700">Duración</Label>
                        <RadioGroup
                            value={String(duration)}
                            onValueChange={(val) => setDuration(Number(val))}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="60" id="60min" />
                                <Label htmlFor="60min" className="cursor-pointer">
                                    <span className="font-medium">60 minutos</span>
                                    <span className="text-gray-500 ml-1 text-sm">
                                        (${pricePerHour.toLocaleString()})
                                    </span>
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="90" id="90min" />
                                <Label htmlFor="90min" className="cursor-pointer">
                                    <span className="font-medium">90 minutos</span>
                                    <span className="text-gray-500 ml-1 text-sm">
                                        (${(pricePerHour * 1.5).toLocaleString()})
                                    </span>
                                </Label>
                            </div>
                        </RadioGroup>

                        {!availability.available && (
                            <Alert variant="destructive" className="mt-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{availability.message}</AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <Separator />

                    {/* Payment Method */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-700">Método de pago</Label>
                        <RadioGroup
                            value={paymentMethod}
                            onValueChange={setPaymentMethod}
                            className="space-y-3"
                        >
                            <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                                <RadioGroupItem value="mercadopago" id="mp" className="mt-1" />
                                <Label htmlFor="mp" className="cursor-pointer flex-1">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-blue-600" />
                                        <span className="font-medium">Mercado Pago</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Pago inmediato con tarjeta o saldo
                                    </p>
                                </Label>
                            </div>
                            <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                                <RadioGroupItem value="transfer" id="transfer" className="mt-1" />
                                <Label htmlFor="transfer" className="cursor-pointer flex-1">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-green-600" />
                                        <span className="font-medium">Transferencia bancaria</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Alias: <span className="font-mono font-medium">{bankAlias || 'cancha.padel'}</span>
                                    </p>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <Separator />

                    {/* Summary */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Horario</span>
                            <span className="font-medium">{selectedTime} - {endTime}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Duración</span>
                            <span className="font-medium">{duration} minutos</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between">
                            <span className="font-semibold text-gray-800">Total</span>
                            <span className="font-bold text-lg text-blue-600">
                                ${totalPrice.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            className="flex-1 bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold"
                            disabled={!availability.available || isSubmitting}
                        >
                            {isSubmitting ? 'Procesando...' : 'Confirmar reserva'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}