import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import Pagination from '../../Components/Pagination';
import { categoryClass, formatDate } from '../../lib/format';

export default function PostList({ posts, filters = {}, categories = [] }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [category, setCategory] = useState(filters.category || '');

    const applyFilters = (nextSearch, nextStatus, nextCategory) => {
        router.get('/admin/posts', { search: nextSearch, status: nextStatus, category: nextCategory }, {
            preserveState: true,
            replace: true,
        });
    };

    const items = posts?.data || [];

    return (
        <AppLayout>
            <Head title="Semua Artikel - Admin" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Semua Artikel Sistem</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Pantau seluruh artikel dari semua penulis (read-only).</p>
                    </div>
                    <a
                        href="/admin/posts/export"
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl transition"
                    >
                        <span>Export Semua ke Excel</span>
                    </a>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row gap-3">
                    <input
                        type="text"
                        placeholder="Cari judul atau isi artikel..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            applyFilters(e.target.value, status, category);
                        }}
                        className="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            applyFilters(search, e.target.value, category);
                        }}
                        className="lg:w-44 py-2 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">Semua Status</option>
                        <option value="published">Dipublikasikan</option>
                        <option value="draft">Draf</option>
                    </select>
                    <select
                        value={category}
                        onChange={(e) => {
                            setCategory(e.target.value);
                            applyFilters(search, status, e.target.value);
                        }}
                        className="lg:w-48 py-2 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">Semua Kategori</option>
                        {categories.map((cat) => (
                            <option key={cat.value} value={cat.value}>{cat.value}</option>
                        ))}
                    </select>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="px-6 py-3.5">Judul</th>
                                    <th className="px-6 py-3.5">Penulis</th>
                                    <th className="px-6 py-3.5">Kategori</th>
                                    <th className="px-6 py-3.5">Status</th>
                                    <th className="px-6 py-3.5">Tanggal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-slate-500">Belum ada artikel.</td>
                                    </tr>
                                )}
                                {items.map((post) => (
                                    <tr key={post.id} className="hover:bg-slate-50/60 transition">
                                        <td className="px-6 py-4 font-semibold text-slate-900 max-w-xs truncate">
                                            {post.is_published ? (
                                                <Link href={`/articles/${post.slug}`} className="hover:text-purple-700">{post.title}</Link>
                                            ) : (
                                                post.title
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {post.user?.name}
                                            <span className="text-slate-400"> @{post.user?.username}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${categoryClass(post.category)}`}>
                                                {post.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                post.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                            }`}>
                                                {post.is_published ? 'Dipublikasikan' : 'Draf'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">{formatDate(post.published_at || post.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Pagination links={posts?.links} accent="purple" />
            </div>
        </AppLayout>
    );
}