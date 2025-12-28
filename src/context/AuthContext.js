'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import api from '@/services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = Cookies.get('accessToken');
        if (token) {
            try {
                const response = await api.get('/auth/me');
                setUser(response.data.data.user);
            } catch (error) {
                Cookies.remove('accessToken');
                Cookies.remove('refreshToken');
            }
        }
        setLoading(false);
    };

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { user, accessToken, refreshToken } = response.data.data;

        Cookies.set('accessToken', accessToken, { expires: 7 });
        Cookies.set('refreshToken', refreshToken, { expires: 30 });
        setUser(user);

        return user;
    };

    const register = async (name, email, password) => {
        const response = await api.post('/auth/register', { name, email, password });
        const { user, accessToken, refreshToken } = response.data.data;

        Cookies.set('accessToken', accessToken, { expires: 7 });
        Cookies.set('refreshToken', refreshToken, { expires: 30 });
        setUser(user);

        return user;
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        }
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        setUser,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
