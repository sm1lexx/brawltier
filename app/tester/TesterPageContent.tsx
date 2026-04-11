'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';

type TestRequest = {
  id: string;
  player_name: string;
  player_tag: string;
  status: string;
  created_at: string;
  brawler_id: number;
  user_id: string;
  tester_id: string | null;
  brawlers?: {
    name: string;
    class: string;
    icon_url: string | null;
  };
};

type Message = {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
  is_system: boolean;
};

const TIERS = [
  { id: 'PRO',       label: 'PRO',       points: 100, color: 'bg-[#22c55e]', text: 'text-white' },
  { id: 'MASTER',    label: 'MASTER',    points: 80,  color: 'bg-[#f97316]', text: 'text-white' },
  { id: 'LEGENDARY', label: 'LEGENDARY', points: 60,  color: 'bg-[#ef4444]', text: 'text-white' },
  { id: 'MYTHIC',    label: 'MYTHIC',    points: 45,  color: 'bg-[#a855f7]', text: 'text-white' },
  { id: 'DIAMOND',   label: 'DIAMOND',   points: 30,  color: 'bg-[#38bdf8]', text: 'text-white' },
  { id: 'GOLD',      label: 'GOLD',      points: 20,  color: 'bg-[#eab308]', text: 'text-black' },
  { id: 'SILVER',    label: 'SILVER',    points: 10,  color: 'bg-[#94a3b8]', text: 'text-black' },
  { id: 'BRONZE',    label: 'BRONZE',    points: 5,   color: 'bg-[#b45309]', text: 'text-white' },
];

