'use client';

import { useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const supabase = createSupabaseBrowser();
  const router = useRouter();

  const [tag, setTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    setLoading(true);

    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        setError('Сначала войди');
        setLoading(false);
        return;
      }

      // Проверяем, что игрок существует
      const r = await fetch(`/api/brawl/player?tag=${encodeURIComponent(tag)}`);
      const player = await r.json();
      if (!r.ok) throw new Error(player?.message || 'Player Tag не найден');

      // Сохраняем в profiles
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, player_tag: tag.trim().toUpperCase() });

      if (upsertError) throw new Error(upsertError.message);

      router.push('/test');
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111111] p-6">
        <h1 className="text-3xl font-black mb-2">Привязка Player Tag</h1>
        <p className="text-gray-400 mb-6">Введи тег, чтобы участвовать в тестах.</p>

        {error && <div className="mb-4 text-red-300 text-sm">{error}</div>}

        <input
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="#ABC123"
          className="w-full bg-[#1a1a1a] border border-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500"
        />

        <button
          disabled={loading}
          onClick={save}
          className="mt-4 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 px-6 py-3 rounded-2xl font-semibold transition"
        >
          {loading ? 'Проверяем...' : 'Сохранить'}
        </button>
      </div>
    </div>
  );
}