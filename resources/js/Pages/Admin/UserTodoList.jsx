import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

export default function UserTodoList({ targetUser, todos, filters, statuses }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || '');

    const handleFilterChange = (newSearch, newStatus) => {
        router.get(`/admin/users/${targetUser.id}/todos`, {
            search: newSearch,
            status: newStatus,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AppLayout>
            <Head title={`Todolist: ${targetUser.name} - Admin`} />

            <div className="space-y-6">
                {/* Back Link & Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                        <Link
                            href="/admin/users"
                            className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Kembali ke Manajemen Pengguna</span>
                        </Link>

                        <div className="flex items-center space-x-3">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                Todolist: {targetUser.name}
                            </h1>
                            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono">
                                @{targetUser.username}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">
                            Mode Admin: Anda dapat memantau dan mengekspor seluruh tugas user ini (hanya baca).
                        </p>
                    </div>

                    <a
                        href={`/admin/users/${targetUser.id}/todos/export`}
                        className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Export Excel User Ini</span>
                    </a>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Cari judul atau deskripsi..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                handleFilterChange(e.target.value, statusFilter);
                            }}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    <div className="sm:w-48">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                handleFilterChange(search, e.target.value);
                            }}
                            className="w-full py-2 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="">Semua Status</option>
                            {statuses?.map((st) => (
                                <option key={st.value} value={st.value}>{st.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Todos Table */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                    {todos?.data?.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400">
                            Tidak ada todolist yang cocok dengan pencarian atau status terpilih.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                                    <tr>
                                        <th className="px-6 py-3.5">Judul</th>
                                        <th className="px-6 py-3.5">Deskripsi</th>
                                        <th className="px-6 py-3.5">Status</th>
                                        <th className="px-6 py-3.5">Tenggat</th>
                                        <th className="px-6 py-3.5">Dibuat</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {todos.data.map((todo) => (
                                        <tr key={todo.id} className="hover:bg-slate-50/60 transition">
                                            <td className="px-6 py-4 font-bold text-slate-900 max-w-xs truncate">
                                                {todo.title}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 max-w-sm truncate">
                                                {todo.description || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                                                    todo.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                                    todo.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {todo.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {todo.due_date ? todo.due_date.substring(0, 10) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                {todo.created_at ? new Date(todo.created_at).toLocaleDateString('id-ID') : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {todos?.links?.length > 3 && (
                    <div className="flex items-center justify-center space-x-1 pt-4">
                        {todos.links.map((link, idx) => (
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

