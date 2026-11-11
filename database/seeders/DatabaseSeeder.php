<?php

namespace Database\Seeders;

use App\Features\Post\Models\Post;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Administrator',
                'username' => 'admin',
                'password' => Hash::make('admin'),
                'role' => 'admin',
            ]
        );

        $member = User::firstOrCreate(
            ['email' => 'member@example.com'],
            [
                'name' => 'Member User',
                'username' => 'member',
                'password' => Hash::make('member'),
                'role' => 'member',
            ]
        );

        $posts = [
            [
                'slug' => 'memulai-laravel-13-dengan-inertia-dan-react',
                'title' => 'Memulai Laravel 13 dengan Inertia dan React',
                'category' => 'Teknologi',
                'excerpt' => 'Panduan singkat membangun aplikasi full-stack tanpa API terpisah.',
                'content' => "## Kenapa Inertia?\n\nInertia.js menjembatani **Laravel** dan **React** tanpa perlu membangun REST API terpisah.\n\n### Langkah Awal\n\n1. Buat proyek Laravel\n2. Pasang `inertiajs/inertia-laravel`\n3. Pasang `@inertiajs/react`\n\nSetelah itu, controller cukup memanggil `Inertia::render()`.",
                'is_published' => true,
            ],
            [
                'slug' => 'arsitektur-feature-first-untuk-pemula',
                'title' => 'Arsitektur Feature-First untuk Pemula',
                'category' => 'Pendidikan',
                'excerpt' => 'Mengelompokkan kode berdasarkan fitur, bukan berdasarkan jenis file.',
                'content' => "## Feature-First\n\nAlih-alih menaruh semua controller dalam satu folder, kelompokkan kode per fitur: `Post`, `Auth`, `Admin`.\n\n> Setiap fitur memiliki Controller, Service, Repository, dan Policy sendiri.",
                'is_published' => true,
            ],
            [
                'slug' => 'tips-produktif-menulis-setiap-hari',
                'title' => 'Tips Produktif Menulis Setiap Hari',
                'category' => 'Gaya Hidup',
                'excerpt' => 'Kebiasaan kecil yang membuat tulisan terus mengalir.',
                'content' => "## Mulai dari Kecil\n\nTulis **200 kata** setiap pagi. Konsistensi lebih penting daripada panjang tulisan.",
                'is_published' => true,
            ],
            [
                'slug' => 'draf-ide-artikel-berikutnya',
                'title' => 'Draf: Ide Artikel Berikutnya',
                'category' => 'Umum',
                'excerpt' => null,
                'content' => 'Catatan kasar untuk artikel yang belum diterbitkan.',
                'is_published' => false,
            ],
        ];

        foreach ($posts as $data) {
            Post::firstOrCreate(
                ['slug' => $data['slug']],
                [
                    'user_id' => $member->id,
                    'title' => $data['title'],
                    'category' => $data['category'],
                    'excerpt' => $data['excerpt'],
                    'content' => $data['content'],
                    'is_published' => $data['is_published'],
                    'published_at' => $data['is_published'] ? now() : null,
                ]
            );
        }
    }
}