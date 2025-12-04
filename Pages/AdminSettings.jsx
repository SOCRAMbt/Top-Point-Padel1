import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Save, DollarSign, Building2, Clock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { createPageUrl } from '@/utils';
import Sidebar from '@/components/admin/Sidebar';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function AdminSettings() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [localSettings, setLocalSettings] = useState({
        price_per_hour: '5000',
        bank_alias: 'cancha.padel',
        start_hour: '8',
        end_hour: '22',
        admin_email: '',
        business_name: 'Padel Pro'
    });
    const queryClient = useQueryClient();

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

    const { data: settings = [], isLoading: loadingSettings } = useQuery({
        queryKey: ['settings'],
        queryFn: () => base44.entities.Settings.list(),
        enabled: !!user
    });

    useEffect(() => {
        if (settings.length > 0) {
            const settingsMap = settings.reduce((acc, s) => {
                acc[s.key] = s.value;
                return acc;
            }, {});
            setLocalSettings(prev => ({ ...prev, ...settingsMap }));
        }
    }, [settings]);

    const handleLogout = () => {
        base44.auth.logout(createPageUrl('Home'));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            for (const [key, value] of Object.entries(localSettings)) {
                const existing = settings.find(s => s.key === key);
                if (existing) {
                    await base44.entities.Settings.update(existing.id, { value: String(value) });
                } else {
                    await base44.entities.Settings.create({ key, value: String(value) });
                }
            }

            // Log action
            await base44.entities.AuditLog.create({
                action: 'settings_updated',
                entity_type: 'Settings',
                user_email: user.email,
                details: JSON.stringify(localSettings)
            });

            queryClient.invalidateQueries({ queryKey: ['settings'] });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <LoadingSpinner size="lg" text="Cargando..." />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-100">
            <Sidebar currentPage="AdminSettings" onLogout={handleLogout} />

            <main className="flex-1 p-8 overflow-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
                        <p className="text-gray-500">Ajustes generales del sistema</p>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                </div>

                <div className="grid gap-6 max-w-3xl">
                    {/* Business Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="w-5 h-5" />
                                Información del negocio
                            </CardTitle>
                            <CardDescription>
                                Datos básicos de tu establecimiento
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nombre del negocio</Label>
                                <Input
                                    value={localSettings.business_name}
                                    onChange={(e) => setLocalSettings({ ...localSettings, business_name: e.target.value })}
                                    placeholder="Ej: Padel Pro"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email de administración</Label>
                                <Input
                                    type="email"
                                    value={localSettings.admin_email}
                                    onChange={(e) => setLocalSettings({ ...localSettings, admin_email: e.target.value })}
                                    placeholder="admin@tucancha.com"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5" />
                                Precios
                            </CardTitle>
                            <CardDescription>
                                Configura los precios por hora de la cancha
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Precio por hora (ARS)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                    <Input
                                        type="number"
                                        value={localSettings.price_per_hour}
                                        onChange={(e) => setLocalSettings({ ...localSettings, price_per_hour: e.target.value })}
                                        className="pl-8"
                                    />
                                </div>
                                <p className="text-sm text-gray-500">
                                    Este precio se aplicará a las nuevas reservas. Las reservas existentes mantienen su precio original.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="w-5 h-5" />
                                Pagos
                            </CardTitle>
                            <CardDescription>
                                Configuración de métodos de pago
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Alias bancario</Label>
                                <Input
                                    value={localSettings.bank_alias}
                                    onChange={(e) => setLocalSettings({ ...localSettings, bank_alias: e.target.value })}
                                    placeholder="tu.alias.banco"
                                />
                                <p className="text-sm text-gray-500">
                                    Se mostrará a los usuarios que elijan pagar por transferencia
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Schedule */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Horarios
                            </CardTitle>
                            <CardDescription>
                                Define el horario de atención de la cancha
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Hora de apertura</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="23"
                                        value={localSettings.start_hour}
                                        onChange={(e) => setLocalSettings({ ...localSettings, start_hour: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Hora de cierre</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="23"
                                        value={localSettings.end_hour}
                                        onChange={(e) => setLocalSettings({ ...localSettings, end_hour: e.target.value })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}