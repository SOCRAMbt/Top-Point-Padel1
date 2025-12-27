import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '../services/mockBase44';
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
import Sidebar from '@/features/admin/Sidebar';
import StatCard from '@/features/admin/StatCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

// Padel Theme Palette
const COLORS = ['#84cc16', '#22c55e', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']; // Lime, Green, Amber...
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { useNavigate } from 'react-router-dom';

export default function AdminStats() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    const { data: statsData, isLoading: loadingData } = useQuery({
        queryKey: ['admin-stats-full'],
        queryFn: () => api.get('/stats').then(res => res.data),
        enabled: !!user && user.role === 'admin'
    });

    const handleLogout = () => {
        // ... logout logic via auth context or prop
    };

    const stats = useMemo(() => {
        if (!statsData) return null;
        // Map API response to Component required structure if needed, or use directly
        // The API now returns keys like `heatmap`, `revenueByHour`, etc.
        // We can just spread it, but let's ensure defaults.
        return {
            thisMonthRevenue: 0,
            revenueGrowth: 0,
            totalHours: 0,
            uniqueUsers: 0,
            cancellationRate: 0,
            occupancyByHour: [],
            occupancyByDay: [],
            revenueByDay: [],
            topCustomers: [],
            avgLeadTime: 0,
            paymentMethods: {},
            avgWaitlistSize: 0,
            waitlistConversion: 0,
            arpu: 0,
            peakHours: [],
            thisMonthReservations: 0,
            ...statsData // Override defaults
        };
    }, [statsData]);

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
                                    color="green"
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
                                                    <Bar dataKey="count" fill="#84cc16" radius={[4, 4, 0, 0]} />
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
                                                    <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
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
                                            <div key={slot.hour} className="flex-1 p-4 bg-gradient-to-br from-lime-50 to-green-50 rounded-xl text-center border border-lime-100">
                                                <p className="text-2xl font-bold text-lime-700">{slot.hour}</p>
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
                                                        <stop offset="5%" stopColor="#84cc16" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#84cc16" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="date" fontSize={10} />
                                                <YAxis fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                                                <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Ingresos']} />
                                                <Area type="monotone" dataKey="revenue" stroke="#84cc16" fill="url(#colorRevenue)" />
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
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-900 font-bold text-sm ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-gray-300' : i === 2 ? 'bg-orange-300' : 'bg-lime-300'
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
