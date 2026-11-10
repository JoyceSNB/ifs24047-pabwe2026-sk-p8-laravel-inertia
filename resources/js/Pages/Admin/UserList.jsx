import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

export default function UserList({ users, filters }) {
    const [search, setSearch] = useState(filters?.search || '');

    const handleSearch = (val) => {
        setSearch(val);
        router.get('/admin/users', { search: val }, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AppLayout>
            <Head title="Manajemen Pengguna - Admin" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Pengguna</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Daftar seluruh akun terdaftar dan ringkasan todolist masing-masing user
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Cari berdasarkan nama, username, atau email..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="px-6 py-3.5">Pengguna</th>
                                    <th className="px-6 py-3.5">Email</th>
                                    <th className="px-6 py-3.5">Role</th>
                                    <th className="px-6 py-3.5 text-center">Jumlah Todo</th>
                                    <th className="px-6 py-3.5">Terdaftar</th>
                                    <th className="px-6 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users?.data?.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/60 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                                                    {user.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{user.name}</p>
                                                    <p className="text-slate-400">@{user.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                                                user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-700">
                                            {user.todos_count ?? 0}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/admin/users/${user.id}/todos`}
                                                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold rounded-lg transition"
                                            >
                                                <span>Lihat Todo</span>
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {users?.links?.length > 3 && (
                    <div className="flex items-center justify-center space-x-1 pt-4">
                        {users.links.map((link, idx) => (
                            <Link
                                key={idx}
                                href={link.url || '#'}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                                    link.active
                                        ? 'bg-purple-600 text-white border-purple-600'
                                        : link.url
                                        ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                        : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

