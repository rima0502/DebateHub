
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatMessage, Participant } from '../types';

const CATEGORY_THEMES: Record<string, { color: string; bg: string; text: string }> = {
  '전체': { color: 'bg-primary', bg: 'bg-primary/20', text: 'text-primary' },
  '정치/사회': { color: 'bg-cat_politics', bg: 'bg-cat_politics/20', text: 'text-cat_politics' },
  '경제': { color: 'bg-cat_economy', bg: 'bg-cat_economy/20', text: 'text-cat_economy' },
  '기술': { color: 'bg-cat_tech', bg: 'bg-cat_tech/20', text: 'text-cat_tech' },
  '윤리': { color: 'bg-cat_ethics', bg: 'bg-cat_ethics/20', text: 'text-cat_ethics' },
  '환경': { color: 'bg-cat_env', bg: 'bg-cat_env/20', text: 'text-cat_env' },
  '교육': { color: 'bg-cat_edu', bg: 'bg-cat_edu/20', text: 'text-cat_edu' },
};

// 공유될 수 있는 모의 데이터
const ALL_DEBATES_DATA: Record<string, { title: string; category: string }> = {
  '1': { title: '보편적 기본소득: 필수인가, 재정 파탄인가?', category: '경제' },
  '2': { title: '원격 근무의 제도화: 생산성 향상 vs 조직 문화 붕괴', category: '정치/사회' },
  '3': { title: '우주 탐사 예산 증액: 인류의 도약인가, 자원 낭비인가?', category: '기술' },
  '4': { title: '일회용 컵 보증금제 실효성 논란', category: '환경' },
  '5': { title: '디지털 교과서 도입, 학습 효과인가 중독인가?', category: '교육' },
  'ai-consciousness': { title: 'AI는 지각을 가질 수 있는가? 인공 의식의 윤리적 딜레마', category: '기술' }
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    user: 'TechOptimist',
    avatar: 'https://picsum.photos/seed/user1/40/40',
    content: '이 논제에 대해 논리적인 접근이 필요합니다. 우리는 단순히 두려워하기보다 기술의 혜택과 리스크를 동시에 계량화해야 합니다.',
    timestamp: '오전 10:45',
    side: 'PRO',
    likes: 12
  },
  {
    id: 'm2',
    user: 'SafetyFirst',
    avatar: 'https://picsum.photos/seed/user2/40/40',
    content: "안전이 담보되지 않은 혁신은 결국 사회적 비용을 초래합니다. 속도보다는 방향성이 중요한 시점입니다.",
    timestamp: '오전 10:48',
    side: 'CON',
    likes: 8,
    replyTo: 'TechOptimist'
  }
];

