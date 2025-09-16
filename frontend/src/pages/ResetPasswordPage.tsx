import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Utensils, CheckCircle } from 'lucide-react';
import api from '../services/api';

export default function ResetPasswordPage() {
    const [email, setEmail] = useState('');
    const [tempPassword, setTempPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validatie
        if (newPassword !== confirmPassword) {
            setError('Wachtwoorden komen niet overeen');
            return;
        }

        if (newPassword.length < 6) {
            setError('Wachtwoord moet minimaal 6 karakters lang zijn');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/auth/reset-password', {
                email,
                tempPassword,
                newPassword
            });

            // Sla token op in localStorage
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }

            setSuccess(true);

            // Redirect na 2 seconden
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (error: any) {
            setError(error.response?.data?.message || 'Er is een fout opgetreden');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <Utensils className="mx-auto h-12 w-12 text-indigo-600" />
                        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                            LunchMonkeys
                        </h2>
                    </div>

                    <Card>
                        <CardHeader>
                            <div className="flex justify-center mb-4">
                                <CheckCircle className="h-12 w-12 text-green-500" />
                            </div>
                            <CardTitle className="text-center">Wachtwoord succesvol gewijzigd!</CardTitle>
                            <CardDescription className="text-center">
                                Je wordt automatisch doorgestuurd naar het dashboard...
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <Utensils className="mx-auto h-12 w-12 text-indigo-600" />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        LunchMonkeys
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Nieuw wachtwoord instellen
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Reset je wachtwoord</CardTitle>
                        <CardDescription>
                            Gebruik het tijdelijke wachtwoord uit je email om een nieuw wachtwoord in te stellen
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="naam@voorbeeld.nl"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tempPassword">Tijdelijk wachtwoord</Label>
                                <Input
                                    id="tempPassword"
                                    type="text"
                                    placeholder="Uit je email"
                                    value={tempPassword}
                                    onChange={(e) => setTempPassword(e.target.value)}
                                    required
                                />
                                <p className="text-xs text-gray-500">
                                    Check je email voor het tijdelijke wachtwoord
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Nieuw wachtwoord</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    placeholder="Minimaal 6 karakters"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Bevestig nieuw wachtwoord</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Herhaal je wachtwoord"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-600">{error}</p>
                            )}
                        </CardContent>

                        <CardFooter className="flex flex-col space-y-2">
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? 'Wachtwoord wijzigen...' : 'Wachtwoord wijzigen'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/login')}
                                className="w-full"
                            >
                                Terug naar inloggen
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
