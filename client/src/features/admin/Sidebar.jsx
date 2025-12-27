import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/utils/cn';
import {
    Calendar,
    Users,
    BarChart3,
    Settings,
    Clock,
    CreditCard,
    ListOrdered,
    LogOut,
    Home,
    Ban,
    FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const menuItems = [
    { name: 'Dashboard', icon: BarChart3, page: 'AdminDashboard' },
    { name: 'Calendario', icon: Calendar, page: 'AdminCalendar' },
    { name: 'Reservas', icon: Clock, page: 'AdminReservations' },
    { name: 'Usuarios', icon: Users, page: 'AdminUsers' },
    { name: 'Bloqueos', icon: Ban, page: 'AdminBlocks' },
    { name: 'Lista de Espera', icon: ListOrdered, page: 'AdminWaitlist' },
    { name: 'Pagos', icon: CreditCard, page: 'AdminPayments' },
    { name: 'Estadísticas', icon: BarChart3, page: 'AdminStats' },
    { name: 'Configuración', icon: Settings, page: 'AdminSettings' },
];

export default function Sidebar({ currentPage, onLogout }) {
    return (
        <div className="flex flex-col h-full bg-slate-900 text-white w-64">
            {/* Logo */}
            <div className="p-6">
                <Link to={createPageUrl('Home')} className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-400 to-green-600 flex items-center justify-center shadow-lg shadow-lime-500/20 group-hover:scale-110 transition-transform">
                        <span className="text-xl">🎾</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight">TPP</h1>
                        <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Panel Admin</p>
                    </div>
                </Link>
            </div>

            <Separator className="bg-slate-800" />

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = currentPage === item.page;
                    return (
                        <Link
                            key={item.page}
                            to={createPageUrl(item.page)}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                                isActive
                                    ? 'bg-gradient-to-r from-lime-500 to-green-600 text-slate-900 shadow-lg shadow-lime-500/25 font-bold'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            )}
                        >
                            <item.icon className={cn('w-5 h-5 transition-colors', isActive ? 'text-slate-900' : 'text-slate-500 group-hover:text-lime-400')} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <Separator className="bg-slate-700" />

            {/* Footer */}
            <div className="p-4 space-y-2">
                <Link to={createPageUrl('Home')}>
                    <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800">
                        <Home className="w-5 h-5 mr-3" />
                        Ir al sitio
                    </Button>
                </Link>
                <Button
                    variant="ghost"
                    onClick={onLogout}
                    className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-slate-800"
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    Cerrar sesión
                </Button>
            </div>
        </div>
    );
}
