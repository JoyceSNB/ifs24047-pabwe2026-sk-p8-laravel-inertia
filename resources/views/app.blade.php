<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full bg-slate-50">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <meta name="description" inertia="description" content="BlogVerse Pro: platform publikasi artikel. Baca artikel pilihan secara gratis atau bergabung sebagai penulis.">
    <title inertia>{{ config('app.name', 'BlogVerse Pro') }}</title>

    <link rel="icon" type="image/svg+xml" href="/favicon.svg">

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    @inertiaHead
</head>
<body class="h-full font-sans antialiased text-slate-800 bg-slate-50">
    @inertia
</body>
</html>

