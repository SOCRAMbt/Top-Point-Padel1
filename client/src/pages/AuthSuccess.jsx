import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthSuccess() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const { loginWithToken } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const performLogin = async () => {
            if (token) {
                try {
                    await loginWithToken(token);
                    // Short delay to ensure state propagates
                    setTimeout(() => navigate('/'), 500);
                } catch (error) {
                    console.error("Login failed", error);
                    navigate('/login');
                }
            } else {
                navigate('/login');
            }
        };
        performLogin();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
            <h2 className="text-xl font-semibold">Autenticando...</h2>
        </div>
    );
}
