import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

export default function TemplateShow({ template, isOwner }) {
    const [isCloning, setIsCloning] = useState(false);

    const handleClone = () => {
        setIsCloning(true);
        router.post(`/templates/${template.id}/clone`, {}, {
            onFinish: () => setIsCloning(false),
        });
    };

    return (
        <AppLayout>
            <Head title={`Template: ${template.name}`} />

            <div className="w-full space-y-6">
                {/* Back button & Action */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/templates"
                        className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Kembali ke Galeri Template</span>
                    </Link>

                    <button
                        onClick={handleClone}
                        disabled={isCloning}
                        className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-60"
                    >
                        {isCloning ? (
                            <svg className="animate-spin w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        )}
                        <span>{isCloning ? 'Mengkloning Template...' : 'Gunakan Template Ini'}</span>
                    </button>
                </div>

                {/* Template Header Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-center space-x-2">
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-semibold rounded-full flex items-center space-x-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>Template Publik Terverifikasi</span>
                            </span>
                            {isOwner && (
                                <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200/60 text-xs font-semibold rounded-full">
                                    Template Milik Anda
                                </span>
                            )}
                        </div>

                        <span className="text-xs text-slate-500">
                            Dibuat oleh <span className="font-semibold text-slate-800">{template.user?.name || 'Anonim'}</span> (@{template.user?.username})
                        </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        {template.name}
                    </h1>

                    <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                        {template.description || 'Tidak ada deskripsi detail untuk paket template ini.'}
                    </p>

                    <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                        <div className="flex items-center space-x-1.5">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span>Total Item: <strong className="text-slate-800">{template.todos?.length || 0} tugas</strong></span>
                        </div>
                    </div>
                </div>

                {/* List of Todos in this Template (List View per user requirement) */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                            Daftar Tugas dalam Template Ini
                        </h2>
                        <span className="text-xs font-medium text-slate-500">
                            {template.todos?.length || 0} item tersimpan
                        </span>
                    </div>

                    {!template.todos || template.todos.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">
                            Belum ada item tugas dalam template ini.
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {template.todos.map((todo, idx) => (
                                <li key={todo.id || idx} className="p-4 sm:px-6 hover:bg-slate-50/70 transition flex items-center justify-between gap-4">
                                    <div className="flex items-center space-x-3 min-w-0">
                                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold flex items-center justify-center shrink-0">
                                            {idx + 1}
                                        </span>
                                        <span className="font-medium text-slate-800 text-sm truncate">
                                            {todo.title}
                                        </span>
                                    </div>

                                    {/* Priority Badge */}
                                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                                        todo.priority === 'high'
                                            ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                                            : todo.priority === 'medium'
                                            ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                    }`}>
                                        Prioritas {todo.priority ? todo.priority.toUpperCase() : 'LOW'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="p-5 bg-blue-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-xs text-blue-900 text-center sm:text-left">
                            Ketika Anda menekan tombol di samping, seluruh daftar tugas di atas akan disalin otomatis ke todolist pribadi Anda.
                        </p>
                        <button
                            onClick={handleClone}
                            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition shrink-0"
                        >
                            Gunakan Template Ini Sekarang
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

