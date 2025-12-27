import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Home, Receipt, CalendarCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ReservationSuccessModal({ open, onOpenChange, reservation }) {
    const navigate = useNavigate();

    if (!reservation) return null;

    // Parse date explicitly as local date
    const dateObj = parse(reservation.date, 'yyyy-MM-dd', new Date());
    const formattedDate = format(dateObj, "EEEE d 'de' MMMM", { locale: es });

    // Capitalize first letter
    const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onOpenChange(val)}>
            <DialogContent className="bg-slate-900 border border-white/10 text-white sm:max-w-md p-0 overflow-hidden rounded-3xl">
                <div className="bg-gradient-to-br from-green-500/20 to-lime-500/20 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-lime-500/30 rounded-full blur-[50px] pointer-events-none" />

                    <div className="w-20 h-20 bg-lime-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(132,204,22,0.5)] animate-in zoom-in duration-300 relative z-10">
                        <CheckCircle2 className="w-10 h-10 text-slate-900" />
                    </div>

                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-200 relative z-10">
                        ¡Reserva Confirmada!
                    </h2>
                    <p className="text-slate-300 mt-2 relative z-10">
                        Gracias por elegir Ataja La Vaca
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5 space-y-3">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <span className="text-slate-400">Fecha</span>
                            <span className="font-medium text-white">{capitalizedDate}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <span className="text-slate-400">Horario</span>
                            <span className="font-medium text-lime-400 text-lg">
                                {reservation.start_time.slice(0, 5)} hs
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">Cancha</span>
                            <span className="font-medium text-white">Cancha Principal</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <Button
                            onClick={() => navigate('/profile')}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-white/10 h-12 rounded-xl gap-2"
                        >
                            <Receipt className="w-4 h-4" />
                            Ver mis reservas
                        </Button>

                        <Button
                            onClick={() => navigate('/')}
                            variant="ghost"
                            className="w-full text-slate-400 hover:text-slate-900 hover:bg-slate-200 h-12 rounded-xl gap-2"
                        >
                            <Home className="w-4 h-4" />
                            Volver al inicio
                        </Button>
                    </div>

                    <p className="text-center text-xs text-slate-500">
                        Te enviamos un correo con los detalles.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
