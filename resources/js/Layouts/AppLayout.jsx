import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import ProcessingIndicator from '../Components/ProcessingIndicator';

function NavItem({ href, active, activeClass = 'bg-indigo-50 text-indigo-700', icon, children }) {
    return (
        <Link
            href={href}
            className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                active ? `${activeClass} font-semibold shadow-xs` : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
            <svg className="w-5 h-5 text-current shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
            </svg>
            <span>{children}</span>
        </Link>
    );
}

const ICONS = {
    posts: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2zM9 12h6m-6 4h6M9 8h2',
    blog: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    profile: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    allPosts: 'M4 6h16M4 10h16M4 14h16M4 18h16',
};

export default function AppLayout({ children }) {
    const page = usePage();
    const { auth, flash } = page.props;
    const url = page.url;
    const user = auth?.user;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [avatarError, setAvatarError] = useState(false);

    useEffect(() => {
        setAvatarError(false);
    }, [user?.profile_photo_path]);

    const handleLogout = (e) => {
        e.preventDefault();
        router.post('/logout');
    };

    const path = (url || '').split('?')[0];
    const isActive = (prefix) => path === prefix || path.startsWith(prefix + '/');

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            <ProcessingIndicator />

            {/* Mobile Header */}
            <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-sm">B</div>
                    <span className="font-bold text-slate-800 text-lg">BlogVerse Pro</span>
                </div>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 text-slate-600 hover:text-slate-900 rounded-lg focus:outline-none"
                    aria-label="Buka menu navigasi" aria-expanded={mobileMenuOpen}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {mobileMenuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </header>

            {/* Sidebar (hanya untuk area Dashboard & Admin) */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
                    mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="p-6 border-b border-slate-100">
                    <Link href="/" className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-lg shadow-sm">B</div>
                        <div>
                            <span className="font-bold text-slate-900 text-lg tracking-tight block leading-tight">BlogVerse</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                Pro
                            </span>
                        </div>
                    </Link>
                </div>

                {user && (
                    <div className="p-4 mx-4 my-4 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-700 text-white font-bold flex items-center justify-center shrink-0 border border-slate-200">
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
                            <p className="text-xs text-slate-600 truncate">@{user.username}</p>
                            <span className={`inline-block text-xs font-bold px-2 py-0.5 mt-1 rounded-full ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-700'
                            }`}>
                                {user.role === 'admin' ? 'ADMIN' : 'PENULIS'}
                            </span>
                        </div>
                    </div>
                )}

                <nav aria-label="Menu dashboard" className="flex-1 px-4 space-y-1.5 overflow-y-auto">
                    {user && (
                        <NavItem href="/dashboard/posts" active={isActive('/dashboard')} icon={ICONS.posts}>
                            Artikel Saya
                        </NavItem>
                    )}
                    <NavItem href="/articles" active={false} icon={ICONS.blog}>
                        Lihat Blog Publik
                    </NavItem>
                    {user && (
                        <NavItem href="/profile" active={isActive('/profile')} icon={ICONS.profile}>
                            Profil Saya
                        </NavItem>
                    )}

                    {user?.role === 'admin' && (
                        <div className="pt-4 mt-4 border-t border-slate-100 space-y-1.5">
                            <span className="px-3 text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                                Admin Area
                            </span>
                            <NavItem
                                href="/admin/users"
                                active={isActive('/admin/users')}
                                activeClass="bg-purple-50 text-purple-700"
                                icon={ICONS.users}
                            >
                                Manajemen User
                            </NavItem>
                            <NavItem
                                href="/admin/posts"
                                active={isActive('/admin/posts')}
                                activeClass="bg-purple-50 text-purple-700"
                                icon={ICONS.allPosts}
                            >
                                Semua Artikel
                            </NavItem>
                        </div>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-700 hover:bg-rose-50 transition"
                    >
                        <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Keluar (Logout)</span>
                    </button>
                </div>
            </aside>

            {mobileMenuOpen && (
                <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/40 z-30 md:hidden" />
            )}

            <main className="flex-1 flex flex-col min-w-0">
                {flash?.success && (
                    <div className="m-4 mb-0 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center space-x-2 text-sm shadow-xs">
                        <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="m-4 mb-0 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-center space-x-2 text-sm shadow-xs">
                        <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{flash.error}</span>
                    </div>
                )}

                <div className="p-4 sm:p-6 lg:p-8 flex-1">{children}</div>
            </main>
        </div>
    );
}