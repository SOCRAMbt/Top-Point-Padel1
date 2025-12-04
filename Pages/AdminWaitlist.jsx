import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, Clock, User, Mail, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { createPageUrl } from '@/utils';
import Sidebar from '@/components/admin/Sidebar';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

const statusLabels = {
    waiting: { label: 'Esperando', color: 'bg-blue-100 text-blue-700' },
    notified: { label: 'Notificado', color: 'bg-amber-100 text-amber-700' },
    expired: { label: 'Expirado', color: 'bg-gray-100 text-gray-700' },
    converted: { label: 'Reservó', color: 'bg-green-100 text-green-700' }
};

export default function AdminWaitlist() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const queryClient = useQueryClient();

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

    const { data: waitlist = [], isLoading: loadingData } = useQuery({
        queryKey: ['admin-waitlist'],
        queryFn: () => base44.entities.Waitlist.list('-created_date', 200),
        enabled: !!user
    });

    const deleteEntry = useMutation({
        mutationFn: (id) => base44.entities.Waitlist.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-waitlist'] });
        }
    });

    const notifyUser = useMutation({
        mutationFn: async (entry) => {
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

            await base44.entities.Waitlist.update(entry.id, {
                status: 'notified',
                notified_at: new Date().toISOString(),
                expires_at: expiresAt
            });

            await base44.integrations.Core.SendEmail({
                to: entry.user_email,
                subject: '¡Turno disponible! - Padel Pro',
                body: `
          <h2>¡Se liberó un turno!</h2>
          <p>Hola ${entry.user_name || 'jugador'}!</p>
          <p>El turno del ${format(parseISO(entry.date), "EEEE d 'de' MMMM", { locale: es })} a las ${entry.start_time} está disponible.</p>
          <p><strong>Tenés 5 minutos para reservarlo.</strong></p>
          <p><a href="${window.location.origin}${createPageUrl('Home')}">Reservar ahora</a></p>
        `
            });

            await base44.entities.AuditLog.create({
                action: 'waitlist_notified',
                entity_type: 'Waitlist',
                entity_id: entry.id,
                user_email: user.email
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-waitlist'] });
        }
    });

    const handleLogout = () => {
        base44.auth.logout(createPageUrl('Home'));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <LoadingSpinner size="lg" text="Cargando..." />
            </div>
        );
    }

    const waitingCount = waitlist.filter(w => w.status === 'waiting').length;
    const notifiedCount = waitlist.filter(w => w.status === 'notified').length;

    return (
        <div className="flex min-h-screen bg-slate-100">
            <Sidebar currentPage="AdminWaitlist" onLogout={handleLogout} />

            <main className="flex-1 p-8 overflow-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Lista de Espera</h1>
                    <p className="text-gray-500">Usuarios esperando por un turno</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-3xl font-bold text-blue-600">{waitingCount}</p>
                            <p className="text-sm text-gray-500">Esperando</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-3xl font-bold text-amber-600">{notifiedCount}</p>
                            <p className="text-sm text-gray-500">Notificados</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-3xl font-bold text-gray-600">{waitlist.length}</p>
                            <p className="text-sm text-gray-500">Total</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Lista de espera</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loadingData ? (
                            <div className="flex justify-center py-12">
                                <LoadingSpinner />
                            </div>
                        ) : waitlist.length === 0 ? (
                            <EmptyState
                                icon={Clock}
                                title="Lista de espera vacía"
                                description="Cuando los usuarios se anoten en la lista de espera, aparecerán aquí"
                            />
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Usuario</TableHead>
                                        <TableHead>Fecha deseada</TableHead>
                                        <TableHead>Horario</TableHead>
                                        <TableHead>Duración</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Registrado</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {waitlist.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                                        <User className="w-4 h-4 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{entry.user_name || 'Sin nombre'}</p>
                                                        <p className="text-sm text-gray-500">{entry.user_email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {format(parseISO(entry.date), "d MMM yyyy", { locale: es })}
                                            </TableCell>
                                            <TableCell>{entry.start_time}</TableCell>
                                            <TableCell>{entry.duration} min</TableCell>
                                            <TableCell>
                                                <Badge className={statusLabels[entry.status]?.color}>
                                                    {statusLabels[entry.status]?.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {format(parseISO(entry.created_date), "d MMM, HH:mm", { locale: es })}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {entry.status === 'waiting' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => notifyUser.mutate(entry)}
                                                            disabled={notifyUser.isPending}
                                                        >
                                                            <Bell className="w-4 h-4 mr-1" />
                                                            Notificar
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => deleteEntry.mutate(entry.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}