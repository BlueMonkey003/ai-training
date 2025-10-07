import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Utensils, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';

export default function VerifyEmailPage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Geen geldig token gevonden');
            return;
        }

        const verifyEmail = async () => {
            try {
                const response = await api.get(`/auth/verify-email/${token}`);
                setStatus('success');
                setMessage(response.data.message || 'Email succesvol geverifieerd!');
                // Na 3 seconden naar login
                setTimeout(() => navigate('/login'), 3000);
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.error || 'Verificatie mislukt');
            }
        };

        verifyEmail();
    }, [token, navigate]);

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
                        <CardTitle>Email Verificatie</CardTitle>
                        <CardDescription>
                            {status === 'loading' && 'Bezig met verifiëren...'}
                            {status === 'success' && 'Verificatie succesvol!'}
                            {status === 'error' && 'Verificatie mislukt'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="text-center py-8">
                        {status === 'loading' && (
                            <div className="animate-pulse">
                                <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto"></div>
                                <p className="mt-4 text-gray-600">Even geduld...</p>
                            </div>
                        )}

                        {status === 'success' && (
                            <div>
                                <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
                                <p className="mt-4 text-lg font-medium text-gray-900">{message}</p>
                                <p className="mt-2 text-sm text-gray-600">Je wordt doorgestuurd naar de inlogpagina...</p>
                            </div>
                        )}

                        {status === 'error' && (
                            <div>
                                <XCircle className="h-16 w-16 text-red-600 mx-auto" />
                                <p className="mt-4 text-lg font-medium text-gray-900">{message}</p>
                                <p className="mt-2 text-sm text-gray-600">De link is mogelijk verlopen of al gebruikt.</p>
                                <div className="mt-6">
                                    <Link to="/login">
                                        <Button className="w-full">Naar Login</Button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}



