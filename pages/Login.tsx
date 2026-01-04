
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../src/hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { user, signInWithEmail, signInWithGoogle, resendVerificationEmail, resetPassword } = useAuth();

  // 이미 로그인한 사용자는 홈으로 리다이렉트
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signInWithEmail(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || '로그인에 실패했습니다.');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    const result = await signInWithGoogle();
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Google 로그인에 실패했습니다.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await resetPassword(resetEmail);
    setLoading(false);

    if (result.success) {
      setResetSuccess(true);
    } else {
      setError(result.error || '비밀번호 재설정 이메일 발송에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0b0f14] relative overflow-hidden font-sans">
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[100px]"></div>
      </div>
      
      <div className="w-full max-w-[500px] z-10 flex flex-col items-center">
        {/* Login Card */}
        <div className="w-full bg-[#111821] rounded-[24px] border border-slate-800/50 shadow-2xl p-10 lg:p-12 mb-10">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="mb-6 size-14 rounded-2xl bg-[#1c2a3b] flex items-center justify-center text-primary shadow-inner">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white mb-3">다시 오신 것을 환영합니다</h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-[280px]">
              계정 정보를 입력하여 토론 포럼에 접속하세요.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex gap-3 items-center mb-4">
              <span className="material-symbols-outlined text-red-500 text-xl">error</span>
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="flex flex-col gap-6">
            {/* ID/Email Field */}
            <div className="flex flex-col gap-2.5">
              <label className="text-sm font-bold text-slate-300 ml-1">이메일</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors text-[20px]">
                  mail
                </span>
                <input
                  className="w-full h-14 pl-12 pr-4 rounded-xl bg-[#0b0f14] border border-slate-800 text-white placeholder:text-slate-600 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-bold text-slate-300">비밀번호</label>
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="text-xs font-black text-primary hover:underline transition-all"
                >
                  비밀번호를 잊으셨나요?
                </button>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors text-[20px]">
                  key
                </span>
                <input
                  className="w-full h-14 pl-12 pr-12 rounded-xl bg-[#0b0f14] border border-slate-800 text-white placeholder:text-slate-600 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 mt-4 bg-primary hover:bg-blue-600 text-white font-black rounded-xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '로그인 중...' : '로그인'} <span className="material-symbols-outlined font-black">logout</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-slate-800/50"></div>
              <span className="flex-shrink-0 mx-4 text-[10px] font-black text-slate-500 tracking-[0.2em]">또는</span>
              <div className="flex-grow border-t border-slate-800/50"></div>
            </div>

            {/* Social Login - Single Google Button as per reference */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex items-center justify-center gap-3 h-14 rounded-xl border border-slate-800 bg-[#1c2127] hover:bg-slate-800 text-white text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="size-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                </svg>
                Google 계정으로 계속하기
              </button>
            </div>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-slate-500 font-medium">
              계정이 없으신가요? <Link to="/signup" className="font-black text-primary hover:underline ml-1">회원가입</Link>
            </p>
          </div>
        </div>

        {/* Footer Links as per reference */}
        <div className="flex items-center justify-center gap-8 py-4">
          <Link to="/privacy" className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors">개인정보처리방침</Link>
          <div className="size-1 bg-slate-800 rounded-full"></div>
          <Link to="/terms" className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors">이용약관</Link>
          <div className="size-1 bg-slate-800 rounded-full"></div>
          <Link to="/inquiry" className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors">고객센터</Link>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111821] rounded-2xl border border-slate-800/50 shadow-2xl p-8 max-w-md w-full">
            {!resetSuccess ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="size-12 rounded-xl bg-[#1c2a3b] flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-2xl">lock_reset</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">비밀번호 재설정</h2>
                    <p className="text-sm text-slate-400 mt-1">이메일로 재설정 링크를 받으세요</p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex gap-3 items-center mb-4">
                    <span className="material-symbols-outlined text-red-500 text-xl">error</span>
                    <p className="text-red-400 text-sm font-medium">{error}</p>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2.5">
                    <label className="text-sm font-bold text-slate-300 ml-1">이메일</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors text-[20px]">
                        mail
                      </span>
                      <input
                        className="w-full h-14 pl-12 pr-4 rounded-xl bg-[#0b0f14] border border-slate-800 text-white placeholder:text-slate-600 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                        type="email"
                        placeholder="user@example.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetModal(false);
                        setError('');
                        setResetEmail('');
                      }}
                      disabled={loading}
                      className="flex-1 h-12 rounded-xl border border-slate-800 bg-[#1c2127] hover:bg-slate-800 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 h-12 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-xl shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? '발송 중...' : '이메일 발송'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center text-center py-4">
                  <div className="size-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-4">
                    <span className="material-symbols-outlined text-4xl">check_circle</span>
                  </div>
                  <h2 className="text-2xl font-black text-white mb-3">이메일 발송 완료</h2>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    <span className="text-primary font-bold">{resetEmail}</span>로<br />
                    비밀번호 재설정 링크를 발송했습니다.<br />
                    이메일을 확인해주세요.
                  </p>
                  <button
                    onClick={() => {
                      setShowResetModal(false);
                      setResetSuccess(false);
                      setResetEmail('');
                      setError('');
                    }}
                    className="w-full h-12 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-xl shadow-primary/20 transition-all"
                  >
                    확인
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
