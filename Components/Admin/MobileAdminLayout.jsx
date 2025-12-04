import React, { useState } from 'react';
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
    Menu,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const menuItems = [
    { name: 'Dashboard', icon: BarChart3, page: 'AdminDashboard' },
    { name: 'Calendario', icon: Calendar, page: 'AdminCalendar' },
    { name: 'Reservas', icon: Clock, page: 'AdminReservations' },
    { name: 'Usuarios', icon: Users, page: 'AdminUsers' },
    { name: 'Bloqueos', icon: Ban, page: 'AdminBlocks' },
    { name: 'Espera', icon: ListOrdered, page: 'AdminWaitlist' },
    { name: 'Pagos', icon: CreditCard, page: 'AdminPayments' },
    { name: 'Stats', icon: BarChart3, page: 'AdminStats' },
    { name: 'Config', icon: Settings, page: 'AdminSettings' },
];

export default function MobileAdminLayout({ children, currentPage, onLogout, title, subtitle }) {
    const [isOpen, setIsOpen] = useState(false);

    const currentItem = menuItems.find(item => item.page === currentPage);

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Mobile Header */}
            <header className="lg:hidden sticky top-0 z-50 bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
                                <Menu className="w-5 h-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-72 p-0 bg-slate-900 border-slate-700">
                            <div className="flex flex-col h-full">
                                {/* Logo */}
                                <div className="p-4 border-b border-slate-700">
                                    <Link to={createPageUrl('Home')} className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
                                        <img
                                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e37bebe20ccc53d68bf1c/7b8e3357f_ImagendeWhatsApp2025-12-02alas192411_c45f4cfe.jpg"
                                            alt="TPP Logo"
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div>
                                            <h1 className="font-bold text-lg text-white">TPP</h1>
                                            <p className="text-xs text-slate-400">Panel Admin</p>
                                        </div>
                                    </Link>
                                </div>

                                {/* Navigation */}
                                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                                    {menuItems.map((item) => {
                                        const isActive = currentPage === item.page;
                                        return (
                                            <Link
                                                key={item.page}
                                                to={createPageUrl(item.page)}
                                                onClick={() => setIsOpen(false)}
                                                className={cn(
                                                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                                                    isActive
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                                )}
                                            >
                                                <item.icon className="w-5 h-5" />
                                                <span className="font-medium">{item.name}</span>
                                            </Link>
                                        );
                                    })}
                                </nav>

                                {/* Footer */}
                                <div className="p-3 border-t border-slate-700 space-y-1">
                                    <Link to={createPageUrl('Home')} onClick={() => setIsOpen(false)}>
                                        <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800">
                                            <Home className="w-5 h-5 mr-3" />
                                            Ir al sitio
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setIsOpen(false);
                                            onLogout();
                                        }}
                                        className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-slate-800"
                                    >
                                        <LogOut className="w-5 h-5 mr-3" />
                                        Cerrar sesión
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                    <div>
                        <h1 className="font-semibold text-sm">{title || currentItem?.name}</h1>
                        {subtitle && <p className="text-[10px] text-slate-400">{subtitle}</p>}
                    </div>
                </div>
                <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e37bebe20ccc53d68bf1c/7b8e3357f_ImagendeWhatsApp2025-12-02alas192411_c45f4cfe.jpg"
                    alt="TPP"
                    className="w-8 h-8 rounded-full object-cover"
                />
            </header>

            {/* Desktop Layout */}
            <div className="hidden lg:flex min-h-screen">
                {/* Desktop Sidebar */}
                <div className="flex flex-col h-screen sticky top-0 bg-slate-900 text-white w-64">
                    <div className="p-6">
                        <Link to={createPageUrl('Home')} className="flex items-center gap-3">
                            <img
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

                    <div className="h-px bg-slate-700" />

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

                    <div className="h-px bg-slate-700" />

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

                {/* Desktop Main Content */}
                <main className="flex-1 p-8 overflow-auto">
                    {title && (
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
                            {subtitle && <p className="text-gray-500">{subtitle}</p>}
                        </div>
                    )}
                    {children}
                </main>
            </div>

            {/* Mobile Main Content */}
            <main className="lg:hidden p-4 pb-20">
                {children}
            </main>
        </div>
    );
}