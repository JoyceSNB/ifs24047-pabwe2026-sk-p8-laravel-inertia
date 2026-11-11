import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import MarkdownEditor from '../../Components/MarkdownEditor';
import Pagination from '../../Components/Pagination';
import Spinner from '../../Components/Spinner';
import { categoryClass, formatDate } from '../../lib/format';

const EMPTY_FORM = {
    title: '',
    category: 'Umum',
    excerpt: '',
    content: '',
    is_published: false,
};

export default function PostIndex({ posts, filters = {}, categories = [], stats = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [categoryFilter, setCategoryFilter] = useState(filters.category || '');
    const [activeMenuId, setActiveMenuId] = useState(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.post-menu-container')) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Form Modal (Tambah / Ubah)
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const form = useForm(EMPTY_FORM);

    // Modal Hapus
    const [deletingPost, setDeletingPost] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Modal Import
    const [showImportModal, setShowImportModal] = useState(false);
    const importForm = useForm({ importFile: null });

    // Toggle cepat publish/draf
    const [togglingId, setTogglingId] = useState(null);

    // Modal AI
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiCount, setAiCount] = useState(3);
    const [aiIsGenerating, setAiIsGenerating] = useState(false);
    const [aiGeneratedItems, setAiGeneratedItems] = useState([]);
    const [aiSelectedIndices, setAiSelectedIndices] = useState([]);
    const [aiErrorMessage, setAiErrorMessage] = useState('');
    const [isSavingAi, setIsSavingAi] = useState(false);

    const applyFilters = (nextSearch, nextStatus, nextCategory) => {
        router.get('/dashboard/posts', {
            search: nextSearch,
            status: nextStatus,
            category: nextCategory,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const openCreateModal = () => {
        setEditingPost(null);
        form.setData({ ...EMPTY_FORM });
        form.clearErrors();
        setShowFormModal(true);
    };

    const openEditModal = (post) => {
        setEditingPost(post);
        form.setData({
            title: post.title,
            category: post.category,
            excerpt: post.excerpt || '',
            content: post.content || '',
            is_published: Boolean(post.is_published),
        });
        form.clearErrors();
        setShowFormModal(true);
    };

    const submitForm = (e) => {
        e.preventDefault();
        if (editingPost) {
            form.put(`/dashboard/posts/${editingPost.id}`, {
                preserveScroll: true,
                onSuccess: () => setShowFormModal(false),
            });
        } else {
            form.post('/dashboard/posts', {
                preserveScroll: true,
                onSuccess: () => setShowFormModal(false),
            });
        }
    };

    const togglePublish = (post) => {
        setTogglingId(post.id);
        router.patch(`/dashboard/posts/${post.id}/publish`, {}, {
            preserveScroll: true,
            onFinish: () => setTogglingId(null),
        });
    };

    const executeDelete = () => {
        if (!deletingPost) return;
        setIsDeleting(true);
        router.delete(`/dashboard/posts/${deletingPost.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingPost(null),
            onFinish: () => setIsDeleting(false),
        });
    };

    const submitImport = (e) => {
        e.preventDefault();
        importForm.post('/dashboard/posts/import', {
            forceFormData: true,
            onSuccess: () => {
                setShowImportModal(false);
                importForm.reset();
            },
        });
    };

    // AI Generator
    const generateAi = async () => {
        if (!aiPrompt.trim()) return;
        setAiIsGenerating(true);
        setAiErrorMessage('');

        try {
            const res = await fetch('/dashboard/posts/ai-generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    prompt: aiPrompt,
                    count: Number(aiCount),
                }),
            });

            const data = await res.json();
            if (!res.ok || data.success === false) {
                let msg = data.message || 'Gagal menghasilkan artikel dengan AI.';
                if (data.errors) {
                    const errorList = Object.values(data.errors).flat().join('. ');
                    if (errorList) msg = errorList;
                }
                setAiErrorMessage(msg);
            } else {
                const list = data.posts || data.items || [];
                setAiGeneratedItems(list);
                setAiSelectedIndices(list.map((_, i) => i));
            }
        } catch (err) {
            setAiErrorMessage(err.message || 'Terjadi kesalahan jaringan atau server tidak merespon.');
        } finally {
            setAiIsGenerating(false);
        }
    };

    const toggleAiSelect = (index) => {
        setAiSelectedIndices((prev) =>
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        );
    };

    const saveAiGenerated = () => {
        const selected = aiSelectedIndices.map((i) => aiGeneratedItems[i]);
        if (selected.length === 0) return;

        setIsSavingAi(true);
        router.post('/dashboard/posts/ai-save', { items: selected }, {
            onSuccess: () => {
                setShowAiModal(false);
                setAiGeneratedItems([]);
                setAiSelectedIndices([]);
                setAiPrompt('');
            },
            onFinish: () => setIsSavingAi(false),
        });
    };

    const items = posts?.data || [];

    return (
        <AppLayout>
            <Head title="Artikel Saya" />

            <div className="w-full space-y-6">
                <div className="w-full">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Artikel Saya</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Tulis artikel, atur status draf atau publikasi, dan kelola cover untuk pembaca BlogVerse Pro.
                    </p>
                </div>

                {/* Toolbar aksi */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        id="btn-create-post"
                        onClick={openCreateModal}
                        className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Tulis Artikel</span>
                    </button>

                    <button
                        onClick={() => setShowAiModal(true)}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold rounded-xl transition"
                    >
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>AI Generator</span>
                    </button>

                    <a
                        href="/dashboard/posts/export"
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl transition"
                    >
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Export Excel</span>
                    </a>

                    <button
                        onClick={() => setShowImportModal(true)}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl transition"
                    >
                        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span>Import</span>
                    </button>
                </div>

                {/* Kartu statistik */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center space-x-3.5">
                        <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2zM9 12h6m-6 4h6" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Artikel</span>
                            <div className="flex items-baseline space-x-1.5 mt-0.5">
                                <span id="stat-total" className="text-2xl font-black text-slate-900">{stats?.total ?? 0}</span>
                                <span className="text-xs text-slate-500 font-medium">tulisan</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center space-x-3.5">
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Selesai</span>
                            <div className="flex items-baseline space-x-1.5 mt-0.5">
                                <span id="stat-published" className="text-2xl font-black text-emerald-600">{stats?.published ?? 0}</span>
                                <span className="text-xs text-emerald-600 font-medium">dipublikasikan</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center space-x-3.5">
                        <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Belum Selesai</span>
                            <div className="flex items-baseline space-x-1.5 mt-0.5">
                                <span id="stat-draft" className="text-2xl font-black text-amber-600">{stats?.draft ?? 0}</span>
                                <span className="text-xs text-amber-600 font-medium">masih draf</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Cari judul atau isi artikel..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                applyFilters(e.target.value, statusFilter, categoryFilter);
                            }}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            applyFilters(search, e.target.value, categoryFilter);
                        }}
                        className="lg:w-44 py-2 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Semua Status</option>
                        <option value="published">Dipublikasikan</option>
                        <option value="draft">Draf</option>
                    </select>

                    <select
                        value={categoryFilter}
                        onChange={(e) => {
                            setCategoryFilter(e.target.value);
                            applyFilters(search, statusFilter, e.target.value);
                        }}
                        className="lg:w-48 py-2 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Semua Kategori</option>
                        {categories.map((cat) => (
                            <option key={cat.value} value={cat.value}>{cat.value}</option>
                        ))}
                    </select>
                </div>

                {/* Daftar artikel (format List, bukan card, tanpa deskripsi) */}
                {items.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
                        <h3 className="text-base font-bold text-slate-800">Belum Ada Artikel</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            Mulai tulis artikel pertama Anda, impor dari Excel, atau gunakan AI Generator.
                        </p>
                        <button
                            onClick={openCreateModal}
                            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                        >
                            + Tulis Artikel
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs divide-y divide-slate-100">
                        {items.map((post) => (
                            <div
                                key={post.id}
                                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                            >
                                <div className="min-w-0 flex-1 flex flex-wrap items-center gap-2">
                                    <Link
                                        href={`/dashboard/posts/${post.id}`}
                                        className="font-semibold text-sm text-slate-900 hover:text-indigo-600 transition truncate max-w-md"
                                    >
                                        {post.title}
                                    </Link>

                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${categoryClass(post.category)}`}>
                                        {post.category}
                                    </span>

                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        post.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                        {post.is_published ? 'Dipublikasikan' : 'Draf'}
                                    </span>

                                    <span className="text-[11px] text-slate-500">
                                        {post.is_published ? formatDate(post.published_at) : `Dibuat ${formatDate(post.created_at)}`}
                                    </span>

                                    {post.cover_image_path && (
                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">📷 Cover</span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => togglePublish(post)}
                                        disabled={togglingId === post.id}
                                        className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition flex items-center space-x-1.5 disabled:opacity-60 ${
                                            post.is_published
                                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                        }`}
                                    >
                                        {togglingId === post.id && <Spinner className="w-3 h-3 text-slate-500" />}
                                        <span>{post.is_published ? 'Jadikan Draf' : 'Publikasikan'}</span>
                                    </button>

                                    {/* Menu kebab */}
                                    <div className="relative post-menu-container">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenuId(activeMenuId === post.id ? null : post.id);
                                            }}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                                            title="Menu Tindakan"
                                            aria-label="Menu Tindakan"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                            </svg>
                                        </button>

                                        {activeMenuId === post.id && (
                                            <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30">
                                                {/* Detail: ikon mata, teks primary */}
                                                <Link
                                                    href={`/dashboard/posts/${post.id}`}
                                                    onClick={() => setActiveMenuId(null)}
                                                    className="w-full px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50/70 flex items-center space-x-2 transition"
                                                >
                                                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    <span>Detail</span>
                                                </Link>

                                                {/* Ubah Edit: ikon pensil, teks primary */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setActiveMenuId(null);
                                                        openEditModal(post);
                                                    }}
                                                    className="w-full px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50/70 flex items-center space-x-2 transition text-left"
                                                >
                                                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    <span>Ubah Edit</span>
                                                </button>

                                                <div className="border-t border-slate-100 my-1"></div>

                                                {/* Hapus: ikon tempat sampah, teks merah */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setActiveMenuId(null);
                                                        setDeletingPost(post);
                                                    }}
                                                    className="w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition text-left"
                                                >
                                                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    <span>Hapus</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Pagination links={posts?.links} />
            </div>

            {/* Modal Tambah/Ubah (Full Screen; header & footer beda warna; tombol di kanan footer) */}
            {showFormModal && (
                <div className="fixed inset-0 z-50 flex flex-col bg-white">
                    <div className="px-6 md:px-8 py-4 bg-indigo-700 text-white flex items-center justify-between shrink-0 shadow-xs">
                        <div>
                            <h3 className="text-base font-bold leading-tight">
                                {editingPost ? 'Ubah Artikel' : 'Tulis Artikel Baru'}
                            </h3>
                            <p className="text-xs text-indigo-200">Lengkapi judul, kategori, ringkasan, dan isi artikel dalam Markdown</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowFormModal(false)}
                            className="text-indigo-200 hover:text-white p-1.5 rounded-xl hover:bg-indigo-800 transition"
                            aria-label="Tutup"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={submitForm} className="flex-1 flex flex-col justify-between overflow-hidden">
                        <div className="flex-1 p-6 md:p-8 space-y-5 overflow-y-auto w-full">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Judul Artikel *</label>
                                <input
                                    id="post-title"
                                    type="text"
                                    value={form.data.title}
                                    onChange={(e) => form.setData('title', e.target.value)}
                                    required
                                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Contoh: Memulai Laravel 13 dengan Inertia"
                                />
                                {form.errors.title && <p className="mt-1 text-xs text-rose-600">{form.errors.title}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Kategori *</label>
                                    <select
                                        value={form.data.category}
                                        onChange={(e) => form.setData('category', e.target.value)}
                                        className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                    {form.errors.category && <p className="mt-1 text-xs text-rose-600">{form.errors.category}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Status Publikasi</label>
                                    <label className="mt-1 flex items-center space-x-2.5 px-3 py-2.5 rounded-xl border border-slate-300 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.data.is_published}
                                            onChange={(e) => form.setData('is_published', e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 border-slate-300"
                                        />
                                        <span className="text-slate-700">{form.data.is_published ? 'Publikasikan ke publik' : 'Simpan sebagai draf'}</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Ringkasan (Excerpt)</label>
                                <textarea
                                    rows={2}
                                    value={form.data.excerpt}
                                    onChange={(e) => form.setData('excerpt', e.target.value)}
                                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                                    placeholder="1-2 kalimat pemikat pembaca..."
                                />
                                {form.errors.excerpt && <p className="mt-1 text-xs text-rose-600">{form.errors.excerpt}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                    Isi Artikel (Toast UI Markdown Editor) *
                                </label>
                                <MarkdownEditor
                                    key={editingPost ? `edit-${editingPost.id}` : 'create-post'}
                                    value={form.data.content}
                                    onChange={(val) => form.setData('content', val)}
                                    height="460px"
                                    placeholder="Tulis artikel Anda dalam format Markdown..."
                                />
                                {form.errors.content && <p className="mt-1 text-xs text-rose-600">{form.errors.content}</p>}
                            </div>
                        </div>

                        <div className="px-6 md:px-8 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end space-x-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setShowFormModal(false)}
                                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition"
                            >
                                Batal
                            </button>
                            <button
                                id="post-submit"
                                type="submit"
                                disabled={form.processing}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50 flex items-center space-x-2 transition"
                            >
                                {form.processing && <Spinner className="w-3.5 h-3.5 text-white" />}
                                <span>{form.processing ? 'Menyimpan...' : editingPost ? 'Simpan Perubahan' : 'Simpan Artikel'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal Hapus */}
            {deletingPost && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-100 overflow-hidden">
                        <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
                            <h3 className="text-sm font-bold">Konfirmasi Hapus Artikel</h3>
                            <button onClick={() => setDeletingPost(null)} className="text-rose-200 hover:text-white p-1" aria-label="Tutup">✕</button>
                        </div>
                        <div className="p-6 text-center">
                            <h3 className="text-base font-bold text-slate-900">Hapus Artikel Ini?</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Artikel "{deletingPost.title}" beserta foto covernya akan dihapus secara permanen.
                            </p>
                        </div>
                        <div className="px-6 py-3.5 bg-rose-50 border-t border-rose-100 flex items-center justify-end space-x-2">
                            <button
                                onClick={() => setDeletingPost(null)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                onClick={executeDelete}
                                disabled={isDeleting}
                                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50 flex items-center space-x-1.5"
                            >
                                {isDeleting && <Spinner className="w-3.5 h-3.5 text-white" />}
                                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Artikel'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Import Excel */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between">
                            <h3 className="text-base font-bold">Import Artikel dari Excel</h3>
                            <button onClick={() => setShowImportModal(false)} className="text-slate-300 hover:text-white" aria-label="Tutup">✕</button>
                        </div>

                        <form onSubmit={submitImport}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Pilih File Excel (.xlsx, .xls, .csv)
                                    </label>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={(e) => importForm.setData('importFile', e.target.files[0])}
                                        required
                                        className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                    {importForm.errors.importFile && (
                                        <p className="mt-1 text-xs text-rose-600">{importForm.errors.importFile}</p>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-400">
                                    Urutan kolom: No, Title, Category, Excerpt, Content, Status (Published/Draft). Gunakan file hasil Export Excel sebagai templat.
                                </p>
                            </div>

                            <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowImportModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={importForm.processing}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 flex items-center space-x-1.5"
                                >
                                    {importForm.processing && <Spinner className="w-3.5 h-3.5 text-white" />}
                                    <span>{importForm.processing ? 'Mengimpor...' : 'Import Data'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal AI Generator */}
            {showAiModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-purple-100 overflow-hidden">
                        <div className="px-6 py-4 bg-purple-700 text-white flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="w-7 h-7 rounded-lg bg-white text-purple-700 flex items-center justify-center font-bold text-xs shadow-xs">AI</div>
                                <h3 className="text-base font-bold">Rancang Artikel dengan OpenAI</h3>
                            </div>
                            <button onClick={() => setShowAiModal(false)} className="text-purple-200 hover:text-white" aria-label="Tutup">✕</button>
                        </div>

                        <div className="p-6 space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Topik / Instruksi Artikel</label>
                                <textarea
                                    rows={3}
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="Contoh: Tulis artikel tentang manfaat belajar Laravel untuk mahasiswa informatika..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="flex items-center space-x-3">
                                <label className="text-xs font-semibold text-slate-700">Jumlah Artikel:</label>
                                <div className="w-24">
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={aiCount}
                                        onChange={(e) => setAiCount(e.target.value === '' ? '' : Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))}
                                        onBlur={() => { if (!aiCount || Number(aiCount) < 1) setAiCount(3); }}
                                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-center font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                        placeholder="3"
                                    />
                                </div>
                                <span className="text-xs text-slate-500">(1-10)</span>

                                <button
                                    type="button"
                                    onClick={generateAi}
                                    disabled={aiIsGenerating || !aiPrompt.trim()}
                                    className="ml-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 flex items-center space-x-1.5"
                                >
                                    {aiIsGenerating && <Spinner className="w-3.5 h-3.5 text-white" />}
                                    <span>{aiIsGenerating ? 'Sedang Merancang...' : 'Generate Artikel'}</span>
                                </button>
                            </div>

                            {aiErrorMessage && (
                                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                                    <p className="font-semibold text-rose-800">Gagal Memproses Permintaan AI:</p>
                                    <p className="mt-0.5 leading-relaxed">{aiErrorMessage}</p>
                                </div>
                            )}

                            {aiGeneratedItems.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                                    <span className="text-xs font-bold text-slate-700">
                                        Pilih artikel yang ingin disimpan sebagai draf ({aiSelectedIndices.length}/{aiGeneratedItems.length}):
                                    </span>
                                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                                        {aiGeneratedItems.map((item, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => toggleAiSelect(idx)}
                                                className={`p-3 rounded-xl border cursor-pointer transition text-xs flex items-start space-x-2.5 ${
                                                    aiSelectedIndices.includes(idx)
                                                        ? 'border-purple-500 bg-purple-50/50'
                                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={aiSelectedIndices.includes(idx)}
                                                    onChange={() => {}}
                                                    className="mt-0.5 rounded text-purple-600"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-slate-800">{item.title}</p>
                                                    <span className="inline-block mt-1 text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded">
                                                        {item.category}
                                                    </span>
                                                    {item.excerpt && <p className="mt-1 text-slate-500 line-clamp-2">{item.excerpt}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-3.5 bg-purple-50 border-t border-purple-100 flex items-center justify-end space-x-2">
                            <button
                                type="button"
                                onClick={() => setShowAiModal(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl"
                            >
                                Tutup
                            </button>
                            {aiGeneratedItems.length > 0 && (
                                <button
                                    type="button"
                                    onClick={saveAiGenerated}
                                    disabled={isSavingAi || aiSelectedIndices.length === 0}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
                                >
                                    {isSavingAi && <Spinner className="w-3.5 h-3.5 text-white" />}
                                    <span>{isSavingAi ? 'Menyimpan...' : `Simpan Terpilih (${aiSelectedIndices.length})`}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}