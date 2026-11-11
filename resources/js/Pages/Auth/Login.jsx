import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        login: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <Head title="Masuk" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <Link href="/" className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 items-center justify-center text-white font-black text-2xl shadow-md">
                    B
                </Link>
                <h1 className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight">
                    BlogVerse Pro
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                    Masuk untuk menulis dan mengelola artikel Anda
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
                    <form onSubmit={submit} className="space-y-5">
                        {errors.login && (
                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                                {errors.login}
                            </div>
                        )}

                        <div>
                            <label
                                htmlFor="login-username"
                                className="block text-sm font-semibold text-slate-700"
                            >
                                Username atau Email
                            </label>
                            <div className="mt-1.5">
                                <input
                                    id="login-username"
                                    type="text"
                                    name="login"
                                    value={data.login}
                                    onChange={(e) => setData('login', e.target.value)}
                                    autoComplete="username"
                                    required
                                    className="block w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 shadow-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="Masukkan username atau email"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="login-password"
                                className="block text-sm font-semibold text-slate-700"
                            >
                                Password
                            </label>
                            <div className="mt-1.5">
                                <input
                                    id="login-password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    autoComplete="current-password"
                                    required
                                    className="block w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 shadow-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-xs text-rose-700">{errors.password}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                />
                                <span>Ingat saya</span>
                            </label>
                        </div>

                        <div>
                            <button
                                id="login-submit"
                                type="submit"
                                disabled={processing}
                                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50"
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Memproses...</span>
                                    </>
                                ) : (
                                    <span>Masuk</span>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-600">
                        Belum punya akun?{' '}
                        <Link
                            href="/register"
                            className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
                        >
                            Daftar sekarang
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