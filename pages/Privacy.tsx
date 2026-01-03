
import React from 'react';

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-black mb-8 text-center">개인정보처리방침</h1>
      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border-dark shadow-xl p-8 space-y-6">
        <h2 className="text-xl font-bold">제1조 (목적)</h2>
        <p className="text-slate-600 dark:text-slate-300">
          DebateHub는 이용자의 개인정보를 소중히 다루며, 관련 법령을 준수합니다. 본 방침은 이용자가 제공하는 개인정보가 어떤 용도와 방식으로 이용되고 있는지, 개인정보 보호를 위해 어떤 조치가 취해지고 있는지 알리기 위해 수립되었습니다.
        </p>
        <h2 className="text-xl font-bold">제2조 (수집 항목)</h2>
        <p className="text-slate-600 dark:text-slate-300">
          회사는 회원가입을 위해 이메일, 닉네임, 비밀번호를 수집합니다. 토론 참여 시에는 접속 로그 및 IP 정보가 자동으로 수집될 수 있습니다.
        </p>
      </div>
    </div>
  );
}
