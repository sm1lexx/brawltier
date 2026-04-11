'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase/client';

type Brawler = {
  id: number | string;
  name: string;
  class: string;
  icon_url?: string | null;
};

type BrawlerClass = {
  id: string;
  label: string;
  icon: string;
};

type TierResult = {
  id: string;
  user_id: string;
  username: string;
  player_tag: string;
  tier: string;
  points: number;
  avatar_url?: string | null; // ✅
};

type LeaderboardEntry = {
  user_id: string;
  username: string;
  player_tag: string;
  total_points: number;
  avatar_url: string | null; // ✅
  best_tiers: { brawler_name: string; brawler_icon: string | null; tier: string }[];
};

function UserMenu() {
  const supabase = createSupabaseBrowser();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null);
      if (data.user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('avatar_url, username')
          .eq('id', data.user.id)
          .single();
        setProfile(prof);
      }
      setLoading(false);
    });
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) return <div className="w-20 h-10 bg-white/10 rounded-2xl animate-pulse" />;

  if (!user) {
    return (
      <Link
        href="/login"
        className="bg-white text-black px-6 py-2.5 rounded-2xl font-semibold hover:bg-orange-500 hover:text-white transition-all"
      >
        Войти
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/profile" className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-2xl font-semibold text-sm transition">
        {/* ✅ Аватарка в хедере */}
        <div className="w-6 h-6 rounded-full overflow-hidden border border-white/30">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span>👤</span>
          )}
        </div>
        Профиль
      </Link>
      <button
        onClick={logout}
        className="bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-2xl text-sm transition"
      >
        Выйти
      </button>
    </div>
  );
}

const TIER_DEFINITIONS = [
  { id: 'PRO',       label: 'PRO',       color: 'bg-[#22c55e]', border: 'border-[#22c55e]', icon: '/icons/tiers/pro.png' },
  { id: 'MASTER',    label: 'MASTER',    color: 'bg-[#f97316]', border: 'border-[#f97316]', icon: '/icons/tiers/master.png' },
  { id: 'LEGENDARY', label: 'LEGENDARY', color: 'bg-[#ef4444]', border: 'border-[#ef4444]', icon: '/icons/tiers/legendary.png' },
  { id: 'MYTHIC',    label: 'MYTHIC',    color: 'bg-[#a855f7]', border: 'border-[#a855f7]', icon: '/icons/tiers/mythic.png' },
  { id: 'DIAMOND',   label: 'DIAMOND',   color: 'bg-[#38bdf8]', border: 'border-[#38bdf8]', icon: '/icons/tiers/diamond.png' },
  { id: 'GOLD',      label: 'GOLD',      color: 'bg-[#eab308]', border: 'border-[#eab308]', icon: '/icons/tiers/gold.png' },
  { id: 'SILVER',    label: 'SILVER',    color: 'bg-[#94a3b8]', border: 'border-[#94a3b8]', icon: '/icons/tiers/silver.png' },
  { id: 'BRONZE',    label: 'BRONZE',    color: 'bg-[#b45309]', border: 'border-[#b45309]', icon: '/icons/tiers/bronze.png' },
] as const;

const TIER_POINTS: Record<string, number> = {
  PRO: 100, MASTER: 80, LEGENDARY: 60, MYTHIC: 45,
  DIAMOND: 30, GOLD: 20, SILVER: 10, BRONZE: 5,
};

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

const CLASSES: BrawlerClass[] = [
  { id: 'Damage Dealer', label: 'Damage Dealer', icon: '/icons/classes/damage.png' },
  { id: 'Marksman',      label: 'Marksman',      icon: '/icons/classes/marksman.png' },
  { id: 'Tank',          label: 'Tank',           icon: '/icons/classes/tank.png' },
  { id: 'Assassin',      label: 'Assassin',       icon: '/icons/classes/assassin.png' },
  { id: 'Support',       label: 'Support',        icon: '/icons/classes/support.png' },
  { id: 'Controller',    label: 'Controller',     icon: '/icons/classes/controller.png' },
  { id: 'Artillery',     label: 'Artillery',      icon: '/icons/classes/artillery.png' },
];

