# 보안 권장사항

이 문서는 DebateHub 애플리케이션의 보안을 강화하기 위한 권장사항을 담고 있습니다.

## ✅ 완료된 보안 개선사항

### 1. 하드코딩된 인증 정보 제거
- `checkFirestore.js`에서 Firebase 인증 정보를 환경 변수로 이동
- `.env` 파일을 통한 안전한 인증 정보 관리

### 2. 입력 검증 추가
- 토론방 제목: 최대 200자
- 토론방 설명: 최대 2000자
- 메시지 내용: 최대 5000자
- 빈 입력 방지

### 3. 레이트 리밋 구현
- 메시지 전송: 1분당 최대 10개 메시지
- 스팸 공격 방지

### 4. 프로덕션 빌드 보안
- 프로덕션 환경에서 소스맵 비활성화
- 소스 코드 노출 방지

### 5. 로깅 시스템 개선
- 개발 환경에서만 디버그 로그 출력
- `src/utils/logger.ts` 유틸리티 생성

---

## 🔴 즉시 조치 필요

### 1. Firebase 보안 규칙 설정 확인

**중요도: 매우 높음**

Firebase Console에서 Firestore 보안 규칙이 올바르게 설정되어 있는지 확인해야 합니다.

#### 권장 보안 규칙:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 사용자 인증 헬퍼 함수
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // 토론방 (debates)
    match /debates/{debateId} {
      // 모든 사용자가 읽기 가능
      allow read: if true;

      // 인증된 사용자만 생성 가능
      allow create: if isSignedIn()
        && request.resource.data.title.size() > 0
        && request.resource.data.title.size() <= 200
        && request.resource.data.description.size() <= 2000
        && request.resource.data.creatorId == request.auth.uid;

      // 생성자만 삭제 가능
      allow delete: if isOwner(resource.data.creatorId);

      // 생성자만 수정 가능 (일부 필드 제외)
      allow update: if isOwner(resource.data.creatorId)
        || (isSignedIn() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['participantCount', 'messageCount', 'updatedAt', 'pinnedBy']));
    }

    // 메시지 (messages)
    match /messages/{messageId} {
      // 모든 사용자가 읽기 가능
      allow read: if true;

      // 인증된 사용자만 생성 가능
      allow create: if isSignedIn()
        && request.resource.data.content.size() > 0
        && request.resource.data.content.size() <= 5000
        && request.resource.data.userId == request.auth.uid;

      // 좋아요 업데이트만 허용
      allow update: if isSignedIn()
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes', 'likedBy']);

      // 작성자만 삭제 가능
      allow delete: if isOwner(resource.data.userId);
    }

    // 참여자 (participants)
    match /participants/{participantId} {
      // 모든 사용자가 읽기 가능
      allow read: if true;

      // 인증된 사용자만 생성 가능
      allow create: if isSignedIn()
        && request.resource.data.userId == request.auth.uid;

      // 본인 또는 호스트만 수정 가능
      allow update: if isOwner(resource.data.userId);

      // 본인만 삭제 가능
      allow delete: if isOwner(resource.data.userId);
    }

    // 알림 (notifications)
    match /notifications/{notificationId} {
      // 본인 알림만 읽기 가능
      allow read: if isOwner(resource.data.userId);

      // 시스템에서만 생성 가능 (인증된 사용자)
      allow create: if isSignedIn();

      // 본인 알림만 수정 가능 (읽음 표시)
      allow update: if isOwner(resource.data.userId)
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']);

      // 본인 알림만 삭제 가능
      allow delete: if isOwner(resource.data.userId);
    }

    // 사용자 (users)
    match /users/{userId} {
      // 모든 사용자가 읽기 가능
      allow read: if true;

      // 본인 프로필만 생성/수정 가능
      allow create, update: if isOwner(userId);

      // 본인 프로필만 삭제 가능
      allow delete: if isOwner(userId);
    }
  }
}
```

#### 설정 방법:
1. [Firebase Console](https://console.firebase.google.com) 접속
2. 프로젝트 선택 (debatehub-70611)
3. 왼쪽 메뉴에서 "Firestore Database" 선택
4. "규칙" 탭 클릭
5. 위의 규칙을 복사하여 붙여넣기
6. "게시" 버튼 클릭

---

## 🟡 단기 조치 필요 (1주일 이내)

### 2. .env 파일 Git 히스토리에서 제거

현재 `.env` 파일이 Git 히스토리에 포함되어 있을 수 있습니다.

```bash
# Git 히스토리에서 완전히 제거
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 또는 BFG Repo-Cleaner 사용 (더 빠름)
# https://rtyley.github.io/bfg-repo-cleaner/
bfg --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 강제 푸시 (주의!)
git push origin --force --all
```

### 3. Firebase API 키 재생성 (선택사항)

만약 `.env` 파일이 공개 저장소에 커밋되었다면:

1. [Firebase Console](https://console.firebase.google.com) 접속
2. 프로젝트 설정 > 일반
3. "내 앱" 섹션에서 웹 앱 삭제 후 재생성
4. 새로운 인증 정보로 `.env` 파일 업데이트
5. Vercel 환경 변수도 업데이트

### 4. localStorage 보안 개선

현재 localStorage에 사용자 UID가 노출되어 있습니다.

**개선 방법:**
- localStorage 대신 Firestore에 사용자 설정 저장
- 또는 UID 없이 키 사용: `recent_visits`, `pinned_debates`

---

## 🟢 중장기 조치 (1개월 이내)

### 5. Content Security Policy (CSP) 헤더 추가

Vercel에 배포 시 `vercel.json`에 CSP 헤더 추가:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://www.gstatic.com; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: http:;"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        }
      ]
    }
  ]
}
```

