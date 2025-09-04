import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userApi, uploadApi } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { User, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: user?.name || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // Validatie voor wachtwoord wijziging
        if (formData.newPassword) {
            if (formData.newPassword !== formData.confirmPassword) {
                toast.error('Nieuwe wachtwoorden komen niet overeen');
                return;
            }
            if (formData.newPassword.length < 6) {
                toast.error('Wachtwoord moet minimaal 6 karakters zijn');
                return;
            }
        }

        setLoading(true);
        try {
            const updateData: any = {};
            if (formData.name !== user.name) {
                updateData.name = formData.name;
            }
            if (formData.newPassword) {
                updateData.password = formData.newPassword;
            }

            if (Object.keys(updateData).length > 0) {
                await userApi.updateUser(user._id, updateData);
                toast.success('Profiel bijgewerkt');

                // Reset wachtwoord velden
                setFormData(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                }));

                // Herlaad gebruikersdata
                window.location.reload();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Fout bij bijwerken profiel');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Valideer bestandsgrootte
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Bestand is te groot (max 5MB)');
            return;
        }

        setUploadingImage(true);
        try {
            await uploadApi.uploadProfileImage(file);
            toast.success('Profielfoto geüpload');
            // Gebruik React Router voor navigatie in plaats van page reload
            setTimeout(() => {
                window.location.href = window.location.href;
            }, 100);
        } catch (error) {
            toast.error('Fout bij uploaden profielfoto');
        } finally {
            setUploadingImage(false);
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-0">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mijn Profiel</h1>
                <p className="mt-2 text-sm sm:text-base text-gray-600">
                    Beheer je persoonlijke gegevens en accountinstellingen
                </p>
            </div>

            {/* Profielfoto */}
            <Card>
                <CardHeader>
                    <CardTitle>Profielfoto</CardTitle>
                    <CardDescription>
                        Upload een profielfoto voor je account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-6">
                        <div className="relative">
                            <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
                                {user.profileImageUrl ? (
                                    <img
                                        src={user.profileImageUrl}
                                        alt={user.name}
                                        className="w-24 h-24 rounded-full object-cover"
                                    />
                                ) : (
                                    <User className="h-12 w-12 text-gray-600" />
                                )}
                            </div>
                            <label
                                htmlFor="profile-image"
                                className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50"
                            >
                                <Camera className="h-4 w-4" />
                                <input
                                    id="profile-image"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    disabled={uploadingImage}
                                />
                            </label>
                        </div>

                        <div>
                            <p className="text-sm text-gray-600">
                                JPG, PNG of WebP. Max 5MB.
                            </p>
                            {uploadingImage && (
                                <p className="text-sm text-blue-600 mt-1">Uploaden...</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Account Informatie */}
            <Card>
                <CardHeader>
                    <CardTitle>Account Informatie</CardTitle>
                    <CardDescription>
                        Je basis accountgegevens
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Email</Label>
                        <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                    </div>

                    <div>
                        <Label>Rol</Label>
                        <p className="text-sm text-gray-600 mt-1">
                            {user.role === 'admin' ? 'Administrator' : 'Medewerker'}
                        </p>
                    </div>

                    <div>
                        <Label>Account aangemaakt</Label>
                        <p className="text-sm text-gray-600 mt-1">
                            {new Date(user.createdAt).toLocaleDateString('nl-NL')}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Profiel Bijwerken */}
            <Card>
                <CardHeader>
                    <CardTitle>Profiel Bijwerken</CardTitle>
                    <CardDescription>
                        Wijzig je naam of wachtwoord
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdateProfile}>
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

                        <div className="border-t pt-4">
                            <h3 className="font-medium mb-4">Wachtwoord Wijzigen</h3>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">Nieuw Wachtwoord</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                        placeholder="Laat leeg om niet te wijzigen"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Bevestig Nieuw Wachtwoord</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        placeholder="Herhaal nieuw wachtwoord"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-2">
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Opslaan...' : 'Wijzigingen Opslaan'}
                            </Button>
                        </div>
                    </CardContent>
                </form>
            </Card>

            {/* Uitloggen */}
            <Card>
                <CardHeader>
                    <CardTitle>Sessie</CardTitle>
                    <CardDescription>
                        Beheer je inlogsessie
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="destructive" onClick={logout}>
                        Uitloggen
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
} 