function getRankStyle(rank: number) {
  if (rank === 1) return 'bg-[#eab308] text-black';
  if (rank === 2) return 'bg-[#94a3b8] text-black';
  if (rank === 3) return 'bg-[#b45309] text-white';
  return 'bg-white/10 text-gray-300';
}

// ✅ Компонент аватарки
function Avatar({ url, size = 'md' }: { url?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-16 h-16' };
  return (
    <div className={`${sizes[size]} rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-orange-500/20 flex items-center justify-center`}>
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-lg">🎮</span>
      )}
    </div>
  );
}

export default function Home() {
  const supabase = createSupabaseBrowser();

  const [brawlers, setBrawlers] = useState<Brawler[]>([]);
  const [activeTab, setActiveTab] = useState('Overall');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedBrawler, setSelectedBrawler] = useState<Brawler | null>(null);

  const [brawlerTiers, setBrawlerTiers] = useState<Record<string, TierResult[]>>({});
  const [brawlerTiersLoading, setBrawlerTiersLoading] = useState(false);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  useEffect(() => {
    if (!supabaseUrl || !supabaseKey) { setLoading(false); return; }
    setLoading(true);
    fetch(`${supabaseUrl}/rest/v1/brawlers?select=*&order=name`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    })
      .then((res) => res.json())
      .then((data) => { setBrawlers(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [supabaseUrl, supabaseKey]);

  useEffect(() => {
    if (!selectedBrawler) return;
    loadBrawlerTiers(selectedBrawler.id);
  }, [selectedBrawler]);

  const loadBrawlerTiers = async (brawlerId: number | string) => {
    setBrawlerTiersLoading(true);

    // ✅ Запрашиваем avatar_url через join с profiles
    const { data } = await supabase
      .from('tier_results')
      .select('id, user_id, username, player_tag, tier, points, profiles(avatar_url)')
      .eq('brawler_id', brawlerId)
      .order('points', { ascending: false });

    const grouped: Record<string, TierResult[]> = {};
    TIER_DEFINITIONS.forEach(t => { grouped[t.id] = []; });

    data?.forEach((result: any) => {
      if (grouped[result.tier]) {
        grouped[result.tier].push({
          ...result,
          avatar_url: result.profiles?.avatar_url || null, // ✅
        });
      }
    });

    setBrawlerTiers(grouped);
    setBrawlerTiersLoading(false);
  };

  useEffect(() => {
    if (activeTab !== 'Overall') return;
    loadLeaderboard();
  }, [activeTab]);

  const loadLeaderboard = async () => {
    setLeaderboardLoading(true);

    // ✅ Запрашиваем avatar_url через join с profiles
    const { data: results } = await supabase
      .from('tier_results')
      .select('user_id, username, player_tag, tier, points, brawlers(name, icon_url), profiles(avatar_url)');

    if (!results || results.length === 0) {
      setLeaderboard([]);
      setLeaderboardLoading(false);
      return;
    }

    const userMap: Record<string, LeaderboardEntry> = {};

    results.forEach((r: any) => {
      if (!userMap[r.user_id]) {
        userMap[r.user_id] = {
          user_id: r.user_id,
          username: r.username,
          player_tag: r.player_tag,
          total_points: 0,
          avatar_url: r.profiles?.avatar_url || null, // ✅
          best_tiers: [],
        };
      }
      userMap[r.user_id].total_points += r.points;
      userMap[r.user_id].best_tiers.push({
        brawler_name: r.brawlers?.name || '?',
        brawler_icon: r.brawlers?.icon_url || null,
        tier: r.tier,
      });
    });

    const sorted = Object.values(userMap)
      .map(entry => ({
        ...entry,
        best_tiers: entry.best_tiers.sort(
          (a, b) => (TIER_POINTS[b.tier] || 0) - (TIER_POINTS[a.tier] || 0)
        ),
      }))
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, 100);

    setLeaderboard(sorted);
    setLeaderboardLoading(false);
  };

  const filteredBrawlers = brawlers
    .filter((b) => {
      const matchesTab = activeTab === 'Overall' || b.class === activeTab;
      const matchesSearch = (b.name || '').toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesSearch;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black tracking-tighter text-orange-500">BRAWL</span>
            <span className="text-3xl font-black tracking-tighter">TIER</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#" className="hover:text-orange-400">Гайд</Link>
            <Link href="#" className="hover:text-orange-400">Тестеры</Link>
            <Link href="#" className="hover:text-orange-400">Discord</Link>
          </nav>
          <UserMenu />
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-none mb-6">
          КРУПНЕЙШИЙ<br />
          <span className="text-orange-500">TIER TEST</span><br />
          BRAWL STARS
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          101 боец • 3 дуэли 1v1 на специальных картах<br />
          Реальный скилл • Тиры от BRONZE до PRO • Overall топ
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Link href="/test" className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-5 rounded-3xl text-xl font-semibold transition-all text-center">
            Пройти тест
          </Link>
          <Link href="/become-tester" className="border-2 border-white/30 hover:border-white/70 px-10 py-5 rounded-3xl text-xl font-semibold transition-all text-center">
            Стать тестером
          </Link>
        </div>
      </div>

      {/* Контент */}
      <div id="brawlers" className="max-w-7xl mx-auto px-6 pb-8">
        {selectedBrawler ? (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => { setSelectedBrawler(null); setBrawlerTiers({}); }}
                className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all"
              >
                ← Назад
              </button>
              <div className="flex items-center gap-4">
                <img
                  src={selectedBrawler.icon_url || `https://via.placeholder.com/150/1f2937/9ca3af?text=??`}
                  alt={selectedBrawler.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-500"
                />
                <div>
                  <h2 className="text-3xl font-black">{selectedBrawler.name}</h2>
                  <p className="text-gray-400">{selectedBrawler.class}</p>
                </div>
              </div>
            </div>

            {brawlerTiersLoading ? (
              <div className="flex gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="min-w-[280px] h-48 bg-white/5 rounded-xl animate-pulse flex-shrink-0" />
                ))}
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-6 snap-x">
                {TIER_DEFINITIONS.map((tier) => {
                  const players = brawlerTiers[tier.id] || [];
                  return (
                    <div
                      key={tier.id}
                      className="min-w-[280px] sm:min-w-[320px] flex-shrink-0 snap-start flex flex-col bg-[#141414] rounded-xl overflow-hidden border border-white/5"
                    >
                      <div className={`px-4 py-3 flex items-center justify-between ${tier.color}`}>
                        <div className="flex items-center gap-2">
                          <img src={tier.icon} alt={tier.label} className="w-7 h-7 object-contain drop-shadow-md" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          <span className="font-bold text-lg drop-shadow-md tracking-wider">{tier.label}</span>
                        </div>
                        <span className="text-xs font-medium text-white/70 bg-black/20 px-2 py-0.5 rounded-full">{players.length}</span>
                      </div>

                      <div className="flex flex-col">
                        {players.length === 0 ? (
                          <div className="px-4 py-6 text-center text-gray-600 text-sm">Пока никого нет</div>
                        ) : (
                          players.map((player) => (
                            <div key={player.id} className="flex items-center gap-3 px-3 py-2.5 bg-[#1a1a1a] border-b border-white/5 hover:bg-[#252525] transition-colors">
                              {/* ✅ Аватарка игрока в тире */}
                              <Avatar url={player.avatar_url} size="sm" />
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/user/${player.user_id}`}
                                  className="font-medium text-sm text-gray-200 truncate hover:text-orange-400 transition block"
                                >
                                  {player.username}
                                </Link>
                                <div className="text-xs text-gray-500 truncate">{player.player_tag}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            {activeTab !== 'Overall' && (
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
                <input
                  type="text"
                  placeholder="Поиск бойца..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-[#1a1a1a] border border-white/20 rounded-2xl px-6 py-3 w-full md:w-96 focus:outline-none focus:border-orange-500"
                />
              </div>
            )}

            <div className="bg-[#111111] rounded-3xl overflow-hidden border border-white/10">
              {/* Табы */}
              <div className="flex overflow-x-auto border-b border-white/10">
                <button
                  onClick={() => setActiveTab('Overall')}
                  className={`px-6 py-5 text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'Overall' ? 'text-orange-400 border-b-2 border-orange-400' : 'hover:text-gray-300'}`}
                >
                  <img src="/icons/classes/top.png" alt="TOP" className="w-6 h-6 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  TOP
                </button>
                {CLASSES.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => setActiveTab(cls.id)}
                    className={`px-6 py-5 text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === cls.id ? 'text-orange-400 border-b-2 border-orange-400' : 'hover:text-gray-300'}`}
                  >
                    <img src={cls.icon} alt={cls.label} className="w-5 h-5 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    {cls.label}
                  </button>
                ))}
              </div>

              {/* TOP 100 */}
              {activeTab === 'Overall' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black">🏆 TOP 100 игроков</h2>
                    <button onClick={loadLeaderboard} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm transition">
                      🔄 Обновить
                    </button>
                  </div>

                  {leaderboardLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
                      ))}
                    </div>
                  ) : leaderboard.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="text-5xl mb-4">📭</div>
                      <p className="text-gray-400 text-lg">Пока нет завершённых тестов</p>
                      <p className="text-gray-600 text-sm mt-2">Пройди тест чтобы попасть в топ!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {leaderboard.map((entry, index) => {
                        const rank = index + 1;
                        return (
                          <div
                            key={entry.user_id}
                            className="bg-[#1a1a1a] hover:bg-[#222] rounded-2xl p-4 flex items-center gap-4 transition-all border border-white/5 hover:border-white/10"
                          >
                            {/* Номер */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${getRankStyle(rank)}`}>
                              {rank}
                            </div>

                            {/* ✅ Аватарка в лидерборде */}
                            <Avatar url={entry.avatar_url} size="md" />

                            {/* Ник + тег + очки */}
                            <div className="flex items-center gap-6 flex-shrink-0 min-w-[280px]">
                              <div>
                                <Link
                                  href={`/user/${entry.user_id}`}
                                  className="font-bold text-base leading-tight hover:text-orange-400 transition block"
                                >
                                  {entry.username}
                                </Link>
                                <div className="text-xs text-gray-500 mt-0.5">{entry.player_tag}</div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <img src="/icons/points.png" alt="points" className="w-5 h-5 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                <div>
                                  <span className="text-orange-400 font-black text-lg leading-none">{entry.total_points}</span>
                                  <div className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">очков</div>
                                </div>
                              </div>
                            </div>

                            {/* Топ 5 тиров */}
                            <div className="flex items-center gap-2 flex-1 justify-end">
                              {entry.best_tiers.slice(0, 5).map((bt, i) => (
                                <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
                                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-black/40 border border-white/10">
                                    <img
                                      src={bt.brawler_icon || `https://via.placeholder.com/36/1f2937/9ca3af?text=?`}
                                      alt={bt.brawler_name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => { e.currentTarget.src = `https://via.placeholder.com/36/1f2937/9ca3af?text=?`; }}
                                    />
                                  </div>
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none ${TIER_BADGE[bt.tier] || 'bg-gray-600 text-white'}`}>
                                    {bt.tier}
                                  </span>
                                </div>
                              ))}
                              {entry.best_tiers.length > 5 && (
                                <div className="text-xs text-gray-500 flex-shrink-0">+{entry.best_tiers.length - 5}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Бойцы */}
              {activeTab !== 'Overall' && (
                <div className="p-8">
                  {loading ? (
                    <p className="text-center py-20 text-gray-400">Загрузка бойцов...</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {filteredBrawlers.map((brawler) => {
                        const iconUrl = brawler.icon_url || `https://via.placeholder.com/150/1f2937/9ca3af?text=${brawler.name.slice(0, 2)}`;
                        return (
                          <div
                            key={brawler.id}
                            className="bg-[#1a1a1a] hover:bg-[#222] rounded-2xl p-4 flex flex-col items-center text-center transition-all hover:scale-105 cursor-pointer group"
                            onClick={() => setSelectedBrawler(brawler)}
                          >
                            <div className="w-24 h-24 mb-3 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-orange-400 transition">
                              <img
                                src={iconUrl}
                                alt={brawler.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.src = `https://via.placeholder.com/150/1f2937/9ca3af?text=${brawler.name.slice(0, 2)}`; }}
                              />
                            </div>
                            <div className="font-semibold text-lg">{brawler.name}</div>
                            <div className="text-xs text-gray-400 mt-1">{brawler.class}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {!loading && filteredBrawlers.length === 0 && (
                    <p className="text-center py-20 text-gray-400">Ничего не найдено</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="text-center text-xs text-gray-500 py-12">
        brawltier.ru • {brawlers.length} бойцов
      </footer>
    </div>
  );
}