### 6. Firebase App Check 활성화

악의적인 트래픽으로부터 Firebase 리소스 보호:

1. [Firebase Console](https://console.firebase.google.com) 접속
2. "App Check" 메뉴 선택
3. reCAPTCHA Enterprise 또는 reCAPTCHA v3 활성화
4. 코드에 App Check SDK 추가:

```typescript
// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const app = initializeApp(firebaseConfig);

// App Check 활성화 (프로덕션 환경에서만)
if (import.meta.env.PROD) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
    isTokenAutoRefreshEnabled: true
  });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 7. 모니터링 및 알림 설정

Firebase Console에서 다음을 모니터링:

- 비정상적인 트래픽 패턴
- Firestore 읽기/쓰기 급증
- 인증 실패 시도
- 예상치 못한 비용 증가

**Google Cloud Monitoring** 설정:
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트 선택
3. "Monitoring" > "Alerting" 메뉴
4. 알림 정책 생성 (예: 일일 읽기/쓰기 한도 초과 시)

### 8. 정기 보안 감사

- 월 1회: 의존성 취약점 검사 (`npm audit`)
- 월 1회: Firestore 보안 규칙 검토
- 분기 1회: 전체 보안 감사 실시

---

## 📋 체크리스트

배포 전 확인사항:

- [ ] Firebase 보안 규칙이 프로덕션 모드로 설정되어 있는가?
- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는가?
- [ ] Vercel 환경 변수가 올바르게 설정되어 있는가?
- [ ] 프로덕션 빌드에서 소스맵이 비활성화되어 있는가?
- [ ] `npm audit`를 실행하여 취약점이 없는가?
- [ ] Firebase 사용량 알림이 설정되어 있는가?

---

## 🔗 참고 자료

- [Firebase 보안 규칙 가이드](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase App Check](https://firebase.google.com/docs/app-check)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Security Cheat Sheet](https://cheatsheetseries.owasp.org/)
- [Vercel 보안 헤더](https://vercel.com/docs/edge-network/headers)
