'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase/client';

export default function BecomeTesterPage() {
  const supabase = createSupabaseBrowser();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingApp, setExistingApp] = useState<any>(null);

  const [formData, setFormData] = useState({
    discord: '',
    trophies: '',
    years_playing: '',
    about: '',
  });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profile);

      // Проверяем есть ли уже заявка
      const { data: app } = await supabase
        .from('tester_applications')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setExistingApp(app);

      setLoading(false);
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.discord.trim()) {
      setError('Укажи Discord');
      return;
    }
    if (!formData.trophies || parseInt(formData.trophies) < 0) {
      setError('Укажи количество трофеев');
      return;
    }
    if (!formData.about.trim() || formData.about.length < 20) {
      setError('Расскажи о себе (минимум 20 символов)');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from('tester_applications')
      .insert({
        user_id: user.id,
        username: profile?.username || user.email,
        player_tag: profile?.player_tag || '#UNKNOWN',
        discord: formData.discord.trim(),
        trophies: parseInt(formData.trophies),
        years_playing: parseInt(formData.years_playing) || 0,
        about: formData.about.trim(),
        status: 'pending',
      });

    if (error) {
      setError('Ошибка: ' + error.message);
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        Загрузка...
      </div>
    );
  }

  // Уже тестер
  if (profile?.is_tester) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-[#111111] border border-white/10 rounded-3xl p-8 text-center">
          <div className="text-6xl mb-4">🛡️</div>
          <h1 className="text-2xl font-black mb-3">Ты уже тестер!</h1>
          <p className="text-gray-400 mb-6">У тебя уже есть роль тестера</p>
          <Link href="/tester" className="bg-orange-500 hover:bg-orange-600 px-8 py-3 rounded-2xl font-bold transition inline-block">
            Панель тестера
          </Link>
        </div>
      </div>
    );
  }

  // Уже подал заявку
  if (existingApp && !success) {
    const statusMap: Record<string, { text: string; color: string; icon: string }> = {
      pending:  { text: 'На рассмотрении', color: 'text-yellow-400', icon: '⏳' },
      approved: { text: 'Одобрена!',       color: 'text-green-400',  icon: '✅' },
      rejected: { text: 'Отклонена',       color: 'text-red-400',    icon: '❌' },
    };
    const status = statusMap[existingApp.status] || statusMap.pending;

    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-[#111111] border border-white/10 rounded-3xl p-8 text-center">
          <div className="text-6xl mb-4">{status.icon}</div>
          <h1 className="text-2xl font-black mb-3">Заявка отправлена</h1>
          <p className={`text-lg font-bold mb-2 ${status.color}`}>{status.text}</p>
          <p className="text-gray-400 text-sm mb-6">
            Подана: {new Date(existingApp.created_at).toLocaleDateString('ru', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
          {existingApp.status === 'rejected' && (
            <p className="text-gray-400 text-sm mb-6">
              Ты можешь подать новую заявку через некоторое время
            </p>
          )}
          <Link href="/" className="bg-orange-500 hover:bg-orange-600 px-8 py-3 rounded-2xl font-bold transition inline-block">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  // Успешно отправлена
  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-[#111111] border border-white/10 rounded-3xl p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-black mb-3">Заявка отправлена!</h1>
          <p className="text-gray-400 mb-6">
            Мы рассмотрим твою заявку и свяжемся с тобой в Discord
          </p>
          <Link href="/" className="bg-orange-500 hover:bg-orange-600 px-8 py-3 rounded-2xl font-bold transition inline-block">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/" className="text-gray-400 hover:text-white transition text-sm mb-8 inline-block">
          ← На главную
        </Link>

        <div className="mb-8">
          <h1 className="text-5xl font-black mb-2">Стать тестером</h1>
          <p className="text-gray-400 text-lg">Заполни анкету и мы рассмотрим твою заявку</p>
        </div>

        {/* Инфо игрока */}
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-4 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center text-xl">🎮</div>
          <div>
            <div className="font-bold">{profile?.username}</div>
            <div className="text-sm text-gray-400">{profile?.player_tag}</div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 space-y-5">

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Discord <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.discord}
                onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
                placeholder="username#0000 или username"
                required
                className="w-full bg-[#1a1a1a] border border-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Количество трофеев <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={formData.trophies}
                onChange={(e) => setFormData({ ...formData, trophies: e.target.value })}
                placeholder="например: 50000"
                required
                min="0"
                className="w-full bg-[#1a1a1a] border border-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Сколько лет играешь в Brawl Stars
              </label>
              <input
                type="number"
                value={formData.years_playing}
                onChange={(e) => setFormData({ ...formData, years_playing: e.target.value })}
                placeholder="например: 3"
                min="0"
                max="10"
                className="w-full bg-[#1a1a1a] border border-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Расскажи о себе <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.about}
                onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                placeholder="Почему хочешь стать тестером? Какой у тебя опыт? Какие бойцы твои любимые?"
                required
                rows={5}
                className="w-full bg-[#1a1a1a] border border-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.about.length} / минимум 20 символов</p>
            </div>
          </div>

          {/* Требования */}
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4">
            <p className="text-orange-400 font-bold text-sm mb-2">📋 Требования к тестеру:</p>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Хорошее знание всех бойцов</li>
              <li>• Умение объективно оценивать скилл</li>
              <li>• Наличие Discord для связи</li>
              <li>• Готовность тестировать регулярно</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-4 rounded-2xl font-bold text-xl transition"
          >
            {submitting ? 'Отправка...' : '🛡️ Подать заявку'}
          </button>
        </form>
      </div>
    </div>
  );
}