import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Utensils, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const navigate = useNavigate();

    // Wachtwoord sterkte checks
    const passwordChecks = {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecial: /[^A-Za-z0-9]/.test(password),
    };

    const allPasswordChecksPassed = Object.values(passwordChecks).every(Boolean);

    const validateField = (field: string, value: string) => {
        const newErrors = { ...errors };

        switch (field) {
            case 'name':
                if (!value.trim()) newErrors.name = 'Naam is verplicht';
                else delete newErrors.name;
                break;
            case 'username':
                if (!value.trim()) newErrors.username = 'Emailadres is verplicht';
                else if (value.includes('@')) newErrors.username = 'Alleen gebruikersnaam invoeren (zonder @bluemonkeysit.nl)';
                else delete newErrors.username;
                break;
            case 'birthDate':
                if (!value) newErrors.birthDate = 'Geboortedatum is verplicht';
                else if (!/^\d{2}-\d{2}-\d{4}$/.test(value)) newErrors.birthDate = 'Gebruik formaat dd-mm-jjjj';
                else {
                    const [day, month, year] = value.split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    if (isNaN(date.getTime())) newErrors.birthDate = 'Ongeldige datum';
                    else if (date > new Date()) newErrors.birthDate = 'Geboortedatum kan niet in de toekomst liggen';
                    else delete newErrors.birthDate;
                }
                break;
            case 'password':
                if (!allPasswordChecksPassed) newErrors.password = 'Wachtwoord voldoet niet aan alle eisen';
                else delete newErrors.password;
                break;
            case 'confirmPassword':
                if (!value) newErrors.confirmPassword = 'Bevestig wachtwoord is verplicht';
                else if (value !== password) newErrors.confirmPassword = 'Wachtwoorden komen niet overeen';
                else delete newErrors.confirmPassword;
                break;
        }

        setErrors(newErrors);
    };

    const handleBlur = (field: string) => {
        setTouched({ ...touched, [field]: true });
        validateField(field, eval(field));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Mark all as touched
        setTouched({ name: true, username: true, birthDate: true, password: true, confirmPassword: true });

        // Validate all
        validateField('name', name);
        validateField('username', username);
        validateField('birthDate', birthDate);
        validateField('password', password);
        validateField('confirmPassword', confirmPassword);

        // Check for errors
        if (Object.keys(errors).length > 0 || !allPasswordChecksPassed) {
            toast.error('Vul alle velden correct in');
            return;
        }

        if (password !== confirmPassword) {
            setErrors({ ...errors, confirmPassword: 'Wachtwoorden komen niet overeen' });
            return;
        }

        setLoading(true);

        try {
            const fullEmail = `${username}@bluemonkeysit.nl`;
            // Parse dd-mm-jjjj naar ISO (yyyy-mm-dd)
            let birthDateISO: string | undefined;
            if (birthDate && /^\d{2}-\d{2}-\d{4}$/.test(birthDate)) {
                const [day, month, year] = birthDate.split('-');
                birthDateISO = `${year}-${month}-${day}`;
            }
            await authApi.register({ name, email: fullEmail, password, birthDate: birthDateISO });
            toast.success('Account aangemaakt! Controleer je email om je account te activeren.');
            navigate('/login');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Fout bij registratie');
        } finally {
            setLoading(false);
        }
    };

    const PasswordRequirement = ({ met, label }: { met: boolean; label: string }) => (
        <div className={`flex items-center gap-2 text-sm ${met ? 'text-green-600' : 'text-red-600'}`}>
            {met ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            <span>{label}</span>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <Utensils className="mx-auto h-12 w-12 text-indigo-600" />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        LunchMonkeys
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Maak een account aan om te beginnen
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Registreren</CardTitle>
                        <CardDescription>
                            Vul je gegevens in om een account aan te maken
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {/* Naam */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Volledige naam *</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Je volledige naam"
                                    value={name}
                                    onChange={(e) => { setName(e.target.value); if (touched.name) validateField('name', e.target.value); }}
                                    onBlur={() => handleBlur('name')}
                                    required
                                    className={touched.name && errors.name ? 'border-red-500' : ''}
                                />
                                {touched.name && errors.name && (
                                    <p className="text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>

                            {/* Geboortedatum */}
                            <div className="space-y-2">
                                <Label htmlFor="birthDate">Geboortedatum *</Label>
                                <Input
                                    id="birthDate"
                                    type="text"
                                    placeholder="dd-mm-jjjj"
                                    value={birthDate}
                                    onChange={(e) => {
                                        let val = e.target.value.replace(/[^0-9-]/g, '');
                                        // Auto-insert hyphens
                                        if (val.length === 2 && !val.includes('-')) val += '-';
                                        if (val.length === 5 && val.split('-').length === 2) val += '-';
                                        if (val.length > 10) val = val.slice(0, 10);
                                        setBirthDate(val);
                                        if (touched.birthDate) validateField('birthDate', val);
                                    }}
                                    onBlur={() => handleBlur('birthDate')}
                                    required
                                    maxLength={10}
                                    className={touched.birthDate && errors.birthDate ? 'border-red-500' : ''}
                                />
                                <p className="text-xs text-gray-500">Bijvoorbeeld: 25-12-1990</p>
                                {touched.birthDate && errors.birthDate && (
                                    <p className="text-sm text-red-600">{errors.birthDate}</p>
                                )}
                            </div>

                            {/* Email (alleen username) */}
                            <div className="space-y-2">
                                <Label htmlFor="username">Emailadres *</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="emailadres zonder @domein"
                                        value={username}
                                        onChange={(e) => { setUsername(e.target.value.replace('@', '')); if (touched.username) validateField('username', e.target.value.replace('@', '')); }}
                                        onBlur={() => handleBlur('username')}
                                        required
                                        className={`flex-1 ${touched.username && errors.username ? 'border-red-500' : ''}`}
                                    />
                                    <span className="text-gray-600 whitespace-nowrap">@bluemonkeysit.nl</span>
                                </div>
                                {touched.username && errors.username && (
                                    <p className="text-sm text-red-600">{errors.username}</p>
                                )}
                            </div>

                            {/* Wachtwoord met live feedback */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Wachtwoord *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Kies een sterk wachtwoord"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); if (touched.password) validateField('password', e.target.value); }}
                                    onBlur={() => handleBlur('password')}
                                    required
                                    className={touched.password && errors.password ? 'border-red-500' : ''}
                                />
                                {password && (
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

                            {/* Bevestig wachtwoord */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Bevestig wachtwoord *</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Herhaal je wachtwoord"
                                    value={confirmPassword}
                                    onChange={(e) => { setConfirmPassword(e.target.value); if (touched.confirmPassword) validateField('confirmPassword', e.target.value); }}
                                    onBlur={() => handleBlur('confirmPassword')}
                                    required
                                    className={touched.confirmPassword && errors.confirmPassword ? 'border-red-500' : ''}
                                />
                                {touched.confirmPassword && errors.confirmPassword && (
                                    <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                                )}
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col space-y-4">
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading || !allPasswordChecksPassed}
                            >
                                {loading ? 'Account aanmaken...' : 'Registreren'}
                            </Button>

                            <p className="text-sm text-center text-gray-600">
                                Heb je al een account?{' '}
                                <Link
                                    to="/login"
                                    className="font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                    Log hier in
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
