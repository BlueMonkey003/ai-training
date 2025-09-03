import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderApi } from '../services/api';
import type { Order, OrderItem, Restaurant, User } from '../../../shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socket';
import toast from 'react-hot-toast';
import { ShoppingCart, Edit2, Trash2, X, Clock } from 'lucide-react';

export default function OrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, isAdmin } = useAuth();

    const [order, setOrder] = useState<Order | null>(null);
    const [items, setItems] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        itemName: '',
        notes: '',
        price: '',
    });

    useEffect(() => {
        if (!id) return;

        fetchOrderDetails();

        // Join order room voor realtime updates
        socketService.joinOrder(id);

        // Luister naar updates
        socketService.onOrderUpdate((data) => {
            if (data.type === 'item_added' && data.item) {
                setItems(prev => [...prev, data.item!]);
                toast.success('Nieuwe bestelling toegevoegd');
            } else if (data.type === 'item_updated' && data.item) {
                setItems(prev => prev.map(item =>
                    item._id === data.item!._id ? data.item! : item
                ));
                toast('Bestelling bijgewerkt', { icon: 'ℹ️' });
            } else if (data.type === 'item_deleted' && data.itemId) {
                setItems(prev => prev.filter(item => item._id !== data.itemId));
                toast('Bestelling verwijderd', { icon: 'ℹ️' });
            }
        });

        socketService.onOrderClosed(() => {
            setOrder(prev => prev ? { ...prev, status: 'closed' } : null);
            toast('Bestelling is gesloten', { icon: 'ℹ️' });
        });

        return () => {
            socketService.leaveOrder(id);
        };
    }, [id]);

    const fetchOrderDetails = async () => {
        if (!id) return;

        try {
            const response = await orderApi.getById(id);
            setOrder(response.order);
            setItems(response.items);
        } catch (error) {
            toast.error('Fout bij ophalen order details');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        try {
            const data = {
                itemName: formData.itemName,
                notes: formData.notes || undefined,
                price: formData.price ? parseFloat(formData.price) : undefined,
            };

            if (editingItemId) {
                await orderApi.updateItem(id, editingItemId, data);
            } else {
                await orderApi.addItem(id, data);
            }

            resetForm();
            fetchOrderDetails();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Fout bij opslaan');
        }
    };

    const handleEdit = (item: OrderItem) => {
        if ((item.userId as User)._id !== user?._id) return;

        setFormData({
            itemName: item.itemName,
            notes: item.notes || '',
            price: item.price?.toString() || '',
        });
        setEditingItemId(item._id);
        setShowForm(true);
    };

    const handleDelete = async (itemId: string) => {
        if (!id || !confirm('Weet je zeker dat je deze bestelling wilt verwijderen?')) return;

        try {
            await orderApi.deleteItem(id, itemId);
            fetchOrderDetails();
        } catch (error) {
            toast.error('Fout bij verwijderen');
        }
    };

    const handleCloseOrder = async () => {
        if (!id || !confirm('Weet je zeker dat je deze bestelling wilt sluiten?')) return;

        try {
            await orderApi.close(id);
        } catch (error) {
            toast.error('Fout bij sluiten bestelling');
        }
    };

    const resetForm = () => {
        setFormData({ itemName: '', notes: '', price: '' });
        setEditingItemId(null);
        setShowForm(false);
    };

    const getUserItem = () => {
        return items.find(item => (item.userId as User)._id === user?._id);
    };

    const totalPrice = items.reduce((sum, item) => sum + (item.price || 0), 0);

    if (loading) {
        return <div className="flex justify-center items-center h-64">Laden...</div>;
    }

    if (!order) {
        return <div>Order niet gevonden</div>;
    }

    const restaurant = order.restaurantId as Restaurant;
    const userItem = getUserItem();
    const canAddItem = order.status === 'open' && !userItem && !showForm;

    return (
        <div className="space-y-6">
            {/* Restaurant Info */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>{restaurant.name}</CardTitle>
                            <CardDescription>
                                <div className="flex items-center space-x-2 mt-2">
                                    <Clock className="h-4 w-4" />
                                    <span>
                                        {new Date(order.createdAt).toLocaleString('nl-NL')} -
                                        Status: <span className={order.status === 'open' ? 'text-green-600' : 'text-red-600'}>
                                            {order.status === 'open' ? 'Open' : 'Gesloten'}
                                        </span>
                                    </span>
                                </div>
                            </CardDescription>
                        </div>
                        {isAdmin && order.status === 'open' && (
                            <Button variant="destructive" onClick={handleCloseOrder}>
                                Sluit Bestelling
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <img
                        src={restaurant.imageUrl}
                        alt={restaurant.name}
                        className="w-full h-64 object-cover rounded-lg"
                    />
                    <div className="mt-4 flex space-x-4">
                        <a
                            href={restaurant.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                        >
                            Website →
                        </a>
                        {restaurant.menuUrl && (
                            <a
                                href={restaurant.menuUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                            >
                                Menu →
                            </a>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Bestel Form */}
            {(showForm || canAddItem) && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {editingItemId ? 'Bestelling Bewerken' : 'Jouw Bestelling'}
                        </CardTitle>
                    </CardHeader>
                    {showForm ? (
                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="itemName">Wat wil je bestellen?</Label>
                                    <Input
                                        id="itemName"
                                        value={formData.itemName}
                                        onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                                        placeholder="Bijv. Broodje gezond"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes">Opmerkingen (optioneel)</Label>
                                    <Input
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Bijv. Zonder tomaat"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="price">Prijs (optioneel)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="flex space-x-2">
                                    <Button type="submit">
                                        {editingItemId ? 'Bijwerken' : 'Toevoegen'}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={resetForm}>
                                        <X className="h-4 w-4 mr-1" />
                                        Annuleren
                                    </Button>
                                </div>
                            </CardContent>
                        </form>
                    ) : (
                        <CardContent>
                            <Button onClick={() => setShowForm(true)} className="w-full">
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Voeg je bestelling toe
                            </Button>
                        </CardContent>
                    )}
                </Card>
            )}

            {/* Bestellingen Lijst */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Bestellingen ({items.length})</CardTitle>
                        {totalPrice > 0 && (
                            <span className="text-lg font-semibold">
                                Totaal: €{totalPrice.toFixed(2)}
                            </span>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {items.map((item) => {
                            const itemUser = item.userId as User;
                            const isOwner = itemUser._id === user?._id;

                            return (
                                <div
                                    key={item._id}
                                    className={`p-4 rounded-lg border ${isOwner ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                                                    {itemUser.profileImageUrl ? (
                                                        <img
                                                            src={itemUser.profileImageUrl}
                                                            alt={itemUser.name}
                                                            className="w-8 h-8 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        itemUser.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <span className="font-medium">{itemUser.name}</span>
                                            </div>

                                            <div className="mt-2">
                                                <p className="font-medium">{item.itemName}</p>
                                                {item.notes && (
                                                    <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
                                                )}
                                                {item.price && (
                                                    <p className="text-sm font-medium mt-1">€{item.price.toFixed(2)}</p>
                                                )}
                                            </div>
                                        </div>

                                        {isOwner && order.status === 'open' && (
                                            <div className="flex space-x-1 ml-4">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleEdit(item)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(item._id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {items.length === 0 && (
                            <p className="text-center text-gray-500 py-8">
                                Nog geen bestellingen toegevoegd
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 