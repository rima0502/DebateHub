
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const REPORT_TYPES = [
  { id: 'abuse', label: '욕설 및 비방', icon: 'mood_bad' },
  { id: 'hate', label: '혐오 표현', icon: 'gavel' },
  { id: 'spam', label: '스팸 및 홍보', icon: 'mail' },
  { id: 'offtopic', label: '토론 주제 이탈', icon: 'wrong_location' },
  { id: 'flooding', label: '도배 행위', icon: 'reorder' },
  { id: 'other', label: '기타 사유', icon: 'more_horiz' },
];

export default function ReportUser() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [detail, setDetail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;
    
    // 실제 API 연동 시 이곳에서 신고 처리
    console.log('Reporting user:', username, 'Reason:', selectedType, 'Details:', detail);
    setSubmitted(true);
    
    // 2초 후 이전 페이지로 이동
    setTimeout(() => {
      navigate(-1);
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-[#0b0f14]">
        <div className="max-w-md w-full bg-surface-dark border border-border-dark p-10 rounded-3xl text-center shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="size-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">신고가 접수되었습니다</h2>
          <p className="text-slate-400 mb-8">검토 후 적절한 조치를 취하겠습니다.<br />잠시 후 원래 화면으로 돌아갑니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0b0f14] py-12 px-4 overflow-y-auto no-scrollbar">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <header className="flex flex-col gap-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 w-fit mx-auto">
            <span className="text-red-500 text-[10px] font-black uppercase tracking-wider">User Report</span>
          </div>
          <h1 className="text-white text-3xl font-black tracking-tight">사용자 신고하기</h1>
          <p className="text-slate-500">대상 사용자: <span className="text-primary font-bold">@{username}</span></p>
        </header>

        <div className="bg-surface-dark border border-border-dark rounded-3xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <label className="text-white text-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-red-500">warning</span>
                신고 유형 선택
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {REPORT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                      selectedType === type.id
                        ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10'
                        : 'bg-[#111418] border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-[#15191f]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">{type.icon}</span>
                    <span className="text-sm font-bold">{type.label}</span>
                    {selectedType === type.id && (
                      <span className="material-symbols-outlined ml-auto text-[18px]">check_circle</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-white text-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-slate-400">description</span>
                상세 내용 (선택)
              </label>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="구체적인 정황을 작성해주시면 정확한 검토에 도움이 됩니다."
                className="w-full bg-[#111418] border border-slate-800 rounded-2xl p-4 text-white text-sm min-h-[160px] resize-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-2xl flex gap-3">
              <span className="material-symbols-outlined text-red-400 text-[20px] shrink-0">info</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                허위 신고의 경우 이용 약관에 따라 서비스 이용이 제한될 수 있습니다. 
                신고 접수 후 검토에는 최대 24시간이 소요될 수 있습니다.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={!selectedType}
                className={`flex-[2] h-14 rounded-2xl font-black text-sm transition-all shadow-lg ${
                  selectedType
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                }`}
              >
                신고 제출하기
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
