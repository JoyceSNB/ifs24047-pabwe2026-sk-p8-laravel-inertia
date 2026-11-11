// Jalankan SEKALI dari root proyek:  node scripts/apply-fixes.mjs
import fs from 'node:fs';
import path from 'node:path';

const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, s) => fs.writeFileSync(p, s, 'utf8');
const edit = (p, fn) => write(p, fn(read(p)));
const must = (s, a, b, file) => {
    if (!s.includes(a)) throw new Error(`Teks tidak ditemukan di ${file}: ${a.slice(0, 50)}`);
    return s.replace(a, b);
};
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const jsx = walk('resources/js').filter((f) => f.endsWith('.jsx'));
const P = (f) => 'resources/js/' + f;

/* ---------- 1. Code splitting: halaman & editor dimuat saat dibutuhkan ---------- */
edit(P('app.jsx'), (s) => {
    s = must(s, "import.meta.glob('./Pages/**/*.jsx', { eager: true })", "import.meta.glob('./Pages/**/*.jsx')", 'app.jsx');
    return must(s, 'return page;', 'return page();', 'app.jsx');
});

const lazyFiles = [
    ['Pages/Public/PostShow.jsx', ['MarkdownViewer']],
    ['Pages/Post/Show.jsx', ['MarkdownViewer', 'MarkdownEditor']],
    ['Pages/Post/Index.jsx', ['MarkdownEditor']],
];
for (const [f, comps] of lazyFiles) {
    edit(P(f), (s) => {
        for (const c of comps) {
            s = must(s, `import ${c} from '../../Components/${c}';`, `const ${c} = lazy(() => import('../../Components/${c}'));`, f);
        }
        s = s.replace(/import React(, \{ ([^}]*) \})? from 'react';/, (m, _a, names) =>
            `import React, { ${names ? names + ', ' : ''}lazy, Suspense } from 'react';`);
        const fb = '<Suspense fallback={<p className="text-sm text-slate-600" role="status">Memuat...</p>}>';
        s = s.replace(/(<MarkdownEditor\b[\s\S]*?\/>)/g, (m) => `${fb}\n${m}\n</Suspense>`);
        s = s.replace('<MarkdownViewer content={post.content} />', `${fb}<MarkdownViewer content={post.content} /></Suspense>`);
        return s;
    });
}

/* ---------- 2. Font eksternal dihapus, meta description, sourcemap ---------- */
edit('resources/views/app.blade.php', (s) => {
    s = s.replace(/\s*<!-- Fonts -->[\s\S]*?rel="stylesheet" \/>\n/, '\n');
    return must(s, '<title inertia>',
        '<meta name="description" inertia="description" content="BlogVerse Pro: platform publikasi artikel. Baca artikel pilihan secara gratis atau bergabung sebagai penulis.">\n    <title inertia>', 'app.blade.php');
});
edit('resources/css/app.css', (s) => must(s, "'Instrument Sans', ui-sans-serif, system-ui, sans-serif,",
    "ui-sans-serif, system-ui, 'Segoe UI', Roboto, sans-serif,", 'app.css'));
edit('vite.config.js', (s) => must(s, '    server: {', '    build: {\n        sourcemap: true,\n        chunkSizeWarningLimit: 700,\n    },\n    server: {', 'vite.config.js'));
edit('public/.htaccess', (s) => `<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml
</IfModule>

# Cache panjang untuk aset hasil build Vite (nama file ber-hash)
<IfModule mod_headers.c>
    SetEnvIf Request_URI "^/build/assets/" VITE_ASSET
    Header set Cache-Control "public, max-age=31536000, immutable" env=VITE_ASSET
</IfModule>

` + s);

