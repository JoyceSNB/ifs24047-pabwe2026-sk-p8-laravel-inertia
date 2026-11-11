import React, { useState, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

export default function ProfileEdit({ user }) {
    // Info Form
    const infoForm = useForm({
        name: user.name,
        username: user.username,
        email: user.email,
    });

    // Password Form
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // Photo Preview & Upload State
    const [previewUrl, setPreviewUrl] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
    const [confirmingPhotoDelete, setConfirmingPhotoDelete] = useState(false);
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [user.profile_photo_path]);

    const submitInfo = (e) => {
        e.preventDefault();
        infoForm.patch('/profile');
    };

    const submitPassword = (e) => {
        e.preventDefault();
        passwordForm.put('/profile/password', {
            onSuccess: () => passwordForm.reset(),
        });
    };

    const handlePhotoSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const uploadPhoto = () => {
        if (!selectedFile) return;
        setIsUploadingPhoto(true);

        const formData = new FormData();
        formData.append('photo', selectedFile);

        router.post('/profile/photo', formData, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => {
                setIsUploadingPhoto(false);
                setSelectedFile(null);
                setPreviewUrl(null);
            },
        });
    };

    const deletePhoto = () => {
        setIsDeletingPhoto(true);
        router.delete('/profile/photo', {
            preserveScroll: true,
            onSuccess: () => setConfirmingPhotoDelete(false),
            onFinish: () => setIsDeletingPhoto(false),
        });
    };

    return (
        <AppLayout>
            <Head title="Profil Saya" />

            <div className="w-full space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pengaturan Profil</h1>
                    <p className="text-sm text-slate-600 mt-0.5">
                        Kelola data diri, foto avatar 1:1, dan keamanan kata sandi akun Anda
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Avatar */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col items-center text-center">
                        <h2 className="text-sm font-bold text-slate-800 self-start mb-4">Foto Profil (1:1)</h2>

                        <div className="relative w-36 h-36 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner mb-4 bg-slate-100 flex items-center justify-center">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : user.profile_photo_path && !imgError ? (
                                <img
                                    src={`/storage/${user.profile_photo_path}`}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-3xl">
                                    {user.name?.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                        </div>

                        <div className="w-full space-y-2">
                            {previewUrl ? (
                                <div className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={uploadPhoto}
                                        disabled={isUploadingPhoto}
                                        className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
                                    >
                                        {isUploadingPhoto ? (
                                            <>
                                                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Menyimpan...</span>
                                            </>
                                        ) : (
                                            <span>Simpan Foto Baru</span>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPreviewUrl(null);
                                            setSelectedFile(null);
                                        }}
                                        className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                                    >
                                        Batal
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <label className="cursor-pointer w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center space-x-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        </svg>
                                        <span>Unggah Foto Baru</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoSelect}
                                            className="hidden"
                                        />
                                    </label>

                                    {user.profile_photo_path && (
                                        <button
                                            type="button"
                                            onClick={() => setConfirmingPhotoDelete(true)}
                                            className="w-full py-2 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-xl border border-rose-200 transition"
                                        >
                                            Hapus Foto Profil
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        <p className="text-[11px] text-slate-600 mt-4 leading-relaxed">
                            Mendukung JPG, PNG, GIF hingga 5MB. Foto diproses otomatis menjadi rasio 1:1.
                        </p>
                    </div>

                    {/* Right Columns: Forms */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Personal Info Form */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
                            <h2 className="text-sm font-bold text-slate-800 mb-1">Identitas Akun</h2>
                            <p className="text-xs text-slate-600 mb-4">Perbarui informasi profil dan alamat email Anda</p>

                            <form onSubmit={submitInfo} className="space-y-4">
                                <div>
                                    <label htmlFor="prof-1" className="block text-xs font-semibold text-slate-700">Nama Lengkap</label>
                                    <input id="prof-1"
                                        type="text"
                                        value={infoForm.data.name}
                                        onChange={(e) => infoForm.setData('name', e.target.value)}
                                        required
                                        className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                    {infoForm.errors.name && <p className="mt-1 text-xs text-rose-600">{infoForm.errors.name}</p>}
                                </div>

                                <div>
                                    <label htmlFor="prof-2" className="block text-xs font-semibold text-slate-700">Username</label>
                                    <input id="prof-2"
                                        type="text"
                                        value={infoForm.data.username}
                                        onChange={(e) => infoForm.setData('username', e.target.value)}
                                        required
                                        className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                    {infoForm.errors.username && <p className="mt-1 text-xs text-rose-600">{infoForm.errors.username}</p>}
                                </div>

                                <div>
                                    <label htmlFor="prof-3" className="block text-xs font-semibold text-slate-700">Email</label>
                                    <input id="prof-3"
                                        type="email"
                                        value={infoForm.data.email}
                                        onChange={(e) => infoForm.setData('email', e.target.value)}
                                        required
                                        className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                    {infoForm.errors.email && <p className="mt-1 text-xs text-rose-600">{infoForm.errors.email}</p>}
                                </div>

                                <div className="pt-2 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={infoForm.processing}
                                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50 flex items-center space-x-1.5"
                                    >
                                        {infoForm.processing ? (
                                            <>
                                                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Menyimpan...</span>
                                            </>
                                        ) : (
                                            <span>Simpan Profil</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Password Form */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
                            <h2 className="text-sm font-bold text-slate-800 mb-1">Perbarui Password</h2>
                            <p className="text-xs text-slate-600 mb-4">Gunakan password yang kuat untuk menjaga keamanan akun Anda</p>

                            <form onSubmit={submitPassword} className="space-y-4">
                                <div>
                                    <label htmlFor="prof-4" className="block text-xs font-semibold text-slate-700">Password Saat Ini</label>
                                    <input id="prof-4"
                                        type="password"
                                        value={passwordForm.data.current_password}
                                        onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                        required
                                        className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                    {passwordForm.errors.current_password && (
                                        <p className="mt-1 text-xs text-rose-600">{passwordForm.errors.current_password}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="prof-5" className="block text-xs font-semibold text-slate-700">Password Baru</label>
                                    <input id="prof-5"
                                        type="password"
                                        value={passwordForm.data.password}
                                        onChange={(e) => passwordForm.setData('password', e.target.value)}
                                        required
                                        className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                    {passwordForm.errors.password && (
                                        <p className="mt-1 text-xs text-rose-600">{passwordForm.errors.password}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="prof-6" className="block text-xs font-semibold text-slate-700">Konfirmasi Password Baru</label>
                                    <input id="prof-6"
                                        type="password"
                                        value={passwordForm.data.password_confirmation}
                                        onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                        required
                                        className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="pt-2 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={passwordForm.processing}
                                        className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50 flex items-center space-x-1.5"
                                    >
                                        {passwordForm.processing ? (
                                            <>
                                                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Menyimpan...</span>
                                            </>
                                        ) : (
                                            <span>Perbarui Password</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Delete Photo Modal */}
            {confirmingPhotoDelete && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center">
                        <h3 className="text-base font-bold text-slate-900">Hapus Foto Profil?</h3>
                        <p className="text-xs text-slate-600 mt-1">
                            Foto profil Anda akan dihapus dan digantikan inisial nama.
                        </p>
                        <div className="mt-5 flex items-center justify-center space-x-2">
                            <button
                                onClick={() => setConfirmingPhotoDelete(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                onClick={deletePhoto}
                                disabled={isDeletingPhoto}
                                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
                            >
                                {isDeletingPhoto ? (
                                    <>
                                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Menghapus...</span>
                                    </>
                                ) : (
                                    <span>Ya, Hapus Foto</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

