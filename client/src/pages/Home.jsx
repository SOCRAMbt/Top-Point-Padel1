import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, MapPin, Phone, Star, TrendingUp, Calendar, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function Home() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <LoadingSpinner size="lg" text="Cargando..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-lime-500 selection:text-slate-900">
            {/* Navbar */}
            <nav className="absolute top-0 w-full z-50 border-b border-white/10 bg-slate-900/50 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    {/* Logo Area */}
                    <div className="flex items-center gap-3">
                        <img src="/logo.jpg" alt="TPP Logo" className="w-12 h-12 rounded-full border border-white/10" />
                        <div className="leading-tight">
                            <h1 className="font-bold text-lg tracking-tight">Ataja La Vaca</h1>
                            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Top Point Pádel</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <Link to="/profile">
                                    <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">
                                        Mi Perfil
                                    </Button>
                                </Link>
                                {user.role === 'admin' && (
                                    <Link to="/admin">
                                        <Button className="bg-white text-slate-900 hover:bg-slate-200 font-semibold">
                                            Admin
                                        </Button>
                                    </Link>
                                )}
                            </>
                        ) : (
                            <Link to="/login">
                                <Button className="bg-white text-slate-900 hover:bg-slate-200 font-semibold px-6">
                                    Iniciar Sesión
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Background Glows */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-lime-500/20 rounded-full blur-[120px] -z-10 opacity-30 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

                <div className="max-w-4xl mx-auto px-6 text-center">
                    {/* Main Logo/Badge */}
                    <div className="inline-flex items-center justify-center w-32 h-32 mb-8 rounded-full bg-slate-900 border-4 border-lime-500/20 shadow-[0_0_40px_rgba(132,204,22,0.3)] relative group overflow-hidden">
                        <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
                        Reservá tu cancha <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-green-500">
                            en Top Point Pádel
                        </span>
                    </h1>

                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Elegí el horario que quieras, pagá online y listo.
                        <br className="hidden md:block" /> Sin llamadas, sin esperas. Jugá cuando quieras.
                    </p>

                    {/* Meta Info */}
                    <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-12 text-sm font-medium text-slate-300">
                        <div className="flex items-center gap-2 bg-white/5 py-2 px-4 rounded-full border border-white/5">
                            <Clock className="w-4 h-4 text-lime-400" />
                            <span>8:00 - 22:00 hs</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 py-2 px-4 rounded-full border border-white/5">
                            <MapPin className="w-4 h-4 text-lime-400" />
                            <span>Ataja la Vaca</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 py-2 px-4 rounded-full border border-white/5">
                            <Star className="w-4 h-4 text-lime-400" />
                            <span>Cancha Premium</span>
                        </div>
                    </div>

                    {/* CTA Button */}
                    {!user && (
                        <div className="animate-fade-in-up">
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-lime-400 to-green-500 hover:from-lime-500 hover:to-green-600 text-slate-900 font-bold border-0 shadow-[0_0_20px_rgba(132,204,22,0.5)] transition-all hover:scale-105"
                                onClick={() => navigate('/booking')}
                            >
                                RESERVAR AHORA
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                            <p className="mt-4 text-sm text-slate-500">
                                ¿Ya tenés cuenta? <Link to="/login" className="text-lime-400 hover:underline">Iniciá sesión</Link>
                            </p>
                        </div>
                    )}
                </div>
            </header>

            {/* Feature Cards Section */}
            {!user && (
                <section className="py-20 bg-slate-800/50 border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Card 1 */}
                            <div className="group p-8 rounded-3xl bg-slate-900 border border-white/5 hover:border-lime-500/30 transition-all hover:bg-slate-800/80">
                                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Clock className="w-7 h-7 text-blue-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-white">Turnos Flexibles</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Turnos de 60 o 90 minutos. Organiza tu partido con la duración que necesites sin complicaciones.
                                </p>
                            </div>

                            {/* Card 2 */}
                            <div className="group p-8 rounded-3xl bg-slate-900 border border-white/5 hover:border-lime-500/30 transition-all hover:bg-slate-800/80">
                                <div className="w-14 h-14 rounded-2xl bg-lime-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <TrendingUp className="w-7 h-7 text-lime-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-white">Reserva Instantánea</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Confirmación inmediata. Tu cancha queda asegurada al momento de realizar el pago.
                                </p>
                            </div>

                            {/* Card 3 */}
                            <div className="group p-8 rounded-3xl bg-slate-900 border border-white/5 hover:border-lime-500/30 transition-all hover:bg-slate-800/80">
                                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Phone className="w-7 h-7 text-purple-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-white">Soporte Directo</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    ¿Dudas? Nuestro equipo está disponible en Ataja la Vaca para ayudarte.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Calendar Teaser (for Logged In Users) */}
            {user && (
                <section className="max-w-7xl mx-auto px-6 pb-20">
                    <div className="bg-slate-800 rounded-3xl p-8 md:p-12 border border-white/5 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                        <Calendar className="w-16 h-16 text-lime-400 mx-auto mb-6 opacity-80" />
                        <h2 className="text-3xl font-bold mb-4">¿Listo para jugar?</h2>
                        <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                            Reservá tu turno ahora mismo en simples pasos.
                        </p>

                        <div className="flex justify-center gap-4">
                            <Button
                                size="lg"
                                className="bg-lime-500 hover:bg-lime-400 text-slate-900 font-bold"
                                onClick={() => navigate('/booking')}
                            >
                                <Calendar className="w-5 h-5 mr-2" />
                                Reservar Cancha
                            </Button>
                        </div>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 bg-slate-950">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity">
                        <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-full" />
                        <span className="font-bold">Ataja La Vaca</span>
                    </div>
                    <p className="text-slate-500 text-sm">
                        © 2024 Ataja la Vaca - Top Point Pádel.
                    </p>
                </div>
            </footer>
        </div>
    );
}