/* ---------- 3. Kontras warna ---------- */
for (const f of jsx) {
    edit(f, (s) => s
        .replaceAll('text-slate-400', 'text-slate-600')
        .replaceAll('text-slate-500', 'text-slate-600')
        .replaceAll('text-slate-300 border-slate-200 cursor-not-allowed', 'text-slate-600 border-slate-200 cursor-not-allowed')
        .replaceAll('bg-indigo-500 text-white', 'bg-indigo-700 text-white')
        .replaceAll('text-white/80 select-none', 'text-indigo-700 select-none')
        .replaceAll('text-indigo-100', 'text-white')
        .replaceAll('bg-indigo-500/40 border border-white/40', 'bg-indigo-800 border border-white/60')
        .replaceAll('hover:bg-indigo-500/60', 'hover:bg-indigo-900')
        .replaceAll('text-[10px] font-bold', 'text-xs font-bold')
        .replaceAll('text-[11px] font-bold', 'text-xs font-bold'));
}
// Footer berlatar gelap harus tetap terang
edit(P('Layouts/PublicLayout.jsx'), (s) => s
    .replaceAll('text-slate-600 mb-3', 'text-slate-300 mb-3')
    .replace(/(<p className="text-sm )text-slate-600( mt-3 leading-relaxed">\s*Platform publikasi)/, '$1text-slate-300$2')
    .replace('border-t border-slate-800 py-4 text-center text-xs text-slate-600', 'border-t border-slate-800 py-4 text-center text-xs text-slate-300'));

/* ---------- 4. Landmark, heading, label ---------- */
for (const f of ['Pages/Auth/Login.jsx', 'Pages/Auth/Register.jsx']) {
    edit(P(f), (s) => {
        s = must(s, '<div className="min-h-screen bg-gradient-to-br', '<main className="min-h-screen bg-gradient-to-br', f);
        s = must(s, '<h2 className="mt-4 text-3xl', '<h1 className="mt-4 text-3xl', f);
        s = s.replace('</h2>', '</h1>');
        const end = '        </div>\n    );';
        const i = s.lastIndexOf(end);
        return s.slice(0, i) + '        </main>\n    );' + s.slice(i + end.length);
    });
}
edit(P('Layouts/AppLayout.jsx'), (s) => {
    s = must(s, '<div className="md:hidden bg-white border-b border-slate-200 px-4 py-3', '<header className="md:hidden bg-white border-b border-slate-200 px-4 py-3', 'AppLayout');
    s = must(s, '                </button>\n            </div>\n\n            {/* Sidebar', '                </button>\n            </header>\n\n            {/* Sidebar', 'AppLayout');
    s = s.replace('aria-label="Toggle Navigation"', 'aria-label="Buka menu navigasi" aria-expanded={mobileMenuOpen}');
    return s.replace('<nav className="flex-1 px-4', '<nav aria-label="Menu dashboard" className="flex-1 px-4');
});
edit(P('Layouts/PublicLayout.jsx'), (s) => s
    .replaceAll('<h4 ', '<h2 ').replaceAll('</h4>', '</h2>')
    .replace('aria-label="Toggle Navigation"', 'aria-label="Buka menu navigasi" aria-expanded={menuOpen}')
    .replace('<nav className="hidden md:flex', '<nav aria-label="Navigasi utama" className="hidden md:flex'));

