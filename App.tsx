
import { useState, useRef, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { useAuth } from './src/hooks/useAuth';
import Home from './pages/Home';
import CreateDebate from './pages/CreateDebate';
import DebateRoom from './pages/DebateRoom';
import Guidelines from './pages/Guidelines';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Inquiry from './pages/Inquiry';
import ReportUser from './pages/ReportUser';
import DebateList from './pages/DebateList';
import MyDebates from './pages/MyDebates';
import MyPage from './pages/MyPage';

const Header = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
    setIsDropdownOpen(false);
    navigate('/');
  };

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-800 bg-[#0b0f14]/80 backdrop-blur-md px-4 sm:px-10 py-3">
      <div className="flex items-center gap-8 w-full max-w-[1440px] mx-auto">
        <Link to="/" className="flex items-center gap-3 text-slate-900 dark:text-white shrink-0">
          <div className="size-8 text-primary">
            <span className="material-symbols-outlined text-3xl">forum</span>
          </div>
          <h2 className="text-xl font-bold leading-tight tracking-tight">DebateHub</h2>
        </Link>

        <div className="flex gap-3 ml-auto items-center">
          {loading ? (
            <div className="h-9 px-4 flex items-center">
              <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-800 hover:border-slate-600 transition-colors cursor-pointer"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="프로필"
                    className="size-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="size-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="text-sm text-slate-300">{user.displayName || user.email}</span>
                <span className="material-symbols-outlined text-slate-400 text-lg">
                  {isDropdownOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {/* 드롭다운 메뉴 */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden animate-fade-in">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate('/mypage');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">person</span>
                      <span>마이페이지</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate('/my-debates');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">forum</span>
                      <span>내 토론방</span>
                    </button>
                    <div className="border-t border-slate-700 my-1"></div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">logout</span>
                      <span>로그아웃</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 모바일용 간단 버튼 */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="sm:hidden size-9 rounded-full overflow-hidden"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="프로필"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="size-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                )}
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="hidden sm:flex h-9 px-4 items-center justify-center rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-medium transition-colors">
                로그인
              </Link>
              <Link to="/signup" className="flex h-9 px-4 items-center justify-center rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-lg shadow-primary/20 transition-colors">
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

const Footer = () => (
  <footer className="mt-auto border-t border-slate-200 dark:border-border-dark py-8 bg-white dark:bg-background-dark">
    <div className="max-w-[1440px] mx-auto px-4 sm:px-10 flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-2 text-slate-900 dark:text-white">
        <div className="size-6 text-primary">
          <span className="material-symbols-outlined text-2xl">forum</span>
        </div>
        <span className="text-lg font-bold">DebateHub</span>
      </div>
      <div className="flex gap-6 flex-wrap justify-center">
        <Link to="/privacy" className="text-sm text-white hover:text-primary">개인정보처리방침</Link>
        <Link to="/terms" className="text-sm text-white hover:text-primary">이용약관</Link>
        <Link to="/guidelines" className="text-sm text-white hover:text-primary">가이드라인</Link>
        <Link to="/inquiry" className="text-sm text-white hover:text-primary">문의하기</Link>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-600">
        © 2026 DebateHub. All rights reserved.
      </p>
    </div>
  </footer>
);

export default function App() {
  return (
    <HashRouter>
      <div className="flex flex-col min-h-screen bg-[#0b0f14]">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateDebate />} />
            <Route path="/room/:id" element={<DebateRoom />} />
            <Route path="/guidelines" element={<Guidelines />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/inquiry" element={<Inquiry />} />
            <Route path="/report/:username" element={<ReportUser />} />
            <Route path="/debates" element={<DebateList />} />
            <Route path="/my-debates" element={<MyDebates />} />
            <Route path="/mypage" element={<MyPage />} />
          </Routes>
        </main>
        <Footer />
        <Analytics />
      </div>
    </HashRouter>
  );
}
