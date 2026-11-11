import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import ProcessingIndicator from '../Components/ProcessingIndicator';

export default function PublicLayout({ children }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = (e) => {
        e.preventDefault();
        router.post('/logout');
    };

    const dashboardHref = user?.role === 'admin' ? '/admin/users' : '/dashboard/posts';
    const dashboardLabel = user?.role === 'admin' ? 'Panel Admin' : 'Dashboard Penulis';

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <ProcessingIndicator />

            {/* Sticky Top Navbar */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2.5" id="nav-brand">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
                            B
                        </div>
                        <span className="font-extrabold text-slate-900 text-lg tracking-tight">
                            BlogVerse <span className="text-indigo-600">Pro</span>
                        </span>
                    </Link>

                    <nav aria-label="Navigasi utama" className="hidden md:flex items-center space-x-1">
                        <Link href="/" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition">
                            Beranda
                        </Link>
                        <Link href="/articles" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition">
                            Artikel
                        </Link>
                    </nav>

                    <div className="hidden md:flex items-center space-x-2">
                        {user ? (
                            <>
                                <Link
                                    href={dashboardHref}
                                    className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-800 transition"
                                >
                                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                                        {user.name?.charAt(0).toUpperCase()}
                                    </span>
                                    <span>{dashboardLabel}</span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="px-3 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 rounded-xl transition"
                                >
                                    Keluar
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    id="nav-login"
                                    className="inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    <span>Masuk</span>
                                </Link>
                                <Link
                                    href="/register"
                                    id="nav-register"
                                    className="inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                    <span>Daftar</span>
                                </Link>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden p-2 text-slate-600 rounded-lg"
                        aria-label="Buka menu navigasi" aria-expanded={menuOpen}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {menuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {menuOpen && (
                    <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
                        <Link href="/" className="block px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100">Beranda</Link>
                        <Link href="/articles" className="block px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100">Artikel</Link>
                        {user ? (
                            <>
                                <Link href={dashboardHref} className="block px-3 py-2 text-sm font-semibold text-indigo-700 rounded-lg hover:bg-indigo-50">{dashboardLabel}</Link>
                                <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-sm font-semibold text-rose-700 rounded-lg hover:bg-rose-50">Keluar</button>
                            </>
                        ) : (
                            <div className="flex gap-2 pt-2">
                                <Link href="/login" className="flex-1 text-center px-3 py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl">Masuk</Link>
                                <Link href="/register" className="flex-1 text-center px-3 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl">Daftar</Link>
                            </div>
                        )}
                    </div>
                )}
            </header>

            <main className="flex-1 w-full">{children}</main>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-300 mt-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid gap-8 md:grid-cols-3">
                    <div>
                        <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-black">B</div>
                            <span className="font-extrabold text-white text-lg">BlogVerse Pro</span>
                        </div>
                        <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                            Platform publikasi artikel multi-tier: baca bebas, menulis sebagai anggota, dan dipantau oleh admin.
                        </p>
                    </div>
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Jelajahi</h2>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/" className="hover:text-white transition">Beranda Publik</Link></li>
                            <li><Link href="/articles" className="hover:text-white transition">Semua Artikel</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Bergabung</h2>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/login" id="footer-login" className="hover:text-white transition">Halaman Login</Link></li>
                            <li><Link href="/register" id="footer-register" className="hover:text-white transition">Halaman Register</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-300">
                    &copy; {new Date().getFullYear()} BlogVerse Pro &middot; PABWE IT Del
                </div>
            </footer>
        </div>
    );
}