function TierModal({
  onSelect,
  onClose,
}: {
  onSelect: (tier: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-black mb-1">Выбери тир игрока</h2>
        <p className="text-gray-400 text-sm mb-6">Выбери тир который заслужил игрок</p>
        <div className="space-y-2 mb-6">
          {TIERS.map((tier) => (
            <button
              key={tier.id}
              onClick={() => setSelected(tier.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all ${
                selected === tier.id ? 'border-white scale-[1.02]' : 'border-transparent hover:border-white/30'
              } ${tier.color}`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={`/icons/tiers/${tier.id.toLowerCase()}.png`}
                  alt={tier.label}
                  className="w-8 h-8 object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <span className={`font-black text-lg tracking-wider ${tier.text}`}>{tier.label}</span>
              </div>
              <span className={`text-sm font-bold px-3 py-1 rounded-full bg-black/20 ${tier.text}`}>
                +{tier.points} очков
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-white/10 hover:bg-white/20 px-4 py-3 rounded-2xl font-bold transition">
            Отмена
          </button>
          <button
            onClick={() => selected && onSelect(selected)}
            disabled={!selected}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-3 rounded-2xl font-bold transition"
          >
            {selected ? `Назначить ${selected}` : 'Выбери тир'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TesterPageContent() {
  const supabase = createSupabaseBrowser();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [waitingRequests, setWaitingRequests] = useState<TestRequest[]>([]);
  const [myTesterRequests, setMyTesterRequests] = useState<TestRequest[]>([]);
  const [myPlayerRequests, setMyPlayerRequests] = useState<TestRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'my' | 'queue' | 'chat'>('my');

  const [activeChat, setActiveChat] = useState<TestRequest | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const [showTierModal, setShowTierModal] = useState(false);
  const [completingRequest, setCompletingRequest] = useState<TestRequest | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sentMessageIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ Загрузка чата вынесена отдельно
  const loadChatMessages = async (requestId: string) => {
    const { data } = await supabase
      .from('test_messages')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const openChat = async (request: TestRequest) => {
    setActiveChat(request);
    setActiveTab('chat');
    sentMessageIds.current.clear();
    await loadChatMessages(request.id);
  };

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

      await loadRequests(user.id, profile?.is_tester || false);

      const tabParam = searchParams.get('tab');
      const chatParam = searchParams.get('chat'); // ✅ Читаем ?chat=ID из адреса

      if (tabParam === 'queue' && profile?.is_tester) {
        setActiveTab('queue');
      } else if (chatParam) {
        // ✅ Автоматически открываем чат по ID
        const { data: req } = await supabase
          .from('test_requests')
          .select('*, brawlers(name, class, icon_url)')
          .eq('id', chatParam)
          .single();

        if (req) {
          setActiveChat(req);
          setActiveTab('chat');
          await loadChatMessages(req.id);
        }
      }

      setLoading(false);
    };

    load();
  }, []);

  const loadRequests = async (userId: string, isTester: boolean) => {
    const { data: playerReqs } = await supabase
      .from('test_requests')
      .select('*, brawlers(name, class, icon_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setMyPlayerRequests(playerReqs || []);

    if (isTester) {
      const { data: waiting } = await supabase
        .from('test_requests')
        .select('*, brawlers(name, class, icon_url)')
        .eq('status', 'waiting')
        .order('created_at', { ascending: true });
      setWaitingRequests(waiting || []);

      const { data: testerReqs } = await supabase
        .from('test_requests')
        .select('*, brawlers(name, class, icon_url)')
        .eq('tester_id', userId)
        .in('status', ['accepted', 'testing'])
        .order('created_at', { ascending: false });
      setMyTesterRequests(testerReqs || []);
    }
  };

  useEffect(() => {
    if (!activeChat || !user) return;

    const channelName = `chat-room-${activeChat.id}`;

    const channel = supabase
      .channel(channelName, { config: { broadcast: { self: false } } })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'test_messages',
          filter: `request_id=eq.${activeChat.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;

          if (sentMessageIds.current.has(newMsg.id)) {
            sentMessageIds.current.delete(newMsg.id);
            return;
          }

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChat?.id, user?.id]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat || sendingMessage) return;

    setSendingMessage(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    const tempId = `temp-${Date.now()}`;

    const optimisticMsg: Message = {
      id: tempId,
      message: messageText,
      sender_id: user.id,
      created_at: new Date().toISOString(),
      is_system: false,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    const { data, error } = await supabase
      .from('test_messages')
      .insert({
        request_id: activeChat.id,
        sender_id: user.id,
        message: messageText,
        is_system: false,
      })
      .select('id')
      .single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setSendingMessage(false);
      return;
    }

    if (data?.id) {
      sentMessageIds.current.add(data.id);
    }

    setMessages((prev) =>
      prev.map((m) =>
        m.id === tempId ? { ...m, id: data.id } : m
      )
    );

    setSendingMessage(false);
  };

  const acceptRequest = async (request: TestRequest) => {
    const { error } = await supabase
      .from('test_requests')
      .update({
        tester_id: user.id,
        status: 'accepted',
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.id)
      .eq('status', 'waiting');

    if (error) {
      alert('Ошибка: ' + error.message);
      return;
    }

    await supabase.from('test_messages').insert({
      request_id: request.id,
      sender_id: user.id,
      message: `Тестер ${profile?.username} принял заявку! Договоритесь о времени.`,
      is_system: true,
    });

    await loadRequests(user.id, true);
    openChat({ ...request, status: 'accepted', tester_id: user.id });
  };

  const startComplete = (request: TestRequest) => {
    setCompletingRequest(request);
    setShowTierModal(true);
  };

  const completeRequest = async (tier: string) => {
    if (!completingRequest) return;
    setShowTierModal(false);

    const tierData = TIERS.find(t => t.id === tier);
    const points = tierData?.points || 0;
    const req = completingRequest;

    await supabase
      .from('test_requests')
      .update({
        status: 'completed',
        result_tier: tier,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.id);

    await supabase.from('test_messages').insert({
      request_id: req.id,
      sender_id: user.id,
      message: `✅ Тест завершён! Тир: ${tier} (+${points} очков)`,
      is_system: true,
    });

    const { data: existing } = await supabase
      .from('tier_results')
      .select('id, tier, points')
      .eq('user_id', req.user_id)
      .eq('brawler_id', req.brawler_id)
      .single();

    if (!existing) {
      await supabase.from('tier_results').insert({
        user_id: req.user_id,
        brawler_id: req.brawler_id,
        tier,
        points,
        username: req.player_name,
        player_tag: req.player_tag,
        test_request_id: req.id,
      });
    } else if (points > (existing.points || 0)) {
      await supabase
        .from('tier_results')
        .update({ tier, points, test_request_id: req.id, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    }

    setCompletingRequest(null);
    await loadRequests(user.id, profile?.is_tester);
    setActiveChat(null);
    setActiveTab('my');
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'только что';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} мин назад`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ч назад`;
    return `${Math.floor(seconds / 86400)} д назад`;
  };

  const statusLabels: Record<string, { text: string; color: string }> = {
    waiting:   { text: 'В очереди',    color: 'bg-yellow-500/20 text-yellow-400' },
    accepted:  { text: 'Принята',      color: 'bg-blue-500/20 text-blue-400' },
    testing:   { text: 'Тестирование', color: 'bg-purple-500/20 text-purple-400' },
    completed: { text: 'Завершён',     color: 'bg-green-500/20 text-green-400' },
    cancelled: { text: 'Отменён',      color: 'bg-red-500/20 text-red-400' },
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
      {showTierModal && completingRequest && (
        <TierModal
          onSelect={completeRequest}
          onClose={() => { setShowTierModal(false); setCompletingRequest(null); }}
        />
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/" className="text-gray-400 hover:text-white transition text-sm">← Главная</Link>
              <span className="text-gray-600">•</span>
              <Link href="/profile" className="text-gray-400 hover:text-white transition text-sm">Профиль</Link>
            </div>
            <h1 className="text-4xl font-black">{profile?.is_tester ? 'Панель тестера' : 'Мои тесты'}</h1>
            <p className="text-gray-400 mt-1">
              <span className="text-orange-400 font-bold">{profile?.username}</span>
              {profile?.is_tester && (
                <span className="ml-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">ТЕСТЕР</span>
              )}
            </p>
          </div>
          <div className="text-right text-sm text-gray-400">
            <div>Мои заявки: <span className="text-white font-bold">{myPlayerRequests.length}</span></div>
            {profile?.is_tester && (
              <>
                <div>В очереди: <span className="text-white font-bold">{waitingRequests.length}</span></div>
                <div>Активные: <span className="text-white font-bold">{myTesterRequests.length}</span></div>
              </>
            )}
          </div>
        </div>

        {/* Табы */}
        <div className="flex gap-2 mb-6 bg-[#111111] p-1.5 rounded-2xl border border-white/10 w-fit">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition ${activeTab === 'my' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            🎮 Мои тесты
          </button>
          {profile?.is_tester && (
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition ${activeTab === 'queue' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              📋 Очередь ({waitingRequests.length})
            </button>
          )}
          {activeChat && (
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition ${activeTab === 'chat' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              💬 Чат
            </button>
          )}
        </div>

        {/* Мои тесты */}
        {activeTab === 'my' && (
          <div>
            {profile?.is_tester && myTesterRequests.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-3 text-orange-400">Активные тесты (как тестер)</h2>
                <div className="space-y-3">
                  {myTesterRequests.map((req) => (
                    <div key={req.id} className="bg-[#111111] border border-orange-500/20 rounded-2xl p-5 flex items-center gap-4">
                      <img src={req.brawlers?.icon_url || 'https://via.placeholder.com/48'} alt="" className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                      <div className="flex-1">
                        <div className="font-bold">{req.player_name}</div>
                        <div className="text-xs text-gray-400">{req.brawlers?.name} • {req.player_tag} • {timeAgo(req.created_at)}</div>
                      </div>
                      <button onClick={() => openChat(req)} className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-xl text-sm font-bold transition">💬 Чат</button>
                      <button onClick={() => startComplete(req)} className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-xl text-sm font-bold transition">✅ Завершить</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h2 className="text-lg font-bold mb-3">Мои заявки</h2>
            {myPlayerRequests.length === 0 ? (
              <div className="bg-[#111111] border border-white/10 rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-gray-400 mb-4">У тебя нет заявок на тест</p>
                <Link href="/test" className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-2xl font-bold transition inline-block">Пройти тест</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myPlayerRequests.map((req) => {
                  const status = statusLabels[req.status] || { text: req.status, color: 'bg-gray-500/20 text-gray-400' };
                  return (
                    <div key={req.id} className="bg-[#111111] border border-white/10 rounded-2xl p-5 flex items-center gap-4">
                      <img src={req.brawlers?.icon_url || 'https://via.placeholder.com/48'} alt="" className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                      <div className="flex-1">
                        <div className="font-bold">{req.brawlers?.name || 'Боец'}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(req.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${status.color}`}>{status.text}</span>
                      {(req.status === 'accepted' || req.status === 'testing') && (
                        <button onClick={() => openChat(req)} className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-xl text-sm font-bold transition">💬 Чат</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Очередь */}
        {activeTab === 'queue' && profile?.is_tester && (
          <div className="space-y-3">
            {waitingRequests.length === 0 ? (
              <div className="bg-[#111111] border border-white/10 rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">😴</div>
                <p className="text-gray-400">Очередь пуста</p>
              </div>
            ) : (
              waitingRequests.map((req) => (
                <div key={req.id} className="bg-[#111111] border border-white/10 rounded-2xl p-5 flex items-center gap-4">
                  <img src={req.brawlers?.icon_url || 'https://via.placeholder.com/48'} alt="" className="w-14 h-14 rounded-2xl object-cover border border-white/10" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg">{req.player_name}</span>
                      <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{req.player_tag}</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Боец: <span className="text-white">{req.brawlers?.name}</span> • {timeAgo(req.created_at)}
                    </div>
                  </div>
                  <button onClick={() => acceptRequest(req)} className="bg-green-500 hover:bg-green-600 px-5 py-2.5 rounded-2xl font-bold text-sm transition">✅ Принять</button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Чат */}
        {activeTab === 'chat' && activeChat && (
          <div className="bg-[#111111] border border-white/10 rounded-3xl overflow-hidden flex flex-col" style={{ height: '600px' }}>
            <div className="px-6 py-4 border-b border-white/10 flex items-center gap-4">
              <img src={activeChat.brawlers?.icon_url || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-xl object-cover" />
              <div>
                <div className="font-bold">{activeChat.player_name}</div>
                <div className="text-xs text-gray-400">{activeChat.brawlers?.name} • {activeChat.player_tag}</div>
              </div>
              {profile?.is_tester && activeChat.tester_id === user.id && (
                <button
                  onClick={() => startComplete(activeChat)}
                  className="ml-auto bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-xl font-bold text-sm transition"
                >
                  ✅ Завершить тест
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-12">Чат пуст. Напиши первым!</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id}>
                    {msg.is_system ? (
                      <div className="text-center text-xs text-gray-500 bg-white/5 rounded-xl py-2 px-4">
                        🔔 {msg.message}
                      </div>
                    ) : (
                      <div className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${msg.sender_id === user.id ? 'bg-orange-500 text-white' : 'bg-[#1a1a1a] text-gray-200'}`}>
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-[10px] mt-1 ${msg.sender_id === user.id ? 'text-orange-200' : 'text-gray-500'}`}>
                            {new Date(msg.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-6 py-4 border-t border-white/10 flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Напиши сообщение..."
                className="flex-1 bg-[#1a1a1a] border border-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition"
              />
              <button
                onClick={sendMessage}
                disabled={sendingMessage || !newMessage.trim()}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 px-6 py-3 rounded-2xl font-bold transition"
              >
                📤
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}