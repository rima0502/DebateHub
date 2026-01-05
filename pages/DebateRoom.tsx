
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDebateRoom } from '../src/hooks/useDebateRoom';
import { useAuth } from '../src/hooks/useAuth';
import { updateParticipantActivity, kickParticipant } from '../src/services/debateService';
import { Timestamp } from 'firebase/firestore';
import type { DebateSide } from '../src/types/debate';

const CATEGORY_THEMES: Record<string, { color: string; bg: string; text: string }> = {
  '전체': { color: 'bg-primary', bg: 'bg-primary/20', text: 'text-primary' },
  '정치/사회': { color: 'bg-cat_politics', bg: 'bg-cat_politics/20', text: 'text-cat_politics' },
  '정치': { color: 'bg-cat_politics', bg: 'bg-cat_politics/20', text: 'text-cat_politics' },
  '경제': { color: 'bg-cat_economy', bg: 'bg-cat_economy/20', text: 'text-cat_economy' },
  '기술': { color: 'bg-cat_tech', bg: 'bg-cat_tech/20', text: 'text-cat_tech' },
  '윤리': { color: 'bg-cat_ethics', bg: 'bg-cat_ethics/20', text: 'text-cat_ethics' },
  '환경': { color: 'bg-cat_env', bg: 'bg-cat_env/20', text: 'text-cat_env' },
  '교육': { color: 'bg-cat_edu', bg: 'bg-cat_edu/20', text: 'text-cat_edu' },
};

// Firestore Timestamp를 시간 표시용으로 변환
const formatTimestamp = (timestamp: Timestamp | Date | null | undefined) => {
  if (!timestamp) return '방금 전';

  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;

  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
};

// 사용자가 현재 활동 중인지 확인 (최근 1분 이내 활동)
const isUserActive = (lastActiveAt: Timestamp | Date | null | undefined): boolean => {
  if (!lastActiveAt) return false;

  const lastActive = lastActiveAt instanceof Timestamp ? lastActiveAt.toDate() : lastActiveAt;
  const now = new Date();
  const diffMs = now.getTime() - lastActive.getTime();
  const diffSecs = diffMs / 1000;

  // 60초(1분) 이내에 활동한 경우 활동 중으로 표시
  return diffSecs <= 60;
};

