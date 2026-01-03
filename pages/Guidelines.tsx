
import React from 'react';

export default function Guidelines() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-black mb-8 text-center">커뮤니티 가이드라인</h1>
      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border-dark shadow-xl p-8 space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">handshake</span>
            </div>
            <h2 className="text-2xl font-bold">1. 상호 존중과 포용</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            우리는 다양한 배경과 생각을 가진 사람들이 모인 커뮤니티입니다. 서로의 다름을 인정하고 존중하는 태도가 건강한 토론의 시작입니다.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-500">
            <li>상대방의 의견을 끝까지 경청하며, 감정적인 비난보다는 논리적인 반박을 지향합니다.</li>
            <li>차별적 발언이나 혐오 표현은 절대 용납되지 않습니다.</li>
          </ul>
        </section>
        <section className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
              <span className="material-symbols-outlined">fact_check</span>
            </div>
            <h2 className="text-2xl font-bold">2. 근거 기반의 논쟁</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            생산적인 토론을 위해 주장의 신뢰성을 확보해 주세요. 명확한 사실과 논리는 토론의 질을 높입니다.
          </p>
        </section>
      </div>
    </div>
  );
}
