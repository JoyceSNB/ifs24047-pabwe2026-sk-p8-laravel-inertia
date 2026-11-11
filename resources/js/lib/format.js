export function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function coverUrl(path) {
    return path ? `/storage/${path}` : null;
}

const CATEGORY_STYLES = {
    Teknologi: 'bg-blue-50 text-blue-700 border-blue-200',
    Pendidikan: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Gaya Hidup': 'bg-pink-50 text-pink-700 border-pink-200',
    Bisnis: 'bg-amber-50 text-amber-800 border-amber-200',
    Opini: 'bg-violet-50 text-violet-700 border-violet-200',
    Umum: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function categoryClass(category) {
    return CATEGORY_STYLES[category] || CATEGORY_STYLES.Umum;
}

export function readingTime(text) {
    const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
}