import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Utensils } from 'lucide-react';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const fullEmail = username.includes('@') ? username : `${username}@bluemonkeysit.nl`;
            await login(fullEmail, password);
            navigate('/');
        } catch (error) {
            // Error wordt afgehandeld in AuthContext
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <Utensils className="mx-auto h-12 w-12 text-indigo-600" />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        LunchMonkeys
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Organiseer lunchbestellingen voor je team
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Inloggen</CardTitle>
                        <CardDescription>
                            Vul je gegevens in om in te loggen
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
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
                                        className="flex-1"
                                    />
                                    <span className="text-gray-600 whitespace-nowrap">@bluemonkeysit.nl</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Wachtwoord</Label>
                                    <Link
                                        to="/forgot-password"
                                        className="text-sm text-indigo-600 hover:text-indigo-500"
                                    >
                                        Wachtwoord vergeten?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col space-y-4">
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? 'Bezig met inloggen...' : 'Inloggen'}
                            </Button>

                            <p className="text-sm text-center text-gray-600">
                                Nog geen account?{' '}
                                <Link
                                    to="/register"
                                    className="font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                    Registreer hier
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
} 