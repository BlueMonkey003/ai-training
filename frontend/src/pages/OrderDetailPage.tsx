import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderApi, receiptApi } from '../services/api';
import type { Order, OrderItem, Restaurant, User } from '../../../shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socket';
import toast from 'react-hot-toast';
import { ShoppingCart, Edit2, Trash2, X, Clock } from 'lucide-react';
import { restaurantApi } from '../services/api';
import type { RestaurantMenu, RestaurantMenuCategory, RestaurantMenuItem } from '../../../shared/types';

export default function OrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, isAdmin } = useAuth();

    const [order, setOrder] = useState<Order | null>(null);
    const [items, setItems] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [menu, setMenu] = useState<RestaurantMenu | null>(null);
    // Keuzes voor varianten en add-ons
    const [selectedVariantId, setSelectedVariantId] = useState<string>('');
    const [selectedSingleOptions, setSelectedSingleOptions] = useState<Record<string, string>>({});
    const [selectedMultiOptions, setSelectedMultiOptions] = useState<Record<string, string[]>>({});

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
            const rest = response.order.restaurantId as Restaurant;
            const menuRes = await restaurantApi.getMenu(rest._id);
            setMenu(menuRes.menu);
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
            const data: any = {};
            if (menu && formData.itemName && formData.itemName.includes('::')) {
                const [catId, itemId] = formData.itemName.split('::');
                const category = menu.categories.find(c => c.id === catId);
                const item = category?.items.find(i => i.id === itemId);
                if (!item) throw new Error('Menu item niet gevonden');

                // Bereken totaal + formatteer naam/notes
                let total = item.price;
                let name = item.name;
                const addons: string[] = [];
                if (item.variants && selectedVariantId) {
                    const v = item.variants.find(v => v.id === selectedVariantId);
                    if (v) { total += v.priceDelta; name = `${name} (${v.name})`; }
                }
                for (const g of item.optionGroups || []) {
                    if (g.type === 'single') {
                        const optId = selectedSingleOptions[g.id];
                        const opt = g.options.find(o => o.id === optId);
                        if (opt) { total += opt.priceDelta; addons.push(opt.name); }
                    } else {
                        const list = selectedMultiOptions[g.id] || [];
                        for (const optId of list) {
                            const opt = g.options.find(o => o.id === optId);
                            if (opt) { total += opt.priceDelta; addons.push(opt.name); }
                        }
                    }
                }

                data.itemName = name;
                data.price = total;
                const extraNotes = addons.join('\n');
                data.notes = [formData.notes, extraNotes].filter(Boolean).join('\n') || undefined;
                data.menuItemId = item.id;
            } else {
                // Vrije invoer (geen menu)
                data.itemName = formData.itemName;
                data.notes = formData.notes || undefined;
                if (formData.price) data.price = parseFloat(formData.price);
            }

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
        setSelectedVariantId('');
        setSelectedSingleOptions({});
        setSelectedMultiOptions({});
    };


    const totalPrice = items.reduce((sum, item) => sum + (item.price || 0), 0);

    if (loading) {
        return <div className="flex justify-center items-center h-64">Laden...</div>;
    }

    if (!order) {
        return <div>Order niet gevonden</div>;
    }

    const restaurant = order.restaurantId as Restaurant;
    const canAddItem = order.status === 'open' && !showForm;
    const isClosedAndAdmin = order.status === 'closed' && isAdmin;

    return (
        <div className="space-y-6">
            {/* Restaurant Info */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div className="flex-1">
                            <CardTitle className="text-xl sm:text-2xl">{restaurant.name}</CardTitle>
                            <CardDescription>
                                <span className="inline-flex flex-col sm:flex-row sm:items-center sm:space-x-2 mt-2">
                                    <span className="inline-flex items-center space-x-1">
                                        <Clock className="h-4 w-4" />
                                        <span className="text-sm">{new Date(order.createdAt).toLocaleString('nl-NL')}</span>
                                    </span>
                                    <span className="hidden sm:inline">-</span>
                                    <span className="text-sm">
                                        Status: <span className={order.status === 'open' ? 'text-green-600' : 'text-red-600'}>
                                            {order.status === 'open' ? 'Open' : 'Gesloten'}
                                        </span>
                                    </span>
                                </span>
                            </CardDescription>
                        </div>
                        {isAdmin && order.status === 'open' && (
                            <Button variant="destructive" onClick={handleCloseOrder} className="w-full sm:w-auto">
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

            {/* Upload bonnetje (admin, bij gesloten order) */}
            {isClosedAndAdmin && (
                <Card>
                    <CardHeader>
                        <CardTitle>Bonnetje uploaden</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3 flex-wrap">
                            <Input type="file" accept=".pdf,image/*" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file || !id) return;
                                try {
                                    await receiptApi.uploadForOrder(id, file);
                                    toast.success('Bonnetje geüpload');
                                } catch {
                                    toast.error('Upload mislukt');
                                }
                            }} />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Toegestaan: PDF, JPG, PNG, WEBP (max 5MB)</p>
                    </CardContent>
                </Card>
            )}

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
                                {menu && menu.categories?.length ? (
                                    <div className="space-y-2">
                                        <Label>Menukeuze</Label>
                                        <select
                                            className="w-full border rounded p-2"
                                            value={formData.itemName}
                                            onChange={(e) => { setFormData({ ...formData, itemName: e.target.value, price: '' }); setSelectedVariantId(''); setSelectedSingleOptions({}); setSelectedMultiOptions({}); }}
                                            required
                                        >
                                            <option value="" disabled>Kies een item</option>
                                            {menu.categories.map((cat: RestaurantMenuCategory) => (
                                                <optgroup key={cat.id} label={cat.name}>
                                                    {cat.items.map((mi: RestaurantMenuItem) => (
                                                        <option key={mi.id} value={`${cat.id}::${mi.id}`}>
                                                            {mi.name} — €{mi.price.toFixed(2)}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
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
                                )}

                                {/* Varianten en add-ons afhankelijk van gekozen item */}
                                {(() => {
                                    if (!formData.itemName) return null;
                                    const [catId, itemId] = formData.itemName.split('::');
                                    const category = menu?.categories.find(c => c.id === catId);
                                    const item = category?.items.find(i => i.id === itemId);
                                    if (!item) return null;

                                    const toggleMulti = (groupId: string, optionId: string, maxSelect?: number) => {
                                        setSelectedMultiOptions(prev => {
                                            const existing = prev[groupId] || [];
                                            const has = existing.includes(optionId);
                                            let next = existing;
                                            if (has) next = existing.filter(x => x !== optionId);
                                            else next = maxSelect && existing.length >= maxSelect ? existing : [...existing, optionId];
                                            return { ...prev, [groupId]: next };
                                        });
                                    };

                                    // Live prijsberekening
                                    let total = item.price;
                                    if (item.variants && selectedVariantId) {
                                        const v = item.variants.find(v => v.id === selectedVariantId);
                                        if (v) total += v.priceDelta;
                                    }
                                    for (const g of item.optionGroups || []) {
                                        if (g.type === 'single') {
                                            const optId = selectedSingleOptions[g.id];
                                            const opt = g.options.find(o => o.id === optId);
                                            if (opt) total += opt.priceDelta;
                                        } else {
                                            const list = selectedMultiOptions[g.id] || [];
                                            for (const optId of list) {
                                                const opt = g.options.find(o => o.id === optId);
                                                if (opt) total += opt.priceDelta;
                                            }
                                        }
                                    }

                                    return (
                                        <div className="space-y-4">
                                            {item.variants && item.variants.length > 0 && (
                                                <div className="space-y-2">
                                                    <Label>Formaat</Label>
                                                    <select
                                                        className="w-full border rounded p-2"
                                                        value={selectedVariantId}
                                                        onChange={(e) => setSelectedVariantId(e.target.value)}
                                                        required={true}
                                                    >
                                                        <option value="">Kies formaat</option>
                                                        {item.variants.map(v => (
                                                            <option key={v.id} value={v.id}>{v.name}{v.priceDelta > 0 ? ` (+€${v.priceDelta.toFixed(2)})` : ''}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {item.optionGroups && item.optionGroups.length > 0 && item.optionGroups
                                                // Filter op gekozen variant indien appliesTo is gezet
                                                .filter(g => !g.appliesTo || (selectedVariantId && g.appliesTo === selectedVariantId))
                                                .map(g => (
                                                    <div key={g.id} className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <Label>{g.name}</Label>
                                                            {!g.required && <span className="text-xs text-muted-foreground">Optioneel</span>}
                                                        </div>
                                                        {g.type === 'single' ? (
                                                            <select
                                                                className="w-full border rounded p-2"
                                                                value={selectedSingleOptions[g.id] || ''}
                                                                onChange={(e) => setSelectedSingleOptions(prev => ({ ...prev, [g.id]: e.target.value }))}
                                                            >
                                                                <option value="">Geen keuze</option>
                                                                {g.options.map(o => (
                                                                    <option key={o.id} value={o.id}>{o.name}{o.priceDelta > 0 ? ` (+€${o.priceDelta.toFixed(2)})` : ''}</option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                {g.options.map(o => {
                                                                    const selected = (selectedMultiOptions[g.id] || []).includes(o.id);
                                                                    return (
                                                                        <label key={o.id} className="flex items-center gap-2 border rounded p-2">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={selected}
                                                                                onChange={() => toggleMulti(g.id, o.id, g.maxSelect)}
                                                                            />
                                                                            <span className="flex-1">{o.name}</span>
                                                                            <span className="text-sm text-muted-foreground">{o.priceDelta > 0 ? `+€${o.priceDelta.toFixed(2)}` : '+€0,00'}</span>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}

                                            <div className="text-sm">Totaal: <strong>€{total.toFixed(2)}</strong></div>
                                        </div>
                                    );
                                })()}
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Opmerkingen (optioneel)</Label>
                                    <Input
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Bijv. Zonder tomaat"
                                    />
                                </div>

                                {(!menu || !(menu.categories?.length)) && (
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
                                )}

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
                                Voeg een bestelling toe
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
                                                    item.notes.includes('\n') ? (
                                                        <ul className="text-sm text-gray-600 mt-1 list-disc ml-5">
                                                            {item.notes.split('\n').map((n, i) => (
                                                                <li key={i}>{n}</li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
                                                    )
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