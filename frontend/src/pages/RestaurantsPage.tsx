import { useState, useEffect } from 'react';
import { restaurantApi } from '../services/api';
import type { Restaurant } from '../../../shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Plus, Edit, Trash2, ExternalLink, X } from 'lucide-react';
import toast from 'react-hot-toast';

// Volledig XML template met uitleg (generiek, alles optioneel)
const XML_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<!--
  UITLEG (belangrijk):
  - Dit template werkt voor alle gevallen. Laat secties weg die je niet nodig hebt.
  - Items zonder vervolgkeuzes: zet alleen id, name, price, description (optioneel).
  - Varianten (bijv. 15cm/30cm): voeg <variants> toe; basisprijs = price, andere varianten met priceDelta.
  - Extra's/keuzes:
    * Per item: <optionGroups> binnen <item>
    * Globaal: <extras> onderaan voor standaardgroepen bij alle items
  - Weergavelogica:
    * Als een sectie ontbreekt of leeg is, wordt er niets getoond in de UI.
    * useGlobalExtras="false" op <category> of <item> verbergt globale extra's daar.
    * Conflicten: heeft een item een optionGroup met hetzelfde id als een globale? Dan geldt het item (override).
    * type: 'single' (dropdown) of 'multi' (checkboxen); 'maxSelect' alleen bij 'multi'.
    * appliesTo: koppel een optionGroup aan een variant-id (bijv. '15cm' of '30cm'). Zonder appliesTo geldt de groep voor alle varianten.
    * default="true" wordt NIET automatisch geselecteerd in de UI.
-->
<restaurant>
  <info>
    <name>JOUW RESTAURANT NAAM</name>
    <website>https://voorbeeld.nl/</website>
    <phone>000-0000000</phone>
    <delivery_time>30-45 minuten</delivery_time>
    <minimum_order>15.00</minimum_order>
    <currency>EUR</currency>
  </info>

  <categories>
    <category id="broodjes" name="Broodjes">
      <items>
        <!-- Simpel item (geen extra's) -->
        <item id="gezond" name="Broodje gezond" price="6.95" description="Ham, kaas, sla, tomaat, komkommer, ei en mayo" />

        <!-- Item met eigen keuzes (itemspecifiek OVERRIDET globaal bij gelijk id) -->
        <item id="carpaccio" name="Broodje carpaccio" price="8.95" description="Rucola, zontomaat, pijnboompitten, parmezaan">
          <optionGroups>
            <optionGroup id="saus" name="Saus" type="single">
              <option id="truffel" name="Truffelmayonaise" priceDelta="0.00"/>
              <option id="pesto" name="Pesto" priceDelta="0.00"/>
            </optionGroup>
          </optionGroups>
        </item>

        <!-- Subway-achtig item met varianten (15/30 cm) en variant-specifieke extra's -->
        <item id="italian_bmt" name="Italian B.M.T." price="8.50" description="Salami, pepperoni, ham">
          <variants required="true">
            <variant id="15cm" name="15 cm" priceDelta="0.00"/>
            <variant id="30cm" name="30 cm (Footlong)" priceDelta="4.50"/>
          </variants>
          <optionGroups>
            <optionGroup id="bread" name="Brood" type="single" required="true">
              <option id="white" name="Wit" priceDelta="0.00"/>
              <option id="wholegrain" name="Volkoren" priceDelta="0.00"/>
            </optionGroup>
            <optionGroup id="extras_30" name="Extra (30cm)" type="multi" maxSelect="5" appliesTo="30cm">
              <option id="bacon_30" name="Bacon" priceDelta="2.50"/>
              <option id="double_cheese_30" name="Dubbel Kaas" priceDelta="1.50"/>
            </optionGroup>
            <optionGroup id="extras_15" name="Extra (15cm)" type="multi" maxSelect="5" appliesTo="15cm">
              <option id="bacon_15" name="Bacon" priceDelta="1.50"/>
              <option id="double_cheese_15" name="Dubbel Kaas" priceDelta="0.75"/>
            </optionGroup>
          </optionGroups>
        </item>
      </items>
    </category>

    <!-- Categorie zonder globale extra's -->
    <category id="dranken" name="Dranken" useGlobalExtras="false">
      <items>
        <item id="cola_33" name="Coca-Cola 33cl" price="2.50" description="Koud blikje 0,33l" />
        <item id="fanta_33" name="Fanta Orange 33cl" price="2.50" />
      </items>
    </category>
  </categories>

  <!-- Globale extra's: verschijnen standaard bij ALLE items, behalve waar useGlobalExtras="false" is gezet. -->
  <extras>
    <optionGroup id="extra" name="Extra's" type="multi" maxSelect="5">
      <option id="extra_kaas" name="Extra Kaas" priceDelta="0.75"/>
      <option id="extra_vlees" name="Extra Vlees" priceDelta="1.50"/>
      <option id="extra_groenten" name="Extra Groenten" priceDelta="0.50"/>
      <option id="geen_ui" name="Geen Ui" priceDelta="0.00"/>
      <option id="extra_pikant" name="Extra Pikant" priceDelta="0.00"/>
    </optionGroup>

    <optionGroup id="broodtype" name="Broodtype" type="single">
      <option id="wit" name="Wit" priceDelta="0.00"/>
      <option id="bruin" name="Bruin" priceDelta="0.00"/>
    </optionGroup>
  </extras>
</restaurant>`;

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
    const [menuFile, setMenuFile] = useState<File | null>(null);
    const [menuJson, setMenuJson] = useState<string>('');

    const downloadTemplate = () => {
        const blob = new Blob([XML_TEMPLATE], { type: 'text/xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'menu-template.xml';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

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

            // Optioneel: menu importeren (replace) na create/update
            const targetId = editingId || (await restaurantApi.getAll()).restaurants.find(r => r.name === formData.name)?.
                _id;
            if (targetId) {
                if (menuFile) {
                    await restaurantApi.importMenu(targetId, menuFile);
                    toast.success('Menu geïmporteerd');
                } else if (menuJson.trim()) {
                    try {
                        const parsed = JSON.parse(menuJson);
                        await restaurantApi.importMenu(targetId, parsed);
                        toast.success('Menu geïmporteerd');
                    } catch {
                        toast.error('JSON is ongeldig');
                    }
                }
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
        setMenuFile(null);
        setMenuJson('');
        setEditingId(null);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Laden...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Restaurants</h1>
                    <p className="mt-2 text-sm sm:text-base text-gray-600">
                        Beheer restaurants voor lunchbestellingen
                    </p>
                </div>
                {!showForm && (
                    <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
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

                            <div className="space-y-2">
                                <Label>Menukaart importeren (XML of JSON)</Label>
                                <Input
                                    type="file"
                                    accept=".xml,application/json"
                                    onChange={(e) => setMenuFile(e.target.files?.[0] || null)}
                                />
                                <div>
                                    <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
                                        Voorbeeld XML downloaden
                                    </Button>
                                </div>
                                <div className="text-sm text-gray-500">of plak JSON hieronder</div>
                                <textarea
                                    className="w-full border rounded p-2 text-sm"
                                    rows={6}
                                    placeholder='{"categories": [...]}'
                                    value={menuJson}
                                    onChange={(e) => setMenuJson(e.target.value)}
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