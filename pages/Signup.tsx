
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../src/hooks/useAuth';

export default function Signup() {
  const navigate = useNavigate();
  const { user, signUpWithEmail } = useAuth();

  // 이미 로그인한 사용자는 홈으로 리다이렉트
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [guidelinesAgreed, setGuidelinesAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!termsAgreed || !guidelinesAgreed) {
      setError('모든 약관에 동의해주세요.');
      return;
    }

    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    const result = await signUpWithEmail(email, password);
    setLoading(false);

    if (result.success) {
      setEmailSent(true);
    } else {
      setError(result.error || '회원가입에 실패했습니다.');
    }
  };


  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f14] p-6">
        <div className="max-w-md w-full bg-[#111418] border border-slate-800 rounded-xl p-8 text-center">
          <div className="size-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-4xl">mail</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">이메일을 확인해주세요</h2>
          <p className="text-slate-400 mb-6 leading-relaxed">
            <span className="font-bold text-white">{email}</span>로 인증 메일을 발송했습니다.
            <br />이메일을 확인하고 인증을 완료해주세요.
          </p>
          <Link to="/login" className="inline-block w-full h-12 bg-primary hover:bg-blue-600 text-white font-bold rounded-lg transition-all flex items-center justify-center">
            로그인 페이지로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0b0f14]">
      {/* Left Section (Branding & Features) */}
      <div className="relative lg:w-[45%] flex flex-col bg-[#0b0f14] p-8 lg:p-16 xl:p-24 justify-between border-b lg:border-b-0 lg:border-r border-slate-800/50 overflow-hidden">
        {/* Abstract Background Effect */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-500/5 blur-[100px] pointer-events-none"></div>

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 mb-20">
            <div className="size-8 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">public</span>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Debate Platform</span>
          </Link>

          <div className="flex flex-col gap-6 mb-16">
            <h1 className="text-white tracking-tight text-4xl lg:text-5xl xl:text-6xl font-black leading-[1.15]">
              지능형 공론장에<br />참여하세요
            </h1>
            <p className="text-slate-400 text-lg max-w-md leading-relaxed">
              깊이 있는 심의와 검증된 익명성을 경험하세요. 규칙 기반의 토론을 통해 건강한 담론을 만들어갑니다.
            </p>
          </div>

          <div className="flex flex-col gap-4 max-w-md">
            {[
              { icon: 'chat_bubble', title: '실시간 토론 (Real-time Debate)', desc: '구조화된 논쟁에 실시간으로 참여하세요.' },
              { icon: 'verified_user', title: '검증된 익명성 (Verified Anonymity)', desc: '안전한 신원 확인으로 토론의 질을 높입니다.' },
              { icon: 'gavel', title: '전문가 중재 (Expert Moderation)', desc: '규칙과 중재자가 이끄는 공정한 토론.' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-5 hover:bg-slate-800/50 transition-colors">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-2xl">{item.icon}</span>
                </div>
                <div>
                  <h2 className="text-white text-sm font-bold mb-1">{item.title}</h2>
                  <p className="text-slate-500 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 pt-10">
          <p className="text-slate-600 text-xs font-medium">
            © 2026 Debate Platform. Intelligent Public Sphere.
          </p>
        </div>
      </div>

      {/* Right Section (Form) */}
      <div className="lg:w-[55%] flex flex-col items-center justify-center p-6 lg:p-12 xl:p-20 bg-[#111418]">
        <div className="w-full max-w-[480px] flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold text-white">계정 생성</h2>
            <p className="text-slate-400 text-sm">
              이미 계정이 있으신가요? <Link to="/login" className="text-primary hover:underline font-bold">로그인</Link>
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg flex gap-3 items-center">
              <span className="material-symbols-outlined text-red-500 text-xl">error</span>
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleEmailSignup} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-300">이메일 주소</label>
              <input
                className="w-full h-14 px-4 rounded-lg bg-[#1c2127] border border-slate-700 text-white outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-slate-600"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-300">비밀번호</label>
              <div className="relative">
                <input
                  className="w-full h-14 px-4 pr-12 rounded-lg bg-[#1c2127] border border-slate-700 text-white outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-slate-600"
                  type={showPassword ? "text" : "password"}
                  placeholder="8자 이상 영문, 숫자, 특수문자 포함"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-[#132233] border border-blue-500/20 p-5 rounded-lg flex gap-4">
              <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[18px]">info</span>
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-bold text-white">검증된 익명성 안내</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  건전한 토론 문화를 위해 추후 본인 인증 절차가 추가될 수 있습니다. 귀하의 개인정보는 암호화되어 안전하게 보호됩니다.
                </p>
              </div>
            </div>

            {/* Agreement Checkboxes */}
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="size-5 rounded bg-[#1c2127] border-slate-700 text-primary focus:ring-offset-0 focus:ring-0"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  disabled={loading}
                />
                <span className="text-sm text-slate-400">
                  <Link to="/terms" className="text-primary hover:underline">이용약관</Link> 및 <Link to="/privacy" className="text-primary hover:underline">개인정보 처리방침</Link>에 동의합니다.
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="size-5 rounded bg-[#1c2127] border-slate-700 text-primary focus:ring-offset-0 focus:ring-0"
                  checked={guidelinesAgreed}
                  onChange={(e) => setGuidelinesAgreed(e.target.checked)}
                  disabled={loading}
                />
                <span className="text-sm text-slate-400">
                  <Link to="/guidelines" className="text-primary hover:underline">커뮤니티 가이드라인</Link>에 동의합니다.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-primary hover:bg-blue-600 text-white font-bold rounded-lg shadow-lg shadow-primary/20 mt-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '처리 중...' : '회원가입 완료'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
