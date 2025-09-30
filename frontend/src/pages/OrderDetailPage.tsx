import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    const [showMobileBon, setShowMobileBon] = useState(false);

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

        // Callback handlers (unieke referenties voor cleanup)
        const handleOrderUpdate = (data: any) => {
            if (data.type === 'item_added' && data.item) {
                setItems(prev => {
                    // Voorkom duplicaten
                    if (prev.find(i => i._id === data.item._id)) return prev;
                    return [...prev, data.item];
                });
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
        };

        const handleOrderClosed = () => {
            setOrder(prev => prev ? { ...prev, status: 'closed' } : null);
            toast('Bestelling is gesloten', { icon: 'ℹ️' });
        };

        socketService.onOrderUpdate(handleOrderUpdate);
        socketService.onOrderClosed(handleOrderClosed);

        return () => {
            socketService.leaveOrder(id);
            // Verwijder exact deze listeners
            socketService.offOrderUpdate(handleOrderUpdate);
            socketService.offOrderClosed(handleOrderClosed);
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
                    if (!g.appliesTo || (selectedVariantId && g.appliesTo === selectedVariantId)) {
                        if (g.type === 'single') {
                            const optId = selectedSingleOptions[g.id];
                            const opt = g.options.find(o => o.id === optId);
                            if (opt) {
                                total += opt.priceDelta;
                                const prefix = `${g.name}: `;
                                addons.push(opt.priceDelta > 0 ? `${prefix}${opt.name} (+€${opt.priceDelta.toFixed(2)})` : `${prefix}${opt.name}`);
                            }
                        } else {
                            const list = selectedMultiOptions[g.id] || [];
                            for (const optId of list) {
                                const opt = g.options.find(o => o.id === optId);
                                if (opt) {
                                    total += opt.priceDelta;
                                    const prefix = `${g.name}: `;
                                    addons.push(opt.priceDelta > 0 ? `${prefix}${opt.name} (+€${opt.priceDelta.toFixed(2)})` : `${prefix}${opt.name}`);
                                }
                            }
                        }
                    }
                }

                data.itemName = name;
                data.price = total;
                const notesLines: string[] = [];
                if (formData.notes) notesLines.push(`Opmerking: ${formData.notes}`);
                if (addons.length) notesLines.push(...addons);
                data.notes = notesLines.join('\n') || undefined;
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

    const restaurantObj = (order.restaurantId as Restaurant) || ({} as Restaurant);
    const restaurantName = (restaurantObj as any).name || 'Onbekend restaurant';
    const restaurantImage = (restaurantObj as any).imageUrl || '';
    const restaurantWebsite = (restaurantObj as any).websiteUrl || '';
    const restaurantMenuUrl = (restaurantObj as any).menuUrl || '';
    const canAddItem = order.status === 'open' && !showForm;
    const isClosedAndAdmin = order.status === 'closed' && isAdmin;

    // Helper: bereken bon-gegevens (voor popup)
    const getBonData = () => {
        if (!formData.itemName || !menu || !formData.itemName.includes('::')) return null;
        const [catId, itemId] = formData.itemName.split('::');
        const category = menu?.categories.find(c => c.id === catId);
        const item = category?.items.find(i => i.id === itemId);
        if (!item) return null;

        let total = item.price;
        let variantName = '';
        const groups: Array<{ groupName: string; items: Array<{ label: string; price: string }> }> = [];

        if (item.variants && selectedVariantId) {
            const v = item.variants.find(v => v.id === selectedVariantId);
            if (v) {
                total += v.priceDelta;
                variantName = v.name;
            }
        }
        for (const g of item.optionGroups || []) {
            if (!g.appliesTo || (selectedVariantId && g.appliesTo === selectedVariantId)) {
                const groupItems: Array<{ label: string; price: string }> = [];
                if (g.type === 'single') {
                    const optId = selectedSingleOptions[g.id];
                    const opt = g.options.find(o => o.id === optId);
                    if (opt) {
                        total += opt.priceDelta;
                        groupItems.push({ label: opt.name, price: opt.priceDelta > 0 ? `+€${opt.priceDelta.toFixed(2)}` : '' });
                    }
                } else {
                    const list = selectedMultiOptions[g.id] || [];
                    for (const optId of list) {
                        const opt = g.options.find(o => o.id === optId);
                        if (opt) {
                            total += opt.priceDelta;
                            groupItems.push({ label: opt.name, price: opt.priceDelta > 0 ? `+€${opt.priceDelta.toFixed(2)}` : '' });
                        }
                    }
                }
                if (groupItems.length > 0) {
                    groups.push({ groupName: g.name, items: groupItems });
                }
            }
        }
        return { item, total, variantName, groups };
    };

    const bonData = getBonData();

    return (
        <>
            {/* Mobiel: fullscreen popup bon via Portal (buiten Layout constraints) */}
            {showMobileBon && bonData && createPortal(
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-end"
                    onClick={() => setShowMobileBon(false)}
                >
                    <div
                        className="w-screen bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Scrollable content */}
                        <div className="flex-1 overflow-y-auto p-6 pb-24">
                            <div className="flex justify-between items-center mb-4 pb-3 border-b">
                                <h3 className="font-bold text-xl">Jouw Bon</h3>
                                <button
                                    onClick={() => setShowMobileBon(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full flex-shrink-0"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between items-start gap-6 font-medium text-base">
                                    <span className="flex-1 break-words">{bonData.item.name}</span>
                                    <span className="text-gray-700 font-semibold whitespace-nowrap">€{bonData.item.price.toFixed(2)}</span>
                                </div>

                                {bonData.groups.map((group, i) => (
                                    <div key={i} className="text-sm">
                                        <div className="font-medium text-gray-700 text-xs mb-1">{group.groupName}:</div>
                                        {group.items.map((item, j) => (
                                            <div key={j} className="flex justify-between items-start gap-6 text-gray-600 ml-3 mb-0.5">
                                                <span className="flex-1 break-words">• {item.label}</span>
                                                <span className="whitespace-nowrap text-xs">{item.price}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            {formData.notes && (
                                <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                                    <p className="text-red-700 font-medium text-sm">Opmerking:</p>
                                    <p className="text-red-600 italic text-sm mt-1 break-words">{formData.notes}</p>
                                </div>
                            )}

                            <div className="pt-4 border-t flex justify-between items-center gap-4 mb-4">
                                <span className="font-bold text-xl">Totaal:</span>
                                <span className="text-green-600 font-bold text-2xl whitespace-nowrap">€{bonData.total.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Sticky footer met Toevoegen knop */}
                        <div className="sticky bottom-0 bg-white border-t p-4 shadow-lg">
                            <Button
                                type="button"
                                className="w-full text-lg py-6"
                                onClick={() => {
                                    setShowMobileBon(false);
                                    // Trigger form submit
                                    const form = document.querySelector('form');
                                    if (form) form.requestSubmit();
                                }}
                            >
                                <ShoppingCart className="h-5 w-5 mr-2" />
                                {editingItemId ? 'Bijwerken' : 'Toevoegen aan bestelling'}
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <div className="space-y-6">
                {/* Restaurant Info */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                            <div className="flex-1">
                                <CardTitle className="text-xl sm:text-2xl">{restaurantName}</CardTitle>
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
                        {restaurantImage && (
                            <img
                                src={restaurantImage}
                                alt={restaurantName}
                                className="w-full h-64 object-cover rounded-lg"
                            />
                        )}
                        <div className="mt-4 flex space-x-4">
                            {restaurantWebsite && (
                                <a
                                    href={restaurantWebsite}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    Website →
                                </a>
                            )}
                            {restaurantMenuUrl && (
                                <a
                                    href={restaurantMenuUrl}
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
                                <CardContent className="space-y-4 lg:grid lg:grid-cols-3 lg:gap-6">
                                    {/* Linker kolom: formulier */}
                                    <div className="space-y-4 lg:col-span-2">
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

                                                    <div className="text-sm lg:hidden">Totaal: <strong>€{total.toFixed(2)}</strong></div>
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
                                    </div>

                                    {/* Rechter kolom: sticky bon (desktop) + floating bon (mobiel) */}
                                    {(() => {
                                        if (!formData.itemName || !menu || !formData.itemName.includes('::')) return null;
                                        const [catId, itemId] = formData.itemName.split('::');
                                        const category = menu?.categories.find(c => c.id === catId);
                                        const item = category?.items.find(i => i.id === itemId);
                                        if (!item) return null;

                                        let total = item.price;
                                        let variantName = '';
                                        const addons: Array<{ groupName?: string; label: string; price: string }> = [];

                                        if (item.variants && selectedVariantId) {
                                            const v = item.variants.find(v => v.id === selectedVariantId);
                                            if (v) { total += v.priceDelta; variantName = v.name; }
                                        }
                                        for (const g of item.optionGroups || []) {
                                            if (!g.appliesTo || (selectedVariantId && g.appliesTo === selectedVariantId)) {
                                                if (g.type === 'single') {
                                                    const optId = selectedSingleOptions[g.id];
                                                    const opt = g.options.find(o => o.id === optId);
                                                    if (opt) {
                                                        total += opt.priceDelta;
                                                        addons.push({ groupName: g.name, label: opt.name, price: opt.priceDelta > 0 ? `+€${opt.priceDelta.toFixed(2)}` : '' });
                                                    }
                                                } else {
                                                    const list = selectedMultiOptions[g.id] || [];
                                                    for (const optId of list) {
                                                        const opt = g.options.find(o => o.id === optId);
                                                        if (opt) {
                                                            total += opt.priceDelta;
                                                            addons.push({ groupName: g.name, label: opt.name, price: opt.priceDelta > 0 ? `+€${opt.priceDelta.toFixed(2)}` : '' });
                                                        }
                                                    }
                                                }
                                            }
                                        }

                                        return (
                                            <>
                                                {/* Desktop: sticky bon rechts */}
                                                <div className="hidden lg:block lg:col-span-1">
                                                    <div className="sticky top-4 border rounded-lg p-4 bg-gray-50 shadow-sm">
                                                        <h3 className="font-semibold text-lg mb-3 border-b pb-2">Jouw Bon</h3>
                                                        <div className="space-y-1 text-sm">
                                                            <div className="flex justify-between items-center font-medium">
                                                                <span>{item.name}</span>
                                                                <span className="text-gray-600">€{item.price.toFixed(2)}</span>
                                                            </div>
                                                            {variantName && (
                                                                <div className="flex justify-between items-center text-gray-600 ml-2 text-xs">
                                                                    <span>• {variantName}</span>
                                                                    <span>{item.variants?.find(v => v.id === selectedVariantId)?.priceDelta ? `+€${item.variants.find(v => v.id === selectedVariantId)!.priceDelta.toFixed(2)}` : ''}</span>
                                                                </div>
                                                            )}
                                                            {bonData.groups.map((group, i) => (
                                                                <div key={i} className="text-xs mb-2">
                                                                    <div className="font-medium text-gray-700 mb-0.5">{group.groupName}:</div>
                                                                    {group.items.map((item, j) => (
                                                                        <div key={j} className="flex justify-between items-center text-gray-600 ml-3 mb-0.5">
                                                                            <span>• {item.label}</span>
                                                                            <span>{item.price}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ))}
                                                            {formData.notes && (
                                                                <div className="text-red-600 italic text-xs mt-3 pt-2 border-t">
                                                                    Opmerking: {formData.notes}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="mt-4 pt-3 border-t flex justify-between items-center font-semibold text-lg">
                                                            <span>Totaal:</span>
                                                            <span className="text-green-600">€{total.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Mobiel: floating footer (klikbaar) */}
                                                <div
                                                    className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-3 z-50 cursor-pointer active:bg-gray-50"
                                                    onClick={() => setShowMobileBon(true)}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex-1">
                                                            <div className="font-medium text-sm">{item.name}{variantName && ` (${variantName})`}</div>
                                                            {bonData.groups.length > 0 && (
                                                                <div className="text-xs text-gray-500">+{bonData.groups.reduce((sum, g) => sum + g.items.length, 0)} keuze(s) · Tik voor details</div>
                                                            )}
                                                        </div>
                                                        <div className="text-xl font-semibold text-green-600">€{total.toFixed(2)}</div>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}

                                    <div className="flex space-x-2 pb-20 lg:pb-0 lg:col-span-2">
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
                                const itemUserObj = (item.userId as User) || ({} as User);
                                const itemUserName = (itemUserObj && (itemUserObj as any).name) ? itemUserObj.name : 'Onbekende gebruiker';
                                const itemUserImage = (itemUserObj && (itemUserObj as any).profileImageUrl) ? itemUserObj.profileImageUrl : '';
                                const itemUserId = (itemUserObj && (itemUserObj as any)._id) ? (itemUserObj as any)._id : null;
                                const isOwner = itemUserId && user?._id ? (itemUserId === user?._id) : false;

                                return (
                                    <div
                                        key={item._id}
                                        className={`p-4 rounded-lg border ${isOwner ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium overflow-hidden">
                                                        {itemUserImage ? (
                                                            <img
                                                                src={itemUserImage}
                                                                alt={itemUserName}
                                                                className="w-8 h-8 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <span>{itemUserName.charAt(0).toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                    <span className="font-medium">{itemUserName}</span>
                                                </div>

                                                <div className="mt-2">
                                                    <p className="font-medium">{item.itemName}</p>
                                                    {item.notes && (
                                                        (() => {
                                                            const lines = item.notes.split('\n');
                                                            const userNote = lines.find(l => l.startsWith('Opmerking:'));
                                                            const addons = lines.filter(l => !l.startsWith('Opmerking:'));
                                                            return (
                                                                <>
                                                                    {addons.length > 0 && (
                                                                        <ul className="text-sm text-gray-600 mt-1 space-y-0.5">
                                                                            {addons.map((n, i) => {
                                                                                const match = n.match(/^(.+?)\s*\(\+€([\d.]+)\)$/);
                                                                                if (match) {
                                                                                    return (
                                                                                        <li key={i} className="flex justify-between items-center">
                                                                                            <span>• {match[1]}</span>
                                                                                            <span className="text-xs text-gray-500">+€{parseFloat(match[2]).toFixed(2)}</span>
                                                                                        </li>
                                                                                    );
                                                                                }
                                                                                return <li key={i}>• {n}</li>;
                                                                            })}
                                                                        </ul>
                                                                    )}
                                                                    {userNote && (
                                                                        <p className="text-sm text-red-600 italic mt-2 pt-2 border-t">{userNote}</p>
                                                                    )}
                                                                </>
                                                            );
                                                        })()
                                                    )}
                                                    {item.price && (
                                                        <p className="text-sm font-semibold mt-2 text-green-600">Totaal: €{item.price.toFixed(2)}</p>
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
        </>
    );
} 