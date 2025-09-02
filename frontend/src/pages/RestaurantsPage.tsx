import { useState, useEffect } from 'react';
import { restaurantApi } from '../services/api';
import type { Restaurant } from '../../../shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Plus, Edit, Trash2, ExternalLink, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RestaurantsPage() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        websiteUrl: '',
        menuUrl: '',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        try {
            const response = await restaurantApi.getAll();
            setRestaurants(response.restaurants);
        } catch (error) {
            toast.error('Fout bij ophalen restaurants');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!imageFile && !editingId) {
            toast.error('Selecteer een afbeelding');
            return;
        }

        const data = new FormData();
        data.append('name', formData.name);
        data.append('websiteUrl', formData.websiteUrl);
        if (formData.menuUrl) {
            data.append('menuUrl', formData.menuUrl);
        }
        if (imageFile) {
            data.append('image', imageFile);
        }

        try {
            if (editingId) {
                await restaurantApi.update(editingId, data);
                toast.success('Restaurant bijgewerkt');
            } else {
                await restaurantApi.create(data);
                toast.success('Restaurant toegevoegd');
            }

            setShowForm(false);
            resetForm();
            fetchRestaurants();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Fout bij opslaan');
        }
    };

    const handleEdit = (restaurant: Restaurant) => {
        setFormData({
            name: restaurant.name,
            websiteUrl: restaurant.websiteUrl,
            menuUrl: restaurant.menuUrl || '',
        });
        setEditingId(restaurant._id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Weet je zeker dat je dit restaurant wilt verwijderen?')) {
            return;
        }

        try {
            await restaurantApi.delete(id);
            toast.success('Restaurant verwijderd');
            fetchRestaurants();
        } catch (error) {
            toast.error('Fout bij verwijderen');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            websiteUrl: '',
            menuUrl: '',
        });
        setImageFile(null);
        setEditingId(null);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Laden...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Restaurants</h1>
                    <p className="mt-2 text-gray-600">
                        Beheer restaurants voor lunchbestellingen
                    </p>
                </div>
                {!showForm && (
                    <Button onClick={() => setShowForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nieuw Restaurant
                    </Button>
                )}
            </div>

            {/* Form */}
            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {editingId ? 'Restaurant Bewerken' : 'Nieuw Restaurant'}
                        </CardTitle>
                        <CardDescription>
                            Vul de gegevens in voor het restaurant
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Naam</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="websiteUrl">Website URL</Label>
                                <Input
                                    id="websiteUrl"
                                    type="url"
                                    value={formData.websiteUrl}
                                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="menuUrl">Menu URL (optioneel)</Label>
                                <Input
                                    id="menuUrl"
                                    type="url"
                                    value={formData.menuUrl}
                                    onChange={(e) => setFormData({ ...formData, menuUrl: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="image">Afbeelding {editingId && '(laat leeg om huidige te behouden)'}</Label>
                                <Input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                    required={!editingId}
                                />
                            </div>

                            <div className="flex space-x-2">
                                <Button type="submit">
                                    {editingId ? 'Bijwerken' : 'Toevoegen'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowForm(false);
                                        resetForm();
                                    }}
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Annuleren
                                </Button>
                            </div>
                        </CardContent>
                    </form>
                </Card>
            )}

            {/* Restaurant lijst */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map((restaurant) => (
                    <Card key={restaurant._id}>
                        <CardHeader className="p-0">
                            <img
                                src={restaurant.imageUrl}
                                alt={restaurant.name}
                                className="w-full h-48 object-cover rounded-t-lg"
                            />
                        </CardHeader>
                        <CardContent className="p-4">
                            <h3 className="font-semibold text-lg mb-2">{restaurant.name}</h3>

                            <div className="flex space-x-2 mb-4">
                                <a
                                    href={restaurant.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    <ExternalLink className="h-4 w-4 inline mr-1" />
                                    Website
                                </a>
                                {restaurant.menuUrl && (
                                    <a
                                        href={restaurant.menuUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        <ExternalLink className="h-4 w-4 inline mr-1" />
                                        Menu
                                    </a>
                                )}
                            </div>

                            <div className="flex space-x-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(restaurant)}
                                >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Bewerk
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(restaurant._id)}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Verwijder
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
} 