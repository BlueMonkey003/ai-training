import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, Notification } from '../../../shared/types';
import { authApi, notificationApi } from '../services/api';
import socketService from '../services/socket';
import toast from 'react-hot-toast';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    isAdmin: boolean;
    unreadNotifications: number;
    refreshNotifications: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth moet binnen AuthProvider gebruikt worden');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    useEffect(() => {
        let mounted = true;

        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token && mounted) {
                try {
                    const response = await authApi.getMe();
                    if (mounted) {
                        setUser(response.user);
                        // Socket connectie opzetten
                        socketService.connect(token);
                    }
                } catch (error) {
                    localStorage.removeItem('token');
                }
            }
            if (mounted) {
                setLoading(false);
            }
        };

        checkAuth();

        return () => {
            mounted = false;
            socketService.disconnect();
        };
    }, []);

    // Effect voor notification listener
    useEffect(() => {
        if (user) {
            const handleNewNotification = (notification: Notification) => {
                toast(`🔔 ${notification.message}`, {
                    duration: 5000,
                });
                setUnreadNotifications(prev => prev + 1);
            };

            socketService.onNotification(handleNewNotification);

            return () => {
                socketService.removeAllListeners();
            };
        }
    }, [user]);

    const refreshNotifications = async () => {
        if (user) {
            try {
                const response = await notificationApi.getAll(true);
                setUnreadNotifications(response.unreadCount || 0);
            } catch (error) {
                console.error('Error fetching notifications:', error);
            }
        }
    };

    // Haal notification count op bij startup
    useEffect(() => {
        if (user) {
            refreshNotifications();
        }
    }, [user]);

    const login = async (email: string, password: string) => {
        try {
            const response = await authApi.login({ email, password });
            localStorage.setItem('token', response.token);
            setUser(response.user);
            // Socket connectie opzetten na login
            socketService.connect(response.token);
            toast.success('Succesvol ingelogd!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Login mislukt');
            throw error;
        }
    };

    const register = async (name: string, email: string, password: string) => {
        try {
            const response = await authApi.register({ name, email, password });
            localStorage.setItem('token', response.token);
            setUser(response.user);
            // Socket connectie opzetten na registratie
            socketService.connect(response.token);
            toast.success('Account succesvol aangemaakt!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Registratie mislukt');
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setUnreadNotifications(0);
        socketService.disconnect();
        toast.success('Uitgelogd');
    };

    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, unreadNotifications, refreshNotifications }}>
            {children}
        </AuthContext.Provider>
    );
}; 