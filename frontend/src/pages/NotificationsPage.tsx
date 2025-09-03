import { useState, useEffect } from 'react';
import { notificationApi } from '../services/api';
import socketService from '../services/socket';
import { useAuth } from '../contexts/AuthContext';
import type { Notification } from '../../../shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { BellOff, Check, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [markingRead, setMarkingRead] = useState<string | null>(null);
    const { refreshNotifications } = useAuth();

    useEffect(() => {
        fetchNotifications();

        // Luister naar nieuwe notificaties
        const handleNewNotification = (notification: Notification) => {
            setNotifications(prev => [notification, ...prev]);
        };

        socketService.onNotification(handleNewNotification);

        return () => {
            socketService.removeAllListeners();
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await notificationApi.getAll();
            setNotifications(response.notifications);
        } catch (error) {
            toast.error('Fout bij ophalen notificaties');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        setMarkingRead(id);
        try {
            await notificationApi.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, read: true } : n)
            );
            refreshNotifications(); // Update badge count
        } catch (error) {
            toast.error('Fout bij markeren als gelezen');
        } finally {
            setMarkingRead(null);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            refreshNotifications(); // Update badge count
            toast.success('Alle notificaties gemarkeerd als gelezen');
        } catch (error) {
            toast.error('Fout bij markeren als gelezen');
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'order_reminder':
                return '🍔';
            case 'order_closed':
                return '🔒';
            case 'new_item':
                return '🛒';
            default:
                return '🔔';
        }
    };

    const getNotificationTitle = (type: Notification['type']) => {
        switch (type) {
            case 'order_reminder':
                return 'Nieuwe Bestelling';
            case 'order_closed':
                return 'Bestelling Gesloten';
            case 'new_item':
                return 'Nieuw Item';
            default:
                return 'Notificatie';
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Laden...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Notificaties</h1>
                    <p className="mt-2 text-gray-600">
                        {unreadCount > 0
                            ? `Je hebt ${unreadCount} ongelezen notificatie${unreadCount > 1 ? 's' : ''}`
                            : 'Alle notificaties zijn gelezen'
                        }
                    </p>
                </div>

                {unreadCount > 0 && (
                    <Button onClick={handleMarkAllAsRead} variant="outline">
                        <CheckCheck className="h-4 w-4 mr-2" />
                        Markeer alles als gelezen
                    </Button>
                )}
            </div>

            {notifications.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <BellOff className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Geen notificaties</h3>
                        <p className="text-gray-500 mt-1">Je hebt nog geen notificaties ontvangen</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <Card
                            key={notification._id}
                            className={notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start space-x-3">
                                        <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                                        <div>
                                            <CardTitle className="text-base">
                                                {getNotificationTitle(notification.type)}
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                {notification.message}
                                            </CardDescription>
                                            <p className="text-xs text-gray-500 mt-2">
                                                {new Date(notification.createdAt).toLocaleString('nl-NL')}
                                            </p>
                                        </div>
                                    </div>

                                    {!notification.read && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleMarkAsRead(notification._id)}
                                            disabled={markingRead === notification._id}
                                        >
                                            {markingRead === notification._id ? (
                                                <span className="text-xs">...</span>
                                            ) : (
                                                <>
                                                    <Check className="h-4 w-4 mr-1" />
                                                    Gelezen
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
} 