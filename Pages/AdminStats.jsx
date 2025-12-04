import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, differenceInDays, eachDayOfInterval, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    BarChart3, TrendingUp, Users, Clock, DollarSign, Calendar,
    Target, AlertTriangle, Timer, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { createPageUrl } from '@/utils';
import Sidebar from '@/components/admin/Sidebar';
import StatCard from '@/components/admin/StatCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function AdminStats() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [period, setPeriod] = useState('month');

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
        queryKey: ['stats-reservations'],
        queryFn: () => base44.entities.Reservation.list('-created_date', 1000),
        enabled: !!user
    });

    const { data: waitlist = [] } = useQuery({
        queryKey: ['stats-waitlist'],
        queryFn: () => base44.entities.Waitlist.list('-created_date', 500),
        enabled: !!user
    });

    const handleLogout = () => {
        base44.auth.logout(createPageUrl('Home'));
    };

    const stats = useMemo(() => {
        if (!reservations.length) return null;

        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));

        const paidReservations = reservations.filter(r => r.status === 'paid' || r.status === 'completed');
        const thisMonth = paidReservations.filter(r => {
            const date = parseISO(r.date);
            return date >= monthStart && date <= monthEnd;
        });
        const lastMonth = paidReservations.filter(r => {
            const date = parseISO(r.date);
            return date >= lastMonthStart && date <= lastMonthEnd;
        });

        // Revenue
        const thisMonthRevenue = thisMonth.reduce((sum, r) => sum + (r.amount || 0), 0);
        const lastMonthRevenue = lastMonth.reduce((sum, r) => sum + (r.amount || 0), 0);
        const revenueGrowth = lastMonthRevenue > 0
            ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
            : 0;

        // Hours
        const totalHours = thisMonth.reduce((sum, r) => sum + (r.duration || 60) / 60, 0);

        // Unique users
        const uniqueUsers = new Set(paidReservations.map(r => r.user_email)).size;

        // Cancellation rate
        const cancelled = reservations.filter(r => r.status === 'cancelled').length;
        const cancellationRate = reservations.length > 0
            ? ((cancelled / reservations.length) * 100).toFixed(1)
            : 0;

        // Occupancy by hour
        const byHour = {};
        for (let h = 8; h < 22; h++) {
            byHour[h] = { hour: `${h}:00`, count: 0, revenue: 0 };
        }
        paidReservations.forEach(r => {
            const hour = parseInt(r.start_time?.split(':')[0] || '0');
            if (byHour[hour]) {
                byHour[hour].count++;
                byHour[hour].revenue += r.amount || 0;
            }
        });
        const occupancyByHour = Object.values(byHour);

        // Occupancy by day of week
        const byDay = DAYS.map((day, i) => ({ day, count: 0, revenue: 0 }));
        paidReservations.forEach(r => {
            const dayIndex = getDay(parseISO(r.date));
            byDay[dayIndex].count++;
            byDay[dayIndex].revenue += r.amount || 0;
        });

        // Revenue by day (last 30 days)
        const last30Days = eachDayOfInterval({
            start: subMonths(now, 1),
            end: now
        });
        const revenueByDay = last30Days.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayRevenue = paidReservations
                .filter(r => r.date === dateStr)
                .reduce((sum, r) => sum + (r.amount || 0), 0);
            return {
                date: format(date, 'd/M'),
                revenue: dayRevenue
            };
        });

        // Top customers
        const customerSpend = {};
        paidReservations.forEach(r => {
            const email = r.user_email;
            if (!customerSpend[email]) {
                customerSpend[email] = { email, name: r.user_name || email, count: 0, total: 0, hours: 0 };
            }
            customerSpend[email].count++;
            customerSpend[email].total += r.amount || 0;
            customerSpend[email].hours += (r.duration || 60) / 60;
        });
        const topCustomers = Object.values(customerSpend)
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        // Booking lead time (how far in advance people book)
        const leadTimes = paidReservations.map(r => {
            const bookingDate = parseISO(r.created_date);
            const reservationDate = parseISO(r.date);
            return differenceInDays(reservationDate, bookingDate);
        });
        const avgLeadTime = leadTimes.length > 0
            ? (leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length).toFixed(1)
            : 0;

        // Payment methods distribution
        const paymentMethods = reservations.reduce((acc, r) => {
            const method = r.payment_method || 'unknown';
            acc[method] = (acc[method] || 0) + 1;
            return acc;
        }, {});

        // Waitlist stats
        const waitlistByHour = {};
        waitlist.forEach(w => {
            const hour = w.start_time?.split(':')[0] || '00';
            waitlistByHour[hour] = (waitlistByHour[hour] || 0) + 1;
        });
        const avgWaitlistSize = waitlist.filter(w => w.status === 'waiting').length;
        const waitlistConversion = waitlist.length > 0
            ? ((waitlist.filter(w => w.status === 'converted').length / waitlist.length) * 100).toFixed(1)
            : 0;

        // ARPU (Average Revenue Per User)
        const arpu = uniqueUsers > 0 ? (thisMonthRevenue / uniqueUsers).toFixed(0) : 0;

        // Peak hours (hours that fill up fastest)
        const peakHours = occupancyByHour.sort((a, b) => b.count - a.count).slice(0, 3);

        return {
            thisMonthRevenue,
            revenueGrowth,
            totalHours,
            uniqueUsers,
            cancellationRate,
            occupancyByHour: Object.values(byHour),
            occupancyByDay: byDay,
            revenueByDay,
            topCustomers,
            avgLeadTime,
            paymentMethods,
            avgWaitlistSize,
            waitlistConversion,
            arpu,
            peakHours,
            thisMonthReservations: thisMonth.length
        };
    }, [reservations, waitlist]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <LoadingSpinner size="lg" text="Cargando..." />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-100">
            <Sidebar currentPage="AdminStats" onLogout={handleLogout} />

            <main className="flex-1 p-8 overflow-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Estadísticas Avanzadas</h1>
                        <p className="text-gray-500">Métricas para maximizar ventas y ocupación</p>
                    </div>
                </div>

                {loadingData || !stats ? (
                    <div className="flex justify-center py-20">
                        <LoadingSpinner text="Calculando estadísticas..." />
                    </div>
                ) : (
                    <Tabs defaultValue="demanda" className="space-y-6">
                        <TabsList className="bg-white p-1 shadow-sm">
                            <TabsTrigger value="demanda">Demanda y Ocupación</TabsTrigger>
                            <TabsTrigger value="ingresos">Precios e Ingresos</TabsTrigger>
                            <TabsTrigger value="usuarios">Comportamiento</TabsTrigger>
                            <TabsTrigger value="waitlist">Lista de Espera</TabsTrigger>
                        </TabsList>

                        {/* DEMANDA Y OCUPACIÓN */}
                        <TabsContent value="demanda" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <StatCard
                                    title="Reservas del mes"
                                    value={stats.thisMonthReservations}
                                    icon={Calendar}
                                    color="blue"
                                />
                                <StatCard
                                    title="Horas ocupadas"
                                    value={`${stats.totalHours.toFixed(0)}h`}
                                    icon={Timer}
                                    color="purple"
                                />
                                <StatCard
                                    title="Tasa de cancelación"
                                    value={`${stats.cancellationRate}%`}
                                    icon={AlertTriangle}
                                    color="orange"
                                />
                                <StatCard
                                    title="Anticipo promedio"
                                    value={`${stats.avgLeadTime} días`}
                                    subtitle="Cuándo reservan"
                                    icon={Clock}
                                    color="cyan"
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Ocupación por hora */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Ocupación por franja horaria</CardTitle>
                                        <CardDescription>Cantidad de reservas por hora</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={stats.occupancyByHour}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis dataKey="hour" fontSize={12} />
                                                    <YAxis fontSize={12} />
                                                    <Tooltip />
                                                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Ocupación por día */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Ocupación por día de semana</CardTitle>
                                        <CardDescription>Demanda semanal</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={stats.occupancyByDay}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis dataKey="day" fontSize={12} />
                                                    <YAxis fontSize={12} />
                                                    <Tooltip />
                                                    <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Peak Hours */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="w-5 h-5" />
                                        Horarios pico
                                    </CardTitle>
                                    <CardDescription>Franjas que se llenan más rápido</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-4">
                                        {stats.peakHours.map((slot, i) => (
                                            <div key={slot.hour} className="flex-1 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl text-center">
                                                <p className="text-2xl font-bold text-blue-600">{slot.hour}</p>
                                                <p className="text-sm text-gray-500">{slot.count} reservas</p>
                                                <p className="text-xs text-gray-400 mt-1">#{i + 1} más popular</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* PRECIOS E INGRESOS */}
                        <TabsContent value="ingresos" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <StatCard
                                    title="Ingresos del mes"
                                    value={`$${stats.thisMonthRevenue.toLocaleString()}`}
                                    icon={DollarSign}
                                    color="green"
                                    trend={Number(stats.revenueGrowth) >= 0 ? 'up' : 'down'}
                                    trendValue={`${stats.revenueGrowth}% vs mes anterior`}
                                />
                                <StatCard
                                    title="ARPU"
                                    value={`$${stats.arpu}`}
                                    subtitle="Ingreso por usuario"
                                    icon={Users}
                                    color="purple"
                                />
                                <StatCard
                                    title="Clientes únicos"
                                    value={stats.uniqueUsers}
                                    icon={Users}
                                    color="blue"
                                />
                                <StatCard
                                    title="Ticket promedio"
                                    value={`$${stats.thisMonthReservations > 0 ? Math.round(stats.thisMonthRevenue / stats.thisMonthReservations) : 0}`}
                                    icon={DollarSign}
                                    color="cyan"
                                />
                            </div>

                            {/* Revenue trend */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Tendencia de ingresos (30 días)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={stats.revenueByDay}>
                                                <defs>
                                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="date" fontSize={10} />
                                                <YAxis fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                                                <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Ingresos']} />
                                                <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="url(#colorRevenue)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Revenue by hour */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Ingresos por franja horaria</CardTitle>
                                    <CardDescription>Dónde se genera más valor</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={stats.occupancyByHour}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="hour" fontSize={12} />
                                                <YAxis fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                                                <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Ingresos']} />
                                                <Bar dataKey="revenue" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* COMPORTAMIENTO */}
                        <TabsContent value="usuarios" className="space-y-6">
                            {/* Top customers */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="w-5 h-5" />
                                        Clientes más frecuentes (CLV)
                                    </CardTitle>
                                    <CardDescription>Top 10 por valor total</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {stats.topCustomers.map((customer, i) => (
                                            <div key={customer.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-blue-400'
                                                        }`}>
                                                        {i + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{customer.name}</p>
                                                        <p className="text-sm text-gray-500">{customer.count} reservas • {customer.hours.toFixed(1)}h jugadas</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-green-600">${customer.total.toLocaleString()}</p>
                                                    <p className="text-xs text-gray-400">CLV total</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Payment methods */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Métodos de pago</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={Object.entries(stats.paymentMethods).map(([name, value]) => ({ name, value }))}
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={70}
                                                    dataKey="value"
                                                    label={({ name, value }) => `${name}: ${value}`}
                                                >
                                                    {Object.keys(stats.paymentMethods).map((_, index) => (
                                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* LISTA DE ESPERA */}
                        <TabsContent value="waitlist" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <StatCard
                                    title="En lista de espera"
                                    value={stats.avgWaitlistSize}
                                    subtitle="Personas esperando"
                                    icon={Clock}
                                    color="purple"
                                />
                                <StatCard
                                    title="Conversión de waitlist"
                                    value={`${stats.waitlistConversion}%`}
                                    subtitle="Logran reservar"
                                    icon={TrendingUp}
                                    color="green"
                                />
                                <StatCard
                                    title="Demanda oculta"
                                    value={waitlist.length}
                                    subtitle="Total histórico"
                                    icon={Activity}
                                    color="orange"
                                />
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Demanda insatisfecha</CardTitle>
                                    <CardDescription>
                                        Estos datos revelan oportunidades de crecimiento:
                                        horarios con alta demanda que podrían justificar precios premium o expansión de capacidad.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                        <p className="text-amber-800">
                                            <strong>Insight:</strong> Si la lista de espera es consistentemente alta para ciertos horarios,
                                            considerá subir el precio un 10-15% en esos slots o agregar disponibilidad adicional.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                )}
            </main>
        </div>
    );
}