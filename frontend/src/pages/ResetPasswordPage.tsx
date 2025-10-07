import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Utensils, CheckCircle, Check, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socket';

export default function ResetPasswordPage() {
    const [tempPassword, setTempPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Wachtwoord sterkte checks
    const passwordChecks = {
        minLength: newPassword.length >= 8,
        hasUppercase: /[A-Z]/.test(newPassword),
        hasLowercase: /[a-z]/.test(newPassword),
        hasNumber: /[0-9]/.test(newPassword),
        hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
    };

    const allPasswordChecksPassed = Object.values(passwordChecks).every(Boolean);

    const PasswordRequirement = ({ met, label }: { met: boolean; label: string }) => (
        <div className={`flex items-center gap-2 text-sm ${met ? 'text-green-600' : 'text-red-600'}`}>
            {met ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            <span>{label}</span>
        </div>
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validatie
        if (!allPasswordChecksPassed) {
            setError('Wachtwoord voldoet niet aan alle eisen');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Wachtwoorden komen niet overeen');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/auth/reset-password', {
                tempPassword: tempPassword.trim(),
                newPassword
            });

            // Login gebruiker met token
            if (response.data.token && response.data.user) {
                localStorage.setItem('token', response.data.token);
                // Trigger socket connect
                socketService.connect(response.data.token);
            }

            setSuccess(true);

            // Redirect na 2 seconden naar dashboard (React Router navigeert, AuthContext pikt token op)
            setTimeout(() => {
                window.location.href = '/';
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
                                <Label htmlFor="tempPassword">Tijdelijk wachtwoord *</Label>
                                <Input
                                    id="tempPassword"
                                    type="text"
                                    placeholder="Uit je email"
                                    value={tempPassword}
                                    onChange={(e) => setTempPassword(e.target.value.trim())}
                                    required
                                    autoFocus
                                />
                                <p className="text-xs text-gray-500">
                                    Kopieer het tijdelijke wachtwoord uit je email
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Nieuw wachtwoord</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    placeholder="Kies een sterk wachtwoord"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                                {newPassword && (
                                    <div className="mt-2 space-y-1 p-3 bg-gray-50 rounded border">
                                        <p className="text-xs font-medium text-gray-700 mb-2">Wachtwoord vereisten:</p>
                                        <PasswordRequirement met={passwordChecks.minLength} label="Minimaal 8 karakters" />
                                        <PasswordRequirement met={passwordChecks.hasUppercase} label="Minimaal 1 hoofdletter" />
                                        <PasswordRequirement met={passwordChecks.hasLowercase} label="Minimaal 1 kleine letter" />
                                        <PasswordRequirement met={passwordChecks.hasNumber} label="Minimaal 1 cijfer" />
                                        <PasswordRequirement met={passwordChecks.hasSpecial} label="Minimaal 1 speciaal teken (!@#$%...)" />
                                    </div>
                                )}
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
                                disabled={loading || !allPasswordChecksPassed}
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
