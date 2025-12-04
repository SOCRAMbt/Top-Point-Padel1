import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, User, Mail, Calendar, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { createPageUrl } from '@/utils';
import Sidebar from '@/components/admin/Sidebar';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function AdminUsers() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);

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

    const { data: users = [], isLoading: loadingUsers } = useQuery({
        queryKey: ['admin-users'],
        queryFn: () => base44.entities.User.list('-created_date', 200),
        enabled: !!user
    });

    const { data: reservations = [] } = useQuery({
        queryKey: ['users-reservations'],
        queryFn: () => base44.entities.Reservation.list('-created_date', 1000),
        enabled: !!user
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

    const getUserStats = (email) => {
        const userReservations = reservations.filter(r => r.user_email === email);
        const paidReservations = userReservations.filter(r => r.status === 'paid' || r.status === 'completed');
        return {
            total: userReservations.length,
            paid: paidReservations.length,
            hours: paidReservations.reduce((sum, r) => sum + (r.duration || 60) / 60, 0),
            spent: paidReservations.reduce((sum, r) => sum + (r.amount || 0), 0),
            lastReservation: userReservations[0]
        };
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-slate-100">
            <Sidebar currentPage="AdminUsers" onLogout={handleLogout} />

            <main className="flex-1 p-8 overflow-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
                    <p className="text-gray-500">Gestiona los usuarios registrados</p>
                </div>

                <Card>
                    <CardHeader className="border-b">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Buscar por nombre o email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loadingUsers ? (
                            <div className="flex justify-center py-12">
                                <LoadingSpinner />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Usuario</TableHead>
                                        <TableHead>Registrado</TableHead>
                                        <TableHead>Reservas</TableHead>
                                        <TableHead>Horas</TableHead>
                                        <TableHead>Total gastado</TableHead>
                                        <TableHead>Rol</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((u) => {
                                        const stats = getUserStats(u.email);
                                        return (
                                            <TableRow
                                                key={u.id}
                                                className="cursor-pointer hover:bg-gray-50"
                                                onClick={() => setSelectedUser({ ...u, stats })}
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium">
                                                            {u.full_name?.charAt(0) || u.email?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{u.full_name || 'Sin nombre'}</p>
                                                            <p className="text-sm text-gray-500">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-gray-500">
                                                    {format(parseISO(u.created_date), "d MMM yyyy", { locale: es })}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-medium">{stats.paid}</span>
                                                    <span className="text-gray-400">/{stats.total}</span>
                                                </TableCell>
                                                <TableCell>{stats.hours.toFixed(1)}h</TableCell>
                                                <TableCell className="font-semibold text-green-600">
                                                    ${stats.spent.toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                                                        {u.role || 'user'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* User Details Dialog */}
                <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Perfil del usuario</DialogTitle>
                        </DialogHeader>
                        {selectedUser && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                                        {selectedUser.full_name?.charAt(0) || selectedUser.email?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{selectedUser.full_name || 'Sin nombre'}</h3>
                                        <p className="text-gray-500">{selectedUser.email}</p>
                                        <Badge className="mt-1">{selectedUser.role || 'user'}</Badge>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-blue-50 rounded-xl text-center">
                                        <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                                        <p className="text-2xl font-bold text-blue-700">{selectedUser.stats.paid}</p>
                                        <p className="text-sm text-blue-600">Reservas completadas</p>
                                    </div>
                                    <div className="p-4 bg-purple-50 rounded-xl text-center">
                                        <Clock className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                                        <p className="text-2xl font-bold text-purple-700">{selectedUser.stats.hours.toFixed(1)}h</p>
                                        <p className="text-sm text-purple-600">Horas jugadas</p>
                                    </div>
                                    <div className="p-4 bg-green-50 rounded-xl text-center col-span-2">
                                        <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
                                        <p className="text-2xl font-bold text-green-700">${selectedUser.stats.spent.toLocaleString()}</p>
                                        <p className="text-sm text-green-600">Total gastado</p>
                                    </div>
                                </div>

                                {selectedUser.stats.lastReservation && (
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-sm text-gray-500 mb-1">Última reserva</p>
                                        <p className="font-medium">
                                            {format(parseISO(selectedUser.stats.lastReservation.date), "EEEE d 'de' MMMM", { locale: es })}
                                            {' a las '}{selectedUser.stats.lastReservation.start_time}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
}