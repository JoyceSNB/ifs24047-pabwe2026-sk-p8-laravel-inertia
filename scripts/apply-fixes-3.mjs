// Bagian 3: sisa kontras warna (dari laporan Axe) + lang="id". Jalankan SEKALI.
import fs from 'node:fs';
import path from 'node:path';
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const edit = (p, fn) => fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8')), 'utf8');

// 1. Warna teks status/aksi yang kontrasnya < 4.5:1
for (const f of walk('resources/js').filter((x) => x.endsWith('.jsx'))) {
    edit(f, (s) => s
        .replaceAll('text-amber-600', 'text-amber-700')
        .replaceAll('text-rose-600', 'text-rose-700')
        .replaceAll('text-emerald-600', 'text-emerald-700'));
}

// 2. Kode inline di artikel (Toast UI) berwarna pucat -> gelapkan
edit('resources/css/app.css', (s) => s + `
/* Kontras kode inline pada konten markdown (WCAG AA) */
.toastui-editor-contents.toastui-editor-contents code,
.toastui-editor-contents.toastui-editor-contents p code {
    color: #8a2c43;
    background-color: #f9f2f4;
}
`);

// 3. Bahasa dokumen
edit('resources/views/app.blade.php', (s) => s.replace(/<html lang="[^"]*"/, '<html lang="id"'));
console.log('Selesai. Jalankan: npm run build');