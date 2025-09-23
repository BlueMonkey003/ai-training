import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Utensils } from 'lucide-react';
import EmailWithDomainInput from '../components/EmailWithDomainInput';

export default function RegisterPage() {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [passwordError, setPasswordError] = useState('');
	const [loading, setLoading] = useState(false);
	const [emailError, setEmailError] = useState('');
	const { register } = useAuth();
	const navigate = useNavigate();

	const DOMAIN = '@bluemonkeysit.nl';

	const normalizeEmail = (raw: string) => {
		const trimmed = raw.trim();
		if (!trimmed) return '';
		// Neem alleen lokale deel vóór '@' en voeg domein toe
		const local = trimmed.split('@')[0];
		return `${local.toLowerCase()}${DOMAIN}`;
	};

	const validateEmail = (raw: string) => {
		const fullEmail = normalizeEmail(raw);
		// Basis check op domeinrestrictie
		if (!fullEmail.toLowerCase().endsWith(DOMAIN)) {
			setEmailError(`Alleen emailadressen met ${DOMAIN} zijn toegestaan`);
			return { ok: false, fullEmail };
		}
		// Eenvoudige structuurvalidatie
		const basicPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!basicPattern.test(fullEmail)) {
			setEmailError('Ongeldig e-mailadres');
			return { ok: false, fullEmail };
		}
		setEmailError('');
		return { ok: true, fullEmail };
	};

// Email invoer en blokkering van '@' zijn verplaatst naar EmailWithDomainInput component

	const validatePasswordComplexity = (pwd: string): { ok: boolean; message?: string } => {
		if (!pwd || pwd.length < 12) return { ok: false, message: 'Minimaal 12 karakters' };
		if (!/[a-z]/.test(pwd)) return { ok: false, message: 'Minstens één kleine letter' };
		if (!/[A-Z]/.test(pwd)) return { ok: false, message: 'Minstens één hoofdletter' };
		if (!/[0-9]/.test(pwd)) return { ok: false, message: 'Minstens één cijfer' };
		if (!/[^A-Za-z0-9]/.test(pwd)) return { ok: false, message: 'Minstens één speciaal teken' };

		const lowered = pwd.toLowerCase();
		const namePart = name.toLowerCase().replace(/\s+/g, '');
		const emailLocal = email.toLowerCase();
		if (namePart && namePart.length >= 3 && lowered.includes(namePart)) return { ok: false, message: 'Mag je naam niet bevatten' };
		if (emailLocal && emailLocal.length >= 3 && lowered.includes(emailLocal)) return { ok: false, message: 'Mag geen deel van je e-mailadres bevatten' };
		return { ok: true };
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const { ok, fullEmail } = validateEmail(email);
		if (!ok) {
			return;
		}

		const complexity = validatePasswordComplexity(password);
		if (!complexity.ok) {
			setPasswordError(complexity.message || 'Ongeldig wachtwoord');
			return;
		}

		if (password !== confirmPassword) {
			alert('Wachtwoorden komen niet overeen');
			return;
		}

		setLoading(true);

		try {
			await register(name, fullEmail, password);
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
							<div className="space-y-2">
								<Label htmlFor="name">Naam</Label>
								<Input
									id="name"
									type="text"
									placeholder="Je volledige naam"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<EmailWithDomainInput id="email" value={email} onChange={setEmail} />
								{emailError && (
									<p className="text-sm text-red-600">{emailError}</p>
								)}
								<p className="text-xs text-gray-500">Vul alleen je gebruikersnaam in (zonder @); het domein wordt automatisch toegevoegd.</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="password">Wachtwoord</Label>
								<Input
									id="password"
									type="password"
									placeholder="Minimaal 12 karakters, 1 hoofdletter, 1 kleine letter, 1 cijfer, 1 speciaal teken"
									value={password}
									onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
									required
								/>
								<ul className="text-xs text-gray-500 list-disc ml-5 space-y-0.5">
									<li>Minimaal 12 karakters</li>
									<li>Minstens 1 hoofdletter, 1 kleine letter, 1 cijfer, 1 speciaal teken</li>
									<li>Mag geen deel van je naam of e-mailadres bevatten</li>
								</ul>
								{passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
							</div>

							<div className="space-y-2">
								<Label htmlFor="confirmPassword">Bevestig wachtwoord</Label>
								<Input
									id="confirmPassword"
									type="password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
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