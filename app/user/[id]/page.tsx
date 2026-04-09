'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';

const TIER_BADGE: Record<string, string> = {
  PRO:       'bg-[#22c55e] text-white',
  MASTER:    'bg-[#f97316] text-white',
  LEGENDARY: 'bg-[#ef4444] text-white',
  MYTHIC:    'bg-[#a855f7] text-white',
  DIAMOND:   'bg-[#38bdf8] text-white',
  GOLD:      'bg-[#eab308] text-black',
  SILVER:    'bg-[#94a3b8] text-black',
  BRONZE:    'bg-[#b45309] text-white',
};

const TIER_POINTS: Record<string, number> = {
  PRO: 100, MASTER: 80, LEGENDARY: 60, MYTHIC: 45,
  DIAMOND: 30, GOLD: 20, SILVER: 10, BRONZE: 5,
};

type TierResult = {
  id: string;
  tier: string;
  points: number;
  brawlers: {
    name: string;
    icon_url: string | null;
  };
  created_at: string;
};

type Profile = {
  id: string;
  username: string;
  player_tag: string;
  is_tester: boolean;
  is_admin: boolean;
  created_at: string;
};

export default function UserProfilePage() {
  const supabase = createSupabaseBrowser();
  const params = useParams();
  const userId = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [tierResults, setTierResults] = useState<TierResult[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      // Загружаем профиль
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProfile(profile);

      // Загружаем результаты тиров
      const { data: results } = await supabase
        .from('tier_results')
        .select('id, tier, points, created_at, brawlers(name, icon_url)')
        .eq('user_id', userId)
        .order('points', { ascending: false });

      setTierResults(results || []);

      // Считаем сумму очков
      const total = (results || []).reduce((sum: number, r: any) => sum + (r.points || 0), 0);
      setTotalPoints(total);

      setLoading(false);
    };

    load();
  }, [userId]);

  // Определяем роль
  const getRole = () => {
    if (profile?.is_admin) return { label: 'ADMIN', color: 'bg-red-500/20 text-red-400', icon: '👑' };
    if (profile?.is_tester) return { label: 'ТЕСТЕР', color: 'bg-orange-500/20 text-orange-400', icon: '🛡️' };
    return { label: 'PLAYER', color: 'bg-white/10 text-gray-400', icon: '🎮' };
  };

  // Лучший тир
  const bestTier = tierResults.length > 0 ? tierResults[0] : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-gray-400">Загрузка...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-black mb-3">Игрок не найден</h1>
          <p className="text-gray-400 mb-6">Такого профиля не существует</p>
          <Link href="/" className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-2xl font-bold transition inline-block">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  const role = getRole();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="text-gray-400 hover:text-white transition text-sm mb-8 inline-block">
          ← На главную
        </Link>

        {/* Карточка профиля */}
        <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 mb-6">
          <div className="flex items-center gap-6">
            {/* Аватар */}
            <div className="w-24 h-24 bg-orange-500/20 rounded-3xl flex items-center justify-center text-5xl flex-shrink-0">
              🎮
            </div>

            {/* Инфо */}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-3xl font-black">{profile?.username}</h1>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${role.color}`}>
                  {role.icon} {role.label}
                </span>
              </div>
              <div className="text-gray-400 text-sm mb-3">{profile?.player_tag}</div>

              {/* Статистика */}
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-orange-400 font-black text-xl">{totalPoints}</div>
                  <div className="text-xs text-gray-500">очков</div>
                </div>
                <div>
                  <div className="text-white font-black text-xl">{tierResults.length}</div>
                  <div className="text-xs text-gray-500">тестов</div>
                </div>
                {bestTier && (
                  <div>
                    <span className={`text-sm font-black px-3 py-1 rounded-xl ${TIER_BADGE[bestTier.tier] || 'bg-gray-600 text-white'}`}>
                      {bestTier.tier}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">лучший тир</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Дата регистрации */}
          <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-500">
            На сайте с {new Date(profile?.created_at || '').toLocaleDateString('ru', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </div>
        </div>

        {/* Результаты тир тестов */}
        <h2 className="text-2xl font-black mb-4">Результаты тир тестов</h2>

        {tierResults.length === 0 ? (
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-400">У игрока пока нет пройденных тестов</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tierResults.map((result) => (
              <div
                key={result.id}
                className="bg-[#111111] border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:border-white/20 transition"
              >
                {/* Иконка бойца */}
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-black/40 border border-white/10 flex-shrink-0">
                  <img
                    src={(result.brawlers as any)?.icon_url || 'https://via.placeholder.com/56'}
                    alt={(result.brawlers as any)?.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/56'; }}
                  />
                </div>

                {/* Имя бойца */}
                <div className="flex-1">
                  <div className="font-bold text-lg">{(result.brawlers as any)?.name || '?'}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(result.created_at).toLocaleDateString('ru', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </div>
                </div>

                {/* Очки */}
                <div className="text-center flex-shrink-0">
                  <div className="text-orange-400 font-black">+{result.points}</div>
                  <div className="text-xs text-gray-500">очков</div>
                </div>

                {/* Тир */}
                <span className={`text-sm font-black px-4 py-2 rounded-xl flex-shrink-0 ${TIER_BADGE[result.tier] || 'bg-gray-600 text-white'}`}>
                  {result.tier}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}