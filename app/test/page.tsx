'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase/client';

type Brawler = {
  id: number;
  name: string;
  class: string;
  icon_url?: string | null;
};

export default function TestPage() {
  const supabase = createSupabaseBrowser();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [brawlers, setBrawlers] = useState<Brawler[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedBrawler, setSelectedBrawler] = useState<Brawler | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      // Проверяем авторизацию
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }
      setUser(user);

      // Загружаем профиль
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profile);

      // Загружаем бойцов
      const { data: brawlers } = await supabase
        .from('brawlers')
        .select('id, name, class, icon_url')
        .order('name');
      setBrawlers(brawlers || []);

      setLoading(false);
    };

    load();
  }, []);

  const handleSubmit = async () => {
    if (!selectedBrawler) {
      setError('Выбери бойца');
      return;
    }

    setSubmitting(true);
    setError(null);

    // Проверяем нет ли уже активной заявки
    const { data: existing } = await supabase
      .from('test_requests')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['waiting', 'accepted', 'testing'])
      .single();

    if (existing) {
      setError('У тебя уже есть активная заявка! Дождись её завершения.');
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('test_requests').insert({
      user_id: user.id,
      brawler_id: selectedBrawler.id,
      player_name: profile?.username || user.email,
      player_tag: profile?.player_tag || '#UNKNOWN',
      status: 'waiting',
    });

    if (error) {
      setError('Ошибка: ' + error.message);
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
  };

  const filteredBrawlers = brawlers.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  // Загрузка
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-gray-400">Загрузка...</div>
      </div>
    );
  }

  // Успех
  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111111] p-8 text-center">
          <div className="text-6xl mb-4">🎮</div>
          <h1 className="text-2xl font-black mb-3">Заявка отправлена!</h1>
          <p className="text-gray-400 mb-2">
            Боец: <span className="text-white font-bold">{selectedBrawler?.name}</span>
          </p>
          <p className="text-gray-400 mb-6">
            Ожидай — тестер примет заявку и напишет тебе в чат
          </p>

          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 mb-6 text-left">
            <p className="text-orange-400 text-sm font-medium mb-1">📋 Что дальше:</p>
            <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
              <li>Тестер увидит твою заявку</li>
              <li>Он напишет тебе в чат</li>
              <li>Договоритесь о времени</li>
              <li>Сыграйте 3 дуэли 1v1</li>
            </ol>
          </div>

          <Link
            href="/"
            className="bg-orange-500 hover:bg-orange-600 px-8 py-3 rounded-2xl font-bold transition inline-block"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* Шапка */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-gray-400 hover:text-white transition text-sm">
            ← На главную
          </Link>
          <div className="text-sm text-gray-400">
            Привет, <span className="text-white font-medium">{profile?.username || user?.email}</span>
          </div>
        </div>

        <h1 className="text-5xl font-black mb-2">Пройти тест</h1>
        <p className="text-gray-400 text-lg mb-8">
          Выбери бойца и встань в очередь к тестеру
        </p>

        {/* Инфо о игроке */}
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-4 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center text-xl">
            🎮
          </div>
          <div>
            <div className="font-bold">{profile?.username || 'Игрок'}</div>
            <div className="text-sm text-gray-400">{profile?.player_tag || 'Тег не указан'}</div>
          </div>
          <div className="ml-auto text-xs text-gray-500">
            Данные из профиля
          </div>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Выбор бойца */}
        <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Выбери бойца</h2>

          {/* Поиск */}
          <input
            type="text"
            placeholder="Поиск бойца..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition mb-4"
          />

          {/* Выбранный боец */}
          {selectedBrawler && (
            <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center gap-3">
              <img
                src={selectedBrawler.icon_url || `https://via.placeholder.com/40/1f2937/9ca3af?text=${selectedBrawler.name.slice(0, 2)}`}
                alt={selectedBrawler.name}
                className="w-10 h-10 rounded-xl object-cover"
              />
              <div>
                <div className="font-bold text-orange-400">{selectedBrawler.name}</div>
                <div className="text-xs text-gray-400">{selectedBrawler.class}</div>
              </div>
              <button
                onClick={() => setSelectedBrawler(null)}
                className="ml-auto text-gray-500 hover:text-white transition"
              >
                ✕
              </button>
            </div>
          )}

          {/* Сетка бойцов */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-80 overflow-y-auto pr-1">
            {filteredBrawlers.map((brawler) => (
              <button
                key={brawler.id}
                onClick={() => setSelectedBrawler(brawler)}
                className={`flex flex-col items-center p-2 rounded-2xl transition-all hover:scale-105 ${
                  selectedBrawler?.id === brawler.id
                    ? 'bg-orange-500/20 border-2 border-orange-500'
                    : 'bg-[#1a1a1a] border-2 border-transparent hover:border-white/20'
                }`}
              >
                <img
                  src={brawler.icon_url || `https://via.placeholder.com/60/1f2937/9ca3af?text=${brawler.name.slice(0, 2)}`}
                  alt={brawler.name}
                  className="w-12 h-12 rounded-xl object-cover mb-1"
                  onError={(e) => {
                    e.currentTarget.src = `https://via.placeholder.com/60/1f2937/9ca3af?text=${brawler.name.slice(0, 2)}`;
                  }}
                />
                <span className="text-xs font-medium text-center leading-tight">
                  {brawler.name}
                </span>
              </button>
            ))}
          </div>

          {filteredBrawlers.length === 0 && (
            <p className="text-center text-gray-500 py-8">Боец не найден</p>
          )}
        </div>

        {/* Правила */}
        <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-3">📋 Правила теста</h2>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-orange-400 mt-0.5">•</span>
              3 дуэли 1v1 на специальных картах
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400 mt-0.5">•</span>
              Тестер сам выбирает карты под бойца
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400 mt-0.5">•</span>
              Результат зависит от твоего скилла, а не от удачи
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400 mt-0.5">•</span>
              После теста тебе присвоят тир от LT5 до HT1
            </li>
          </ul>
        </div>

        {/* Кнопка */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !selectedBrawler}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-4 rounded-2xl font-bold text-xl transition"
        >
          {submitting ? 'Отправка...' : selectedBrawler ? `Встать в очередь с ${selectedBrawler.name}` : 'Сначала выбери бойца'}
        </button>

      </div>
    </div>
  );
}