'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase/client';

export default function ProfilePage() {
  const supabase = createSupabaseBrowser();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myTests, setMyTests] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }
      setUser(user);

      // Профиль
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profile);

      // Мои заявки на тест (как игрок)
      const { data: tests } = await supabase
        .from('test_requests')
        .select('*, brawlers(name, icon_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setMyTests(tests || []);

      setLoading(false);
    };

    load();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const statusLabels: Record<string, { text: string; color: string }> = {
    waiting: { text: 'В очереди', color: 'bg-yellow-500/20 text-yellow-400' },
    accepted: { text: 'Принята', color: 'bg-blue-500/20 text-blue-400' },
    testing: { text: 'Тестирование', color: 'bg-purple-500/20 text-purple-400' },
    completed: { text: 'Завершён', color: 'bg-green-500/20 text-green-400' },
    cancelled: { text: 'Отменён', color: 'bg-red-500/20 text-red-400' },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* Шапка */}
        <Link href="/" className="text-gray-400 hover:text-white transition text-sm mb-8 inline-block">
          ← На главную
        </Link>

        {/* Карточка профиля */}
        <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 mb-8">
          <div className="flex items-center gap-6 mb-6">
            {/* Аватар */}
            <div className="w-20 h-20 bg-orange-500/20 rounded-2xl flex items-center justify-center text-4xl">
              🎮
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-black">{profile?.username || 'Игрок'}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-gray-400 text-sm">{profile?.player_tag}</span>
                {profile?.is_tester && (
                  <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-3 py-1 rounded-full">
                    🛡️ ТЕСТЕР
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
            </div>

            <button
              onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-2xl text-sm font-medium transition"
            >
              Выйти
            </button>
          </div>

          {/* Кнопки навигации */}
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/tester"
              className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-2xl font-bold transition"
            >
              🎮 Мои тесты
            </Link>

            {profile?.is_tester && (
              <Link
                href="/tester?tab=queue"
                className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-2xl font-bold transition"
              >
                📋 Очередь заявок
              </Link>
            )}

            {!profile?.is_tester && (
              <Link
                href="/become-tester"
                className="border border-white/20 hover:border-white/50 px-6 py-3 rounded-2xl font-bold transition"
              >
                🛡️ Стать тестером
              </Link>
            )}
          </div>
        </div>

        {/* История тестов */}
        <h2 className="text-2xl font-black mb-4">История тестов</h2>

        {myTests.length === 0 ? (
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-400 mb-4">У тебя пока нет тестов</p>
            <Link
              href="/test"
              className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-2xl font-bold transition inline-block"
            >
              Пройти тест
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myTests.map((test) => {
              const status = statusLabels[test.status] || { text: test.status, color: 'bg-gray-500/20 text-gray-400' };

              return (
                <div key={test.id} className="bg-[#111111] border border-white/10 rounded-2xl p-5 flex items-center gap-4">
                  <img
                    src={test.brawlers?.icon_url || 'https://via.placeholder.com/48/1f2937/9ca3af?text=??'}
                    alt={test.brawlers?.name || ''}
                    className="w-12 h-12 rounded-xl object-cover border border-white/10"
                  />

                  <div className="flex-1">
                    <div className="font-bold">{test.brawlers?.name || 'Неизвестный боец'}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(test.created_at).toLocaleDateString('ru', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${status.color}`}>
                    {status.text}
                  </span>

                  {(test.status === 'accepted' || test.status === 'testing') && (
                    <Link
                      href={`/tester?chat=${test.id}`}
                      className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-xl text-sm font-bold transition"
                    >
                      💬 Чат
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}