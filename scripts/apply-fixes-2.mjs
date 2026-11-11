// Bagian 2 (sisa langkah 5). Aman untuk file berakhiran baris Windows (CRLF) dan aman dijalankan ulang.
import fs from 'node:fs';
const P = (f) => 'resources/js/' + f;
const edit = (p, fn) => {
    const before = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
    fs.writeFileSync(p, fn(before), 'utf8');
};
const report = [];
const swap = (s, label, re, to) => {
    if (typeof re === 'string' ? s.includes(re) : re.test(s)) { report.push(`OK      ${label}`); return s.replace(re, to); }
    report.push(`LEWAT   ${label} (tidak ditemukan / sudah terpasang)`);
    return s;
};

edit(P('Pages/Public/PostIndex.jsx'), (s) => {
    if (!s.includes('head-key="description"')) {
        s = swap(s, 'PostIndex: meta description', /<Head title=\{isHome \? 'Beranda' : 'Artikel'\} \/>/,
`<Head title={isHome ? 'Beranda' : 'Artikel'}>
                <meta head-key="description" name="description" content="Baca artikel terbaru dari para penulis BlogVerse Pro, platform publikasi artikel gratis." />
            </Head>`);
    }
    if (!s.includes('id="search-articles"')) {
        s = swap(s, 'PostIndex: label kolom cari', /<input\s+type="text"\s+placeholder="Cari judul atau isi artikel\.\.\."/,
`<label htmlFor="search-articles" className="sr-only">Cari artikel</label>
                        <input
                            id="search-articles"
                            type="search"
                            placeholder="Cari judul atau isi artikel..."`);
    }
    s = swap(s, 'PostIndex: svg dekoratif', /<svg className="w-4 h-4 text-slate-600 absolute/, '<svg aria-hidden="true" className="w-4 h-4 text-slate-600 absolute');
    s = swap(s, 'PostIndex: h3 kartu -> h2', /<h3 className="mt-3 text-lg font-bold([^>]*)>([\s\S]*?)<\/h3>/, '<h2 className="mt-3 text-lg font-bold$1>$2</h2>');
    s = swap(s, 'PostIndex: h3 kosong -> h2', /<h3 className="text-base font-bold text-slate-800">Belum ada artikel yang cocok<\/h3>/, '<h2 className="text-base font-bold text-slate-800">Belum ada artikel yang cocok</h2>');
    s = swap(s, 'PostIndex: link gambar dekoratif', /<Link href=\{`\/articles\/\$\{post\.slug\}`\} className="block h-44/, '<Link href={`/articles/${post.slug}`} tabIndex={-1} aria-hidden="true" className="block h-44');
    s = swap(s, 'PostIndex: img lazy', /<img src=\{cover\} alt=\{post\.title\} className="w-full/, '<img src={cover} alt="" loading="lazy" decoding="async" width="400" height="176" className="w-full');
    s = swap(s, 'PostIndex: aria-pressed', /<button(\s+)onClick=\{\(\) => \{ setCategory\(''\);/, '<button$1aria-pressed={!category}$1onClick={() => { setCategory(\'\');');
    return s;
});

edit(P('Pages/Public/PostShow.jsx'), (s) => {
    if (!s.includes('head-key="description"')) {
        s = swap(s, 'PostShow: meta description', /<Head title=\{post\.title\} \/>/,
`<Head title={post.title}>
                <meta head-key="description" name="description" content={post.excerpt || \`Baca artikel \${post.title} di BlogVerse Pro.\`} />
            </Head>`);
    }
    s = swap(s, 'PostShow: gambar sampul', /<img src=\{cover\} alt=\{post\.title\} className="mt-8/, '<img src={cover} alt={post.title} fetchpriority="high" decoding="async" width="768" height="448" className="mt-8');
    s = swap(s, 'PostShow: h3 CTA -> h2', /<h3 className="text-xl font-black">Suka dengan tulisan ini\?<\/h3>/, '<h2 className="text-xl font-black">Suka dengan tulisan ini?</h2>');
    return s;
});

// Pastikan aria-label select filter terpasang (tahan CRLF), lalu cek
for (const f of ['Pages/Post/Index.jsx', 'Pages/Admin/PostList.jsx', 'Pages/Admin/UserPostList.jsx']) {
    edit(P(f), (s) => {
        s = s.replace(/<select(\s+)(?!aria-label)(value=\{(?:statusFilter|status)\})/g, '<select$1aria-label="Filter status" $2');
        s = s.replace(/<select(\s+)(?!aria-label)(value=\{(?:categoryFilter|category)\})/g, '<select$1aria-label="Filter kategori" $2');
        const n = (s.match(/aria-label="Filter /g) || []).length;
        report.push(`CEK     ${f}: ${n} select berlabel`);
        return s;
    });
}
console.log(report.join('\n'));
console.log('\nSelesai. Jalankan: npm run build');