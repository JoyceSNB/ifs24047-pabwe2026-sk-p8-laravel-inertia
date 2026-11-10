import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import MarkdownEditor from '../../Components/MarkdownEditor';
import MarkdownViewer from '../../Components/MarkdownViewer';

export default function TodoShow({ todo, statuses }) {
    const [showEditModal, setShowEditModal] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [confirmingCoverDelete, setConfirmingCoverDelete] = useState(false);

    // Edit form
    const editForm = useForm({
        title: todo.title,
        description: todo.description || '',
        status: todo.status,
        due_date: todo.due_date ? todo.due_date.substring(0, 10) : '',
    });

    // Cover upload form
    const coverForm = useForm({
        coverPhoto: null,
    });

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.put(`/todos/${todo.id}`, {
            onSuccess: () => setShowEditModal(false),
        });
    };

    const toggleComplete = () => {
        router.patch(`/todos/${todo.id}/toggle`, {}, {
            preserveScroll: true,
        });
    };

    const deleteTodo = () => {
        router.delete(`/todos/${todo.id}`);
    };

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        router.post(`/todos/${todo.id}/cover`, { coverPhoto: file }, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const deleteCover = () => {
        router.delete(`/todos/${todo.id}/cover`, {
            preserveScroll: true,
            onSuccess: () => setConfirmingCoverDelete(false),
        });
    };

    const isCompleted = todo.status === 'completed';

    return (
        <AppLayout>
            <Head title={todo.title} />

            <div className="w-full space-y-6">
                {/* Back Button & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <Link
                        href="/todos"
                        className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Kembali ke Todolist</span>
                    </Link>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={toggleComplete}
                            className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition flex items-center space-x-1.5 ${
                                isCompleted
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{isCompleted ? 'Tandai Belum Selesai' : 'Tandai Selesai'}</span>
                        </button>

                        <button
                            onClick={() => setShowEditModal(true)}
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                        >
                            Edit Todo
                        </button>

                        <button
                            onClick={() => setConfirmingDelete(true)}
                            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold rounded-xl transition"
                        >
                            Hapus
                        </button>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                    {/* Cover Section */}
                    {todo.cover_image_path ? (
                        <div className="relative h-64 sm:h-80 w-full bg-slate-900 group overflow-hidden">
                            <img
                                src={`/storage/${todo.cover_image_path}`}
                                alt={todo.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-between p-6">
                                <div className="text-white">
                                    <span className="text-xs font-semibold bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full uppercase tracking-wider">
                                        Cover Image
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <label className="cursor-pointer px-3 py-1.5 bg-white/90 hover:bg-white text-slate-800 text-xs font-semibold rounded-lg shadow-sm backdrop-blur-xs transition">
                                        Ganti Cover
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleCoverChange}
                                            className="hidden"
                                        />
                                    </label>
                                    <button
                                        onClick={() => setConfirmingCoverDelete(true)}
                                        className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg shadow-sm backdrop-blur-xs transition"
                                    >
                                        Hapus Cover
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center space-x-3 text-slate-500 text-xs">
                                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>Belum ada foto sampul (cover). Anda dapat mengunggah gambar pendukung tugas.</span>
                            </div>
                            <label className="cursor-pointer px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition shrink-0">
                                + Unggah Cover
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleCoverChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    )}

                    {/* Content Section */}
                    <div className="p-6 sm:p-8 space-y-6">
                        <div>
                            <div className="flex items-center space-x-2.5 mb-2">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                    todo.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                    todo.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                    'bg-amber-100 text-amber-800'
                                }`}>
                                    {todo.status.replace('_', ' ')}
                                </span>
                                {todo.due_date && (
                                    <span className="text-xs text-slate-500">
                                        Tenggat: <strong className="text-slate-700">{todo.due_date}</strong>
                                    </span>
                                )}
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                                {todo.title}
                            </h1>
                            <p className="text-xs text-slate-400 mt-1">
                                Dibuat pada {todo.created_at || '-'}
                            </p>
                        </div>

                        {/* Description / Markdown */}
                        <div className="pt-6 border-t border-slate-100">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                                Deskripsi & Catatan (Markdown)
                            </h2>
                            {todo.description ? (
                                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                                    <MarkdownViewer content={todo.description} />
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 italic">Tidak ada deskripsi tambahan.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal (Full Screen dengan tombol di sebelah kanan) */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex flex-col bg-white">
                    {/* Distinct Header Color */}
                    <div className="px-6 md:px-8 py-4 bg-blue-600 text-white flex items-center justify-between shrink-0 shadow-xs">
                        <div className="flex items-center space-x-3">
                            <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm">
                                ✎
                            </span>
                            <div>
                                <h3 className="text-base font-bold leading-tight">Edit Todo</h3>
                                <p className="text-xs text-blue-100">Perbarui judul, status, tenggat waktu, dan catatan markdown tugas Anda</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowEditModal(false)}
                            className="text-blue-100 hover:text-white p-1.5 rounded-xl hover:bg-blue-700 transition"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={submitEdit} className="flex-1 flex flex-col justify-between overflow-hidden">
                        <div className="flex-1 p-6 md:p-8 space-y-5 overflow-y-auto w-full">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Judul Todo *
                                </label>
                                <input
                                    type="text"
                                    value={editForm.data.title}
                                    onChange={(e) => editForm.setData('title', e.target.value)}
                                    required
                                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                                />
                                {editForm.errors.title && <p className="mt-1 text-xs text-rose-600">{editForm.errors.title}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                        Status
                                    </label>
                                    <select
                                        value={editForm.data.status}
                                        onChange={(e) => editForm.setData('status', e.target.value)}
                                        className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">Sedang Dikerjakan</option>
                                        <option value="completed">Selesai</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                        Tenggat Waktu
                                    </label>
                                    <input
                                        type="date"
                                        value={editForm.data.due_date}
                                        onChange={(e) => editForm.setData('due_date', e.target.value)}
                                        className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                    Deskripsi Todo (Toast UI Markdown Editor)
                                </label>
                                <MarkdownEditor
                                    key={`detail-edit-${todo.id}`}
                                    value={editForm.data.description}
                                    onChange={(val) => editForm.setData('description', val)}
                                    height="480px"
                                    placeholder="Tuliskan catatan atau rencana detail tugas dalam format Markdown..."
                                />
                                {editForm.errors.description && <p className="mt-1 text-xs text-rose-600">{editForm.errors.description}</p>}
                            </div>
                        </div>

                        {/* Distinct Footer Color with Buttons on the Right */}
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
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition inline-flex items-center space-x-2"
                            >
                                {editForm.processing ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <span>Simpan Perubahan</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Confirm Delete Todo Modal */}
            {confirmingDelete && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-100 overflow-hidden text-center">
                        <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between text-left">
                            <div className="flex items-center space-x-2 text-rose-700">
                                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <h3 className="text-sm font-bold">Hapus Todo</h3>
                            </div>
                            <button onClick={() => setConfirmingDelete(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <div className="p-6">
                            <h3 className="text-base font-bold text-slate-900">Hapus Todo Ini?</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Seluruh data todo "{todo.title}" akan dihapus permanen.
                            </p>
                        </div>
                        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-center space-x-2">
                            <button
                                onClick={() => setConfirmingDelete(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                onClick={deleteTodo}
                                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                            >
                                Ya, Hapus Todo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Delete Cover Modal */}
            {confirmingCoverDelete && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-100 overflow-hidden text-center">
                        <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between text-left">
                            <div className="flex items-center space-x-2 text-rose-700">
                                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <h3 className="text-sm font-bold">Hapus Cover Sampul</h3>
                            </div>
                            <button onClick={() => setConfirmingCoverDelete(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <div className="p-6">
                            <h3 className="text-base font-bold text-slate-900">Hapus Cover Sampul?</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Foto cover pada todo ini akan dihapus dari penyimpanan.
                            </p>
                        </div>
                        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-center space-x-2">
                            <button
                                onClick={() => setConfirmingCoverDelete(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                onClick={deleteCover}
                                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                            >
                                Ya, Hapus Cover
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

