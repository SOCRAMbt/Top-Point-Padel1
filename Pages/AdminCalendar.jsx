import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';
import Sidebar from '@/components/admin/Sidebar';
import WeekCalendar from '@/components/calendar/WeekCalendar';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { es } from 'date-fns/locale';

export default function AdminCalendar() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReservation, setSelectedReservation] = useState(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userData = await base44.auth.me();
                if (userData.role !== 'admin') {
                    window.location.href = createPageUrl('Home');
                    return;
                }
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
        queryKey: ['calendar-reservations'],
        queryFn: () => base44.entities.Reservation.filter({ status: { $ne: 'cancelled' } }),
        enabled: !!user
    });

    const { data: blocks = [] } = useQuery({
        queryKey: ['calendar-blocks'],
        queryFn: () => base44.entities.Block.list(),
        enabled: !!user
    });

    const handleLogout = () => {
        base44.auth.logout(createPageUrl('Home'));
    };

    const handleSlotClick = (date, time, reservation) => {
        if (reservation) {
            setSelectedReservation(reservation);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <LoadingSpinner size="lg" text="Cargando..." />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-100">
            <Sidebar currentPage="AdminCalendar" onLogout={handleLogout} />

            <main className="flex-1 p-8 overflow-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Calendario</h1>
                    <p className="text-gray-500">Vista general de reservas y bloqueos</p>
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
                        isAdmin={true}
                    />
                )}

                {/* Reservation Details */}
                <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Detalles de la reserva</DialogTitle>
                        </DialogHeader>
                        {selectedReservation && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Usuario</p>
                                        <p className="font-medium">{selectedReservation.user_name || 'Sin nombre'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium">{selectedReservation.user_email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Fecha</p>
                                        <p className="font-medium">
                                            {format(new Date(selectedReservation.date), "EEEE d 'de' MMMM", { locale: es })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Horario</p>
                                        <p className="font-medium">{selectedReservation.start_time} - {selectedReservation.end_time}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Monto</p>
                                        <p className="font-medium">${selectedReservation.amount?.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Estado</p>
                                        <Badge className={
                                            selectedReservation.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                selectedReservation.status === 'pending_payment' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-gray-100 text-gray-700'
                                        }>
                                            {selectedReservation.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
}