import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    User, Calendar, Clock, CreditCard, ChevronRight,
    LogOut, ArrowLeft, Trophy, Timer, CheckCircle, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

const statusLabels = {
    pending_payment: { label: 'Pago pendiente', color: 'bg-amber-100 text-amber-700' },
    pending_manual_payment: { label: 'Esperando pago', color: 'bg-orange-100 text-orange-700' },
    paid: { label: 'Pagado', color: 'bg-green-100 text-green-700' },
    completed: { label: 'Completado', color: 'bg-blue-100 text-blue-700' },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' }
};

export default function Profile() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userData = await base44.auth.me();
                setUser(userData);
            } catch (e) {
                base44.auth.redirectToLogin();
            } finally {
                setIsLoading(false);
            }
        };
        loadUser();
    }, []);

    const { data: reservations = [], isLoading: loadingReservations } = useQuery({
        queryKey: ['my-reservations', user?.email],
        queryFn: () => base44.entities.Reservation.filter({ user_email: user?.email }, '-created_date'),
        enabled: !!user?.email
    });

    const handleLogout = () => {
        base44.auth.logout(createPageUrl('Home'));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <LoadingSpinner size="lg" text="Cargando..." />
            </div>
        );
    }

    // Stats
    const paidReservations = reservations.filter(r => r.status === 'paid' || r.status === 'completed');
    const totalHours = paidReservations.reduce((acc, r) => acc + (r.duration || 60) / 60, 0);
    const totalSpent = paidReservations.reduce((acc, r) => acc + (r.amount || 0), 0);
    const upcomingReservations = reservations.filter(r =>
        ['paid', 'pending_payment', 'pending_manual_payment'].includes(r.status) &&
        new Date(`${r.date}T${r.start_time}`) > new Date()
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            {/* Header */}
            <header className="bg-white border-b">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to={createPageUrl('Home')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Volver</span>
                    </Link>
                    <Button variant="ghost" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <LogOut className="w-4 h-4 mr-2" />
                        Cerrar sesión
                    </Button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-10">
                {/* Profile Header */}
                <div className="flex items-start gap-6 mb-10">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                        {user?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{user?.full_name || 'Usuario'}</h1>
                        <p className="text-gray-500">{user?.email}</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Miembro desde {format(new Date(user?.created_date || new Date()), "MMMM yyyy", { locale: es })}
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-900">{paidReservations.length}</p>
                            <p className="text-sm text-gray-500">Turnos totales</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Timer className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
                            <p className="text-sm text-gray-500">Horas jugadas</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Calendar className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-900">{upcomingReservations.length}</p>
                            <p className="text-sm text-gray-500">Próximos turnos</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <CreditCard className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-900">${totalSpent.toLocaleString()}</p>
                            <p className="text-sm text-gray-500">Total pagado</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Reservations */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Mis reservas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loadingReservations ? (
                            <LoadingSpinner />
                        ) : reservations.length === 0 ? (
                            <EmptyState
                                icon={Calendar}
                                title="No tenés reservas"
                                description="Hacé tu primera reserva para disfrutar de la cancha"
                                action={() => window.location.href = createPageUrl('Home')}
                                actionLabel="Reservar ahora"
                            />
                        ) : (
                            <div className="space-y-3">
                                {reservations.slice(0, 10).map((reservation) => (
                                    <div
                                        key={reservation.id}
                                        className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-white flex flex-col items-center justify-center shadow-sm">
                                                <span className="text-xs text-gray-500">
                                                    {format(new Date(reservation.date), 'MMM', { locale: es })}
                                                </span>
                                                <span className="text-lg font-bold text-gray-800">
                                                    {format(new Date(reservation.date), 'd')}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">
                                                    {format(new Date(reservation.date), "EEEE", { locale: es })}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {reservation.start_time} - {reservation.end_time} ({reservation.duration} min)
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge className={statusLabels[reservation.status]?.color || 'bg-gray-100'}>
                                                {statusLabels[reservation.status]?.label || reservation.status}
                                            </Badge>
                                            <span className="font-semibold text-gray-700">
                                                ${reservation.amount?.toLocaleString() || '-'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}