export default function DebateRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { debate, messages, participants, loading, sendMessage, joinDebate, toggleMessageLike } = useDebateRoom(id || '');

  const [input, setInput] = useState('');
  const [userSide, setUserSide] = useState<DebateSide | null>(null);
  const [replyTarget, setReplyTarget] = useState<{ messageId: string; content: string; userName: string } | null>(null);
  const [activeParticipantId, setActiveParticipantId] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(false);

  // 사용자가 이미 참여했는지 확인
  useEffect(() => {
    if (user && id && participants.length > 0) {
      const userParticipant = participants.find(p => p.userId === user.uid);
      if (userParticipant) {
        // NEUTRAL은 무시하고 PRO 또는 CON만 허용
        if (userParticipant.side === 'PRO' || userParticipant.side === 'CON') {
          setUserSide(userParticipant.side);
        }
      }
    }
  }, [user, id, participants]);

  // 최근 방문 목록에 추가 (사용자별로 저장)
  useEffect(() => {
    if (debate && id && user) {
      const userKey = user.uid;
      const recentVisits = JSON.parse(localStorage.getItem(`recent_visits_${userKey}`) || '[]');
      const newVisit = {
        id,
        title: debate.title.length > 20 ? debate.title.substring(0, 20) + '...' : debate.title,
        category: debate.category,
        time: '방금 전'
      };

      const filteredVisits = recentVisits.filter((v: any) => v.id !== id);
      const updatedVisits = [newVisit, ...filteredVisits].slice(0, 10);

      localStorage.setItem(`recent_visits_${userKey}`, JSON.stringify(updatedVisits));
    }
  }, [debate, id, user]);

  // 토론방 삭제 감지
  useEffect(() => {
    if (debate && (debate.status as any) === 'deleted') {
      alert('이 토론방은 삭제되었습니다.');
      navigate('/debates');
    }
  }, [debate, navigate]);

  // 강제퇴장 당한 사용자 감지 (실시간 감지)
  useEffect(() => {
    if (debate && user && debate.bannedUsers && debate.bannedUsers.includes(user.uid)) {
      alert('강제퇴장되었습니다. 방장에게 문의하세요.');
      navigate('/debates');
    }
  }, [debate, user, navigate]);

  const theme = debate ? CATEGORY_THEMES[debate.category] || CATEGORY_THEMES['전체'] : CATEGORY_THEMES['전체'];

  // 스크롤 위치 감지
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const scrolledFromBottom = scrollHeight - scrollTop - clientHeight;

      // 100px 이상 위로 스크롤하면 버튼 표시
      setShowScrollButton(scrolledFromBottom > 3000);
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      // 초기 상태 확인
      handleScroll();
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [messages]);

  // 자동 스크롤 (새 메시지가 추가되면 맨 아래로 - 사용자가 위로 스크롤하지 않았을 때만)
  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      // 맨 아래 근처에 있을 때만 자동 스크롤
      if (isNearBottom) {
        isAutoScrolling.current = true;
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTo({
              top: scrollRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
          setTimeout(() => {
            isAutoScrolling.current = false;
          }, 500);
        }, 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // 30초마다 활동 상태 업데이트 (heartbeat)
  useEffect(() => {
    if (!user || !id) return;

    const updateActivity = async () => {
      await updateParticipantActivity(id);
    };

    // 즉시 한 번 업데이트
    updateActivity();

    // 30초마다 업데이트
    const interval = setInterval(updateActivity, 30000);

    return () => clearInterval(interval);
  }, [user, id]);

  // URL 파라미터에서 highlight 메시지 ID를 읽고 해당 메시지로 스크롤 & 하이라이트
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId && messages.length > 0) {
      // 약간의 지연을 주어 DOM이 완전히 렌더링되도록 함
      setTimeout(() => {
        const element = document.getElementById(`msg-${highlightId}`);
        if (element) {
          // 스크롤하여 해당 메시지를 중앙에 표시
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // 하이라이트 효과 (반짝임)
          element.classList.add('animate-pulse', 'ring-4', 'ring-primary', 'ring-offset-2', 'ring-offset-[#0b0f14]', 'bg-primary/20');

          // 2초 후 효과 제거 및 URL 파라미터 제거
          setTimeout(() => {
            element.classList.remove('animate-pulse', 'ring-4', 'ring-primary', 'ring-offset-2', 'ring-offset-[#0b0f14]', 'bg-primary/20');

            // URL에서 highlight 파라미터 제거 (한 번만 실행되도록)
            const url = new URL(window.location.href);
            url.searchParams.delete('highlight');
            window.history.replaceState({}, '', url.pathname);
          }, 2000);
        }
      }, 500);
    }
  }, [searchParams, messages.length]);

  const handleSend = async () => {
    // 찬성/반대를 선택하지 않았으면 메시지 전송 불가 (NEUTRAL도 불가)
    if (!input.trim() || !user || !id || !userSide || userSide === 'NEUTRAL') return;

    try {
      // 사용자가 아직 참여하지 않았으면 먼저 참여
      const userParticipant = participants.find(p => p.userId === user.uid);
      if (!userParticipant) {
        const joinResult = await joinDebate(userSide);
        if (!joinResult.success) {
          alert(joinResult.error || '토론방 참여에 실패했습니다.');
          return;
        }
      }

      const messageData: any = {
        debateId: id,
        content: input,
        side: userSide
      };

      // replyTo가 있을 때만 추가 (메시지 ID 저장)
      if (replyTarget) {
        messageData.replyTo = replyTarget.messageId;
      }

      await sendMessage(messageData);
      setInput('');
      setReplyTarget(null);

      // 메시지 전송 후 맨 아래로 스크롤
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth'
          });
          setShowScrollButton(false);
        }
      }, 100);
    } catch (error) {
      console.error('메시지 전송 실패:', error);
    }
  };

  const toggleLike = async (msgId: string) => {
    if (!user) return;

    // 현재 스크롤 위치 저장
    const currentScrollTop = scrollRef.current?.scrollTop || 0;

    // 자동 스크롤 방지
    isAutoScrolling.current = true;

    // Firestore에 좋아요 저장
    await toggleMessageLike(msgId);

    // 스크롤 위치 복원
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = currentScrollTop;
      }
      setTimeout(() => {
        isAutoScrolling.current = false;
      }, 100);
    });
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      isAutoScrolling.current = true;
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
      setShowScrollButton(false);
      setTimeout(() => {
        isAutoScrolling.current = false;
      }, 500);
    }
  };

  const startReply = (messageId: string, content: string, userName: string) => {
    setReplyTarget({ messageId, content, userName });
    const textarea = document.getElementById('chat-input');
    textarea?.focus();
  };

  const handleReport = (e: React.MouseEvent, participantName: string) => {
    e.stopPropagation();
    navigate(`/report/${participantName}`);
  };

  const handleKick = async (e: React.MouseEvent, userId: string, userName: string) => {
    e.stopPropagation();

    if (!confirm(`"${userName}" 님을 강제퇴장시키시겠습니까?\n\n강제퇴장된 사용자는 다시 이 토론방에 참여할 수 없습니다.`)) {
      return;
    }

    try {
      const result = await kickParticipant(id || '', userId);

      if (result.success) {
        alert(`"${userName}" 님을 강제퇴장시켰습니다.`);
        setActiveParticipantId(null);
      } else {
        alert(result.error || '강제퇴장에 실패했습니다.');
      }
    } catch (error) {
      console.error('강제퇴장 오류:', error);
      alert('강제퇴장 중 오류가 발생했습니다.');
    }
  };

  // 로딩 중
  if (loading || !debate) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-[#0b0f14]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">토론방 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] bg-[#0b0f14] overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 lg:border-r border-slate-800/50 overflow-hidden">

        <div className="mb-6 shrink-0 rounded-2xl bg-gradient-to-r from-[#1c2127] to-[#111418] border border-slate-800 p-6 shadow-xl">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full ${theme.bg} ${theme.text} text-[10px] font-bold uppercase tracking-wider`}>{debate.category}</span>
              <span className="text-slate-500 text-xs font-medium">Room ID: {id}</span>
            </div>
            <h1 className="text-white text-xl md:text-2xl font-black leading-tight text-balance">{debate.title}</h1>
            <p className="text-slate-400 text-sm mt-2">{debate.description}</p>
          </div>
        </div>

        <div className="relative flex-1 mb-6 overflow-hidden">
          <div
            ref={scrollRef}
            className="h-full overflow-y-auto pr-2 space-y-6 no-scrollbar scroll-smooth"
            style={{ height: '100%' }}
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <span className="material-symbols-outlined text-6xl text-slate-700 mb-4">chat_bubble_outline</span>
                <p className="text-slate-500 text-sm font-medium">아직 메시지가 없습니다</p>
                <p className="text-slate-600 text-xs mt-2">첫 번째 의견을 남겨보세요!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} id={`msg-${msg.id}`} className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2 transition-all duration-300">
                  <div className="shrink-0 pt-1">
                    <div className={`size-10 rounded-full p-0.5 border-2 overflow-hidden ${msg.side === 'PRO' ? 'border-primary' : msg.side === 'CON' ? 'border-secondary' : 'border-purple-500'
                      }`}>
                      {msg.userAvatar ? (
                        <img
                          src={msg.userAvatar}
                          alt={msg.userName || '익명'}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                          {msg.userName?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1.5">
                      <span className="font-bold text-sm text-white">{msg.userName || '익명'}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${msg.side === 'PRO' ? 'bg-primary/10 text-primary border-primary/20' :
                        msg.side === 'CON' ? 'bg-secondary/10 text-secondary border-secondary/20' :
                          'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}>
                        {msg.side === 'PRO' ? '찬성' : msg.side === 'CON' ? '반대' : '중립'}
                      </span>
                      <span className="text-slate-600 text-[10px] font-medium">
                        {formatTimestamp(msg.createdAt as Timestamp)}
                      </span>
                    </div>
                    <div className="relative bg-[#1c2127] border border-slate-800 rounded-2xl rounded-tl-none p-4 shadow-sm hover:border-slate-700 transition-colors">
                      {msg.replyTo && (() => {
                        const originalMsg = messages.find(m => m.id === msg.replyTo);
                        return originalMsg ? (
                          <div
                            onClick={() => {
                              const element = document.getElementById(`msg-${msg.replyTo}`);
                              element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              element?.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-[#0b0f14]');
                              setTimeout(() => {
                                element?.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-[#0b0f14]');
                              }, 2000);
                            }}
                            className="flex items-start gap-2 mb-2 px-3 py-1.5 bg-[#0b0f14]/50 rounded-lg border-l-2 border-primary/50 text-slate-400 text-xs font-medium cursor-pointer hover:bg-[#0b0f14]/80 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px] mt-0.5">reply</span>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-primary text-[10px]">{originalMsg.userName}님의 의견</span>
                              <span className="line-clamp-1">"{originalMsg.content.substring(0, 40)}{originalMsg.content.length > 40 ? '...' : ''}"</span>
                            </div>
                          </div>
                        ) : null;
                      })()}
                      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <div className="flex items-center gap-5 mt-2 ml-1">
                      <button
                        onClick={() => toggleLike(msg.id)}
                        className={`group/btn flex items-center gap-1.5 transition-colors ${msg.likedBy?.includes(user?.uid || '') ? 'text-primary' : 'text-slate-500 hover:text-primary'
                          }`}
                      >
                        <span className={`material-symbols-outlined text-[18px] transition-transform ${msg.likedBy?.includes(user?.uid || '') ? 'fill-1' : 'group-active/btn:scale-125'
                          }`}>
                          thumb_up
                        </span>
                        <span className="text-[11px] font-bold">{msg.likes || 0}</span>
                      </button>
                      <button
                        onClick={() => startReply(msg.id, msg.content, msg.userName || '익명')}
                        className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
                        <span className="text-[11px] font-bold">답글 달기</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 최신 댓글로 이동 버튼 */}
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-6 right-6 flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-full shadow-xl hover:bg-blue-600 transition-all z-50 border-2 border-white/20"
              style={{ boxShadow: '0 10px 40px rgba(59, 130, 246, 0.5)' }}
            >
              <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
              <span className="text-sm font-bold">최신 댓글로 이동</span>
            </button>
          )}
        </div>

        <div className="shrink-0 space-y-3 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex bg-[#1c2127] p-1 rounded-xl border border-slate-800 shadow-inner">
              <button
                onClick={() => setUserSide('PRO')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${userSide === 'PRO'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-slate-500 hover:text-slate-300'
                  }`}
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                찬성
              </button>
              <button
                onClick={() => setUserSide('CON')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${userSide === 'CON'
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
                <div className="flex flex-col gap-1 text-primary text-[11px]">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="material-symbols-outlined text-[16px]">reply</span>
                    <span>"{replyTarget.content.substring(0, 30)}{replyTarget.content.length > 30 ? '...' : ''}"</span>
                  </div>
                  <span className="text-[10px] text-primary/70">라는 의견에 대한 답글 작성 중...</span>
                </div>
                <button onClick={() => setReplyTarget(null)} className="text-primary hover:bg-primary/20 rounded-full p-0.5 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}
            <div className={`flex gap-3 items-end bg-[#1c2127] border p-3 transition-all focus-within:border-primary/50 ${replyTarget ? 'rounded-b-2xl border-primary/30' : 'rounded-2xl border-slate-800'
              }`}>
              <textarea
                id="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                className="flex-1 bg-transparent border-none focus:ring-0 text-white text-sm resize-none h-[48px] py-3.5 no-scrollbar"
                placeholder={!user ? "로그인이 필요합니다" : (!userSide || userSide === 'NEUTRAL') ? "찬성 또는 반대를 선택해주세요" : "의견을 남겨보세요..."}
                disabled={!user || !userSide || userSide === 'NEUTRAL'}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || !user || !userSide || userSide === 'NEUTRAL'}
                className={`size-11 rounded-xl flex items-center justify-center transition-all active:scale-90 ${input.trim() && user && userSide && userSide !== 'NEUTRAL'
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
            <span className="text-primary text-sm font-bold">{participants.length}명</span>
          </div>
          <div className="space-y-4">
            {participants.length === 0 ? (
              <p className="text-slate-600 text-xs text-center py-8">참여자가 없습니다</p>
            ) : (
              participants.map((p, idx) => (
                <div
                  key={p.id}
                  onClick={() => setActiveParticipantId(activeParticipantId === p.id ? null : p.id)}
                  className={`flex flex-col gap-2 p-2 rounded-xl transition-all cursor-pointer ${activeParticipantId === p.id ? 'bg-slate-800/50 ring-1 ring-slate-700' : 'hover:bg-slate-800/30'
                    } group/user animate-in fade-in`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`size-8 rounded-full border transition-transform group-hover/user:scale-105 overflow-hidden ${p.side === 'PRO' ? 'border-primary' : p.side === 'CON' ? 'border-secondary' : 'border-purple-500'
                        }`}>
                        {p.userAvatar ? (
                          <img
                            src={p.userAvatar}
                            alt={p.userName || '익명'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xs">
                            {p.userName?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-300">{p.userName || '익명'}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      {isUserActive(p.lastActiveAt as Timestamp) ? (
                        <div className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>
                        </div>
                      ) : (
                        <div className="relative flex h-2 w-2">
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-600"></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {activeParticipantId === p.id && user && p.userId !== user.uid && (
                    <div className="mt-2 animate-in fade-in slide-in-from-bottom-1 duration-200 flex flex-col gap-2">
                      {/* 방장인 경우 강제퇴장 버튼 표시 */}
                      {debate && debate.creatorId === user.uid && (
                        <button
                          onClick={(e) => handleKick(e, p.userId, p.userName || '익명')}
                          className="w-full py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[16px]">block</span>
                          강제퇴장시키기
                        </button>
                      )}
                      <button
                        onClick={(e) => handleReport(e, p.userName || '익명')}
                        className="w-full py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[16px]">report</span>
                        이 사용자 신고하기
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="mt-2 p-3 bg-slate-800/20 border border-slate-800 rounded-xl">
            <p className="text-[10px] text-slate-600 leading-relaxed italic">
              * 참여자 목록은 실시간으로 업데이트됩니다.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
