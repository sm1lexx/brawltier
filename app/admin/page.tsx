'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase/client';

type Application = {
  id: string;
  user_id: string;
  username: string;
  player_tag: string;
  discord: string;
  trophies: number;
  years_playing: number;
  about: string;
  status: string;
  created_at: string;
};

export default function AdminPage() {
  const supabase = createSupabaseBrowser();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeFilter, setActiveFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [processing, setProcessing] = useState<string | null>(null);

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

      if (!profile?.is_admin) {
        window.location.href = '/';
        return;
      }
      setProfile(profile);

      await loadApplications();
      setLoading(false);
    };
    load();
  }, []);

  const loadApplications = async () => {
    const { data } = await supabase
      .from('tester_applications')
      .select('*')
      .order('created_at', { ascending: false });
    setApplications(data || []);
  };

  const approve = async (app: Application) => {
    setProcessing(app.id);

    // Обновляем заявку
    await supabase
      .from('tester_applications')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', app.id);

    // Даём роль тестера
    await supabase
      .from('profiles')
      .update({ is_tester: true, tester_status: 'approved' })
      .eq('id', app.user_id);

    await loadApplications();
    setProcessing(null);
  };

  const reject = async (app: Application) => {
    setProcessing(app.id);

    await supabase
      .from('tester_applications')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', app.id);

    await supabase
      .from('profiles')
      .update({ tester_status: 'rejected' })
      .eq('id', app.user_id);

    await loadApplications();
    setProcessing(null);
  };

  const filtered = applications.filter(a => a.status === activeFilter);

  const counts = {
    pending:  applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
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
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Хедер */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/" className="text-gray-400 hover:text-white transition text-sm">← Главная</Link>
            </div>
            <h1 className="text-4xl font-black">Панель администратора</h1>
            <p className="text-gray-400 mt-1">
              <span className="text-red-400 font-bold">{profile?.username}</span>
              <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">👑 ADMIN</span>
            </p>
          </div>
          <div className="text-right text-sm text-gray-400">
            <div>Всего заявок: <span className="text-white font-bold">{applications.length}</span></div>
            <div>Ожидают: <span className="text-yellow-400 font-bold">{counts.pending}</span></div>
          </div>
        </div>

        {/* Фильтры */}
        <div className="flex gap-2 mb-6 bg-[#111111] p-1.5 rounded-2xl border border-white/10 w-fit">
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition ${activeFilter === 'pending' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            ⏳ Ожидают ({counts.pending})
          </button>
          <button
            onClick={() => setActiveFilter('approved')}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition ${activeFilter === 'approved' ? 'bg-green-500 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            ✅ Одобрены ({counts.approved})
          </button>
          <button
            onClick={() => setActiveFilter('rejected')}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition ${activeFilter === 'rejected' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            ❌ Отклонены ({counts.rejected})
          </button>
        </div>

        {/* Заявки */}
        {filtered.length === 0 ? (
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-400">Нет заявок в этой категории</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((app) => (
              <div key={app.id} className="bg-[#111111] border border-white/10 rounded-3xl p-6">
                {/* Шапка */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center text-2xl">
                      🎮
                    </div>
                    <div>
                      <div className="font-black text-xl">{app.username}</div>
                      <div className="text-gray-400 text-sm">{app.player_tag}</div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        {new Date(app.created_at).toLocaleDateString('ru', {
                          day: 'numeric', month: 'long', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Кнопки только для pending */}
                  {app.status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => reject(app)}
                        disabled={processing === app.id}
                        className="bg-red-500/20 hover:bg-red-500 border border-red-500/30 text-red-400 hover:text-white px-5 py-2.5 rounded-2xl font-bold text-sm transition disabled:opacity-50"
                      >
                        ❌ Отклонить
                      </button>
                      <button
                        onClick={() => approve(app)}
                        disabled={processing === app.id}
                        className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm transition disabled:opacity-50"
                      >
                        ✅ Принять
                      </button>
                    </div>
                  )}

                  {app.status === 'approved' && (
                    <span className="bg-green-500/20 text-green-400 text-sm font-bold px-4 py-2 rounded-full">
                      ✅ Одобрена
                    </span>
                  )}

                  {app.status === 'rejected' && (
                    <span className="bg-red-500/20 text-red-400 text-sm font-bold px-4 py-2 rounded-full">
                      ❌ Отклонена
                    </span>
                  )}
                </div>

                {/* Детали */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-white/5 rounded-2xl p-3 text-center">
                    <div className="text-2xl font-black text-orange-400">{app.trophies?.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Трофеев</div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-3 text-center">
                    <div className="text-2xl font-black text-blue-400">{app.years_playing || 0}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Лет в игре</div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-3 text-center">
                    <div className="text-lg font-black text-purple-400 truncate">{app.discord || '—'}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Discord</div>
                  </div>
                </div>

                {/* О себе */}
                <div className="bg-white/5 rounded-2xl p-4">
                  <p className="text-xs text-gray-500 mb-1">О себе:</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{app.about}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}