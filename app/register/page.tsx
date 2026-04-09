'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase/client';

export default function RegisterPage() {
  const supabase = createSupabaseBrowser();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    playerTag: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Проверки
    if (formData.username.length < 3) {
      setError('Ник должен быть минимум 3 символа');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    if (formData.password.length < 6) {
      setError('Пароль минимум 6 символов');
      return;
    }

    // Форматируем тег
    let tag = formData.playerTag.trim().toUpperCase();
    if (!tag.startsWith('#')) tag = '#' + tag;
    if (tag.length < 4) {
      setError('Введи корректный Player Tag');
      return;
    }

    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          username: formData.username,
          player_tag: tag,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Создаём профиль вручную (на случай если триггер не сработал)
    if (authData.user) {
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        username: formData.username,
        player_tag: tag,
        email: formData.email,
      });
    }

    setSuccess(true);
    setLoading(false);
  };

  // Успех
  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111111] p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-black mb-3">Аккаунт создан!</h1>
          <p className="text-gray-400 mb-6">
            Проверь почту <span className="text-white font-medium">{formData.email}</span> и подтверди регистрацию
          </p>
          <Link
            href="/login"
            className="bg-orange-500 hover:bg-orange-600 px-8 py-3 rounded-2xl font-bold transition inline-block"
          >
            Войти
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6 py-12">
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

        <h1 className="text-3xl font-black mb-1">Регистрация</h1>
        <p className="text-gray-400 mb-6">Создай аккаунт для прохождения тестов</p>

        {/* Ошибка */}
        {error && (
          <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          
          {/* Ник */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Никнейм
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="например: sm1lexx"
              required
              className="w-full bg-[#1a1a1a] border border-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@mail.com"
              required
              className="w-full bg-[#1a1a1a] border border-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition"
            />
          </div>

          {/* Player Tag */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Player Tag в Brawl Stars
            </label>
            <input
              type="text"
              name="playerTag"
              value={formData.playerTag}
              onChange={handleChange}
              placeholder="#XXXXXX"
              required
              className="w-full bg-[#1a1a1a] border border-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition"
            />
            <p className="text-xs text-gray-500 mt-1">
              Найди в профиле Brawl Stars под именем
            </p>
          </div>

          {/* Пароль */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Пароль
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="минимум 6 символов"
              required
              className="w-full bg-[#1a1a1a] border border-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition"
            />
          </div>

          {/* Подтверждение пароля */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Подтверждение пароля
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="повтори пароль"
              required
              className="w-full bg-[#1a1a1a] border border-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3.5 rounded-2xl font-bold text-lg transition mt-2"
          >
            {loading ? 'Создание аккаунта...' : 'Создать аккаунт'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="text-orange-500 hover:text-orange-400 font-medium transition">
            Войти
          </Link>
        </div>
      </div>
    </div>
  );
}