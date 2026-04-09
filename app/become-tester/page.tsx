'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function BecomeTesterPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const [nickname, setNickname] = useState('');
  const [playerTag, setPlayerTag] = useState('');
  const [yearsPlaying, setYearsPlaying] = useState('');
  const [trophies, setTrophies] = useState('');
  const [discord, setDiscord] = useState('');
  const [about, setAbout] = useState('');

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setOk(false);

    if (!nickname.trim()) return setError('Введи ник');
    if (!playerTag.trim()) return setError('Введи Player Tag');

    setLoading(true);
    try {
      const body = {
        nickname: nickname.trim(),
        player_tag: playerTag.trim().toUpperCase(),
        years_playing: yearsPlaying ? Number(yearsPlaying) : null,
        trophies: trophies ? Number(trophies) : null,
        discord: discord.trim() || null,
        about: about.trim() || null,
        status: 'pending',
      };

      const res = await fetch(`${supabaseUrl}/rest/v1/tester_applications`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || data?.hint || 'Не удалось отправить заявку');

      setOk(true);
      setNickname('');
      setPlayerTag('');
      setYearsPlaying('');
      setTrophies('');
      setDiscord('');
      setAbout('');
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-white/10 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tighter text-orange-500">BRAWL</span>
            <span className="text-2xl font-black tracking-tighter">TIER</span>
          </Link>
          <Link href="/" className="text-sm text-gray-300 hover:text-white">
            ← На главную
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-3">Стать тестером</h1>
        <p className="text-gray-400 mb-8">
          Заполни анкету — позже мы будем вручную проверять заявки и выдавать роль тестера.
        </p>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-200">
            {error}
          </div>
        )}

        {ok && (
          <div className="mb-6 rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-4 text-green-200">
            Заявка отправлена. Мы рассмотрим её и свяжемся (позже добавим уведомления/Discord).
          </div>
        )}

        <div className="rounded-3xl border border-white/10 bg-[#111111] p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400">Ник</label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="mt-2 w-full bg-[#1a1a1a] border border-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500"
                placeholder="Твой ник"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400">Player Tag</label>
              <input
                value={playerTag}
                onChange={(e) => setPlayerTag(e.target.value)}
                className="mt-2 w-full bg-[#1a1a1a] border border-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500"
                placeholder="#ABC123"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400">Сколько лет играешь</label>
              <input
                value={yearsPlaying}
                onChange={(e) => setYearsPlaying(e.target.value)}
                className="mt-2 w-full bg-[#1a1a1a] border border-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500"
                placeholder="Например: 3"
                inputMode="numeric"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400">Трофеи (примерно)</label>
              <input
                value={trophies}
                onChange={(e) => setTrophies(e.target.value)}
                className="mt-2 w-full bg-[#1a1a1a] border border-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500"
                placeholder="Например: 45000"
                inputMode="numeric"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-gray-400">Discord (необязательно)</label>
              <input
                value={discord}
                onChange={(e) => setDiscord(e.target.value)}
                className="mt-2 w-full bg-[#1a1a1a] border border-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500"
                placeholder="nickname#0000 или @nickname"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-gray-400">О себе / опыт / почему хочешь быть тестером</label>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="mt-2 w-full min-h-[140px] bg-[#1a1a1a] border border-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500"
                placeholder="Напиши про скилл, режимы, доступность по времени и т.д."
              />
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button
                disabled={loading}
                onClick={submit}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white px-6 py-3 rounded-2xl font-semibold transition"
              >
                {loading ? 'Отправка...' : 'Отправить заявку'}
              </button>

              <Link
                href="/"
                className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl font-semibold transition text-center"
              >
                Назад
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-500 py-10">
        brawltier.ru • заявки тестеров
      </footer>
    </div>
  );
}