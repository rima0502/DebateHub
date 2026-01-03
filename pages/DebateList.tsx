
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CATEGORY_THEMES: Record<string, { color: string; bg: string; text: string; ring: string }> = {
  '전체': { color: 'bg-primary', bg: 'bg-primary/10', text: 'text-primary', ring: 'shadow-[0_0_20px_rgba(19,127,236,0.3)]' },
  '정치/사회': { color: 'bg-cat_politics', bg: 'bg-cat_politics/10', text: 'text-cat_politics', ring: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]' },
  '정치': { color: 'bg-cat_politics', bg: 'bg-cat_politics/10', text: 'text-cat_politics', ring: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]' },
  '사회': { color: 'bg-cat_politics', bg: 'bg-cat_politics/10', text: 'text-cat_politics', ring: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]' },
  '경제': { color: 'bg-cat_economy', bg: 'bg-cat_economy/10', text: 'text-cat_economy', ring: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]' },
  '기술': { color: 'bg-cat_tech', bg: 'bg-cat_tech/10', text: 'text-cat_tech', ring: 'shadow-[0_0_20px_rgba(14,165,233,0.3)]' },
  '과학': { color: 'bg-cat_tech', bg: 'bg-cat_tech/10', text: 'text-cat_tech', ring: 'shadow-[0_0_20px_rgba(14,165,233,0.3)]' },
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

const MOCK_ALL_DEBATES = [
  { 
    id: '1', 
    title: '보편적 기본소득: 필수인가, 재정 파탄인가?', 
    category: '경제', 
    desc: 'AI 시대의 새로운 복지 모델인 기본소득 도입의 실효성과 재정적 지속 가능성에 대해 논의합니다.',
    participants: '1.5k', 
    messages: '342', 
    status: 'HOT', 
    time: '2시간 전', 
    timestamp: 2,
    image: 'https://picsum.photos/seed/ubidebate/200/200'
  },
  { 
    id: '2', 
    title: '원격 근무의 제도화: 생산성 향상 vs 조직 문화 붕괴', 
    category: '사회', 
    desc: '포스트 코로나 시대, 재택근무가 표준이 될 수 있을까요? 기업 문화와 생산성 사이의 균형을 토론합니다.',
    participants: '856', 
    messages: '128', 
    status: 'HOT', 
    time: '10분 전', 
    timestamp: 0.16,
    image: 'https://picsum.photos/seed/remotework/200/200'
  },
  { 
    id: '3', 
    title: '우주 탐사 예산 증액: 인류의 도약인가, 자원 낭비인가?', 
    category: '과학', 
    desc: '화성 탐사와 민간 우주 비행 시대, 지구 내부의 문제를 먼저 해결해야 할까요? 아니면 밖으로 나아가야 할까요?',
    participants: '2.1k', 
    messages: '890', 
    status: 'NORMAL', 
    time: '방금 전', 
    timestamp: 0.01 
  },
  { 
    id: '4', 
    title: '청년 병역 의무화 제도 개편 논의', 
    category: '정치', 
    desc: '인구 절벽 시대, 모병제 전환과 여성 징집 등 군 복무 제도의 근본적인 변화에 대해 다룹니다.',
    participants: '4.2k', 
    messages: '1.2k', 
    status: 'HOT', 
    time: '5시간 전', 
    timestamp: 5,
    image: 'https://picsum.photos/seed/military/200/200'
  },
  { 
    id: '5', 
    title: '채식 주의 급식 확대, 선택인가 강요인가?', 
    category: '교육', 
    desc: '학교 급식 내 채식 선택권 보장이 성장기 학생들의 건강과 신념 사이에서 어떤 위치를 가져야 할까요?',
    participants: '500', 
    messages: '92', 
    status: 'NORMAL', 
    time: '1일 전', 
    timestamp: 24 
  },
  { 
    id: '6', 
    title: '일회용 컵 보증금제 실효성 논란', 
    category: '환경', 
    desc: '환경 보호를 위한 보증금제가 소상공인과 소비자에게 미치는 영향과 실제 폐기물 저감 효과를 분석합니다.',
    participants: '1.1k', 
    messages: '210', 
    status: 'NORMAL', 
    time: '3시간 전', 
    timestamp: 3,
    image: 'https://picsum.photos/seed/ecocup/200/200'
  },
];

const parseCount = (str: string): number => {
  if (str.endsWith('k')) return parseFloat(str) * 1000;
  return parseInt(str);
};

export default function DebateList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('전체');
  const [activeSort, setActiveSort] = useState<SortOption>('LATEST');
  const [isSorting, setIsSorting] = useState(false);
  const [userDebates, setUserDebates] = useState<any[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('user_debates') || '[]');
    setUserDebates(saved);
  }, []);

  useEffect(() => {
    setIsSorting(true);
    const timer = setTimeout(() => setIsSorting(false), 400);
    return () => clearTimeout(timer);
  }, [activeSort, activeCategory]);

  const combinedDebates = useMemo(() => {
    return [...userDebates, ...MOCK_ALL_DEBATES];
  }, [userDebates]);

  const filteredAndSortedDebates = useMemo(() => {
    let result = combinedDebates.filter(debate => {
      const matchesSearch = debate.title.toLowerCase().includes(searchTerm.toLowerCase()) || (debate.desc && debate.desc.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = activeCategory === '전체' || debate.category === activeCategory.split('/')[0] || debate.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    result.sort((a, b) => {
      if (activeSort === 'LATEST') return a.timestamp - b.timestamp;
      if (activeSort === 'PARTICIPANTS') return parseCount(b.participants) - parseCount(a.participants);
      if (activeSort === 'MESSAGES') return parseCount(b.messages) - parseCount(a.messages);
      return 0;
    });

    return result;
  }, [searchTerm, activeCategory, activeSort, combinedDebates]);

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

        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 transition-all duration-500 ${isSorting ? 'opacity-40 translate-y-2' : 'opacity-100 translate-y-0'}`}>
          {filteredAndSortedDebates.length > 0 ? (
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
