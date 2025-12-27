import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Calendar, Clock, DollarSign, Users, TrendingUp, AlertCircle,
    BarChart3, Timer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createPageUrl } from '@/utils';
import Sidebar from '@/features/admin/Sidebar';
import StatCard from '@/features/admin/StatCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    const { data: statsData, isLoading: loadingStats } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: () => api.get('/stats').then(res => res.data),
        enabled: !!user && user.role === 'admin'
    });

    if (loading || loadingStats) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <LoadingSpinner size="lg" text="Cargando..." />
            </div>
        );
    }

    const handleLogout = () => {
        logout(); // From useAuth context
        navigate('/login');
    };

    if (isLoading || loadingStats) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <LoadingSpinner size="lg" text="Cargando..." />
            </div>
        );
    }

    // Default to 0 values/empty structures
    const stats = statsData || {};
    const {
        thisMonthRevenue = 0,
        totalHours = 0,
        heatmap = {},
        revenueByHour = {},
        reservations: recentReservations = [],
        topCustomers
    } = stats;

    const pendingPayments = recentReservations.filter(r =>
        r.status === 'pending_payment' || r.status === 'pending_manual_payment'
    ).length;

    // Adapt revenueByHour to chart format
    const revenueChartData = Object.entries(revenueByHour).map(([hour, amount]) => ({
        date: `${hour}:00`,
        revenue: amount
    })).sort((a, b) => parseInt(a.date) - parseInt(b.date));

    // Status distribution
    const statusCounts = recentReservations.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
    }, {});

    const statusChartData = [
        { name: 'Pagados', value: (statusCounts.paid || 0) + (statusCounts.confirmed || 0), color: '#10B981' }, // Confirmed is new Paid
        { name: 'Pendientes', value: (statusCounts.pending_payment || 0) + (statusCounts.pending_manual_payment || 0), color: '#F59E0B' },
        { name: 'Cancelados', value: statusCounts.cancelled || 0, color: '#EF4444' }
    ];

    const todayReservations = recentReservations.filter(r => isToday(parseISO(r.date || new Date().toISOString())));
    const hoursOccupied = totalHours || 0;
    const hourChartData = revenueChartData.map(d => ({ hour: d.date, count: Math.ceil(d.revenue / 20000) })); // Approx count

    // Revenue for week (mock calculation for now based on recent if API doesn't send specific)
    const weekRevenue = recentReservations
        .filter(r => isToday(parseISO(r.date))) // Just using today as placeholder for 'week' in rapid dev unless logic added
        .reduce((sum, r) => sum + Number(r.total_price || r.amount || 0), 0);

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
                        value={`$${thisMonthRevenue.toLocaleString()}`}
                        icon={DollarSign}
                        color="green"
                        trend="up"
                        trendValue="+12% vs mes anterior"
                    />
                    <StatCard
                        title="Reservas del mes"
                        value={recentReservations.length}
                        subtitle={`${todayReservations.length} hoy`}
                        icon={Calendar}
                        color="blue"
                    />
                    <StatCard
                        title="Horas ocupadas"
                        value={`${hoursOccupied.toFixed(0)}h`}
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
                        value={0} // Not fetched yet
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
                                                <stop offset="5%" stopColor="#84cc16" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#84cc16" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="date" fontSize={12} tickLine={false} />
                                        <YAxis fontSize={12} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                                        <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Ingresos']} />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#84cc16"
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
                                {recentReservations.slice(0, 5).map((res) => (
                                    <div key={res.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-lime-100 flex items-center justify-center">
                                                <span className="text-lime-700 font-medium">
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
