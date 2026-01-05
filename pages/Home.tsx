
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDebates } from '../src/hooks/useDebates';
import { useAuth } from '../src/hooks/useAuth';
import type { Debate as FirestoreDebate } from '../src/types/debate';
import { Timestamp, collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../src/firebase';

const CATEGORY_THEMES: Record<string, { color: string; border: string; bg: string; text: string }> = {
  '전체': { color: 'bg-primary', border: 'border-primary/50', bg: 'bg-primary/10', text: 'text-primary' },
  '정치/사회': { color: 'bg-cat_politics', border: 'border-cat_politics/50', bg: 'bg-cat_politics/10', text: 'text-cat_politics' },
  '경제': { color: 'bg-cat_economy', border: 'border-cat_economy/50', bg: 'bg-cat_economy/10', text: 'text-cat_economy' },
  '기술': { color: 'bg-cat_tech', border: 'border-cat_tech/50', bg: 'bg-cat_tech/10', text: 'text-cat_tech' },
  '윤리': { color: 'bg-cat_ethics', border: 'border-cat_ethics/50', bg: 'bg-cat_ethics/10', text: 'text-cat_ethics' },
  '환경': { color: 'bg-cat_env', border: 'border-cat_env/50', bg: 'bg-cat_env/10', text: 'text-cat_env' },
  '교육': { color: 'bg-cat_edu', border: 'border-cat_edu/50', bg: 'bg-cat_edu/10', text: 'text-cat_edu' },
};

const CATEGORIES = [
  { id: '전체', icon: 'grid_view' },
  { id: '정치/사회', icon: 'gavel' },
  { id: '경제', icon: 'trending_up' },
  { id: '기술', icon: 'memory' },
  { id: '윤리', icon: 'balance' },
  { id: '환경', icon: 'public' },
  { id: '교육', icon: 'school' },
];

// Firestore 데이터를 화면 표시용으로 변환하는 헬퍼 함수
const formatDebateForDisplay = (debate: FirestoreDebate) => {
  const getTimeAgo = (timestamp: Timestamp) => {
    const now = Date.now();
    const debateTime = timestamp.toMillis();
    const diff = now - debateTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  return {
    id: debate.id,
    title: debate.title,
    category: debate.category,
    time: getTimeAgo(debate.createdAt as Timestamp),
    desc: debate.description,
    participants: debate.participantCount.toString(),
    messages: debate.messageCount.toString(),
    image: debate.imageUrl || 'https://picsum.photos/seed/debate/600/400',
  };
};

interface FeedItem {
  user: string;
  cat: string;
  text: string;
  time: string;
  debateId?: string;
  timestamp?: number; // 정렬용 타임스탬프
  userAvatar?: string; // 프로필 사진
  messageId?: string; // 하이라이트할 메시지 ID
}

const parseCount = (str: string): number => {
  if (!str) return 0;
  if (typeof str !== 'string') return Number(str) || 0;
  if (str.endsWith('k')) return parseFloat(str) * 1000;
  return parseInt(str) || 0;
};

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('전체');
  const [isFeedExpanded, setIsFeedExpanded] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [recentVisits, setRecentVisits] = useState<any[]>([]);
  const [feedData, setFeedData] = useState<FeedItem[]>([]);
  const { user } = useAuth();

  // Firestore에서 토론방 데이터 가져오기
  const { debates: firestoreDebates, loading } = useDebates(activeCategory === '전체' ? undefined : activeCategory as any);

  // localStorage에서 핀 정보와 최근 방문 정보 불러오기 (사용자별로)
  useEffect(() => {
    if (user) {
      // 사용자별 키 사용
      const userKey = user.uid;
      const visits = JSON.parse(localStorage.getItem(`recent_visits_${userKey}`) || '[]');
      setRecentVisits(visits);

      const savedPins = JSON.parse(localStorage.getItem(`pinned_debates_${userKey}`) || '[]');
      setPinnedIds(savedPins);
    } else {
      // 로그아웃 시 초기화
      setRecentVisits([]);
      setPinnedIds([]);
      setFeedData([]);
    }
  }, [user]);

  // 활동 피드: Firestore notifications 컬렉션에서 가져오기
  useEffect(() => {
    if (!user) {
      setFeedData([]);
      return;
    }

    const getTimeAgo = (timestamp: Timestamp) => {
      const now = Date.now();
      const time = timestamp.toMillis();
      const diff = now - time;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);

      if (minutes < 1) return '방금 전';
      if (minutes < 60) return `${minutes}분 전`;
      if (hours < 24) return `${hours}시간 전`;
      return `${Math.floor(hours / 24)}일 전`;
    };

    // Firestore notifications 컬렉션 실시간 구독
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      limit(50)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notifications: FeedItem[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          user: data.actorName?.charAt(0) || 'U',
          cat: data.category || '전체',
          text: data.type === 'like'
            ? `[${data.debateTitle}] 회원님의 의견 "${data.messageContent}..."에 좋아요를 눌렀습니다.`
            : `[${data.debateTitle}] "${data.messageContent}..." 라는 답글이 등록되었습니다.`,
          time: data.createdAt ? getTimeAgo(data.createdAt as Timestamp) : '방금 전',
          debateId: data.debateId,
          timestamp: data.createdAt ? (data.createdAt as Timestamp).toMillis() : Date.now(),
          userAvatar: data.actorAvatar,
          messageId: data.messageId
        };
      });

      // 클라이언트에서 정렬
      notifications.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      setFeedData(notifications);
    });

    return () => unsubscribe();
  }, [user]);

  // Firestore 데이터를 화면 표시용 포맷으로 변환
  const combinedDebates = useMemo(() => {
    if (loading) return [];
    return firestoreDebates.map(formatDebateForDisplay);
  }, [firestoreDebates, loading]);

  // 상단 히어로 섹션에 표시할 참여자 수가 가장 많은 토론 추출
  const topDebate = useMemo(() => {
    if (combinedDebates.length === 0) return null;
    return [...combinedDebates].sort((a, b) => parseCount(b.participants) - parseCount(a.participants))[0];
  }, [combinedDebates]);

  const filteredDebates = useMemo(() => {
    const filtered = activeCategory === '전체'
      ? combinedDebates
      : combinedDebates.filter(debate => debate.category === activeCategory);

    // 참여자 수 기준으로 내림차순 정렬
    return [...filtered].sort((a, b) => parseCount(b.participants) - parseCount(a.participants));
  }, [activeCategory, combinedDebates]);

  const togglePin = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    setPinnedIds(prev => {
      const newPinned = prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id];
      // 사용자별로 localStorage에 저장
      const userKey = user.uid;
      localStorage.setItem(`pinned_debates_${userKey}`, JSON.stringify(newPinned));
      return newPinned;
    });
  };

  const pinnedDebates = recentVisits.filter(v => pinnedIds.includes(v.id));
  const recentDebates = recentVisits.filter(v => !pinnedIds.includes(v.id));

  return (
    <div className="flex flex-col items-center w-full bg-[#0b0f14]">
      {/* Hero Section - Dynamically showing the most participated debate */}
      {topDebate && (
        <section className="w-full max-w-[1440px] px-4 sm:px-10 py-8 lg:py-12 animate-in fade-in duration-700">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1c2127] to-[#101922] border border-slate-800 shadow-2xl p-6 lg:p-10 flex flex-col lg:flex-row gap-8 items-center">
            <div className="flex-1 flex flex-col gap-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-red-400 text-[10px] font-black uppercase tracking-wider">가장 핫한 토론</span>
              </div>
              <h1 className="text-white text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight">
                {topDebate.title.split(':').length > 1 ? (
                  <>
                    {topDebate.title.split(':')[0]}
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                      {topDebate.title.split(':')[1].trim()}
                    </span>
                  </>
                ) : topDebate.title}
              </h1>
              <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
                {topDebate.desc}
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link to={`/room/${topDebate.id}`} className="h-11 px-6 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-all shadow-lg shadow-primary/25 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">forum</span>
                  토론 참여하기
                </Link>
                <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                  <span className="material-symbols-outlined text-primary">groups</span>
                  현재 {topDebate.participants}명 참여 중
                </div>
              </div>
            </div>
            <div className="w-full lg:w-[45%] aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/5 relative shrink-0">
              <img src={topDebate.image} alt={topDebate.title} className="w-full h-full object-cover opacity-60 transition-transform duration-1000 hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f14] via-transparent to-transparent opacity-80"></div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <div className="w-full max-w-[1440px] px-4 sm:px-10 py-6 flex flex-col lg:flex-row gap-10">
        <div className="flex-1 flex flex-col gap-8">
          
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => {
              const theme = CATEGORY_THEMES[cat.id] || CATEGORY_THEMES['전체'];
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    isActive
                    ? `${theme.color} text-white shadow-lg`
                    : `bg-[#1c2127] text-slate-400 hover:text-white hover:bg-slate-700`
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                  {cat.id}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-red-500 fill-1">local_fire_department</span>
                지금 핫한 토론 {activeCategory !== '전체' && <span className="text-sm font-medium text-slate-500">({activeCategory})</span>}
              </h2>
              <Link to="/debates" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                전체보기 <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </Link>
            </div>
            
            <div className="flex flex-col gap-6 min-h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-sm font-medium">토론방 불러오는 중...</p>
                  </div>
                </div>
              ) : filteredDebates.length > 0 ? (
                filteredDebates.map(debate => {
                  const theme = CATEGORY_THEMES[debate.category] || CATEGORY_THEMES['전체'];
                  return (
                    <article key={debate.id} className={`group overflow-hidden rounded-xl bg-[#1c2127] border border-slate-800 shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 hover:border-${theme.text.split('-')[1]}/50`}>
                      <div className="flex flex-col sm:flex-row h-full">
                        <div className="sm:w-56 h-48 sm:h-auto bg-cover bg-center shrink-0 overflow-hidden">
                          <img src={debate.image} alt={debate.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        </div>
                        <div className="flex-1 p-6 flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-0.5 rounded ${theme.bg} ${theme.text} text-[10px] font-black uppercase tracking-wider`}>{debate.category}</span>
                              <span className="text-[11px] text-slate-500 font-medium">{debate.time}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <h3 className={`text-lg font-bold text-white transition-colors leading-tight group-hover:${theme.text}`}>{debate.title}</h3>
                            <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{debate.desc}</p>
                          </div>
                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800">
                            <div className="flex items-center gap-4 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">group</span> {debate.participants} 참여</span>
                              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">chat_bubble</span> {debate.messages} 의견</span>
                            </div>
                            <Link to={`/room/${debate.id}`} className="px-5 py-2 rounded-lg bg-slate-800 text-white text-xs font-black hover:bg-primary transition-all active:scale-95">
                              참여하기
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-[#1c2127]/30 rounded-2xl border border-dashed border-slate-800 animate-in fade-in">
                  <div className="size-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-slate-600 text-3xl">inbox</span>
                  </div>
                  <h3 className="text-slate-400 font-bold mb-1">핫한 토론이 없습니다</h3>
                  <p className="text-slate-600 text-sm">해당 카테고리의 인기 토론이 아직 준비되지 않았습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-80 xl:w-96 flex flex-col gap-8 shrink-0">
          <div className="rounded-2xl bg-gradient-to-br from-primary to-blue-700 p-8 text-white shadow-xl shadow-primary/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 size-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <h3 className="text-xl font-black mb-2 relative">나만의 토론 주제가 있나요?</h3>
            <p className="text-blue-100 text-sm mb-6 relative leading-relaxed">새로운 논제를 발의하고 지능형 공론장을 직접 개설해보세요.</p>
            <Link to="/create" className="w-full h-12 bg-white text-primary font-black rounded-xl text-sm hover:bg-blue-50 transition-all shadow-lg flex items-center justify-center gap-2 relative">
              <span className="material-symbols-outlined">add_circle</span>
              새 토론방 만들기
            </Link>
          </div>

          {/* Real-time Activity Feed */}
          <div className="rounded-2xl bg-[#1c2127] border border-slate-800 shadow-sm flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-800">
              <h3 className="font-black text-white flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                실시간 활동 피드
              </h3>
            </div>
            <div className={`flex flex-col transition-all duration-700 ease-in-out overflow-y-auto no-scrollbar ${isFeedExpanded ? 'max-h-[1000px]' : 'max-h-[300px]'}`}>
              {feedData.length > 0 ? feedData.map((item, i) => {
                const theme = CATEGORY_THEMES[item.cat] || CATEGORY_THEMES['전체'];
                return (
                  <Link
                    key={i}
                    to={item.debateId ? `/room/${item.debateId}${item.messageId ? `?highlight=${item.messageId}` : ''}` : '#'}
                    className={`p-5 border-b border-slate-800/50 hover:bg-slate-800/30 transition-all cursor-pointer group block ${
                      !isFeedExpanded && i >= 3 ? 'hidden' : 'animate-in fade-in slide-in-from-bottom-2 duration-300'
                    }`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex gap-4">
                      {item.userAvatar ? (
                        <img
                          src={item.userAvatar}
                          alt={item.user}
                          className="size-9 rounded-full shrink-0 border-2 border-slate-700 object-cover"
                        />
                      ) : (
                        <div className={`size-9 rounded-full ${theme.bg} ${theme.text} flex items-center justify-center text-sm font-black shrink-0 border ${theme.border}`}>{item.user}</div>
                      )}
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{item.time} • <span className={theme.text}>{item.cat}</span></p>
                        <p className="text-xs text-slate-300 leading-relaxed group-hover:text-white transition-colors">{item.text}</p>
                      </div>
                    </div>
                  </Link>
                );
              }) : (
                <div className="p-8 text-center">
                  <p className="text-xs text-slate-500">실시간 활동 피드가 없습니다.</p>
                  <p className="text-[10px] text-slate-600 mt-1">토론에 참여하면 답글과 좋아요 알림을 받을 수 있습니다.</p>
                </div>
              )}
            </div>
            <button 
              onClick={() => setIsFeedExpanded(!isFeedExpanded)}
              className="w-full py-4 text-xs font-black text-slate-500 hover:text-primary transition-all bg-[#15191e] border-t border-slate-800 flex items-center justify-center gap-2 group"
            >
              {isFeedExpanded ? '활동 피드 접기' : '더 많은 피드 보기'}
              <span className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${isFeedExpanded ? 'rotate-180' : 'group-hover:translate-y-0.5'}`}>
                {isFeedExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
              </span>
            </button>
          </div>

          {/* Recently Visited Debates */}
          <div className="rounded-2xl bg-[#1c2127] border border-slate-800 shadow-sm flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">history</span>
                최근 방문한 토론방
              </h3>
            </div>
            
            <div className="flex flex-col max-h-[500px] overflow-y-auto no-scrollbar">
              {/* Pinned Section */}
              {pinnedDebates.length > 0 && (
                <div className="flex flex-col">
                  <div className="px-5 py-2 bg-slate-800/50 text-[10px] font-black text-slate-500 uppercase tracking-widest">고정된 토론</div>
                  {pinnedDebates.map(item => {
                    const theme = CATEGORY_THEMES[item.category] || CATEGORY_THEMES['전체'];
                    return (
                      <Link key={item.id} to={`/room/${item.id}`} className="group p-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-all flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black ${theme.text} px-1.5 py-0.5 rounded ${theme.bg}`}>{item.category}</span>
                            <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{item.title}</span>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => togglePin(e, item.id)}
                          className="text-primary hover:scale-110 transition-transform"
                        >
                          <span className="material-symbols-outlined text-[18px] fill-1">push_pin</span>
                        </button>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Recent Section */}
              <div className="flex flex-col">
                <div className="px-5 py-2 bg-slate-800/50 text-[10px] font-black text-slate-500 uppercase tracking-widest">최근 방문</div>
                {recentDebates.length > 0 ? (
                  recentDebates.map(item => {
                    const theme = CATEGORY_THEMES[item.category] || CATEGORY_THEMES['전체'];
                    return (
                      <Link key={item.id} to={`/room/${item.id}`} className="group p-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-all flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black ${theme.text} px-1.5 py-0.5 rounded ${theme.bg}`}>{item.category}</span>
                            <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200 transition-colors">{item.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-600">{item.time} 방문</span>
                        </div>
                        <button 
                          onClick={(e) => togglePin(e, item.id)}
                          className="text-slate-600 hover:text-slate-400 hover:scale-110 transition-all"
                        >
                          <span className="material-symbols-outlined text-[18px]">push_pin</span>
                        </button>
                      </Link>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-xs text-slate-600 font-medium">최근 방문한 토론방이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-slate-800/20 border-t border-slate-800">
              <p className="text-[10px] text-slate-600 leading-relaxed">
                최근 방문 목록의 핀 아이콘을 눌러 상단에 고정할 수 있습니다.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
