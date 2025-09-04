import { useState, useEffect } from 'react';
import { userApi } from '../services/api';
import type { User } from '../../../shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
    Users,
    Shield,
    ShieldOff,
    Check,
    X,
    Key,
    Search,
    UserCheck,
    UserX
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function UserManagementPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'employee'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

    // Password reset modal state
    const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await userApi.getAll();
            setUsers(response.users);
        } catch (error) {
            toast.error('Fout bij ophalen gebruikers');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: 'admin' | 'employee') => {
        try {
            await userApi.updateRole(userId, newRole);
            toast.success('Rol bijgewerkt');
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Fout bij wijzigen rol');
        }
    };

    const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
        try {
            await userApi.toggleStatus(userId, !currentStatus);
            toast.success(`Gebruiker ${!currentStatus ? 'geactiveerd' : 'gedeactiveerd'}`);
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Fout bij wijzigen status');
        }
    };

    const handlePasswordReset = async () => {
        if (!resetPasswordUserId || !newPassword) return;

        try {
            await userApi.resetPassword(resetPasswordUserId, newPassword);
            toast.success('Wachtwoord gereset');
            setResetPasswordUserId(null);
            setNewPassword('');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Fout bij resetten wachtwoord');
        }
    };

    // Filter users
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' ? user.isActive : !user.isActive);

        return matchesSearch && matchesRole && matchesStatus;
    });

    if (loading) {
        return <div className="flex justify-center items-center h-64">Laden...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gebruikersbeheer</h1>
                <p className="mt-2 text-sm sm:text-base text-gray-600">
                    Beheer gebruikers, rollen en toegang
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{users.length}</div>
                        <p className="text-xs text-muted-foreground">Totaal gebruikers</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                            {users.filter(u => u.isActive).length}
                        </div>
                        <p className="text-xs text-muted-foreground">Actieve gebruikers</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                            {users.filter(u => u.role === 'admin').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Administrators</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                            {users.filter(u => u.role === 'employee').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Medewerkers</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Zoek op naam of email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value as any)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="all">Alle rollen</option>
                            <option value="admin">Administrators</option>
                            <option value="employee">Medewerkers</option>
                        </select>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="all">Alle statussen</option>
                            <option value="active">Actief</option>
                            <option value="inactive">Inactief</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Users List */}
            <div className="space-y-3">
                {filteredUsers.map((user) => (
                    <Card key={user._id} className={user._id === currentUser?._id ? 'border-blue-200' : ''}>
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                                        {user.profileImageUrl ? (
                                            <img
                                                src={user.profileImageUrl}
                                                alt={user.name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-lg font-medium">
                                                {user.name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-medium">
                                            {user.name}
                                            {user._id === currentUser?._id && (
                                                <span className="ml-2 text-xs text-blue-600">(Jij)</span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-600">{user.email}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.role === 'admin'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {user.role === 'admin' ? (
                                                    <><Shield className="h-3 w-3 mr-1" /> Administrator</>
                                                ) : (
                                                    <><Users className="h-3 w-3 mr-1" /> Medewerker</>
                                                )}
                                            </span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {user.isActive ? (
                                                    <><Check className="h-3 w-3 mr-1" /> Actief</>
                                                ) : (
                                                    <><X className="h-3 w-3 mr-1" /> Inactief</>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {/* Role toggle */}
                                    {user._id !== currentUser?._id && (
                                        <Button
                                            size="sm"
                                            variant={user.role === 'admin' ? 'default' : 'outline'}
                                            onClick={() => handleRoleChange(
                                                user._id,
                                                user.role === 'admin' ? 'employee' : 'admin'
                                            )}
                                        >
                                            {user.role === 'admin' ? (
                                                <><ShieldOff className="h-4 w-4 mr-1" /> Verwijder Admin</>
                                            ) : (
                                                <><Shield className="h-4 w-4 mr-1" /> Maak Admin</>
                                            )}
                                        </Button>
                                    )}

                                    {/* Status toggle */}
                                    {user._id !== currentUser?._id && (
                                        <Button
                                            size="sm"
                                            variant={user.isActive ? 'destructive' : 'outline'}
                                            onClick={() => handleStatusToggle(user._id, user.isActive)}
                                        >
                                            {user.isActive ? (
                                                <><UserX className="h-4 w-4 mr-1" /> Deactiveer</>
                                            ) : (
                                                <><UserCheck className="h-4 w-4 mr-1" /> Activeer</>
                                            )}
                                        </Button>
                                    )}

                                    {/* Reset password */}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setResetPasswordUserId(user._id)}
                                    >
                                        <Key className="h-4 w-4 mr-1" /> Reset Wachtwoord
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {filteredUsers.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Users className="h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">Geen gebruikers gevonden</h3>
                            <p className="text-gray-500 mt-1">Pas je filters aan om gebruikers te zien</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Password Reset Modal */}
            {resetPasswordUserId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Wachtwoord Resetten</CardTitle>
                            <CardDescription>
                                Voor: {users.find(u => u._id === resetPasswordUserId)?.name}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Nieuw Wachtwoord</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Minimaal 6 karakters"
                                />
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    onClick={handlePasswordReset}
                                    disabled={newPassword.length < 6}
                                >
                                    Reset Wachtwoord
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setResetPasswordUserId(null);
                                        setNewPassword('');
                                    }}
                                >
                                    Annuleren
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
