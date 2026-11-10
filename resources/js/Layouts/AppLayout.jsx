import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';

export default function AppLayout({ children, title }) {
    const { auth, flash } = usePage().props;
    const user = auth?.user;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        setAvatarError(false);
    }, [user?.profile_photo_path]);

    useEffect(() => {
        const removeStart = router.on('start', () => setIsProcessing(true));
        const removeFinish = router.on('finish', () => setIsProcessing(false));
        const removeError = router.on('error', () => setIsProcessing(false));
        return () => {
            removeStart();
            removeFinish();
            removeError();
        };
    }, []);

    const handleLogout = (e) => {
        e.preventDefault();
        router.post('/logout');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Top Global Loading Progress Bar */}
            {isProcessing && (
                <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                    <div className="h-full bg-white/50 w-full animate-pulse"></div>
                </div>
            )}

            {/* Floating Action Processing Badge */}
            {isProcessing && (
                <div className="fixed bottom-5 right-5 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2.5 text-xs font-semibold backdrop-blur-sm border border-slate-700/60 animate-fadeIn">
                    <svg className="animate-spin w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Memproses tindakan...</span>
                </div>
            )}
            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        T
                    </div>
                    <span className="font-bold text-slate-800 text-lg">TodoApp</span>
                </div>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 text-slate-600 hover:text-slate-900 rounded-lg focus:outline-none"
                    aria-label="Toggle Navigation"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {mobileMenuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Sidebar Navigation */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
                    mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Brand Logo */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <Link href={user ? "/todos" : "/templates"} className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            T
                        </div>
                        <div>
                            <span className="font-bold text-slate-900 text-lg tracking-tight block">TodoApp</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                Inertia React
                            </span>
                        </div>
                    </Link>
                </div>

                {/* User Card or Guest Banner */}
                {user ? (
                    <div className="p-4 mx-4 my-4 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-500 text-white font-bold flex items-center justify-center shrink-0 border border-slate-200">
                            {user.profile_photo_path && !avatarError ? (
                                <img
                                    src={`/storage/${user.profile_photo_path}`}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                    onError={() => setAvatarError(true)}
                                />
                            ) : (
                                <span>{user.name?.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate">@{user.username}</p>
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 mt-1 rounded-full ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-700'
                            }`}>
                                {user.role?.toUpperCase()}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 mx-4 my-4 bg-blue-50/70 rounded-xl border border-blue-200/60">
                        <p className="text-xs font-semibold text-blue-900">Selamat Datang, Pengunjung!</p>
                        <p className="text-xs text-blue-700 mt-1">Jelajahi template publik gratis atau masuk untuk mengelola todo Anda.</p>
                        <div className="mt-3 flex gap-2">
                            <Link
                                href="/login"
                                className="flex-1 text-center px-2.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition"
                            >
                                Masuk
                            </Link>
                            <Link
                                href="/register"
                                className="flex-1 text-center px-2.5 py-1.5 bg-white text-blue-600 border border-blue-200 text-xs font-semibold rounded-lg hover:bg-blue-50 transition"
                            >
                                Daftar
                            </Link>
                        </div>
                    </div>
                )}

                {/* Nav Links */}
                <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
                    {user && (
                        <Link
                            href="/todos"
                            className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                                window.location.pathname.startsWith('/todos')
                                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                            <svg className="w-5 h-5 text-current shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            <span>My Todolist</span>
                        </Link>
                    )}

                    <Link
                        href="/templates"
                        className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                            window.location.pathname.startsWith('/templates')
                                ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                        <svg className="w-5 h-5 text-current shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span>Template Publik</span>
                    </Link>

                    {user && (
                        <Link
                            href="/profile"
                            className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                                window.location.pathname.startsWith('/profile')
                                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                            <svg className="w-5 h-5 text-current shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Profil Saya</span>
                        </Link>
                    )}

                    {user?.role === 'admin' && (
                        <div className="pt-4 mt-4 border-t border-slate-100">
                            <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                                Admin Area
                            </span>
                            <Link
                                href="/admin/users"
                                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                                    window.location.pathname.startsWith('/admin')
                                        ? 'bg-purple-50 text-purple-700 font-semibold shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <svg className="w-5 h-5 text-current shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <span>Manajemen User</span>
                            </Link>
                        </div>
                    )}
                </nav>

                {/* Bottom Auth Action */}
                <div className="p-4 border-t border-slate-100">
                    {user ? (
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition"
                        >
                            <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Keluar (Logout)</span>
                        </button>
                    ) : (
                        <Link
                            href="/login"
                            className="w-full flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition"
                        >
                            <span>Masuk ke Akun</span>
                        </Link>
                    )}
                </div>
            </aside>

            {/* Mobile overlay */}
            {mobileMenuOpen && (
                <div
                    onClick={() => setMobileMenuOpen(false)}
                    className="fixed inset-0 bg-slate-900/40 z-30 md:hidden"
                />
            )}

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Flash Messages */}
                {flash?.success && (
                    <div className="m-4 mb-0 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between text-sm shadow-xs">
                        <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{flash.success}</span>
                        </div>
                    </div>
                )}
                {flash?.error && (
                    <div className="m-4 mb-0 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-center justify-between text-sm shadow-xs">
                        <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{flash.error}</span>
                        </div>
                    </div>
                )}

                <div className="p-4 sm:p-6 lg:p-8 flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
}
