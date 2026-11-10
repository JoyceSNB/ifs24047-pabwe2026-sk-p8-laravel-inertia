import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

export default function TemplateIndex({ templates, filters }) {
    const [search, setSearch] = useState(filters?.search || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/templates', { search }, { preserveState: true });
    };

    const handleClone = (templateId) => {
        router.post(`/templates/${templateId}/clone`);
    };

    return (
        <AppLayout>
            <Head title="Template Todolist Publik" />

            <div className="w-full space-y-6">
                {/* Header Banner */}
                <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
                    <div className="max-w-2xl">
                        <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3 backdrop-blur-xs">
                            Galeri Template Komunitas
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                            Template Todolist Publik
                        </h1>
                        <p className="mt-2 text-blue-100 text-sm sm:text-base leading-relaxed">
                            Jelajahi berbagai paket todolist siap pakai dari komunitas. Anda dapat menyalin dan menggunakan template ini langsung ke akun Anda tanpa perlu menyusun dari nol!
                        </p>
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="mt-6 flex gap-2 max-w-lg">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama template atau deskripsi..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
                            />
                            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <button
                            type="submit"
                            className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition shadow-sm"
                        >
                            Cari
                        </button>
                    </form>
                </div>

                {/* Templates Grid */}
                {templates.data.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-base font-semibold text-slate-800">Tidak ada template publik ditemukan</h3>
                        <p className="text-sm text-slate-500 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.data.map((tpl) => (
                            <div
                                key={tpl.id}
                                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col overflow-hidden"
                            >
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/50">
                                            {tpl.todos_count ?? tpl.todos?.length ?? 0} Tugas
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            oleh <span className="font-medium text-slate-600">{tpl.user?.name || 'Anonim'}</span>
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1 mb-2">
                                        {tpl.name}
                                    </h3>
                                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                                        {tpl.description || 'Tidak ada deskripsi untuk template ini.'}
                                    </p>

                                    {/* Preview 3 todos */}
                                    {tpl.todos && tpl.todos.length > 0 && (
                                        <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-1.5 border border-slate-100">
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Preview Item:</p>
                                            {tpl.todos.slice(0, 3).map((item) => (
                                                <div key={item.id} className="flex items-center space-x-2 text-xs text-slate-700">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                                                    <span className="truncate">{item.title}</span>
                                                </div>
                                            ))}
                                            {tpl.todos.length > 3 && (
                                                <p className="text-[11px] text-slate-400 italic">
                                                    +{tpl.todos.length - 3} item lainnya...
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <Link
                                        href={`/templates/${tpl.id}`}
                                        className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-200/70 transition"
                                    >
                                        Detail Template
                                    </Link>
                                    <button
                                        onClick={() => handleClone(tpl.id)}
                                        className="text-xs font-semibold px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition flex items-center space-x-1.5"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        <span>Gunakan Template</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {templates.links && templates.links.length > 3 && (
                    <div className="flex justify-center items-center gap-1 mt-6">
                        {templates.links.map((link, idx) => (
                            <Link
                                key={idx}
                                href={link.url || '#'}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                    link.active
                                        ? 'bg-blue-600 text-white'
                                        : link.url
                                        ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                        : 'text-slate-300 cursor-not-allowed'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

