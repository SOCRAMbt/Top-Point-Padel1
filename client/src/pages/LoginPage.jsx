import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Phone, Loader2, ArrowLeft } from 'lucide-react';
import { api } from '@/services/api';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState('method');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (user) {
        navigate('/');
        return null;
    }

    const handleGoogleLogin = () => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';
        window.location.href = `${apiUrl}/auth/google`;
    };

    const requestOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (phone.length < 8) throw new Error('Número inválido');
            const res = await api.post('/auth/otp/send', { phone });
            // En desarrollo, mostrar el código (no existe SMS real)
            if (res.data.dev_code) {
                alert(`🔐 Código de verificación (modo desarrollo):\n\n${res.data.dev_code}\n\nEn producción, este código llegará por SMS.`);
            }
            setStep('otp_verify');
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/otp/verify', { phone, code: otp });
            // Guardar token para dual-auth
            if (res.data.token) {
                localStorage.setItem('auth_token', res.data.token);
            }
            window.location.href = '/';
        } catch (err) {
            setError('Código inválido. Intentá de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-lime-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10 animate-fade-in-up">
                {/* Back Button */}
                <div className="mb-6">
                    <Link to="/">
                        <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 pl-0 gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Volver al inicio
                        </Button>
                    </Link>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-lime-500/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(132,204,22,0.2)] overflow-hidden">
                            <img src="/logo.jpg" alt="TPP Logo" className="w-full h-full object-cover" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Bienvenido a Ataja La Vaca</h1>
                        <p className="text-slate-400">Iniciá sesión para reservar tu cancha</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center animate-shake">
                            {error}
                        </div>
                    )}

                    {step === 'method' && (
                        <div className="space-y-4">
                            <button
                                onClick={handleGoogleLogin}
                                className="w-full h-14 bg-white hover:bg-slate-50 text-slate-900 font-semibold rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-3 relative overflow-hidden"
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4" />
                                    <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853" />
                                    <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05" />
                                    <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335" />
                                </svg>
                                <span>Continuar con Google</span>
                            </button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-white/10" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-transparent px-2 text-slate-500 font-medium">O bien</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setStep('phone_input')}
                                className="w-full h-14 bg-slate-800/50 hover:bg-slate-800 border border-white/10 text-white font-medium rounded-xl transition-all hover:border-lime-500/30 flex items-center justify-center gap-3"
                            >
                                <Phone className="w-5 h-5 text-lime-400" />
                                <span>Usar celular</span>
                            </button>
                        </div>
                    )}

                    {step === 'phone_input' && (
                        <form onSubmit={requestOtp} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 ml-1">Número de celular</label>
                                <input
                                    type="tel"
                                    placeholder="Ej: 11 1234 5678"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full h-14 bg-slate-950/50 border border-white/10 text-white rounded-xl px-4 text-lg focus:outline-none focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/50 transition-all placeholder:text-slate-600"
                                    autoFocus
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 bg-lime-500 hover:bg-lime-400 text-slate-900 font-bold rounded-xl text-lg shadow-lg shadow-lime-500/20"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Enviar código'}
                            </Button>
                            <button
                                type="button"
                                onClick={() => setStep('method')}
                                className="w-full text-slate-500 hover:text-white text-sm transition-colors py-2"
                            >
                                Volver atrás
                            </button>
                        </form>
                    )}

                    {step === 'otp_verify' && (
                        <form onSubmit={verifyOtp} className="space-y-6">
                            <div className="text-center p-4 bg-slate-950/30 rounded-xl border border-white/5">
                                <p className="text-slate-400 text-sm mb-1">Código enviado a</p>
                                <p className="text-white font-mono text-lg">{phone}</p>
                            </div>

                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full h-16 bg-slate-950/50 border border-white/10 text-white rounded-xl text-center text-3xl tracking-[0.5em] font-mono focus:outline-none focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/50 transition-all placeholder:text-slate-700"
                                    maxLength={6}
                                    autoFocus
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 bg-lime-500 hover:bg-lime-400 text-slate-900 font-bold rounded-xl text-lg shadow-lg shadow-lime-500/20"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Verificar e Ingresar'}
                            </Button>

                            <button
                                type="button"
                                onClick={() => setStep('phone_input')}
                                className="w-full text-slate-500 hover:text-white text-sm transition-colors py-2"
                            >
                                Cambiar número
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
