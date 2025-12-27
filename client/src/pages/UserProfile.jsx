import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { api } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Calendar, History, Trophy, LogOut, Home } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function UserProfile() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['me'],
        queryFn: () => api.get('/auth/me').then(res => res.data)
    });

    const { data: reservations = [] } = useQuery({
        queryKey: ['my-reservations'],
        queryFn: () => api.get('/reservations').then(res => res.data)
    });

    // Calendar Sync Mutation
    const connectCalendarMutation = useMutation({
        mutationFn: () => api.get('/auth/calendar/connect').then(res => res.data),
        onSuccess: (data) => {
            // Redirect to Google OAuth URL
            window.location.href = data.url;
        }
    });

    // Handle code from URL if redirected back with code (fallback)
    const [searchParams] = useSearchParams();
    const calendarCode = searchParams.get('calendar_code');

    React.useEffect(() => {
        if (calendarCode) {
            // Backend redirect lost session cookie, but Frontend has session -> Manual Sync
            api.post('/auth/calendar/sync', { code: calendarCode })
                .then(() => {
                    // Refetch user to update switch state
                    queryClient.invalidateQueries(['me']);
                    // Clean URL
                    navigate('/profile', { replace: true });
                })
                .catch(err => console.error(err));
        }
    }, [calendarCode, navigate, queryClient]);

    return (
        <div className="min-h-screen bg-slate-950 p-4 pb-20 text-white">
            <div className="max-w-md mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Mi Perfil</h1>
                        <p className="text-slate-400">{user?.full_name || 'Jugador'}</p>
                    </div>
                    {user?.picture && (
                        <img src={user.picture} alt="Profile" className="w-12 h-12 rounded-full border-2 border-lime-500" />
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <Trophy className="w-8 h-8 text-lime-500 mb-2" />
                            <span className="text-2xl font-bold text-white">{reservations.length}</span>
                            <span className="text-xs text-slate-400">Partidos jugados</span>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <History className="w-8 h-8 text-blue-500 mb-2" />
                            <span className="text-2xl font-bold text-white">
                                {reservations.reduce((acc, r) => acc + (r.duration || 60), 0) / 60}h
                            </span>
                            <span className="text-xs text-slate-400">Horas en cancha</span>
                        </CardContent>
                    </Card>
                </div>

                {/* Settings */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-lg text-white">Configuración</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-800 rounded-full">
                                    <Calendar className="w-5 h-5 text-orange-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-white">Google Calendar</p>
                                    <p className="text-xs text-slate-400">Sincronizar reservas</p>
                                </div>
                            </div>
                            <Switch
                                checked={user?.calendar_synced}
                                onCheckedChange={() => connectCalendarMutation.mutate()}
                                className="data-[state=checked]:bg-lime-500"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* History */}
                <div>
                    <h2 className="text-lg font-bold mb-3">Historial</h2>
                    <div className="space-y-3">
                        {reservations.slice(0, 5).map(res => (
                            <div key={res.id} className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-white">
                                        {format(parseISO(res.date), "EEEE d 'de' MMM", { locale: es })}
                                    </p>
                                    <p className="text-sm text-slate-400">
                                        {res.start_time} - {res.duration} min
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xs px-2 py-1 rounded-full ${res.status === 'paid' ? 'bg-lime-500/20 text-lime-400' : 'bg-orange-500/20 text-orange-400'
                                        }`}>
                                        {res.status === 'paid' ? 'Pagado' : 'Pendiente'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <Button variant="outline" className="w-full text-slate-900" onClick={() => navigate('/')}>
                        <Home className="w-4 h-4 mr-2" />
                        Volver al Inicio
                    </Button>

                    <Button variant="destructive" className="w-full" onClick={() => { logout(); navigate('/login'); }}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Cerrar Sesión
                    </Button>
                </div>
            </div>
        </div>
    );
}
