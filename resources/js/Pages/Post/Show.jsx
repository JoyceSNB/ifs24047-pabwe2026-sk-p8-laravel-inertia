import React, { useState, lazy, Suspense } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
const MarkdownEditor = lazy(() => import('../../Components/MarkdownEditor'));
const MarkdownViewer = lazy(() => import('../../Components/MarkdownViewer'));
import Spinner from '../../Components/Spinner';
import { categoryClass, coverUrl } from '../../lib/format';

export default function PostShow({ post, categories = [] }) {
    const [showEditModal, setShowEditModal] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [confirmingCoverDelete, setConfirmingCoverDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUploadingCover, setIsUploadingCover] = useState(false);

    const editForm = useForm({
        title: post.title,
        category: post.category,
        excerpt: post.excerpt || '',
        content: post.content || '',
        is_published: Boolean(post.is_published),
    });

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.put(`/dashboard/posts/${post.id}`, {
            preserveScroll: true,
            onSuccess: () => setShowEditModal(false),
        });
    };

    const togglePublish = () => {
        router.patch(`/dashboard/posts/${post.id}/publish`, {}, { preserveScroll: true });
    };

    const deletePost = () => {
        setIsDeleting(true);
        router.delete(`/dashboard/posts/${post.id}`, {
            onFinish: () => setIsDeleting(false),
        });
    };

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploadingCover(true);
        router.post(`/dashboard/posts/${post.id}/cover`, { coverPhoto: file }, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => setIsUploadingCover(false),
        });
    };

    const deleteCover = () => {
        router.delete(`/dashboard/posts/${post.id}/cover`, {
            preserveScroll: true,
            onSuccess: () => setConfirmingCoverDelete(false),
        });
    };

    const cover = coverUrl(post.cover_image_path);

    return (
        <AppLayout>
            <Head title={post.title} />

            <div className="w-full space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <Link
                        href="/dashboard/posts"
                        className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Kembali ke Artikel Saya</span>
                    </Link>

                    <div className="flex flex-wrap items-center gap-2">
                        {post.is_published && (
                            <Link
                                href={`/articles/${post.slug}`}
                                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl transition"
                            >
                                Lihat di Publik
                            </Link>
                        )}
                        <button
                            onClick={togglePublish}
                            className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition ${
                                post.is_published
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                        >
                            {post.is_published ? 'Jadikan Draf' : 'Publikasikan'}
                        </button>
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                        >
                            Ubah Artikel
                        </button>
                        <button
                            onClick={() => setConfirmingDelete(true)}
                            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition"
                        >
                            Hapus
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                    {/* Cover */}
                    {cover ? (
                        <div className="relative h-64 sm:h-80 w-full bg-slate-900 overflow-hidden">
                            <img src={cover} alt={post.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-end p-6">
                                <div className="flex items-center space-x-2">
                                    <label className="cursor-pointer px-3 py-1.5 bg-white/90 hover:bg-white text-slate-800 text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5">
                                        {isUploadingCover && <Spinner className="w-3 h-3 text-slate-600" />}
                                        <span>Ganti Cover</span>
                                        <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                                    </label>
                                    <button
                                        onClick={() => setConfirmingCoverDelete(true)}
                                        className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                                    >
                                        Hapus Cover
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-slate-700">Belum ada foto cover</p>
                                <p className="text-xs text-slate-600">Tambahkan gambar sampul (maks. 5 MB) agar artikel lebih menarik.</p>
                            </div>
                            <label className="cursor-pointer px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center space-x-1.5">
                                {isUploadingCover && <Spinner className="w-3.5 h-3.5 text-white" />}
                                <span>Unggah Cover</span>
                                <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                            </label>
                        </div>
                    )}

                    <div className="p-6 sm:p-8 space-y-5">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${categoryClass(post.category)}`}>
                                {post.category}
                            </span>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                post.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                                {post.is_published ? 'Dipublikasikan' : 'Draf'}
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{post.title}</h1>
                        {post.excerpt && <p className="text-slate-600">{post.excerpt}</p>}

                        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <dt className="font-bold uppercase tracking-wider text-slate-600">Dibuat</dt>
                                <dd className="mt-1 text-slate-700 font-semibold">{post.created_at || '-'}</dd>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <dt className="font-bold uppercase tracking-wider text-slate-600">Diperbarui</dt>
                                <dd className="mt-1 text-slate-700 font-semibold">{post.updated_at || '-'}</dd>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <dt className="font-bold uppercase tracking-wider text-slate-600">Dipublikasikan</dt>
                                <dd className="mt-1 text-slate-700 font-semibold">{post.published_at || '-'}</dd>
                            </div>
                        </dl>

                        <div className="border-t border-slate-100 pt-5">
                            <Suspense fallback={<p className="text-sm text-slate-600" role="status">Memuat...</p>}><MarkdownViewer content={post.content} /></Suspense>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Ubah (Full Screen) */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex flex-col bg-white">
                    <div className="px-6 md:px-8 py-4 bg-indigo-700 text-white flex items-center justify-between shrink-0 shadow-xs">
                        <div>
                            <h3 className="text-base font-bold leading-tight">Ubah Artikel</h3>
                            <p className="text-xs text-indigo-200">Perbarui judul, kategori, ringkasan, dan isi artikel</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowEditModal(false)}
                            className="text-indigo-200 hover:text-white p-1.5 rounded-xl hover:bg-indigo-800 transition"
                            aria-label="Tutup"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={submitEdit} className="flex-1 flex flex-col justify-between overflow-hidden">
                        <div className="flex-1 p-6 md:p-8 space-y-5 overflow-y-auto w-full">
                            <div>
                                <label htmlFor="edit-1" className="block text-xs font-bold uppercase tracking-wider text-slate-700">Judul Artikel *</label>
                                <input id="edit-1"
                                    type="text"
                                    value={editForm.data.title}
                                    onChange={(e) => editForm.setData('title', e.target.value)}
                                    required
                                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                                />
                                {editForm.errors.title && <p className="mt-1 text-xs text-rose-700">{editForm.errors.title}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="edit-2" className="block text-xs font-bold uppercase tracking-wider text-slate-700">Kategori *</label>
                                    <select id="edit-2"
                                        value={editForm.data.category}
                                        onChange={(e) => editForm.setData('category', e.target.value)}
                                        className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Status Publikasi</label>
                                    <label className="mt-1 flex items-center space-x-2.5 px-3 py-2.5 rounded-xl border border-slate-300 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editForm.data.is_published}
                                            onChange={(e) => editForm.setData('is_published', e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 border-slate-300"
                                        />
                                        <span className="text-slate-700">{editForm.data.is_published ? 'Publikasikan ke publik' : 'Simpan sebagai draf'}</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="edit-3" className="block text-xs font-bold uppercase tracking-wider text-slate-700">Ringkasan (Excerpt)</label>
                                <textarea id="edit-3"
                                    rows={2}
                                    value={editForm.data.excerpt}
                                    onChange={(e) => editForm.setData('excerpt', e.target.value)}
                                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                                />
                                {editForm.errors.excerpt && <p className="mt-1 text-xs text-rose-700">{editForm.errors.excerpt}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                    Isi Artikel (Toast UI Markdown Editor) *
                                </label>
                                <Suspense fallback={<p className="text-sm text-slate-600" role="status">Memuat...</p>}>
<MarkdownEditor
                                    key={`edit-${post.id}`}
                                    value={editForm.data.content}
                                    onChange={(val) => editForm.setData('content', val)}
                                    height="460px"
                                />
</Suspense>
                                {editForm.errors.content && <p className="mt-1 text-xs text-rose-700">{editForm.errors.content}</p>}
                            </div>
                        </div>

                        <div className="px-6 md:px-8 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end space-x-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={editForm.processing}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50 flex items-center space-x-2 transition"
                            >
                                {editForm.processing && <Spinner className="w-3.5 h-3.5 text-white" />}
                                <span>{editForm.processing ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal Hapus Artikel */}
            {confirmingDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-100 overflow-hidden">
                        <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
                            <h3 className="text-sm font-bold">Konfirmasi Hapus Artikel</h3>
                            <button onClick={() => setConfirmingDelete(false)} className="text-rose-200 hover:text-white" aria-label="Tutup">✕</button>
                        </div>
                        <div className="p-6 text-center">
                            <h3 className="text-base font-bold text-slate-900">Hapus Artikel Ini?</h3>
                            <p className="text-xs text-slate-600 mt-1">Artikel "{post.title}" dan fotonya akan dihapus permanen.</p>
                        </div>
                        <div className="px-6 py-3.5 bg-rose-50 border-t border-rose-100 flex items-center justify-end space-x-2">
                            <button onClick={() => setConfirmingDelete(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl">
                                Batal
                            </button>
                            <button
                                onClick={deletePost}
                                disabled={isDeleting}
                                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50 flex items-center space-x-1.5"
                            >
                                {isDeleting && <Spinner className="w-3.5 h-3.5 text-white" />}
                                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Hapus Cover */}
            {confirmingCoverDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-rose-100 overflow-hidden">
                        <div className="px-6 py-4 bg-rose-600 text-white">
                            <h3 className="text-sm font-bold">Hapus Foto Cover?</h3>
                        </div>
                        <div className="p-6 text-center text-xs text-slate-600">Foto cover artikel ini akan dihapus.</div>
                        <div className="px-6 py-3.5 bg-rose-50 border-t border-rose-100 flex items-center justify-end space-x-2">
                            <button onClick={() => setConfirmingCoverDelete(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl">
                                Batal
                            </button>
                            <button onClick={deleteCover} className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs">
                                Ya, Hapus Cover
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}