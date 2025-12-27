import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        // Log to console in development
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // In production, you would send this to an error tracking service
        // like Sentry, LogRocket, etc.
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                    <div className="max-w-md w-full text-center">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-10 h-10 text-red-500" />
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-2">
                            ¡Ups! Algo salió mal
                        </h1>

                        <p className="text-slate-400 mb-8">
                            Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleReload}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-lime-500 hover:bg-lime-400 text-slate-900 font-bold rounded-xl transition-all"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Reintentar
                            </button>

                            <button
                                onClick={this.handleGoHome}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all border border-white/10"
                            >
                                <Home className="w-4 h-4" />
                                Ir al Inicio
                            </button>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mt-8 text-left bg-slate-900 p-4 rounded-xl border border-white/10">
                                <summary className="text-slate-400 cursor-pointer text-sm font-medium">
                                    Detalles del error (solo desarrollo)
                                </summary>
                                <pre className="mt-4 text-xs text-red-400 overflow-auto max-h-48">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
