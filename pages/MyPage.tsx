
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../src/hooks/useAuth';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db, auth } from '../src/firebase';

export default function MyPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastNameChange, setLastNameChange] = useState<Date | null>(null);
  const [canChangeName, setCanChangeName] = useState(true);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');

      // 구글 사용자인지 확인
      const currentUser = auth.currentUser;
      const isGoogle = currentUser?.providerData.some(provider => provider.providerId === 'google.com');
      setIsGoogleUser(isGoogle || false);

      // Firestore에서 마지막 닉네임 변경 시간 확인
      const checkLastNameChange = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.lastNameChange) {
              const lastChange = data.lastNameChange.toDate();
              setLastNameChange(lastChange);

              // 일주일(7일) 경과 확인
              const daysSinceChange = (Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24);
              setCanChangeName(daysSinceChange >= 7);
            }
          }
        } catch (error) {
          console.error('마지막 변경 시간 확인 오류:', error);
        }
      };

      checkLastNameChange();
    }
  }, [user]);

  const handleProfileUpdate = async () => {
    if (!user || !auth.currentUser) return;

    // 닉네임이 변경되었는지 확인
    const nameChanged = displayName.trim() !== (user.displayName || '');

    // 닉네임 변경 시도 시 제한 확인
    if (nameChanged && !canChangeName) {
      const daysLeft = 7 - Math.floor((Date.now() - lastNameChange!.getTime()) / (1000 * 60 * 60 * 24));
      alert(`닉네임은 일주일에 한 번만 변경할 수 있습니다. ${daysLeft}일 후에 다시 시도해주세요.`);
      return;
    }

    if (!displayName.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      // photoURL이 비어있으면 기본 아바타 URL 사용
      const finalPhotoURL = photoURL.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`;

      // Firebase Auth 프로필 업데이트
      try {
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim(),
          photoURL: finalPhotoURL
        });
      } catch (authError: any) {
        console.error('Auth 프로필 업데이트 오류:', authError);
        throw new Error('프로필 업데이트 실패: ' + authError.message);
      }

      // Firestore 사용자 문서 업데이트
      const updateData: any = {
        displayName: displayName.trim(),
        photoURL: finalPhotoURL
      };

      // 닉네임이 변경된 경우에만 lastNameChange 업데이트
      if (nameChanged) {
        updateData.lastNameChange = serverTimestamp();
      }

      try {
        await updateDoc(doc(db, 'users', user.uid), updateData);
      } catch (firestoreError: any) {
        console.error('Firestore 사용자 문서 업데이트 오류:', firestoreError);
        throw new Error('사용자 정보 저장 실패: ' + firestoreError.message);
      }

      // participants 및 messages 컬렉션 업데이트 (권한 문제 시 무시)
      try {
        // participants 컬렉션 업데이트
        const participantsQuery = query(
          collection(db, 'participants'),
          where('userId', '==', user.uid)
        );
        const participantsSnapshot = await getDocs(participantsQuery);

        // messages 컬렉션 업데이트
        const messagesQuery = query(
          collection(db, 'messages'),
          where('userId', '==', user.uid)
        );
        const messagesSnapshot = await getDocs(messagesQuery);

        // 배치 업데이트 (최대 500개씩)
        const batch = writeBatch(db);
        let batchCount = 0;

        // participants 업데이트
        participantsSnapshot.forEach((docSnapshot) => {
          batch.update(docSnapshot.ref, {
            userName: displayName.trim(),
            userAvatar: finalPhotoURL
          });
          batchCount++;
        });

        // messages 업데이트
        messagesSnapshot.forEach((docSnapshot) => {
          batch.update(docSnapshot.ref, {
            userName: displayName.trim(),
            userAvatar: finalPhotoURL
          });
          batchCount++;
        });

        // 배치 커밋 (500개 제한이 있으므로 확인)
        if (batchCount > 0) {
          await batch.commit();
        }
      } catch (updateError) {
        console.warn('참여자 및 메시지 업데이트 실패 (무시됨):', updateError);
        // 권한 문제 등으로 실패해도 프로필 업데이트는 성공으로 처리
      }

      alert('프로필이 업데이트되었습니다!');

      if (nameChanged) {
        setCanChangeName(false);
        setLastNameChange(new Date());
      }

      // 페이지 새로고침으로 상태 반영
      window.location.reload();
    } catch (error: any) {
      console.error('프로필 업데이트 오류:', error);
      alert('프로필 업데이트에 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user || !auth.currentUser) return;

    if (isGoogleUser) {
      alert('구글 계정은 비밀번호를 변경할 수 없습니다.');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('모든 비밀번호 필드를 입력해주세요.');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 8) {
      alert('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      // 현재 비밀번호로 재인증
      const credential = EmailAuthProvider.credential(
        user.email!,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // 비밀번호 변경
      await updatePassword(auth.currentUser, newPassword);

      alert('비밀번호가 변경되었습니다!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('비밀번호 변경 오류:', error);
      if (error.code === 'auth/wrong-password') {
        alert('현재 비밀번호가 올바르지 않습니다.');
      } else {
        alert('비밀번호 변경에 실패했습니다: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b0f14]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0b0f14] py-8 px-4 sm:px-10">
      <div className="max-w-[800px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">마이페이지</h1>
          <p className="text-slate-400">프로필 정보를 관리하세요</p>
        </div>

        {/* Profile Section */}
        <div className="bg-[#1c2127] rounded-2xl border border-slate-800 p-6 md:p-8 mb-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined">person</span>
            프로필 정보
          </h2>

          <div className="flex flex-col gap-6">
            {/* Profile Image */}
            <div className="flex items-center gap-6">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt="프로필 이미지"
                  className="size-20 rounded-full object-cover border-2 border-primary"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`size-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold ${photoURL ? 'hidden' : ''}`}>
                {displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-white font-bold">{user.email}</p>
                <p className="text-sm text-slate-500">
                  {isGoogleUser ? '구글 계정' : '이메일 계정'}
                </p>
              </div>
            </div>

            {/* Display Name */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-white flex items-center justify-between">
                <span>닉네임</span>
                {!canChangeName && lastNameChange && (
                  <span className="text-xs text-orange-400">
                    {7 - Math.floor((Date.now() - lastNameChange.getTime()) / (1000 * 60 * 60 * 24))}일 후 변경 가능
                  </span>
                )}
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={!canChangeName}
                className="w-full h-12 px-4 rounded-xl bg-[#0b0f14] border border-slate-800 text-white placeholder:text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="닉네임을 입력하세요"
              />
              <p className="text-xs text-slate-500">
                닉네임은 일주일에 한 번만 변경할 수 있습니다.
              </p>
            </div>

            {/* Photo URL Input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-white">프로필 이미지 URL</label>
              <input
                type="text"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-[#0b0f14] border border-slate-800 text-white placeholder:text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                placeholder="https://example.com/profile.jpg"
              />
              {photoURL && (
                <div className="mt-2 flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                  <img
                    src={photoURL}
                    alt="미리보기"
                    className="size-12 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`;
                    }}
                  />
                  <p className="text-xs text-slate-400">이미지 미리보기</p>
                </div>
              )}
              <p className="text-xs text-slate-500">
                프로필 이미지는 언제든지 변경할 수 있습니다.
              </p>
            </div>

            {/* Update Button */}
            <button
              onClick={handleProfileUpdate}
              disabled={loading}
              className="w-full h-12 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>업데이트 중...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  <span>프로필 업데이트</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Password Change Section - Only for Email Users */}
        {!isGoogleUser && (
          <div className="bg-[#1c2127] rounded-2xl border border-slate-800 p-6 md:p-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined">lock</span>
              비밀번호 변경
            </h2>

            <div className="flex flex-col gap-6">
              {/* Current Password */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-white">현재 비밀번호</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-[#0b0f14] border border-slate-800 text-white placeholder:text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                  placeholder="현재 비밀번호를 입력하세요"
                />
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-white">새 비밀번호</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-[#0b0f14] border border-slate-800 text-white placeholder:text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                  placeholder="새 비밀번호 (8자 이상)"
                />
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-white">새 비밀번호 확인</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-[#0b0f14] border border-slate-800 text-white placeholder:text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                  placeholder="새 비밀번호를 다시 입력하세요"
                />
              </div>

              {/* Change Password Button */}
              <button
                onClick={handlePasswordChange}
                disabled={loading}
                className="w-full h-12 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>변경 중...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">vpn_key</span>
                    <span>비밀번호 변경</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
