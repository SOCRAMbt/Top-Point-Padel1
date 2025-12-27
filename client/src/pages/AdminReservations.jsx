import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Search, Filter, Download, MoreHorizontal, Eye, Trash2,
    CheckCircle, XCircle, Calendar, Clock, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { createPageUrl } from '@/utils';
import Sidebar from '@/features/admin/Sidebar';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const statusLabels = {
    pending_payment: { label: 'Pago pendiente', color: 'bg-amber-100 text-amber-700' },
    pending_manual_payment: { label: 'Esperando pago', color: 'bg-orange-100 text-orange-700' },
    paid: { label: 'Pagado', color: 'bg-green-100 text-green-700' },
    completed: { label: 'Completado', color: 'bg-blue-100 text-blue-700' },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' }
};

import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminReservations() {
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();
    // ... filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    const { data: reservations = [], isLoading: loadingData } = useQuery({
        queryKey: ['admin-reservations'],
        queryFn: () => api.get('/reservations').then(res => res.data.map(r => ({
            ...r,
            user_name: r.User?.full_name || 'Sin nombre',
            user_email: r.User?.email,
            user_phone: r.User?.phone,
            amount: r.total_price
        }))),
        enabled: !!user && user.role === 'admin'
    });

    const updateReservation = useMutation({
        mutationFn: ({ id, data }) => api.patch(`/reservations/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
            setShowDetails(false);
        }
    });

    // ... deleteMutation if needed

    const handleLogout = () => {
        logout(); // From useAuth context
        navigate('/login');
    };

    const confirmPayment = async (reservation) => {
        await updateReservation.mutateAsync({
            id: reservation.id,
            data: { status: 'paid' }
        });
        // Email sent via backend hook in real production, skipping manual FE call
    };


    const cancelReservation = async (reservation) => {
        if (!window.confirm('¿Seguro que querés cancelar esta reserva?')) return;

        await updateReservation.mutateAsync({
            id: reservation.id,
            data: { status: 'cancelled' }
        });
        // Waitlist logic handled by backend now
    };

    const exportToCSV = () => {
        const headers = ['Fecha', 'Hora', 'Usuario', 'Email', 'Duración', 'Monto', 'Estado', 'Método de pago'];
        const rows = filteredReservations.map(r => [
            r.date,
            `${r.start_time} - ${r.end_time}`,
            r.user_name || '',
            r.user_email,
            `${r.duration} min`,
            r.amount || 0,
            statusLabels[r.status]?.label || r.status,
            r.payment_method || ''
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reservas_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <LoadingSpinner size="lg" text="Cargando..." />
            </div>
        );
    }

    const filteredReservations = reservations.filter(r => {
        const matchesSearch =
            r.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="flex min-h-screen bg-slate-100">
            <Sidebar currentPage="AdminReservations" onLogout={handleLogout} />

            <main className="flex-1 p-8 overflow-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Reservas</h1>
                        <p className="text-gray-500">Gestiona todas las reservas</p>
                    </div>
                    <Button onClick={exportToCSV} variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar CSV
                    </Button>
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
                                    <SelectValue placeholder="Filtrar por estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los estados</SelectItem>
                                    <SelectItem value="paid">Pagados</SelectItem>
                                    <SelectItem value="pending_payment">Pago pendiente</SelectItem>
                                    <SelectItem value="pending_manual_payment">Esperando pago</SelectItem>
                                    <SelectItem value="completed">Completados</SelectItem>
                                    <SelectItem value="cancelled">Cancelados</SelectItem>
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
                                        <TableHead>Horario</TableHead>
                                        <TableHead>Monto</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Pago</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredReservations.map((reservation) => (
                                        <TableRow key={reservation.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-lime-100 flex items-center justify-center">
                                                        <span className="text-lime-700 font-medium text-sm">
                                                            {reservation.user_name?.charAt(0) || reservation.user_email?.charAt(0)?.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{reservation.user_name || 'Sin nombre'}</p>
                                                        <p className="text-sm text-gray-500">{reservation.user_email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    {format(parseISO(reservation.date), "d MMM yyyy", { locale: es })}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    {reservation.start_time} - {reservation.end_time}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                ${reservation.amount?.toLocaleString() || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={statusLabels[reservation.status]?.color}>
                                                    {statusLabels[reservation.status]?.label || reservation.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500 capitalize">
                                                {reservation.payment_method || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => {
                                                            setSelectedReservation(reservation);
                                                            setShowDetails(true);
                                                        }}>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            Ver detalles
                                                        </DropdownMenuItem>
                                                        {reservation.status === 'pending_manual_payment' && (
                                                            <DropdownMenuItem onClick={() => confirmPayment(reservation)}>
                                                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                                                Confirmar pago
                                                            </DropdownMenuItem>
                                                        )}
                                                        {reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
                                                            <DropdownMenuItem
                                                                onClick={() => cancelReservation(reservation)}
                                                                className="text-red-600"
                                                            >
                                                                <XCircle className="w-4 h-4 mr-2" />
                                                                Cancelar reserva
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Details Dialog */}
                <Dialog open={showDetails} onOpenChange={setShowDetails}>
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
                                        <p className="text-sm text-gray-500">Teléfono</p>
                                        <p className="font-medium">{selectedReservation.user_phone || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Fecha</p>
                                        <p className="font-medium">
                                            {format(parseISO(selectedReservation.date), "EEEE d 'de' MMMM yyyy", { locale: es })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Horario</p>
                                        <p className="font-medium">{selectedReservation.start_time} - {selectedReservation.end_time}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Duración</p>
                                        <p className="font-medium">{selectedReservation.duration} minutos</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Monto</p>
                                        <p className="font-medium">${selectedReservation.amount?.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Método de pago</p>
                                        <p className="font-medium capitalize">{selectedReservation.payment_method || '-'}</p>
                                    </div>
                                </div>
                                {selectedReservation.notes && (
                                    <div>
                                        <p className="text-sm text-gray-500">Notas</p>
                                        <p className="font-medium">{selectedReservation.notes}</p>
                                    </div>
                                )}
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDetails(false)}>
                                Cerrar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
}
