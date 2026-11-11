import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import PublicLayout from '../../Layouts/PublicLayout';
import Pagination from '../../Components/Pagination';
import { categoryClass, coverUrl, formatDate } from '../../lib/format';

function PostCard({ post }) {
    const cover = coverUrl(post.cover_image_path);

    return (
        <article className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition">
            <Link href={`/articles/${post.slug}`} tabIndex={-1} aria-hidden="true" className="block h-44 bg-gradient-to-br from-indigo-100 via-violet-100 to-fuchsia-100 overflow-hidden">
                {cover ? (
                    <img src={cover} alt="" loading="lazy" decoding="async" width="400" height="176" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl font-black text-indigo-700 select-none">
                        {post.title?.charAt(0).toUpperCase()}
                    </div>
                )}
            </Link>
            <div className="p-5 flex-1 flex flex-col">
                <span className={`self-start text-xs font-bold px-2 py-0.5 rounded-full border ${categoryClass(post.category)}`}>
                    {post.category}
                </span>
                <h2 className="mt-3 text-lg font-bold text-slate-900 leading-snug line-clamp-2">
                    <Link href={`/articles/${post.slug}`} className="hover:text-indigo-600 transition">
                        {post.title}
                    </Link>
                </h2>
                {post.excerpt && <p className="mt-2 text-sm text-slate-600 line-clamp-3">{post.excerpt}</p>}
                <div className="mt-auto pt-4 flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">{post.user?.name}</span>
                    <span>{formatDate(post.published_at)}</span>
                </div>
            </div>
        </article>
    );
}

export default function PostIndex({ posts, categories = [], filters = {}, isHome = false }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || '');

    const applyFilters = (nextSearch, nextCategory) => {
        router.get('/articles', { search: nextSearch, category: nextCategory }, {
            preserveState: true,
            replace: true,
        });
    };

    const items = posts?.data || [];

    return (
        <PublicLayout>
            <Head title={isHome ? 'Beranda' : 'Artikel'}>
                <meta head-key="description" name="description" content="Baca artikel terbaru dari para penulis BlogVerse Pro, platform publikasi artikel gratis." />
            </Head>

            {/* Hero (khusus Beranda) */}
            {isHome && (
                <section className="bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 text-white">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
                        <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-xs font-semibold tracking-wider uppercase">
                            Platform Publikasi Artikel
                        </span>
                        <h1 className="mt-5 text-4xl sm:text-5xl font-black tracking-tight leading-tight">
                            Tulis, Terbitkan, dan Temukan<br className="hidden sm:block" /> Cerita yang Layak Dibaca
                        </h1>
                        <p className="mt-5 max-w-2xl mx-auto text-white text-base sm:text-lg">
                            BlogVerse Pro mempertemukan para penulis dan pembaca. Baca artikel pilihan secara gratis, atau bergabung untuk mulai menulis.
                        </p>
                        {!user && (
                            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                                <Link
                                    href="/login"
                                    id="hero-login"
                                    className="w-full sm:w-auto px-7 py-3 bg-white text-indigo-700 font-bold rounded-xl shadow-lg hover:bg-indigo-50 transition"
                                >
                                    Masuk
                                </Link>
                                <Link
                                    href="/register"
                                    id="hero-register"
                                    className="w-full sm:w-auto px-7 py-3 bg-indigo-800 border border-white/60 text-white font-bold rounded-xl hover:bg-indigo-900 transition"
                                >
                                    Daftar Penulis
                                </Link>
                            </div>
                        )}
                        {user && (
                            <div className="mt-8">
                                <Link
                                    href={user.role === 'admin' ? '/admin/users' : '/dashboard/posts'}
                                    className="inline-block px-7 py-3 bg-white text-indigo-700 font-bold rounded-xl shadow-lg hover:bg-indigo-50 transition"
                                >
                                    Buka {user.role === 'admin' ? 'Panel Admin' : 'Dashboard Penulis'}
                                </Link>
                            </div>
                        )}
                    </div>
                </section>
            )}

            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
                {!isHome && (
                    <div className="mb-6">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Semua Artikel</h1>
                        <p className="text-slate-600 mt-1">Telusuri tulisan terbaru dari para penulis BlogVerse Pro.</p>
                    </div>
                )}
                {isHome && (
                    <div className="mb-6">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Artikel Terbaru</h2>
                    </div>
                )}

                {/* Pencarian & filter kategori */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                    <div className="relative">
                        <label htmlFor="search-articles" className="sr-only">Cari artikel</label>
                        <input
                            id="search-articles"
                            type="search"
                            placeholder="Cari judul atau isi artikel..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                applyFilters(e.target.value, category);
                            }}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <svg aria-hidden="true" className="w-4 h-4 text-slate-600 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            aria-pressed={!category}
                            onClick={() => { setCategory(''); applyFilters(search, ''); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                                !category ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            Semua
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.value}
                                onClick={() => { setCategory(cat.value); applyFilters(search, cat.value); }}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                                    category === cat.value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                {cat.value}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Galeri */}
                {items.length === 0 ? (
                    <div className="mt-8 bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
                        <h2 className="text-base font-bold text-slate-800">Belum ada artikel yang cocok</h2>
                        <p className="text-sm text-slate-600 mt-1">Coba kata kunci atau kategori yang lain.</p>
                    </div>
                ) : (
                    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                )}

                <Pagination links={posts?.links} />
            </div>
        </PublicLayout>
    );
}