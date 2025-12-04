import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
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
                <Link to={createPageUrl('Home')} className="flex items-center gap-3">
                    <img //ESTO HAY QUE CAMBIARLO
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e37bebe20ccc53d68bf1c/7b8e3357f_ImagendeWhatsApp2025-12-02alas192411_c45f4cfe.jpg"
                        alt="TPP Logo"
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                        <h1 className="font-bold text-lg">TPP</h1>
                        <p className="text-xs text-slate-400">Panel Admin</p>
                    </div>
                </Link>
            </div>

            <Separator className="bg-slate-700" />

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = currentPage === item.page;
                    return (
                        <Link
                            key={item.page}
                            to={createPageUrl(item.page)}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                                isActive
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            )}
                        >
                            <item.icon className={cn('w-5 h-5', isActive && 'text-blue-200')} />
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