import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Utensils, ArrowLeft, Mail } from 'lucide-react';
import api from '../services/api';

export default function ForgotPasswordPage() {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const fullEmail = username.includes('@') ? username : `${username}@bluemonkeysit.nl`;
            await api.post('/auth/forgot-password', { email: fullEmail });
            setSubmitted(true);
        } catch (error: any) {
            setError(error.response?.data?.message || 'Er is een fout opgetreden');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
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
                                <Mail className="h-12 w-12 text-green-500" />
                            </div>
                            <CardTitle className="text-center">Email verstuurd!</CardTitle>
                            <CardDescription className="text-center">
                                Als het emailadres bestaat, hebben we een reset email verstuurd met een tijdelijk wachtwoord.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 text-center">
                                Controleer je inbox (en spam folder) voor de instructies om je wachtwoord te resetten.
                            </p>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-2">
                            <Button
                                onClick={() => navigate('/reset-password')}
                                className="w-full"
                            >
                                Wachtwoord resetten
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/login')}
                                className="w-full"
                            >
                                Terug naar inloggen
                            </Button>
                        </CardFooter>
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
                        Wachtwoord vergeten
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Wachtwoord herstellen</CardTitle>
                        <CardDescription>
                            Vul je emailadres in en we sturen je een tijdelijk wachtwoord
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="username">Emailadres</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="jouw.naam"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value.replace('@', ''))}
                                        required
                                        autoFocus
                                        className="flex-1"
                                    />
                                    <span className="text-gray-600 whitespace-nowrap">@bluemonkeysit.nl</span>
                                </div>
                            </div>
                            {error && (
                                <p className="mt-2 text-sm text-red-600">{error}</p>
                            )}
                        </CardContent>

                        <CardFooter className="flex flex-col space-y-2">
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? 'Email versturen...' : 'Stuur reset email'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/login')}
                                className="w-full"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Terug naar inloggen
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
