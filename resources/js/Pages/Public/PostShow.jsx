import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import PublicLayout from '../../Layouts/PublicLayout';
import MarkdownViewer from '../../Components/MarkdownViewer';
import { categoryClass, coverUrl, formatDate, readingTime } from '../../lib/format';

export default function PostShow({ post, related = [] }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const cover = coverUrl(post.cover_image_path);

    return (
        <PublicLayout>
            <Head title={post.title} />

            <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">
                <Link href="/articles" className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Semua Artikel</span>
                </Link>

                <header className="mt-6">
                    <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border ${categoryClass(post.category)}`}>
                        {post.category}
                    </span>
                    <h1 className="mt-4 text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">{post.title}</h1>
                    {post.excerpt && <p className="mt-4 text-lg text-slate-600 leading-relaxed">{post.excerpt}</p>}

                    <div className="mt-6 flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">
                            {post.author?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-sm">
                            <p className="font-semibold text-slate-900">{post.author?.name}</p>
                            <p className="text-slate-500">
                                {formatDate(post.published_at)} &middot; {readingTime(post.content)} menit baca
                            </p>
                        </div>
                    </div>
                </header>

                {cover && (
                    <img src={cover} alt={post.title} className="mt-8 w-full rounded-2xl border border-slate-200 object-cover max-h-[28rem]" />
                )}

                <div className="mt-8 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-10">
                    <MarkdownViewer content={post.content} />
                </div>

                {/* Kartu ajakan: tautan ke Login & Register di akhir artikel */}
                {!user && (
                    <div className="mt-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-8 text-center shadow-lg">
                        <h3 className="text-xl font-black">Suka dengan tulisan ini?</h3>
                        <p className="mt-2 text-indigo-100 text-sm max-w-md mx-auto">
                            Bergabunglah dengan komunitas penulis BlogVerse Pro dan bagikan gagasanmu sendiri.
                        </p>
                        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link
                                href="/login"
                                id="cta-login"
                                className="w-full sm:w-auto px-6 py-2.5 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition"
                            >
                                Masuk
                            </Link>
                            <Link
                                href="/register"
                                id="cta-register"
                                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-500/40 border border-white/40 font-bold rounded-xl hover:bg-indigo-500/60 transition"
                            >
                                Daftar Sekarang
                            </Link>
                        </div>
                    </div>
                )}
            </article>

            {related.length > 0 && (
                <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-14">
                    <h2 className="text-xl font-black text-slate-900 mb-4">Artikel Terkait</h2>
                    <div className="grid gap-4 sm:grid-cols-3">
                        {related.map((item) => (
                            <Link
                                key={item.id}
                                href={`/articles/${item.slug}`}
                                className="bg-white rounded-2xl border border-slate-200/90 p-5 hover:shadow-md transition block"
                            >
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${categoryClass(item.category)}`}>
                                    {item.category}
                                </span>
                                <h3 className="mt-3 font-bold text-slate-900 line-clamp-2">{item.title}</h3>
                                <p className="mt-2 text-xs text-slate-500">{formatDate(item.published_at)}</p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </PublicLayout>
    );
}