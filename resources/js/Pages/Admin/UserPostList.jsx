import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import Pagination from '../../Components/Pagination';
import { categoryClass, formatDate } from '../../lib/format';

export default function UserPostList({ targetUser, posts, filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const applyFilters = (nextSearch, nextStatus) => {
        router.get(`/admin/users/${targetUser.id}/posts`, { search: nextSearch, status: nextStatus }, {
            preserveState: true,
            replace: true,
        });
    };

    const items = posts?.data || [];

    return (
        <AppLayout>
            <Head title={`Artikel ${targetUser.name} - Admin`} />

            <div className="space-y-6">
                <Link href="/admin/users" className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Kembali ke Manajemen Pengguna</span>
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Artikel {targetUser.name}</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            @{targetUser.username} &middot; {targetUser.email} &middot; mode baca saja (read-only)
                        </p>
                    </div>
                    <a
                        href={`/admin/users/${targetUser.id}/posts/export`}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl transition"
                    >
                        <span>Export Excel</span>
                    </a>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        placeholder="Cari judul atau isi artikel..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            applyFilters(e.target.value, status);
                        }}
                        className="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            applyFilters(search, e.target.value);
                        }}
                        className="sm:w-48 py-2 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">Semua Status</option>
                        <option value="published">Dipublikasikan</option>
                        <option value="draft">Draf</option>
                    </select>
                </div>

                {items.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-sm text-slate-500">
                        Pengguna ini belum memiliki artikel.
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs divide-y divide-slate-100">
                        {items.map((post) => (
                            <div key={post.id} className="p-4 flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-sm text-slate-900 truncate max-w-md">{post.title}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${categoryClass(post.category)}`}>
                                    {post.category}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    post.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                    {post.is_published ? 'Dipublikasikan' : 'Draf'}
                                </span>
                                <span className="text-[11px] text-slate-500">{formatDate(post.published_at || post.created_at)}</span>
                                {post.is_published && (
                                    <Link href={`/articles/${post.slug}`} className="ml-auto text-xs font-semibold text-purple-600 hover:text-purple-800">
                                        Lihat di publik &rarr;
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <Pagination links={posts?.links} accent="purple" />
            </div>
        </AppLayout>
    );
}