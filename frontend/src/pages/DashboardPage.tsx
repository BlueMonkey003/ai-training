import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderApi, restaurantApi } from '../services/api';
import type { Order, Restaurant } from '../../../shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Clock, MapPin, ExternalLink, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socket';
import toast from 'react-hot-toast';

export default function DashboardPage() {
    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [previousOrders, setPreviousOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const { isAdmin } = useAuth();

    useEffect(() => {
        fetchData();

        // Luister naar nieuwe orders
        socketService.onNewOrder((order) => {
            setActiveOrder(order);
            toast.success('Nieuwe lunch bestelling geopend!');
        });

        // Luister naar order closed
        socketService.onOrderClosed(() => {
            setActiveOrder(null);
            toast.info('De lunch bestelling is gesloten');
            fetchData();
        });

        return () => {
            socketService.removeAllListeners();
        };
    }, []);

    const fetchData = async () => {
        try {
            // Haal actieve order op
            const ordersResponse = await orderApi.getAll({ status: 'open' });
            if (ordersResponse.orders.length > 0) {
                setActiveOrder(ordersResponse.orders[0]);
            }

            // Haal restaurants op
            const restaurantsResponse = await restaurantApi.getAll();
            setRestaurants(restaurantsResponse.restaurants);

            // Haal vorige orders op
            const previousResponse = await orderApi.getAll({ status: 'closed' });
            setPreviousOrders(previousResponse.orders.slice(0, 5));
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Fout bij het ophalen van gegevens');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrder = async (restaurantId: string) => {
        try {
            const response = await orderApi.create({ restaurantId });
            setActiveOrder(response.order);
            toast.success('Nieuwe bestelling aangemaakt!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Fout bij aanmaken bestelling');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Laden...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-2 text-gray-600">
                    Welkom bij LunchMonkeys! Bekijk de actieve lunchbestelling of start een nieuwe.
                </p>
            </div>

            {/* Actieve Order */}
            {activeOrder ? (
                <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-green-800">Actieve Lunchbestelling</CardTitle>
                                <CardDescription className="text-green-600">
                                    Bestelling is open voor {(activeOrder.restaurantId as Restaurant).name}
                                </CardDescription>
                            </div>
                            <Link to={`/orders/${activeOrder._id}`}>
                                <Button>Bekijk Bestelling</Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                            <img
                                src={(activeOrder.restaurantId as Restaurant).imageUrl}
                                alt={(activeOrder.restaurantId as Restaurant).name}
                                className="w-full h-48 object-cover rounded-lg"
                            />
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg">
                                    {(activeOrder.restaurantId as Restaurant).name}
                                </h3>
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <Clock className="h-4 w-4" />
                                    <span>Geopend op {new Date(activeOrder.createdAt).toLocaleString('nl-NL')}</span>
                                </div>
                                <div className="flex space-x-2">
                                    <a
                                        href={(activeOrder.restaurantId as Restaurant).websiteUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                                    >
                                        <ExternalLink className="h-4 w-4 mr-1" />
                                        Website
                                    </a>
                                    {(activeOrder.restaurantId as Restaurant).menuUrl && (
                                        <a
                                            href={(activeOrder.restaurantId as Restaurant).menuUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-blue-600 hover:text-blue-800"
                                        >
                                            <ExternalLink className="h-4 w-4 mr-1" />
                                            Menu
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Geen Actieve Bestelling</CardTitle>
                        <CardDescription>
                            Er is momenteel geen open lunchbestelling
                        </CardDescription>
                    </CardHeader>
                    {isAdmin && restaurants.length > 0 && (
                        <CardContent>
                            <div className="space-y-4">
                                <h3 className="font-medium">Start een nieuwe bestelling:</h3>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {restaurants.map((restaurant) => (
                                        <Card key={restaurant._id} className="cursor-pointer hover:shadow-lg transition-shadow">
                                            <CardHeader className="p-4">
                                                <img
                                                    src={restaurant.imageUrl}
                                                    alt={restaurant.name}
                                                    className="w-full h-32 object-cover rounded-md mb-2"
                                                />
                                                <h4 className="font-medium">{restaurant.name}</h4>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-0">
                                                <Button
                                                    onClick={() => handleCreateOrder(restaurant._id)}
                                                    className="w-full"
                                                    size="sm"
                                                >
                                                    <Plus className="h-4 w-4 mr-1" />
                                                    Start Bestelling
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>
            )}

            {/* Vorige Orders */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Vorige Bestellingen</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {previousOrders.map((order) => (
                        <Card key={order._id}>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    {(order.restaurantId as Restaurant).name}
                                </CardTitle>
                                <CardDescription>
                                    {new Date(order.date).toLocaleDateString('nl-NL')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link to={`/orders/${order._id}`}>
                                    <Button variant="outline" className="w-full">
                                        Bekijk Details
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
} 