import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import AuthSuccess from './pages/AuthSuccess';
import BookingWizard from './pages/BookingWizard';
import UserProfile from './pages/UserProfile';
import AdminCalendar from './pages/AdminCalendar';
import AdminReservations from './pages/AdminReservations';
import AdminUsers from './pages/AdminUsers';
import AdminBlocks from './pages/AdminBlocks';
import AdminWaitlist from './pages/AdminWaitlist';
import AdminPayments from './pages/AdminPayments';
import AdminStats from './pages/AdminStats';
import AdminSettings from './pages/AdminSettings';

import AdminDashboard from './pages/AdminDashboard';
import { useAuth } from './context/AuthContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            staleTime: 30000,
            refetchOnWindowFocus: false,
        },
    },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-950">
                <LoadingSpinner />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-950">
                <LoadingSpinner />
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default function App() {
    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/login/success" element={<AuthSuccess />} />
                        <Route path="/booking" element={<ProtectedRoute><BookingWizard /></ProtectedRoute>} />
                        <Route path="/booking/success" element={<ProtectedRoute><BookingWizard /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />

                        {/* Admin Routes */}
                        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                        <Route path="/admin/calendar" element={<AdminRoute><AdminCalendar /></AdminRoute>} />
                        <Route path="/admin/reservations" element={<AdminRoute><AdminReservations /></AdminRoute>} />
                        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                        <Route path="/admin/blocks" element={<AdminRoute><AdminBlocks /></AdminRoute>} />
                        <Route path="/admin/waitlist" element={<AdminRoute><AdminWaitlist /></AdminRoute>} />
                        <Route path="/admin/payments" element={<AdminRoute><AdminPayments /></AdminRoute>} />
                        <Route path="/admin/stats" element={<AdminRoute><AdminStats /></AdminRoute>} />
                        <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

                        {/* Catch all to redirect to home */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