const INITIAL_PARTICIPANTS: Participant[] = [
  { id: 'p1', name: 'Moderator_Kim', side: 'HOST', avatar: 'https://picsum.photos/seed/host/40/40', status: '활동 중', warnings: 0 },
  { id: 'p2', name: 'TechOptimist', side: 'PRO', avatar: 'https://picsum.photos/seed/user1/40/40', status: '활동 중', warnings: 0 },
  { id: 'p3', name: 'SafetyFirst', side: 'CON', avatar: 'https://picsum.photos/seed/user2/40/40', status: '대기 중', warnings: 0 },
  { id: 'p4', name: 'EcoWarrior', side: 'CON', avatar: 'https://picsum.photos/seed/user3/40/40', status: '대기 중', warnings: 0 },
  { id: 'p5', name: 'FutureLooker', side: 'PRO', avatar: 'https://picsum.photos/seed/user4/40/40', status: '활동 중', warnings: 0 },
  { id: 'me', name: '나', side: 'PRO', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', status: '활동 중', warnings: 0 },
];

export default function DebateRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [participants, setParticipants] = useState<Participant[]>(INITIAL_PARTICIPANTS);
  const [input, setInput] = useState('');
  const [userSide, setUserSide] = useState<'PRO' | 'CON'>('PRO');
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());
  const [activeParticipantId, setActiveParticipantId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [debateInfo, setDebateInfo] = useState<{ title: string; category: string }>({ title: '로딩 중...', category: '기타' });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      // 1. Mock 데이터 확인
      if (ALL_DEBATES_DATA[id]) {
        setDebateInfo(ALL_DEBATES_DATA[id]);
      } else {
        // 2. localStorage 사용자 생성 데이터 확인
        const userDebates = JSON.parse(localStorage.getItem('user_debates') || '[]');
        const found = userDebates.find((d: any) => d.id === id);
        if (found) {
          setDebateInfo({ title: found.title, category: found.category });
        } else {
          setDebateInfo({ title: '알 수 없는 토론방', category: '기타' });
        }
      }
    }
  }, [id]);

  const theme = CATEGORY_THEMES[debateInfo.category] || CATEGORY_THEMES['전체'];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user: '나',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
      content: input,
      timestamp: '방금 전',
      side: userSide,
      likes: 0,
      replyTo: replyTarget || undefined
    };
    setMessages([...messages, newMessage]);
    setInput('');
    setReplyTarget(null);
  };

  const toggleLike = (msgId: string) => {
    setLikedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(msgId)) {
        newSet.delete(msgId);
        setMessages(msgs => msgs.map(m => m.id === msgId ? { ...m, likes: m.likes - 1 } : m));
      } else {
        newSet.add(msgId);
        setMessages(msgs => msgs.map(m => m.id === msgId ? { ...m, likes: m.likes + 1 } : m));
      }
      return newSet;
    });
  };

  const startReply = (username: string) => {
    setReplyTarget(username);
    const textarea = document.getElementById('chat-input');
    textarea?.focus();
  };

  const handleReport = (e: React.MouseEvent, participantName: string) => {
    e.stopPropagation();
    navigate(`/report/${participantName}`);
  };

  const refreshParticipants = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    setTimeout(() => {
      setParticipants(prev => 
        prev.map(p => {
          if (p.side === 'HOST' || p.name === '나') {
            return { ...p, status: '활동 중' };
          }
          const isConnected = Math.random() > 0.35;
          return {
            ...p,
            status: isConnected ? '활동 중' : '대기 중'
          };
        })
      );
      setIsRefreshing(false);
    }, 800);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] bg-[#0b0f14] overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 lg:border-r border-slate-800/50 overflow-hidden">
        
        <div className="mb-6 shrink-0 rounded-2xl bg-gradient-to-r from-[#1c2127] to-[#111418] border border-slate-800 p-6 shadow-xl">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full ${theme.bg} ${theme.text} text-[10px] font-bold uppercase tracking-wider`}>{debateInfo.category}</span>
              <span className="text-slate-500 text-xs font-medium">Room ID: {id}</span>
            </div>
            <h1 className="text-white text-xl md:text-2xl font-black leading-tight text-balance">{debateInfo.title}</h1>
          </div>
        </div>

        <div 
          ref={scrollRef} 
          className="flex-1 overflow-y-auto pr-2 space-y-6 mb-6 no-scrollbar scroll-smooth"
        >
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2">
              <div className="shrink-0 pt-1">
                <div className={`size-10 rounded-full p-0.5 border-2 ${msg.side === 'PRO' ? 'border-primary' : msg.side === 'CON' ? 'border-secondary' : 'border-purple-500'}`}>
                  <img src={msg.avatar} alt={msg.user} className="w-full h-full rounded-full bg-slate-800" />
                </div>
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="font-bold text-sm text-white">{msg.user}</span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                    msg.side === 'PRO' ? 'bg-primary/10 text-primary border-primary/20' : msg.side === 'CON' ? 'bg-secondary/10 text-secondary border-secondary/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  }`}>
                    {msg.side === 'PRO' ? '찬성' : msg.side === 'CON' ? '반대' : '중재자'}
                  </span>
                  <span className="text-slate-600 text-[10px] font-medium">{msg.timestamp}</span>
                </div>
                <div className="relative bg-[#1c2127] border border-slate-800 rounded-2xl rounded-tl-none p-4 shadow-sm hover:border-slate-700 transition-colors">
                  {msg.replyTo && (
                    <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-[#0b0f14]/50 rounded-lg border-l-2 border-primary/50 text-slate-400 text-xs font-medium">
                      <span className="material-symbols-outlined text-[14px]">reply</span>
                      <span>@{msg.replyTo}님에게 보내는 의견</span>
                    </div>
                  )}
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
                <div className="flex items-center gap-5 mt-2 ml-1">
                  <button 
                    onClick={() => toggleLike(msg.id)}
                    className={`group/btn flex items-center gap-1.5 transition-colors ${
                      likedMessages.has(msg.id) ? 'text-primary' : 'text-slate-500 hover:text-primary'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[18px] transition-transform ${likedMessages.has(msg.id) ? 'fill-1' : 'group-active/btn:scale-125'}`}>
                      thumb_up
                    </span>
                    <span className="text-[11px] font-bold">{msg.likes}</span>
                  </button>
                  <button 
                    onClick={() => startReply(msg.user)}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
                    <span className="text-[11px] font-bold">답글 달기</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="shrink-0 space-y-3 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex bg-[#1c2127] p-1 rounded-xl border border-slate-800 shadow-inner">
              <button 
                onClick={() => setUserSide('PRO')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  userSide === 'PRO' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                찬성
              </button>
              <button 
                onClick={() => setUserSide('CON')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  userSide === 'CON' 
                  ? 'bg-secondary text-white shadow-lg shadow-secondary/20' 
                  : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                반대
              </button>
            </div>
          </div>

          <div className="flex flex-col shadow-2xl overflow-hidden">
            {replyTarget && (
              <div className="flex items-center justify-between px-4 py-2 bg-primary/10 border border-primary/30 border-b-0 rounded-t-2xl animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 text-primary text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[16px]">reply</span>
                  <span>@{replyTarget}님에게 답글 작성 중...</span>
                </div>
                <button onClick={() => setReplyTarget(null)} className="text-primary hover:bg-primary/20 rounded-full p-0.5 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}
            <div className={`flex gap-3 items-end bg-[#1c2127] border p-3 transition-all focus-within:border-primary/50 ${
              replyTarget ? 'rounded-b-2xl border-primary/30' : 'rounded-2xl border-slate-800'
            }`}>
              <textarea 
                id="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                className="flex-1 bg-transparent border-none focus:ring-0 text-white text-sm resize-none h-[48px] py-3.5 no-scrollbar" 
                placeholder="의견을 남겨보세요..." 
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim()}
                className={`size-11 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                  input.trim() 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-blue-600' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined font-bold">send</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 p-6 bg-[#0b0f14] gap-8 border-l border-slate-800/50 h-full overflow-y-auto no-scrollbar">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">현재 참여자</h3>
            <button 
              onClick={refreshParticipants}
              disabled={isRefreshing}
              className={`flex items-center justify-center p-1.5 rounded-lg transition-all group ${
                isRefreshing ? 'bg-primary/20 cursor-wait' : 'hover:bg-slate-800 text-slate-600 hover:text-primary'
              }`}
              title="세션 동기화 및 접속 확인"
            >
              <span className={`material-symbols-outlined text-[20px] ${isRefreshing ? 'animate-spin text-primary' : 'group-active:rotate-180'}`}>
                sync
              </span>
            </button>
          </div>
          <div className={`space-y-4 transition-all duration-500 ${isRefreshing ? 'opacity-40 scale-[0.98]' : 'opacity-100 scale-100'}`}>
            {participants.map((p, idx) => (
              <div 
                key={p.id} 
                onClick={() => setActiveParticipantId(activeParticipantId === p.id ? null : p.id)}
                className={`flex flex-col gap-2 p-2 rounded-xl transition-all cursor-pointer ${
                  activeParticipantId === p.id ? 'bg-slate-800/50 ring-1 ring-slate-700' : 'hover:bg-slate-800/30'
                } group/user animate-in fade-in`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`size-8 rounded-full border transition-transform group-hover/user:scale-105 ${p.side === 'HOST' ? 'border-purple-500' : p.side === 'PRO' ? 'border-primary' : 'border-secondary'}`}>
                      <img src={p.avatar} alt={p.name} className="w-full h-full rounded-full" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-300">{p.name}</span>
                      <span className="text-[10px] text-slate-500">{p.side === 'PRO' ? '찬성측' : p.side === 'CON' ? '반대측' : '중재자'}</span>
                    </div>
                  </div>
                  {p.status === '활동 중' ? (
                    <div className="flex items-center justify-center">
                      <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>
                      </div>
                    </div>
                  ) : (
                    <div className="size-2 rounded-full bg-slate-700"></div>
                  )}
                </div>
                
                {activeParticipantId === p.id && p.name !== '나' && (
                  <div className="mt-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
                    <button 
                      onClick={(e) => handleReport(e, p.name)}
                      className="w-full py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">report</span>
                      이 사용자 신고하기
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-2 p-3 bg-slate-800/20 border border-slate-800 rounded-xl">
            <p className="text-[10px] text-slate-600 leading-relaxed italic">
              * 동기화 버튼을 누르면 실시간 세션 정보를 확인하여 접속 상태를 갱신합니다.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
