import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { User, Users, ChevronRight, Shield } from 'lucide-react';
import api from '../services/api';

export default function SettingsPage() {
    const { user, isAdmin } = useAuth();
    const [version, setVersion] = useState('1.0.0');
    const [buildNumber, setBuildNumber] = useState(0);

    useEffect(() => {
        // Fetch version from health endpoint
        api.get('/health')
            .then(response => {
                if (response.data.version) {
                    setVersion(response.data.version);
                }
                if (response.data.buildNumber) {
                    setBuildNumber(response.data.buildNumber);
                }
            })
            .catch(() => {
                // Silently fail, use default version
            });
    }, []);

    return (
        <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-0">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Instellingen</h1>
                <p className="mt-2 text-sm sm:text-base text-gray-600">
                    Beheer je account en applicatie instellingen
                </p>
            </div>

            {/* Account Settings */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Account</h2>

                <Link to="/profile">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <User className="h-5 w-5 text-gray-600" />
                                    <div>
                                        <CardTitle className="text-base">Profiel</CardTitle>
                                        <CardDescription className="text-sm">
                                            Beheer je persoonlijke gegevens en profielfoto
                                        </CardDescription>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                            </div>
                        </CardHeader>
                    </Card>
                </Link>
            </div>

            {/* Admin Settings */}
            {isAdmin && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Beheer</h2>

                    <Link to="/users">
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Users className="h-5 w-5 text-gray-600" />
                                        <div>
                                            <CardTitle className="text-base">Gebruikersbeheer</CardTitle>
                                            <CardDescription className="text-sm">
                                                Beheer gebruikers, rollen en toegang
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-gray-400" />
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link to="/restaurants">
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Shield className="h-5 w-5 text-gray-600" />
                                        <div>
                                            <CardTitle className="text-base">Restaurants</CardTitle>
                                            <CardDescription className="text-sm">
                                                Beheer restaurants voor lunchbestellingen
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-gray-400" />
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                </div>
            )}

            {/* App Info */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Over</h2>

                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Versie</span>
                                <span className="font-medium">{version} (build {buildNumber})</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Ontwikkeld door</span>
                                <span className="font-medium">BlueMonkeys IT</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Je rol</span>
                                <span className="font-medium">{isAdmin ? 'Administrator' : 'Medewerker'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
