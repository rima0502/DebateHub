
import React from 'react';

export default function Inquiry() {
  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full bg-white dark:bg-surface-dark border-b border-border-dark">
        <div className="max-w-[1440px] mx-auto px-4 py-12 lg:py-16 text-center">
          <h1 className="text-4xl font-black mb-4">문의하기</h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            DebateHub팀은 여러분의 소중한 의견을 기다립니다. 궁금한 점이 있다면 언제든 문의해주세요.
          </p>
        </div>
      </div>
      
      <div className="w-full max-w-[1024px] px-4 py-12 flex flex-col lg:flex-row gap-10">
        <div className="flex-1 bg-white dark:bg-surface-dark rounded-2xl border border-border-dark p-8 shadow-sm">
          <form className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold">문의 유형 *</label>
              <select className="w-full h-12 rounded-lg bg-slate-50 dark:bg-background-dark border border-border-dark text-white px-4">
                <option>일반 문의</option>
                <option>기술 지원</option>
                <option>신고 및 제재</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold">이메일 주소 *</label>
              <input className="w-full h-12 rounded-lg bg-slate-50 dark:bg-background-dark border border-border-dark text-white px-4" placeholder="답변 받으실 이메일 주소" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold">내용 *</label>
              <textarea className="w-full rounded-lg bg-slate-50 dark:bg-background-dark border border-border-dark text-white p-4 h-48" placeholder="자세한 내용을 적어주세요." />
            </div>
            <button type="button" className="w-full h-12 bg-primary text-white font-bold rounded-lg hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">send</span> 문의하기
            </button>
          </form>
        </div>
        
        <div className="w-full lg:w-80 flex flex-col gap-6">
          <div className="rounded-xl bg-white dark:bg-surface-dark border border-border-dark p-6">
            <h3 className="text-lg font-bold mb-4">자주 묻는 질문</h3>
            <button className="w-full p-4 rounded-lg bg-slate-50 dark:bg-background-dark border border-border-dark hover:border-primary flex justify-between items-center group">
              <span className="text-sm font-medium">FAQ 바로가기</span>
              <span className="material-symbols-outlined text-slate-500 group-hover:text-primary">arrow_forward</span>
            </button>
          </div>
          <div className="rounded-xl bg-primary p-6 text-white shadow-lg">
            <h3 className="text-lg font-bold mb-2">운영 시간 안내</h3>
            <p className="text-sm text-blue-100 mb-4">평일 09:00 - 18:00<br />(주말 및 공휴일 휴무)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
