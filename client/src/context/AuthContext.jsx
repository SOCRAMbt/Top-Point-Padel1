import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '@/services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const { data } = await api.get('/auth/me');
            setUser(data || null);
        } catch (err) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const loginWithToken = async (token) => {
        if (token) {
            localStorage.setItem('token', token);
        }
        await checkUser();
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setUser(null);
            localStorage.removeItem('token');
            // Hard redirect to clear client state
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, checkUser, logout, loginWithToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
