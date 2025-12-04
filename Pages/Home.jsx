import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, addDays, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, MapPin, Phone, Star, ChevronRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import WeekCalendar from '@/components/calendar/WeekCalendar';
import BookingModal from '@/components/booking/BookingModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function Home() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const queryClient = useQueryClient();

    useEffect(() => {
        const loadUser = async () => {
            try {
                const isAuth = await base44.auth.isAuthenticated();
                if (isAuth) {
                    const userData = await base44.auth.me();
                    setUser(userData);
                }
            } catch (e) {
                console.log('Not authenticated');
            } finally {
                setIsLoading(false);
            }
        };
        loadUser();
    }, []);

    const { data: reservations = [], isLoading: loadingReservations } = useQuery({
        queryKey: ['reservations'],
        queryFn: () => base44.entities.Reservation.filter({
            status: { $ne: 'cancelled' }
        }),
    });

    const { data: blocks = [] } = useQuery({
        queryKey: ['blocks'],
        queryFn: () => base44.entities.Block.list(),
    });

    const { data: settings = [] } = useQuery({
        queryKey: ['settings'],
        queryFn: () => base44.entities.Settings.list(),
    });

    const getSetting = (key, defaultValue) => {
        const setting = settings.find(s => s.key === key);
        return setting ? setting.value : defaultValue;
    };

    const pricePerHour = Number(getSetting('price_per_hour', 5000));
    const bankAlias = getSetting('bank_alias', 'cancha.padel');

    const createReservation = useMutation({
        mutationFn: async (data) => {
            const reservation = await base44.entities.Reservation.create({
                ...data,
                user_id: user?.id,
                user_email: user?.email,
                user_name: user?.full_name,
                status: data.payment_method === 'mercadopago' ? 'pending_payment' : 'pending_manual_payment'
            });

            // Send confirmation email
            await base44.integrations.Core.SendEmail({
                to: user.email,
                subject: 'Reserva confirmada - Padel Pro',
                body: `
          <h2>¡Tu reserva ha sido registrada!</h2>
          <p><strong>Fecha:</strong> ${format(new Date(data.date), "EEEE d 'de' MMMM", { locale: es })}</p>
          <p><strong>Horario:</strong> ${data.start_time} - ${data.end_time}</p>
          <p><strong>Duración:</strong> ${data.duration} minutos</p>
          <p><strong>Monto:</strong> $${data.amount.toLocaleString()}</p>
          ${data.payment_method === 'transfer' ?
                        `<p><strong>Alias para transferencia:</strong> ${bankAlias}</p>
             <p>Tu reserva quedará confirmada una vez acreditado el pago.</p>` :
                        '<p>Serás redirigido a Mercado Pago para completar el pago.</p>'}
        `
            });

            return reservation;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
        }
    });

    const handleSlotClick = (date, time) => {
        if (!user) {
            base44.auth.redirectToLogin();
            return;
        }
        setSelectedDate(date);
        setSelectedTime(time);
        setIsBookingOpen(true);
    };

    const handleBookingConfirm = async (data) => {
        await createReservation.mutateAsync(data);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <LoadingSpinner size="lg" text="Cargando..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            {/* Hero Section */}
            <header className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900" />
                <div className="absolute inset-0 bg-[url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e37bebe20ccc53d68bf1c/465107ae2_ImagendeWhatsApp2025-12-02alas192411_0ec4dbbd.jpg')] bg-cover bg-center mix-blend-overlay opacity-30" />

                <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <img
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e37bebe20ccc53d68bf1c/7b8e3357f_ImagendeWhatsApp2025-12-02alas192411_c45f4cfe.jpg"
                            alt="TPP Logo"
                            className="w-12 h-12 rounded-full object-cover"
                        />
                        <span className="font-bold text-xl text-white">TPP</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-3">
                                <Link to={createPageUrl('Profile')}>
                                    <Button variant="ghost" className="text-white hover:bg-white/10">
                                        <User className="w-4 h-4 mr-2" />
                                        Mi perfil
                                    </Button>
                                </Link>
                                {user.role === 'admin' && (
                                    <Link to={createPageUrl('AdminDashboard')}>
                                        <Button className="bg-white text-blue-700 hover:bg-blue-50">
                                            Panel Admin
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <Button
                                onClick={() => base44.auth.redirectToLogin()}
                                className="bg-white text-blue-700 hover:bg-blue-50"
                            >
                                Iniciar sesión
                            </Button>
                        )}
                    </div>
                </nav>

                <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center">
                    <img
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e37bebe20ccc53d68bf1c/7b8e3357f_ImagendeWhatsApp2025-12-02alas192411_c45f4cfe.jpg"
                        alt="Ataja la Vaca - Top Point Pádel"
                        className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover mx-auto mb-6 shadow-2xl border-4 border-white/20"
                    />
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                        Reservá tu cancha
                        <span className="block text-lime-400">en Top Point Pádel</span>
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                        Elegí el horario que prefieras, pagá online y listo.
                        Sin llamadas, sin esperas.
                    </p>

                    <div className="flex flex-wrap justify-center gap-6 text-white/80 text-sm">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>8:00 - 22:00 hs</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>Ataja la Vaca</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-lime-400" />
                            <span>Top Point Pádel</span>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 to-transparent" />
            </header>

            {/* Calendar Section */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Calendario de disponibilidad
                    </h2>
                    <p className="text-gray-500">
                        Seleccioná un horario disponible para hacer tu reserva
                    </p>
                </div>

                {loadingReservations ? (
                    <div className="flex justify-center py-20">
                        <LoadingSpinner text="Cargando calendario..." />
                    </div>
                ) : (
                    <WeekCalendar
                        reservations={reservations}
                        blocks={blocks}
                        userEmail={user?.email}
                        onSlotClick={handleSlotClick}
                    />
                )}

                {/* Info Cards */}
                <div className="grid md:grid-cols-3 gap-6 mt-12">
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                        <div className="h-32 bg-cover bg-center" style={{ backgroundImage: "url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e37bebe20ccc53d68bf1c/465107ae2_ImagendeWhatsApp2025-12-02alas192411_0ec4dbbd.jpg')" }} />
                        <div className="p-6">
                            <h3 className="font-semibold text-gray-800 mb-2">Turnos de 60 o 90 min</h3>
                            <p className="text-gray-500 text-sm">
                                Elegí la duración que mejor se adapte a tu juego
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                        <div className="h-32 bg-cover bg-center" style={{ backgroundImage: "url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e37bebe20ccc53d68bf1c/49b6eaee3_ImagendeWhatsApp2025-12-02alas192411_c6886d99.jpg')" }} />
                        <div className="p-6">
                            <h3 className="font-semibold text-gray-800 mb-2">Reserva instantánea</h3>
                            <p className="text-gray-500 text-sm">
                                Confirmación inmediata al realizar el pago
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-4">
                            <Phone className="w-6 h-6 text-lime-400" />
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2">Soporte directo</h3>
                        <p className="text-gray-500 text-sm">
                            Estamos para ayudarte en cualquier momento
                        </p>
                    </div>
                </div>
            </main>

            {/* Booking Modal */}
            <BookingModal
                isOpen={isBookingOpen}
                onClose={() => setIsBookingOpen(false)}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                existingReservations={reservations}
                blocks={blocks}
                pricePerHour={pricePerHour}
                bankAlias={bankAlias}
                onConfirm={handleBookingConfirm}
            />

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-12 mt-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <img
                                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e37bebe20ccc53d68bf1c/7b8e3357f_ImagendeWhatsApp2025-12-02alas192411_c45f4cfe.jpg"
                                alt="TPP Logo"
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                                <span className="font-bold text-lg">TPP</span>
                                <p className="text-xs text-slate-400">Top Point Pádel</p>
                            </div>
                        </div>
                        <p className="text-slate-400 text-sm">
                            © 2024 Ataja la Vaca - Top Point Pádel. Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}