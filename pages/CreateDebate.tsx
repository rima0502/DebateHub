
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../src/hooks/useAuth';
import { createDebate } from '../src/services/debateService';
import type { DebateCategory } from '../src/types/debate';

const CATEGORIES: DebateCategory[] = ['정치/사회', '경제', '기술', '윤리', '환경', '교육'];

export default function CreateDebate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [category, setCategory] = useState<DebateCategory>('정치/사회');
  const [title, setTitle] = useState('');
  const [openingStatement, setOpeningStatement] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imagePosition, setImagePosition] = useState(50); // 0-100 percentage
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    if (!title.trim() || !openingStatement.trim()) {
      alert('논제와 발제문을 모두 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const result = await createDebate({
        title: title.trim(),
        description: openingStatement.trim(),
        category: category,
        imageUrl: image || `https://picsum.photos/seed/${Date.now()}/600/400`
      });

      if (result.success && result.debateId) {
        // 개설된 방으로 이동
        navigate(`/room/${result.debateId}`);
      } else {
        alert(result.error || '토론방 생성에 실패했습니다.');
        setLoading(false);
      }
    } catch (error) {
      console.error('토론방 생성 오류:', error);
      alert('토론방 생성 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="layout-container flex h-full grow flex-col bg-[#0b0f14]">
      <div className="flex flex-1 justify-center py-5 px-4 md:px-10">
        <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
          <div className="flex flex-wrap justify-between gap-3 px-4 py-6 md:py-10">
            <div className="flex min-w-72 flex-col gap-3">
              <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-white">새로운 토론 시작하기</h1>
              <p className="text-slate-500 text-base font-normal">
                명확한 논제와 규칙을 설정하여 깊이 있는 숙의의 장을 만들어보세요.
              </p>
            </div>
          </div>

          <div className="mx-4 flex flex-col gap-8 rounded-2xl bg-[#1c2127] border border-slate-800 p-6 md:p-10 shadow-xl">
            {/* Category Select */}
            <div className="flex flex-col gap-4">
              <label className="text-lg font-bold text-white">카테고리 선택</label>
              <div className="flex flex-wrap gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex h-10 items-center justify-center gap-2 px-4 rounded-lg text-sm font-bold transition-all ${category === cat
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-[#111418] text-slate-500 border border-slate-800 hover:text-slate-300'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {cat === '정치/사회' ? 'gavel' : cat === '경제' ? 'trending_up' : cat === '기술' ? 'memory' : cat === '윤리' ? 'balance' : cat === '환경' ? 'public' : 'school'}
                    </span>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px w-full bg-slate-800"></div>

            {/* Topic Input */}
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-lg font-bold text-white">논제 (토론 주제) <span className="text-red-500">*</span></span>
                <span className="text-slate-500 text-sm">참여자들이 명확히 이해할 수 있는 문장으로 작성해주세요.</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-14 p-4 mt-2 rounded-xl bg-[#0b0f14] border border-slate-800 text-white placeholder:text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                  placeholder="예: 보편적 기본소득 도입은 경제 활성화의 열쇠인가?"
                />
              </label>
            </div>

            {/* Content Input */}
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-lg font-bold text-white">발제문 (나의 의견) <span className="text-red-500">*</span></span>
                <span className="text-slate-500 text-sm">토론의 시작을 알리는 첫 게시물입니다. 논리적으로 서술해주세요.</span>
                <div className="relative mt-2">
                  <textarea
                    value={openingStatement}
                    onChange={(e) => setOpeningStatement(e.target.value)}
                    className="w-full min-h-[240px] p-4 rounded-xl bg-[#0b0f14] border border-slate-800 text-white placeholder:text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all resize-none"
                    placeholder="여기에 의견을 상세히 작성하세요..."
                  />
                </div>
              </label>
            </div>

            {/* Image URL Input */}
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-lg font-bold text-white">대표 이미지 URL (선택)</span>
                <span className="text-slate-500 text-sm">토론방을 대표할 이미지 URL을 입력하세요. 비워두면 자동으로 생성됩니다.</span>
                <input
                  type="text"
                  value={image || ''}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full h-14 p-4 mt-2 rounded-xl bg-[#0b0f14] border border-slate-800 text-white placeholder:text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                  placeholder="https://example.com/image.jpg"
                />
                {image && (
                  <div className="mt-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">이미지 위치 조정</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setImagePosition(0)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            imagePosition === 0
                              ? 'bg-primary text-white'
                              : 'bg-[#0b0f14] text-slate-500 border border-slate-800 hover:text-slate-300'
                          }`}
                        >
                          상단
                        </button>
                        <button
                          type="button"
                          onClick={() => setImagePosition(50)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            imagePosition === 50
                              ? 'bg-primary text-white'
                              : 'bg-[#0b0f14] text-slate-500 border border-slate-800 hover:text-slate-300'
                          }`}
                        >
                          중앙
                        </button>
                        <button
                          type="button"
                          onClick={() => setImagePosition(100)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            imagePosition === 100
                              ? 'bg-primary text-white'
                              : 'bg-[#0b0f14] text-slate-500 border border-slate-800 hover:text-slate-300'
                          }`}
                        >
                          하단
                        </button>
                      </div>
                    </div>
                    <div
                      className="rounded-xl overflow-hidden border border-slate-800 h-48 relative bg-slate-900 cursor-move select-none"
                      onMouseDown={(e) => {
                        setIsDragging(true);
                        const rect = e.currentTarget.getBoundingClientRect();
                        const y = e.clientY - rect.top;
                        const percentage = (y / rect.height) * 100;
                        setImagePosition(Math.max(0, Math.min(100, percentage)));
                      }}
                      onMouseMove={(e) => {
                        if (isDragging) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const y = e.clientY - rect.top;
                          const percentage = (y / rect.height) * 100;
                          setImagePosition(Math.max(0, Math.min(100, percentage)));
                        }
                      }}
                      onMouseUp={() => setIsDragging(false)}
                      onMouseLeave={() => setIsDragging(false)}
                    >
                      <img
                        src={image}
                        alt="미리보기"
                        className="w-full h-full object-cover pointer-events-none"
                        style={{ objectPosition: `50% ${imagePosition}%` }}
                        onError={(e) => {
                          e.currentTarget.src = 'https://picsum.photos/seed/default/600/400';
                        }}
                      />
                      <div className="absolute inset-0 border-2 border-dashed border-primary/30 pointer-events-none" />
                      <div
                        className="absolute left-0 right-0 h-0.5 bg-primary shadow-lg pointer-events-none"
                        style={{ top: `${imagePosition}%` }}
                      >
                        <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-3 h-3 bg-primary rounded-full shadow-lg" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      마우스로 드래그하여 이미지 위치를 조정하세요. 고정된 크기(600x400)로 표시됩니다.
                    </p>
                  </div>
                )}
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse md:flex-row justify-end gap-4 mt-4">
              <button
                onClick={() => navigate(-1)}
                disabled={loading}
                className="h-14 w-full md:w-32 rounded-xl border border-slate-800 font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="h-14 w-full md:w-56 rounded-xl bg-primary px-6 font-black text-white shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>개설 중...</span>
                  </>
                ) : (
                  <>
                    <span>토론방 개설하기</span>
                    <span className="material-symbols-outlined">rocket_launch</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
