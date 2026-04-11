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

type TierResult = {
  id: string;
  tier: string;
  points: number;
  created_at: string;
  brawlers: { name: string; icon_url: string | null }[];
};

type Profile = {
  id: string;
  username: string;
  player_tag: string;
  is_tester: boolean;
  is_admin: boolean;
  created_at: string;
  avatar_url: string | null;
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
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      const { data: results } = await supabase
        .from('tier_results')
        .select('id, tier, points, created_at, brawlers(name, icon_url)')
        .eq('user_id', userId)
        .order('points', { ascending: false });

      const safeResults = (results || []) as TierResult[];
      setTierResults(safeResults);

      const total = safeResults.reduce((sum, r) => sum + (r.points || 0), 0);
      setTotalPoints(total);

      setLoading(false);
    };

    load();
  }, [userId]);

  const getRole = () => {
    if (profile?.is_admin) return { label: 'ADMIN', color: 'bg-red-500/20 text-red-400', icon: '👑' };
    if (profile?.is_tester) return { label: 'ТЕСТЕР', color: 'bg-orange-500/20 text-orange-400', icon: '🛡️' };
    return { label: 'PLAYER', color: 'bg-white/10 text-gray-400', icon: '🎮' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        Загрузка...
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        404 — Пользователь не найден
      </div>
    );
  }

  const role = getRole();
  const bestTier = tierResults.length > 0 ? tierResults[0] : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="text-gray-400 hover:text-white transition text-sm mb-8 inline-block">
          ← На главную
        </Link>

        {/* Карточка профиля */}
        <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 mb-6">
          <div className="flex items-center gap-6">

            {/* ✅ Аватарка */}
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-white/10 flex-shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-orange-500/20 flex items-center justify-center text-5xl">
                  🎮
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-3xl font-black">{profile?.username}</h1>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${role.color}`}>
                  {role.icon} {role.label}
                </span>
              </div>

              <div className="text-gray-400 text-sm mb-3">{profile?.player_tag}</div>

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
                    <span className={`text-sm font-black px-3 py-1 rounded-xl ${TIER_BADGE[bestTier.tier]}`}>
                      {bestTier.tier}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">лучший тир</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-500">
            На сайте с {new Date(profile?.created_at || '').toLocaleDateString('ru')}
          </div>
        </div>

        {/* Результаты */}
        <h2 className="text-2xl font-black mb-4">Результаты тир тестов</h2>

        {tierResults.length === 0 ? (
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-12 text-center">
            Нет пройденных тестов
          </div>
        ) : (
          <div className="space-y-3">
            {tierResults.map((result) => (
              <div key={result.id} className="bg-[#111111] border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-black/40 border border-white/10">
                  <img
                    src={result.brawlers?.[0]?.icon_url || 'https://via.placeholder.com/56'}
                    alt={result.brawlers?.[0]?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg">{result.brawlers?.[0]?.name || '?'}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(result.created_at).toLocaleDateString('ru')}
                  </div>
                </div>
                <div className="text-orange-400 font-black">+{result.points}</div>
                <span className={`text-sm font-black px-4 py-2 rounded-xl ${TIER_BADGE[result.tier]}`}>
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