import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, Utensils, Building2, Menu, X, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
    const { user, logout, isAdmin, unreadNotifications, refreshNotifications } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* Logo en Desktop Menu */}
                        <div className="flex items-center">
                            <Link to="/" className="flex items-center space-x-2">
                                <Utensils className="h-8 w-8 text-indigo-600" />
                                <span className="text-lg sm:text-xl font-bold text-gray-900">LunchMonkeys</span>
                            </Link>

                            {/* Desktop Menu */}
                            <div className="hidden md:ml-10 md:flex items-baseline space-x-4">
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

                        {/* Desktop User Menu */}
                        <div className="hidden md:flex items-center space-x-4">
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
                                    <span className="hidden lg:block text-sm font-medium">{user?.name}</span>
                                </button>

                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                    <Link
                                        to="/settings"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <Settings className="inline h-4 w-4 mr-2" />
                                        Instellingen
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

                        {/* Mobile menu button */}
                        <div className="flex md:hidden items-center space-x-2">
                            <Link
                                to="/notifications"
                                className="relative p-2 text-gray-600 hover:text-gray-900"
                                onClick={refreshNotifications}
                            >
                                <Bell className="h-6 w-6" />
                                {unreadNotifications > 0 && (
                                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                                        {unreadNotifications}
                                    </span>
                                )}
                            </Link>

                            <Link to="/settings" className="p-1.5">
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                    {user?.profileImageUrl ? (
                                        <img
                                            src={user.profileImageUrl}
                                            alt={user.name}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="h-5 w-5 text-gray-600" />
                                    )}
                                </div>
                            </Link>

                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            >
                                {mobileMenuOpen ? (
                                    <X className="h-6 w-6" />
                                ) : (
                                    <Menu className="h-6 w-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-t">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            <Link
                                to="/"
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Dashboard
                            </Link>

                            {isAdmin && (
                                <Link
                                    to="/restaurants"
                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <Building2 className="inline h-4 w-4 mr-2" />
                                    Restaurants
                                </Link>
                            )}

                            <Link
                                to="/settings"
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Settings className="inline h-4 w-4 mr-2" />
                                Instellingen
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                            >
                                <LogOut className="inline h-4 w-4 mr-2" />
                                Uitloggen
                            </button>
                        </div>

                        {/* User info in mobile menu */}
                        <div className="px-4 py-3 border-t">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                    {user?.profileImageUrl ? (
                                        <img
                                            src={user.profileImageUrl}
                                            alt={user.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="h-6 w-6" />
                                    )}
                                </div>
                                <div className="ml-3">
                                    <div className="text-base font-medium text-gray-800">{user?.name}</div>
                                    <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                <Outlet />
            </main>
        </div>
    );
}