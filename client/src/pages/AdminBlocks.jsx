import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../services/mockBase44';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Trash2, Calendar, Clock, Ban, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { createPageUrl } from '@/utils';
import Sidebar from '@/features/admin/Sidebar';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

const daysOfWeek = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' }
];

export default function AdminBlocks() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '08:00',
        end_time: '22:00',
        is_full_day: true,
        reason: '',
        recurring: false,
        recurring_day: 1
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

    const { data: blocks = [], isLoading: loadingData } = useQuery({
        queryKey: ['admin-blocks'],
        queryFn: () => base44.entities.Block.list('-created_date'),
        enabled: !!user
    });

    const createBlock = useMutation({
        mutationFn: (data) => base44.entities.Block.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-blocks'] });
            setShowForm(false);
            resetForm();
        }
    });

    const deleteBlock = useMutation({
        mutationFn: (id) => base44.entities.Block.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-blocks'] });
        }
    });

    const handleLogout = () => {
        base44.auth.logout(createPageUrl('Home'));
    };

    const resetForm = () => {
        setFormData({
            date: format(new Date(), 'yyyy-MM-dd'),
            start_time: '08:00',
            end_time: '22:00',
            is_full_day: true,
            reason: '',
            recurring: false,
            recurring_day: 1
        });
    };

    const handleSubmit = async () => {
        await createBlock.mutateAsync(formData);

        // Log action
        await base44.entities.AuditLog.create({
            action: 'block_created',
            entity_type: 'Block',
            user_email: user.email,
            details: JSON.stringify(formData)
        });
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
            <Sidebar currentPage="AdminBlocks" onLogout={handleLogout} />

            <main className="flex-1 p-8 overflow-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Bloqueos</h1>
                        <p className="text-gray-500">Gestiona horarios no disponibles</p>
                    </div>
                    <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo bloqueo
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Bloqueos activos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loadingData ? (
                            <LoadingSpinner />
                        ) : blocks.length === 0 ? (
                            <EmptyState
                                icon={Ban}
                                title="No hay bloqueos"
                                description="Los bloqueos impiden que se reserven ciertos horarios"
                            />
                        ) : (
                            <div className="space-y-3">
                                {blocks.map((block) => (
                                    <div
                                        key={block.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                                {block.recurring ? (
                                                    <RefreshCw className="w-5 h-5 text-red-600" />
                                                ) : (
                                                    <Ban className="w-5 h-5 text-red-600" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-gray-800">
                                                        {block.recurring
                                                            ? `Todos los ${daysOfWeek.find(d => d.value === block.recurring_day)?.label}`
                                                            : format(parseISO(block.date), "EEEE d 'de' MMMM", { locale: es })
                                                        }
                                                    </p>
                                                    {block.recurring && (
                                                        <Badge variant="outline" className="text-xs">Recurrente</Badge>
                                                    )}
                                                    {block.is_full_day && (
                                                        <Badge className="bg-red-100 text-red-700 text-xs">Día completo</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    {block.is_full_day ? 'Todo el día' : `${block.start_time} - ${block.end_time}`}
                                                    {block.reason && ` • ${block.reason}`}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteBlock.mutate(block.id)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* New Block Dialog */}
                <Dialog open={showForm} onOpenChange={setShowForm}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nuevo bloqueo</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Bloqueo recurrente</Label>
                                <Switch
                                    checked={formData.recurring}
                                    onCheckedChange={(checked) => setFormData({ ...formData, recurring: checked })}
                                />
                            </div>

                            {formData.recurring ? (
                                <div className="space-y-2">
                                    <Label>Día de la semana</Label>
                                    <Select
                                        value={String(formData.recurring_day)}
                                        onValueChange={(value) => setFormData({ ...formData, recurring_day: Number(value) })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {daysOfWeek.map((day) => (
                                                <SelectItem key={day.value} value={String(day.value)}>
                                                    {day.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label>Fecha</Label>
                                    <Input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <Label>Día completo</Label>
                                <Switch
                                    checked={formData.is_full_day}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_full_day: checked })}
                                />
                            </div>

                            {!formData.is_full_day && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Hora inicio</Label>
                                        <Input
                                            type="time"
                                            value={formData.start_time}
                                            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Hora fin</Label>
                                        <Input
                                            type="time"
                                            value={formData.end_time}
                                            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Motivo (opcional)</Label>
                                <Textarea
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    placeholder="Ej: Mantenimiento, feriado, etc."
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowForm(false)}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={createBlock.isPending}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {createBlock.isPending ? 'Creando...' : 'Crear bloqueo'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
}
