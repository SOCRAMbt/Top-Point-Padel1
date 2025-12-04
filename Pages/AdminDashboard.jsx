import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Calendar, Clock, DollarSign, Users, TrendingUp, AlertCircle,
    ArrowUpRight, BarChart3, Timer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createPageUrl } from '@/utils';
import Sidebar from '@/components/admin/Sidebar';
import StatCard from '@/components/admin/StatCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

export default function AdminDashboard() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

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

    const { data: reservations = [] } = useQuery({
        queryKey: ['all-reservations'],
        queryFn: () => base44.entities.Reservation.list('-created_date', 500),
        enabled: !!user
    });

    const { data: waitlist = [] } = useQuery({
        queryKey: ['waitlist'],
        queryFn: () => base44.entities.Waitlist.filter({ status: 'waiting' }),
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

    // Calculate stats
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const paidReservations = reservations.filter(r => r.status === 'paid' || r.status === 'completed');
    const monthReservations = paidReservations.filter(r => {
        const date = parseISO(r.date);
        return date >= monthStart && date <= monthEnd;
    });
    const weekReservations = paidReservations.filter(r => {
        const date = parseISO(r.date);
        return date >= weekStart && date <= weekEnd;
    });
    const todayReservations = paidReservations.filter(r => isToday(parseISO(r.date)));

    const monthRevenue = monthReservations.reduce((sum, r) => sum + (r.amount || 0), 0);
    const weekRevenue = weekReservations.reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalHours = monthReservations.reduce((sum, r) => sum + (r.duration || 60) / 60, 0);

    const pendingPayments = reservations.filter(r =>
        r.status === 'pending_payment' || r.status === 'pending_manual_payment'
    ).length;

    // Chart data - Revenue by day
    const revenueByDay = monthReservations.reduce((acc, r) => {
        const day = format(parseISO(r.date), 'dd/MM');
        acc[day] = (acc[day] || 0) + (r.amount || 0);
        return acc;
    }, {});

    const revenueChartData = Object.entries(revenueByDay)
        .slice(-14)
        .map(([date, revenue]) => ({ date, revenue }));

    // Reservations by hour
    const reservationsByHour = paidReservations.reduce((acc, r) => {
        const hour = r.start_time?.split(':')[0] || '00';
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
    }, {});

    const hourChartData = Object.entries(reservationsByHour)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([hour, count]) => ({ hour: `${hour}:00`, count }));

    // Status distribution
    const statusCounts = reservations.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
    }, {});

    const statusChartData = [
        { name: 'Pagados', value: statusCounts.paid || 0, color: '#10B981' },
        { name: 'Pendientes', value: (statusCounts.pending_payment || 0) + (statusCounts.pending_manual_payment || 0), color: '#F59E0B' },
        { name: 'Cancelados', value: statusCounts.cancelled || 0, color: '#EF4444' },
        { name: 'Completados', value: statusCounts.completed || 0, color: '#3B82F6' }
    ];

    return (
        <div className="flex min-h-screen bg-slate-100">
            <Sidebar currentPage="AdminDashboard" onLogout={handleLogout} />

            <main className="flex-1 p-8 overflow-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-gray-500">Vista general del negocio</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Ingresos del mes"
                        value={`$${monthRevenue.toLocaleString()}`}
                        icon={DollarSign}
                        color="green"
                        trend="up"
                        trendValue="+12% vs mes anterior"
                    />
                    <StatCard
                        title="Reservas del mes"
                        value={monthReservations.length}
                        subtitle={`${weekReservations.length} esta semana`}
                        icon={Calendar}
                        color="blue"
                    />
                    <StatCard
                        title="Horas ocupadas"
                        value={`${totalHours.toFixed(0)}h`}
                        subtitle="Este mes"
                        icon={Timer}
                        color="purple"
                    />
                    <StatCard
                        title="Turnos hoy"
                        value={todayReservations.length}
                        icon={Clock}
                        color="orange"
                    />
                </div>

                {/* Second row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        title="Lista de espera"
                        value={waitlist.length}
                        subtitle="Personas esperando"
                        icon={Users}
                        color="cyan"
                    />
                    <StatCard
                        title="Pagos pendientes"
                        value={pendingPayments}
                        subtitle="Requieren confirmación"
                        icon={AlertCircle}
                        color="pink"
                    />
                    <StatCard
                        title="Ingresos semanales"
                        value={`$${weekRevenue.toLocaleString()}`}
                        icon={TrendingUp}
                        color="green"
                    />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Revenue Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5" />
                                Ingresos (últimos 14 días)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueChartData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="date" fontSize={12} tickLine={false} />
                                        <YAxis fontSize={12} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                                        <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Ingresos']} />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#3B82F6"
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Reservations by Hour */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Demanda por horario
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={hourChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="hour" fontSize={12} tickLine={false} />
                                        <YAxis fontSize={12} tickLine={false} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Status distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Estado de reservas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={70}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {statusChartData.map((entry, index) => (
                                                <Cell key={index} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap justify-center gap-4 mt-4">
                                {statusChartData.map((entry) => (
                                    <div key={entry.name} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                                        <span className="text-sm text-gray-600">{entry.name}: {entry.value}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Últimas reservas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {reservations.slice(0, 5).map((res) => (
                                    <div key={res.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <span className="text-blue-600 font-medium">
                                                    {res.user_name?.charAt(0) || res.user_email?.charAt(0)?.toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{res.user_name || res.user_email}</p>
                                                <p className="text-sm text-gray-500">
                                                    {format(parseISO(res.date), "d MMM", { locale: es })} • {res.start_time}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-800">${res.amount?.toLocaleString()}</p>
                                            <p className={`text-xs ${res.status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                                                {res.status === 'paid' ? 'Pagado' : 'Pendiente'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}