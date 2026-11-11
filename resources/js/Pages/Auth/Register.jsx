import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/register');
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <Head title="Daftar Akun" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <Link href="/" className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 items-center justify-center text-white font-black text-2xl shadow-md">
                    B
                </Link>
                <h1 className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight">
                    Daftar Akun Baru
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                    Bergabung sebagai penulis dan mulai menerbitkan artikel Anda
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label htmlFor="reg-1" className="block text-sm font-semibold text-slate-700">
                                Nama Lengkap
                            </label>
                            <input id="reg-1"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 shadow-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Contoh: Budi Santoso"
                            />
                            {errors.name && <p className="mt-1 text-xs text-rose-700">{errors.name}</p>}
                        </div>

                        <div>
                            <label htmlFor="reg-2" className="block text-sm font-semibold text-slate-700">
                                Username
                            </label>
                            <input id="reg-2"
                                type="text"
                                value={data.username}
                                onChange={(e) => setData('username', e.target.value)}
                                required
                                className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 shadow-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Contoh: budi123"
                            />
                            {errors.username && <p className="mt-1 text-xs text-rose-700">{errors.username}</p>}
                        </div>

                        <div>
                            <label htmlFor="reg-3" className="block text-sm font-semibold text-slate-700">
                                Alamat Email
                            </label>
                            <input id="reg-3"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 shadow-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="budi@example.com"
                            />
                            {errors.email && <p className="mt-1 text-xs text-rose-700">{errors.email}</p>}
                        </div>

                        <div>
                            <label htmlFor="reg-4" className="block text-sm font-semibold text-slate-700">
                                Password
                            </label>
                            <input id="reg-4"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required
                                className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 shadow-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Minimal 8 karakter"
                            />
                            {errors.password && <p className="mt-1 text-xs text-rose-700">{errors.password}</p>}
                        </div>

                        <div>
                            <label htmlFor="reg-5" className="block text-sm font-semibold text-slate-700">
                                Konfirmasi Password
                            </label>
                            <input id="reg-5"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                required
                                className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 shadow-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Ulangi password"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50"
                            >
                                {processing ? 'Mendaftarkan...' : 'Daftar Sekarang'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-600">
                        Sudah punya akun?{' '}
                        <Link
                            href="/login"
                            className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
                        >
                            Masuk di sini
                        </Link>
                    </div>

                    <div className="mt-3 text-center text-sm">
                        <Link href="/" className="text-slate-600 hover:text-slate-800 hover:underline">
                            &larr; Kembali ke beranda
                </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}