import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, Filter, CheckCircle, XCircle, DollarSign, CreditCard, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { createPageUrl } from '@/utils';
import Sidebar from '@/components/admin/Sidebar';
import StatCard from '@/components/admin/StatCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const statusLabels = {
    pending_payment: { label: 'Pendiente MP', color: 'bg-amber-100 text-amber-700' },
    pending_manual_payment: { label: 'Esperando trans.', color: 'bg-orange-100 text-orange-700' },
    paid: { label: 'Pagado', color: 'bg-green-100 text-green-700' },
    completed: { label: 'Completado', color: 'bg-blue-100 text-blue-700' },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' }
};

export default function AdminPayments() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');
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

    const { data: reservations = [], isLoading: loadingData } = useQuery({
        queryKey: ['admin-payments'],
        queryFn: () => base44.entities.Reservation.list('-created_date', 500),
        enabled: !!user
    });

    const updateReservation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Reservation.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
        }
    });

    const handleLogout = () => {
        base44.auth.logout(createPageUrl('Home'));
    };

    const confirmPayment = async (reservation) => {
        await updateReservation.mutateAsync({
            id: reservation.id,
            data: { status: 'paid' }
        });

        await base44.integrations.Core.SendEmail({
            to: reservation.user_email,
            subject: 'Pago confirmado - Padel Pro',
            body: `
        <h2>¡Tu pago ha sido confirmado!</h2>
        <p>Tu reserva para el ${format(parseISO(reservation.date), "EEEE d 'de' MMMM", { locale: es })} a las ${reservation.start_time} está confirmada.</p>
      `
        });

        await base44.entities.AuditLog.create({
            action: 'manual_payment_confirmed',
            entity_type: 'Reservation',
            entity_id: reservation.id,
            user_email: user.email
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <LoadingSpinner size="lg" text="Cargando..." />
            </div>
        );
    }

    const pendingManual = reservations.filter(r => r.status === 'pending_manual_payment');
    const pendingMP = reservations.filter(r => r.status === 'pending_payment');
    const paid = reservations.filter(r => r.status === 'paid' || r.status === 'completed');

    const totalPaid = paid.reduce((sum, r) => sum + (r.amount || 0), 0);
    const pendingAmount = [...pendingManual, ...pendingMP].reduce((sum, r) => sum + (r.amount || 0), 0);

    const filteredReservations = reservations.filter(r => {
        const matchesSearch =
            r.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.user_email?.toLowerCase().includes(searchTerm.toLowerCase());

        if (statusFilter === 'pending') {
            return matchesSearch && (r.status === 'pending_payment' || r.status === 'pending_manual_payment');
        }
        if (statusFilter === 'all') return matchesSearch;
        return matchesSearch && r.status === statusFilter;
    });

    return (
        <div className="flex min-h-screen bg-slate-100">
            <Sidebar currentPage="AdminPayments" onLogout={handleLogout} />

            <main className="flex-1 p-8 overflow-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Pagos</h1>
                    <p className="text-gray-500">Gestiona los pagos y confirmaciones</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        title="Total recaudado"
                        value={`$${totalPaid.toLocaleString()}`}
                        icon={DollarSign}
                        color="green"
                    />
                    <StatCard
                        title="Pendientes de pago"
                        value={`$${pendingAmount.toLocaleString()}`}
                        icon={DollarSign}
                        color="orange"
                    />
                    <StatCard
                        title="Esperando transferencia"
                        value={pendingManual.length}
                        icon={Building2}
                        color="purple"
                    />
                    <StatCard
                        title="Esperando MP"
                        value={pendingMP.length}
                        icon={CreditCard}
                        color="blue"
                    />
                </div>

                <Card>
                    <CardHeader className="border-b">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar por nombre o email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-48">
                                    <Filter className="w-4 h-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pendientes</SelectItem>
                                    <SelectItem value="paid">Pagados</SelectItem>
                                    <SelectItem value="all">Todos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loadingData ? (
                            <div className="flex justify-center py-12">
                                <LoadingSpinner />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Usuario</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Monto</TableHead>
                                        <TableHead>Método</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredReservations.map((reservation) => (
                                        <TableRow key={reservation.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{reservation.user_name || 'Sin nombre'}</p>
                                                    <p className="text-sm text-gray-500">{reservation.user_email}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p>{format(parseISO(reservation.date), "d MMM", { locale: es })}</p>
                                                    <p className="text-sm text-gray-500">{reservation.start_time}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                ${reservation.amount?.toLocaleString() || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {reservation.payment_method === 'mercadopago' ? (
                                                        <CreditCard className="w-4 h-4 text-blue-500" />
                                                    ) : (
                                                        <Building2 className="w-4 h-4 text-green-500" />
                                                    )}
                                                    <span className="text-sm capitalize">{reservation.payment_method || '-'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={statusLabels[reservation.status]?.color}>
                                                    {statusLabels[reservation.status]?.label || reservation.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {reservation.status === 'pending_manual_payment' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => confirmPayment(reservation)}
                                                        disabled={updateReservation.isPending}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        Confirmar
                                                    </Button>
                                                )}
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