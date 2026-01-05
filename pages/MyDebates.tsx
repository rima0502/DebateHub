
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../src/hooks/useAuth';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../src/firebase';
import type { Debate } from '../src/types/debate';
import { Timestamp } from 'firebase/firestore';

const CATEGORY_THEMES: Record<string, { color: string; border: string; bg: string; text: string }> = {
  '전체': { color: 'bg-primary', border: 'border-primary/50', bg: 'bg-primary/10', text: 'text-primary' },
  '정치/사회': { color: 'bg-cat_politics', border: 'border-cat_politics/50', bg: 'bg-cat_politics/10', text: 'text-cat_politics' },
  '경제': { color: 'bg-cat_economy', border: 'border-cat_economy/50', bg: 'bg-cat_economy/10', text: 'text-cat_economy' },
  '기술': { color: 'bg-cat_tech', border: 'border-cat_tech/50', bg: 'bg-cat_tech/10', text: 'text-cat_tech' },
  '윤리': { color: 'bg-cat_ethics', border: 'border-cat_ethics/50', bg: 'bg-cat_ethics/10', text: 'text-cat_ethics' },
  '환경': { color: 'bg-cat_env', border: 'border-cat_env/50', bg: 'bg-cat_env/10', text: 'text-cat_env' },
  '교육': { color: 'bg-cat_edu', border: 'border-cat_edu/50', bg: 'bg-cat_edu/10', text: 'text-cat_edu' },
};

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

export default function MyDebates() {
  const { user, loading: authLoading } = useAuth();
  const [debates, setDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyDebates = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // 내가 개설한 토론방만 표시
        const q = query(
          collection(db, 'debates'),
          where('creatorId', '==', user.uid)
        );

        const querySnapshot = await getDocs(q);
        const myDebates = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Debate[];

        // 클라이언트에서 정렬
        myDebates.sort((a, b) => {
          const aTime = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
          return bTime - aTime;
        });

        setDebates(myDebates);
      } catch (error) {
        console.error('내 토론방 불러오기 오류:', error);
        alert('토론방을 불러오는데 실패했습니다. 다시 시도해주세요.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyDebates();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b0f14]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b0f14]">
        <div className="flex flex-col items-center gap-6 max-w-md text-center p-8">
          <div className="size-20 rounded-full bg-slate-800 flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-slate-600">lock</span>
          </div>
          <h2 className="text-2xl font-bold text-white">로그인이 필요합니다</h2>
          <p className="text-slate-400">내 토론방을 확인하려면 로그인해주세요.</p>
          <Link
            to="/login"
            className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors"
          >
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f14] py-8 px-4 sm:px-10">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">내 토론방</h1>
          <p className="text-slate-400">내가 개설한 토론방 목록입니다</p>
        </div>

        {/* Debates List */}
        {debates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[#1c2127] rounded-2xl border border-slate-800">
            <div className="size-24 rounded-full bg-slate-800 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-6xl text-slate-600">forum</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">개설하신 토론방이 없습니다</h3>
            <p className="text-slate-400 mb-6 text-center">
              새로운 토론방을 개설하고 다른 사람들과 의견을 나눠보세요
            </p>
            <Link
              to="/create"
              className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              <span>토론방 만들기</span>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {debates.map((debate) => {
              const theme = CATEGORY_THEMES[debate.category] || CATEGORY_THEMES['전체'];
              return (
                <article
                  key={debate.id}
                  className="group overflow-hidden rounded-xl bg-[#1c2127] border border-slate-800 shadow-sm transition-all duration-300 hover:border-primary/50"
                >
                  <div className="flex flex-col sm:flex-row h-full">
                    <div className="sm:w-56 h-48 sm:h-auto bg-cover bg-center shrink-0 overflow-hidden">
                      <img
                        src={debate.imageUrl || 'https://picsum.photos/seed/debate/600/400'}
                        alt={debate.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between p-5 sm:p-6">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${theme.bg} ${theme.text} border ${theme.border}`}>
                            {debate.category}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatTimestamp(debate.createdAt as Timestamp)}
                          </span>
                        </div>
                        <Link to={`/room/${debate.id}`}>
                          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {debate.title}
                          </h3>
                        </Link>
                        <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                          {debate.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">group</span>
                          <span>{debate.participantCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">chat_bubble</span>
                          <span>{debate.messageCount}</span>
                        </div>
                        <div className="ml-auto">
                          <Link
                            to={`/room/${debate.id}`}
                            className="px-4 py-2 bg-primary/10 text-primary border border-primary/30 rounded-lg hover:bg-primary hover:text-white transition-colors font-bold"
                          >
                            입장하기
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
