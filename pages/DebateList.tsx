
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDebates } from '../src/hooks/useDebates';
import type { Debate as FirestoreDebate, DebateCategory } from '../src/types/debate';
import { Timestamp } from 'firebase/firestore';

const CATEGORY_THEMES: Record<string, { color: string; bg: string; text: string; ring: string }> = {
  '전체': { color: 'bg-primary', bg: 'bg-primary/10', text: 'text-primary', ring: 'shadow-[0_0_20px_rgba(19,127,236,0.3)]' },
  '정치/사회': { color: 'bg-cat_politics', bg: 'bg-cat_politics/10', text: 'text-cat_politics', ring: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]' },
  '경제': { color: 'bg-cat_economy', bg: 'bg-cat_economy/10', text: 'text-cat_economy', ring: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]' },
  '기술': { color: 'bg-cat_tech', bg: 'bg-cat_tech/10', text: 'text-cat_tech', ring: 'shadow-[0_0_20px_rgba(14,165,233,0.3)]' },
  '윤리': { color: 'bg-cat_ethics', bg: 'bg-cat_ethics/10', text: 'text-cat_ethics', ring: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]' },
  '환경': { color: 'bg-cat_env', bg: 'bg-cat_env/10', text: 'text-cat_env', ring: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]' },
  '교육': { color: 'bg-cat_edu', bg: 'bg-cat_edu/10', text: 'text-cat_edu', ring: 'shadow-[0_0_20px_rgba(99,102,241,0.3)]' },
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

type SortOption = 'LATEST' | 'PARTICIPANTS' | 'MESSAGES';

const SORT_OPTIONS: { id: SortOption; label: string; icon: string }[] = [
  { id: 'LATEST', label: '최신순', icon: 'schedule' },
  { id: 'PARTICIPANTS', label: '참여자순', icon: 'groups' },
  { id: 'MESSAGES', label: '의견많은순', icon: 'forum' },
];

const formatTimestamp = (timestamp: Timestamp) => {
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

interface DisplayDebate {
  id: string;
  title: string;
  category: string;
  desc: string;
  participants: number;
  messages: number;
  time: string;
  timestamp: number;
  image?: string;
}

const formatDebateForDisplay = (debate: FirestoreDebate): DisplayDebate => {
  return {
    id: debate.id,
    title: debate.title,
    category: debate.category,
    desc: debate.description,
    participants: debate.participantCount || 0,
    messages: debate.messageCount || 0,
    time: formatTimestamp(debate.updatedAt as Timestamp),
    timestamp: (debate.updatedAt as Timestamp).toMillis(),
    image: debate.imageUrl
  };
};

export default function DebateList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('전체');
  const [activeSort, setActiveSort] = useState<SortOption>('PARTICIPANTS');
  const { debates: firestoreDebates, loading } = useDebates(activeCategory === '전체' ? undefined : activeCategory as DebateCategory);

  const combinedDebates = useMemo(() => {
    if (loading) return [];
    return firestoreDebates.map(formatDebateForDisplay);
  }, [firestoreDebates, loading]);

  const filteredAndSortedDebates = useMemo(() => {
    let result = combinedDebates.filter(debate => {
      const matchesSearch = debate.title.toLowerCase().includes(searchTerm.toLowerCase()) || (debate.desc && debate.desc.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });

    result.sort((a, b) => {
      if (activeSort === 'LATEST') return b.timestamp - a.timestamp;
      if (activeSort === 'PARTICIPANTS') return b.participants - a.participants;
      if (activeSort === 'MESSAGES') return b.messages - a.messages;
      return 0;
    });

    return result;
  }, [searchTerm, activeSort, combinedDebates]);

  return (
    <div className="min-h-screen bg-[#0b0f14] py-12 px-4">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-10">
        <header className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-2">
              <span className="h-px w-12 bg-primary"></span>
              <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em]">Explore Debates</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">전체 토론 목록</h1>
            <p className="text-slate-500 text-sm">진행 중인 다양한 논제들을 확인하고 토론에 참여하세요.</p>
          </div>

          <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-end justify-between">
            <div className="flex flex-wrap gap-2.5">
              {CATEGORIES.map(cat => {
                const theme = CATEGORY_THEMES[cat.id] || CATEGORY_THEMES['전체'];
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 border ${
                      isActive
                      ? `${theme.color} border-transparent text-white ${theme.ring}`
                      : 'bg-[#1c2127]/50 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                    {cat.id}
                  </button>
                );
              })}
            </div>

            <div className="flex p-1 bg-[#1c2127] rounded-xl border border-slate-800 shadow-inner">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setActiveSort(option.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black transition-all duration-500 ${
                    activeSort === option.id
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  {activeSort === option.id && (
                    <span className="absolute inset-0 bg-gradient-to-br from-blue-600 to-primary rounded-lg shadow-lg animate-in fade-in zoom-in duration-300"></span>
                  )}
                  <span className="material-symbols-outlined text-[16px] relative z-10">{option.icon}</span>
                  <span className="relative z-10">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-colors">search</span>
            <input 
              type="text" 
              placeholder="관심 있는 토론 키워드나 제목을 입력하세요..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-16 pl-14 pr-6 rounded-2xl bg-[#1c2127] border border-slate-800 text-white text-base outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xl"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 text-sm font-medium">토론방 불러오는 중...</p>
              </div>
            </div>
          ) : filteredAndSortedDebates.length > 0 ? (
            filteredAndSortedDebates.map(debate => {
              const theme = CATEGORY_THEMES[debate.category] || CATEGORY_THEMES['전체'];
              const themeName = theme.text.split('-')[1]; // politics, economy, tech etc
              return (
                <Link 
                  to={`/room/${debate.id}`} 
                  key={debate.id}
                  className={`group relative flex flex-col h-full rounded-2xl bg-[#1c2127] border border-slate-800/50 hover:border-${themeName}/50 transition-all duration-300 shadow-sm hover:shadow-2xl hover:shadow-${themeName}/5 overflow-hidden`}
                >
                  <div className={`absolute top-0 left-0 w-full h-1 ${theme.color}`}></div>
                  
                  <div className="p-6 flex flex-col h-full gap-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded ${theme.bg} ${theme.text} text-[9px] font-black uppercase tracking-wider border border-${themeName}/20`}>
                          {debate.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-600 font-bold">{debate.time}</span>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1 flex flex-col gap-2">
                        <h3 className={`text-lg font-bold text-white group-hover:${theme.text} transition-colors leading-snug line-clamp-2`}>
                          {debate.title}
                        </h3>
                        {debate.desc && (
                          <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                            {debate.desc}
                          </p>
                        )}
                      </div>
                      {debate.image && (
                        <div className={`shrink-0 size-20 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 group-hover:border-${themeName}/50 transition-colors shadow-lg`}>
                          <img 
                            src={debate.image} 
                            alt={debate.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-5 border-t border-slate-800/50">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <span className="material-symbols-outlined text-[18px]">groups</span>
                          <span className="text-[11px] font-black">{debate.participants}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <span className="material-symbols-outlined text-[18px]">forum</span>
                          <span className="text-[11px] font-black">{debate.messages}</span>
                        </div>
                      </div>
                      
                      <div className={`size-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:${theme.color} group-hover:text-white transition-all duration-300`}>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full py-32 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4">
              <div className="size-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6 border border-slate-700/50">
                <span className="material-symbols-outlined text-slate-600 text-4xl">search_off</span>
              </div>
              <h3 className="text-xl font-bold text-slate-400 mb-2">검색 결과가 없습니다</h3>
              <p className="text-slate-600 text-sm">다른 키워드로 검색하거나 카테고리를 변경해보세요.</p>
              <button 
                onClick={() => {setSearchTerm(''); setActiveCategory('전체');}}
                className="mt-6 px-6 py-2 rounded-lg border border-slate-700 text-slate-500 hover:text-white hover:border-primary transition-all text-xs font-bold"
              >
                필터 초기화
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
