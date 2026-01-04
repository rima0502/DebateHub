
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Category } from '../types';

export default function CreateDebate() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category>(Category.POLITICS);
  const [title, setTitle] = useState('');
  const [openingStatement, setOpeningStatement] = useState('');
  const [image, setImage] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!title.trim() || !openingStatement.trim()) {
      alert('논제와 발제문을 모두 입력해주세요.');
      return;
    }

    const newDebate = {
      id: `user-${Date.now()}`,
      title: title.trim(),
      category: category,
      desc: openingStatement.trim(),
      participants: '1',
      messages: '0',
      time: '방금 전',
      image: image || `https://picsum.photos/seed/${Date.now()}/600/400`,
      timestamp: Date.now() / 1000 / 3600 // 소팅용 가상 타임스탬프
    };

    // localStorage에 저장
    const existingDebates = JSON.parse(localStorage.getItem('user_debates') || '[]');
    localStorage.setItem('user_debates', JSON.stringify([newDebate, ...existingDebates]));

    // 개설된 방으로 이동
    navigate(`/room/${newDebate.id}`);
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
                {Object.values(Category).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex h-10 items-center justify-center gap-2 px-4 rounded-lg text-sm font-bold transition-all ${category === cat
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-[#111418] text-slate-500 border border-slate-800 hover:text-slate-300'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {cat === Category.POLITICS ? 'gavel' : cat === Category.SCIENCE ? 'science' : cat === Category.HUMANITIES ? 'psychology' : cat === Category.ECONOMY ? 'trending_up' : 'chat_bubble'}
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

            {/* Image Upload (Simulation) */}
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-lg font-bold text-white">대표 이미지 (선택)</span>
                <div
                  onClick={() => setImage(`https://picsum.photos/seed/${Math.random()}/600/400`)}
                  className={`mt-2 flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all py-10 ${image ? 'border-primary bg-primary/5' : 'border-slate-800 bg-[#0b0f14] hover:border-slate-600'
                    }`}
                >
                  <span className={`material-symbols-outlined text-5xl mb-3 ${image ? 'text-primary' : 'text-slate-700'}`}>
                    {image ? 'check_circle' : 'add_photo_alternate'}
                  </span>
                  <p className="text-sm text-slate-500">
                    {image ? <span className="font-bold text-primary">이미지가 선택되었습니다</span> : <span>이미지를 선택하거나 드래그하세요</span>}
                  </p>
                  {image && <p className="text-xs text-slate-600 mt-2">클릭하여 다른 이미지로 변경</p>}
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse md:flex-row justify-end gap-4 mt-4">
              <button
                onClick={() => navigate(-1)}
                className="h-14 w-full md:w-32 rounded-xl border border-slate-800 font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className="h-14 w-full md:w-56 rounded-xl bg-primary px-6 font-black text-white shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
              >
                <span>토론방 개설하기</span>
                <span className="material-symbols-outlined">rocket_launch</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
