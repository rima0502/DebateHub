
import React from 'react';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-black mb-8 text-center">이용약관</h1>
      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border-dark shadow-xl p-8 space-y-6">
        <h2 className="text-xl font-bold">제1조 (목적)</h2>
        <p className="text-slate-600 dark:text-slate-300">
          본 약관은 DebateHub가 제공하는 웹 기반 실시간 숙의형 토론 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>
        <h2 className="text-xl font-bold">제2조 (회원의 의무)</h2>
        <p className="text-slate-600 dark:text-slate-300">
          회원은 건전한 토론 문화를 조성하기 위해 타인의 정보를 도용하거나 허위 사실을 유포해서는 안 됩니다.
        </p>
      </div>
    </div>
  );
}
