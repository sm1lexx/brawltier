'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase/client';

export default function LoginPage() {
  const supabase = createSupabaseBrowser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Неверный email или пароль');
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111111] p-8">
        
        {/* Лого */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-1">
            <span className="text-2xl font-black text-orange-500">BRAWL</span>
            <span className="text-2xl font-black">TIER</span>
          </Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition">
            ← На главную
          </Link>
        </div>

        <h1 className="text-3xl font-black mb-1">Вход</h1>
        <p className="text-gray-400 mb-6">Войди в свой аккаунт</p>

        {/* Ошибка */}
        {error && (
          <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              required
              className="w-full bg-[#1a1a1a] border border-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#1a1a1a] border border-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3.5 rounded-2xl font-bold text-lg transition"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Нет аккаунта?{' '}
          <Link href="/register" className="text-orange-500 hover:text-orange-400 font-medium transition">
            Зарегистрироваться
          </Link>
        </div>
      </div>
    </div>
  );
}