// <label> -> htmlFor + id otomatis
const autolabel = (s, prefix) => {
    let n = 0;
    return s.replace(/<label className="([^"]*)">(\s*[^<{]+?\s*)<\/label>(\s*)((?:<div[^>]*>\s*)?)(<(?:input|select|textarea))(?![^>]*\bid=)/g,
        (m, cls, txt, sp, wrap, tag) => { n++; const id = `${prefix}-${n}`; return `<label htmlFor="${id}" className="${cls}">${txt}</label>${sp}${wrap}${tag} id="${id}"`; });
};
for (const [f, pre] of [['Pages/Auth/Register.jsx', 'reg'], ['Pages/Profile/Edit.jsx', 'prof'], ['Pages/Post/Index.jsx', 'post'], ['Pages/Post/Show.jsx', 'edit']]) {
    edit(P(f), (s) => autolabel(s, pre));
}
// Kolom cari & select filter
for (const f of ['Pages/Post/Index.jsx', 'Pages/Admin/PostList.jsx', 'Pages/Admin/UserList.jsx', 'Pages/Admin/UserPostList.jsx']) {
    edit(P(f), (s) => s
        .replace('placeholder="Cari judul atau isi artikel..."', 'aria-label="Cari artikel" placeholder="Cari judul atau isi artikel..."')
        .replace('placeholder="Cari berdasarkan nama, username, atau email..."', 'aria-label="Cari pengguna" placeholder="Cari berdasarkan nama, username, atau email..."')
        .replace(/(<select\n\s+)(value=\{(?:statusFilter|status)\})/g, '$1aria-label="Filter status" $2')
        .replace(/(<select\n\s+)(value=\{(?:categoryFilter|category)\})/g, '$1aria-label="Filter kategori" $2'));
}
edit(P('Pages/Post/Index.jsx'), (s) => s.replace('<h3 className="text-base font-bold text-slate-800">Belum Ada Artikel</h3>', '<h2 className="text-base font-bold text-slate-800">Belum Ada Artikel</h2>'));

/* ---------- 5. Halaman publik: heading, label, gambar, meta ---------- */
edit(P('Pages/Public/PostIndex.jsx'), (s) => {
    s = must(s, `<Head title={isHome ? 'Beranda' : 'Artikel'} />`, `<Head title={isHome ? 'Beranda' : 'Artikel'}>
                <meta head-key="description" name="description" content="Baca artikel terbaru dari para penulis BlogVerse Pro, platform publikasi artikel gratis." />
            </Head>`, 'PostIndex');
    s = must(s, `<div className="relative">
                        <input
                            type="text"`, `<div className="relative">
                        <label htmlFor="search-articles" className="sr-only">Cari artikel</label>
                        <input
                            id="search-articles"
                            type="search"`, 'PostIndex');
    s = s.replace('<svg className="w-4 h-4 text-slate-600 absolute', '<svg aria-hidden="true" className="w-4 h-4 text-slate-600 absolute');
    s = s.replace('<h3 className="mt-3 text-lg font-bold', '<h2 className="mt-3 text-lg font-bold').replace('                </h3>', '                </h2>');
    s = s.replace('<h3 className="text-base font-bold text-slate-800">Belum ada artikel yang cocok</h3>', '<h2 className="text-base font-bold text-slate-800">Belum ada artikel yang cocok</h2>');
    s = s.replace('<Link href={`/articles/${post.slug}`} className="block h-44', '<Link href={`/articles/${post.slug}`} tabIndex={-1} aria-hidden="true" className="block h-44');
    s = s.replace('<img src={cover} alt={post.title} className="w-full', '<img src={cover} alt="" loading="lazy" decoding="async" width="400" height="176" className="w-full');
    return s.replace("<button\n                            onClick={() => { setCategory('');", "<button\n                            aria-pressed={!category}\n                            onClick={() => { setCategory('');");
});
edit(P('Pages/Public/PostShow.jsx'), (s) => {
    s = must(s, '<Head title={post.title} />', `<Head title={post.title}>
                <meta head-key="description" name="description" content={post.excerpt || \`Baca artikel \${post.title} di BlogVerse Pro.\`} />
            </Head>`, 'PostShow');
    s = s.replace('<img src={cover} alt={post.title} className="mt-8', '<img src={cover} alt={post.title} fetchpriority="high" decoding="async" width="768" height="448" className="mt-8');
    return s.replace('<h3 className="text-xl font-black">Suka dengan tulisan ini?</h3>', '<h2 className="text-xl font-black">Suka dengan tulisan ini?</h2>');
});
console.log('Selesai. Jalankan: npm run build');