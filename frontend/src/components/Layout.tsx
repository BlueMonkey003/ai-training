import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, Utensils, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
    const { user, logout, isAdmin, unreadNotifications, refreshNotifications } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link to="/" className="flex items-center space-x-2">
                                <Utensils className="h-8 w-8 text-indigo-600" />
                                <span className="text-xl font-bold text-gray-900">LunchMonkeys</span>
                            </Link>

                            <div className="ml-10 flex items-baseline space-x-4">
                                <Link
                                    to="/"
                                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Dashboard
                                </Link>

                                {isAdmin && (
                                    <Link
                                        to="/restaurants"
                                        className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
                                    >
                                        <Building2 className="h-4 w-4" />
                                        <span>Restaurants</span>
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <Link
                                to="/notifications"
                                className="relative p-2 text-gray-600 hover:text-gray-900"
                                onClick={refreshNotifications}
                            >
                                <Bell className="h-6 w-6" />
                                {unreadNotifications > 0 && (
                                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                                        {unreadNotifications}
                                    </span>
                                )}
                            </Link>

                            <div className="relative group">
                                <button className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900">
                                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                        {user?.profileImageUrl ? (
                                            <img
                                                src={user.profileImageUrl}
                                                alt={user.name}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <User className="h-5 w-5" />
                                        )}
                                    </div>
                                    <span className="text-sm font-medium">{user?.name}</span>
                                </button>

                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                    <Link
                                        to="/profile"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Profiel
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <LogOut className="inline h-4 w-4 mr-2" />
                                        Uitloggen
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
} 