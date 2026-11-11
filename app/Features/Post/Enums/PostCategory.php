<?php

namespace App\Features\Post\Enums;

enum PostCategory: string
{
    case TEKNOLOGI = 'Teknologi';
    case PENDIDIKAN = 'Pendidikan';
    case GAYA_HIDUP = 'Gaya Hidup';
    case BISNIS = 'Bisnis';
    case OPINI = 'Opini';
    case UMUM = 'Umum';

    public function label(): string
    {
        return match ($this) {
            self::TEKNOLOGI => 'Teknologi & Koding',
            self::PENDIDIKAN => 'Pendidikan & Tutorial',
            self::GAYA_HIDUP => 'Gaya Hidup & Produktivitas',
            self::BISNIS => 'Bisnis & Karir',
            self::OPINI => 'Opini & Pemikiran',
            self::UMUM => 'Umum',
        };
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_map(fn (self $case) => $case->value, self::cases());
    }

    /** @return array<int, array{value: string, label: string}> */
    public static function options(): array
    {
        return array_map(fn (self $case) => [
            'value' => $case->value,
            'label' => $case->label(),
        ], self::cases());
    }

    public static function fromInput(?string $value): self
    {
        $needle = mb_strtolower(trim((string) $value));

        foreach (self::cases() as $case) {
            if (mb_strtolower($case->value) === $needle) {
                return $case;
            }
        }

        return self::UMUM;
    }
}