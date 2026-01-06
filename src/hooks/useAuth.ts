import { useState, useEffect } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Firestore에서 사용자 정보 가져오기 (최신 프로필 정보 반영)
        try {
          console.log('[useAuth] Firebase Auth photoURL:', firebaseUser.photoURL);
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('[useAuth] Firestore userData:', {
              displayName: userData.displayName,
              photoURL: userData.photoURL
            });

            const finalDisplayName = userData.displayName !== undefined ? userData.displayName : firebaseUser.displayName;
            const finalPhotoURL = userData.photoURL !== undefined ? userData.photoURL : firebaseUser.photoURL;

            console.log('[useAuth] Setting user state with:', {
              displayName: finalDisplayName,
              photoURL: finalPhotoURL
            });

            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              // Firestore 값이 있으면 우선 사용 (빈 문자열도 유효한 값으로 처리)
              displayName: finalDisplayName,
              photoURL: finalPhotoURL,
              emailVerified: firebaseUser.emailVerified
            });
          } else {
            console.log('[useAuth] No Firestore doc, using Firebase Auth data');
            // Firestore 문서가 없으면 Firebase Auth 정보 사용
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              emailVerified: firebaseUser.emailVerified
            });
          }
        } catch (error) {
          console.error('사용자 정보 로드 오류:', error);
          // 에러 발생 시 Firebase Auth 정보 사용
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 이메일로 회원가입
  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 이메일 인증 메일 발송
      await sendEmailVerification(user);

      // Firestore에 사용자 정보 저장
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || email.split('@')[0],
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        createdAt: serverTimestamp(),
        emailVerified: false,
        role: 'user'
      });

      return { success: true, user };
    } catch (error: any) {
      console.error('회원가입 오류:', error);
      return { success: false, error: getErrorMessage(error.code) };
    }
  };

  // 이메일로 로그인
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      console.error('로그인 오류:', error);
      return { success: false, error: getErrorMessage(error.code) };
    }
  };

  // Google로 로그인
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Firestore에 사용자 정보 저장 (이미 있으면 업데이트하지 않음)
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          emailVerified: user.emailVerified,
          role: 'user'
        });
      }

      return { success: true, user };
    } catch (error: any) {
      console.error('Google 로그인 오류:', error);
      return { success: false, error: getErrorMessage(error.code) };
    }
  };

  // 로그아웃
  const signOut = async () => {
    try {
      // localStorage에서 사용자별 데이터 모두 삭제
      if (auth.currentUser) {
        const userKey = auth.currentUser.uid;
        localStorage.removeItem(`recent_visits_${userKey}`);
        localStorage.removeItem(`pinned_debates_${userKey}`);
      }

      // Firebase 로그아웃
      await firebaseSignOut(auth);
      return { success: true };
    } catch (error: any) {
      console.error('로그아웃 오류:', error);
      return { success: false, error: getErrorMessage(error.code) };
    }
  };

  // 이메일 인증 재발송
  const resendVerificationEmail = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        return { success: true };
      }
      return { success: false, error: '로그인이 필요합니다.' };
    } catch (error: any) {
      console.error('이메일 인증 재발송 오류:', error);
      return { success: false, error: getErrorMessage(error.code) };
    }
  };

  // 비밀번호 재설정 이메일 발송
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      console.error('비밀번호 재설정 오류:', error);
      return { success: false, error: getErrorMessage(error.code) };
    }
  };

  return {
    user,
    loading,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    resendVerificationEmail,
    resetPassword
  };
}

// 에러 메시지 한글화
function getErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return '이미 사용 중인 이메일입니다.';
    case 'auth/invalid-email':
      return '유효하지 않은 이메일 형식입니다.';
    case 'auth/operation-not-allowed':
      return '이메일/비밀번호 계정이 비활성화되었습니다.';
    case 'auth/weak-password':
      return '비밀번호가 너무 약합니다. 8자 이상 입력해주세요.';
    case 'auth/user-disabled':
      return '비활성화된 계정입니다.';
    case 'auth/user-not-found':
      return '존재하지 않는 계정입니다.';
    case 'auth/wrong-password':
      return '잘못된 비밀번호입니다.';
    case 'auth/too-many-requests':
      return '너무 많은 시도가 있었습니다. 나중에 다시 시도해주세요.';
    case 'auth/popup-closed-by-user':
      return '로그인 팝업이 닫혔습니다.';
    case 'auth/cancelled-popup-request':
      return '로그인이 취소되었습니다.';
    default:
      return '알 수 없는 오류가 발생했습니다.';
  }
}
