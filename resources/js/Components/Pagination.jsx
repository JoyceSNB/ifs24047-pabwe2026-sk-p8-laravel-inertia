import React from 'react';
import { Link } from '@inertiajs/react';

export default function Pagination({ links = [], accent = 'indigo' }) {
    if (!links || links.length <= 3) return null;

    const activeClass = accent === 'purple'
        ? 'bg-purple-600 text-white border-purple-600'
        : 'bg-indigo-600 text-white border-indigo-600';

    return (
        <div className="flex flex-wrap items-center justify-center gap-1 pt-4">
            {links.map((link, idx) => (
                <Link
                    key={idx}
                    href={link.url || '#'}
                    preserveScroll
                    dangerouslySetInnerHTML={{ __html: link.label }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                        link.active
                            ? activeClass
                            : link.url
                            ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            : 'bg-slate-50 text-slate-600 border-slate-200 cursor-not-allowed'
                    }`}
                />
            ))}
        </div>
    );
}