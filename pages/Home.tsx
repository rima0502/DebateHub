
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CATEGORY_THEMES: Record<string, { color: string; border: string; bg: string; text: string }> = {
  '전체': { color: 'bg-primary', border: 'border-primary/50', bg: 'bg-primary/10', text: 'text-primary' },
  '정치/사회': { color: 'bg-cat_politics', border: 'border-cat_politics/50', bg: 'bg-cat_politics/10', text: 'text-cat_politics' },
  '정치': { color: 'bg-cat_politics', border: 'border-cat_politics/50', bg: 'bg-cat_politics/10', text: 'text-cat_politics' },
  '경제': { color: 'bg-cat_economy', border: 'border-cat_economy/50', bg: 'bg-cat_economy/10', text: 'text-cat_economy' },
  '기술': { color: 'bg-cat_tech', border: 'border-cat_tech/50', bg: 'bg-cat_tech/10', text: 'text-cat_tech' },
  '과학': { color: 'bg-cat_tech', border: 'border-cat_tech/50', bg: 'bg-cat_tech/10', text: 'text-cat_tech' },
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

const MOCK_DEBATES = [
  {
    id: '1',
    title: '보편적 기본소득: 필수인가, 재정 파탄인가?',
    category: '경제',
    time: '2시간 전',
    desc: 'AI로 인한 일자리 감소에 대비해 보편적 기본소득(UBI)을 도입해야 한다는 주장과, 국가 재정에 막대한 부담을 주며 근로 의욕을 저하시킬 것이라는 반론이 맞서고 있습니다.',
    participants: '1.5k',
    messages: '342',
    image: 'https://picsum.photos/seed/ubidebate/600/400',
  },
  {
    id: '2',
    title: '원격 근무의 제도화: 생산성 향상 vs 조직 문화 붕괴',
    category: '정치/사회',
    time: '10분 전',
    desc: '포스트 코로나 시대, 전면 원격 근무를 법적으로 보장해야 하는가? 아니면 사무실 복귀가 조직의 혁신을 위해 필수적인가?',
    participants: '856',
    messages: '128',
    image: 'https://picsum.photos/seed/remotework/600/400',
  },
  {
    id: '3',
    title: '우주 탐사 예산 증액: 인류의 도약인가, 자원 낭비인가?',
    category: '기술',
    time: '방금 전',
    desc: '지구의 기외 위기와 빈곤 문제가 시급한 상황에서, 화성 이주 계획과 같은 거대 우주 프로젝트에 천문학적 예산을 투입하는 것이 정당한가?',
    participants: '2.1k',
    messages: '890',
    image: 'https://picsum.photos/seed/spacexx/600/400',
  },
  {
    id: '4',
    title: '일회용 컵 보증금제 실효성 논란',
    category: '환경',
    time: '3시간 전',
    desc: '환경 보호를 위한 보증금제가 소상공인과 소비자에게 미치는 영향과 실제 폐기물 저감 효과를 분석합니다.',
    participants: '1.1k',
    messages: '210',
    image: 'https://picsum.photos/seed/ecocup/600/400',
  },
  {
    id: '5',
    title: '디지털 교과서 도입, 학습 효과인가 중독인가?',
    category: '교육',
    time: '5시간 전',
    desc: '전국 초중고 디지털 교과서 전면 도입에 따른 교육의 질 향상과 스마트폰/태블릿 중독 우려 사이의 팽팽한 토론.',
    participants: '742',
    messages: '156',
    image: 'https://picsum.photos/seed/education/600/400',
  }
];

const MOCK_RECENT_VISITS = [
  { id: '1', title: '보편적 기본소득: 필수인가...', category: '경제', time: '방금 전' },
  { id: '4', title: '일회용 컵 보증금제 실효성...', category: '환경', time: '1시간 전' },
  { id: '10', title: '청년 병역 의무화 개편안', category: '정치', time: '3시간 전' },
  { id: '12', title: '초중고 채식 급식 확대', category: '교육', time: '어제' },
];

const MOCK_FEED_DATA = [
  { user: 'K', cat: '경제', text: '"기본소득은 근로 의욕 저하보다 소비 활성화 효과가 더 큽니다." 라는 반박이 등록되었습니다.', time: '방금 전' },
  { user: 'J', cat: '기술', text: 'SpaceX 프로젝트 관련 새로운 투표가 시작되었습니다.', time: '2분 전' },
  { user: 'M', cat: '정치/사회', text: '"원격 근무" 토론방이 최종 결론 도출 단계에 진입했습니다.', time: '5분 전' },
  { user: 'A', cat: '정치/사회', text: '청년 병역 의무화 토론에서 새로운 핵심 증거가 제시되었습니다.', time: '12분 전' },
  { user: 'L', cat: '환경', text: '일회용 컵 보증금제 실효성 토론에 50명의 새로운 참여자가 입장했습니다.', time: '18분 전' },
];

const parseCount = (str: string): number => {
  if (!str) return 0;
  if (typeof str !== 'string') return Number(str) || 0;
  if (str.endsWith('k')) return parseFloat(str) * 1000;
  return parseInt(str) || 0;
};

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('전체');
  const [isFeedExpanded, setIsFeedExpanded] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<string[]>(['1']);
  const [userDebates, setUserDebates] = useState<any[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('user_debates') || '[]');
    setUserDebates(saved);
  }, []);

  const combinedDebates = useMemo(() => {
    return [...userDebates, ...MOCK_DEBATES];
  }, [userDebates]);

  // 상단 히어로 섹션에 표시할 참여자 수가 가장 많은 토론 추출
  const topDebate = useMemo(() => {
    if (combinedDebates.length === 0) return null;
    return [...combinedDebates].sort((a, b) => parseCount(b.participants) - parseCount(a.participants))[0];
  }, [combinedDebates]);

  const filteredDebates = useMemo(() => {
    if (activeCategory === '전체') return combinedDebates;
    return combinedDebates.filter(debate => debate.category === activeCategory);
  }, [activeCategory, combinedDebates]);

  const togglePin = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPinnedIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const pinnedDebates = MOCK_RECENT_VISITS.filter(v => pinnedIds.includes(v.id));
  const recentDebates = MOCK_RECENT_VISITS.filter(v => !pinnedIds.includes(v.id));

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
                <span className="material-symbols-outlined text-primary fill-1">local_fire_department</span>
                지금 핫한 토론 {activeCategory !== '전체' && <span className="text-sm font-medium text-slate-500">({activeCategory})</span>}
              </h2>
              <Link to="/debates" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                전체보기 <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </Link>
            </div>
            
            <div className="flex flex-col gap-6 min-h-[300px]">
              {filteredDebates.length > 0 ? (
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
            <div className={`flex flex-col transition-all duration-700 ease-in-out overflow-hidden ${isFeedExpanded ? 'max-h-[1000px]' : 'max-h-[300px]'}`}>
              {MOCK_FEED_DATA.map((item, i) => {
                const theme = CATEGORY_THEMES[item.cat] || CATEGORY_THEMES['전체'];
                return (
                  <div 
                    key={i} 
                    className={`p-5 border-b border-slate-800/50 hover:bg-slate-800/30 transition-all cursor-pointer group ${
                      !isFeedExpanded && i >= 3 ? 'hidden' : 'animate-in fade-in slide-in-from-bottom-2 duration-300'
                    }`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex gap-4">
                      <div className={`size-9 rounded-full ${theme.bg} ${theme.text} flex items-center justify-center text-sm font-black shrink-0 border ${theme.border}`}>{item.user}</div>
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{item.time} • <span className={theme.text}>{item.cat}</span></p>
                        <p className="text-xs text-slate-300 leading-relaxed group-hover:text-white transition-colors">{item.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
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

          {/* My Debates */}
          <div className="rounded-2xl bg-[#1c2127] border border-slate-800 shadow-sm flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">bookmarks</span>
                나의 토론방
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
