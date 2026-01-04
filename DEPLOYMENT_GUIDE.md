# 🚀 DebateHub 배포 가이드

## 📋 준비사항

이미 완료된 사항:
- ✅ Firebase 프로젝트 생성 (debatehub-70611)
- ✅ Firebase Authentication 설정
- ✅ `.env` 파일에 Firebase 설정 완료

## 🔥 Firestore 데이터베이스 설정

### 1단계: Firestore 활성화

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 `debatehub-70611` 선택
3. 왼쪽 메뉴에서 **Firestore Database** 클릭
4. **데이터베이스 만들기** 버튼 클릭
5. 위치 선택: **asia-northeast3 (서울)** 추천
6. 보안 규칙 모드 선택:
   - **테스트 모드로 시작** (30일간 모든 읽기/쓰기 허용)
   - 또는 **프로덕션 모드** (아래 보안 규칙 적용 필요)

### 2단계: 보안 규칙 설정 (프로덕션 모드인 경우)

Firebase Console > Firestore Database > **규칙** 탭으로 이동하여 아래 규칙을 적용:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 인증 확인 헬퍼 함수
    function isAuthenticated() {
      return request.auth != null;
    }

    // 토론방
    match /debates/{debateId} {
      allow read: if true;  // 모든 사용자가 읽기 가능
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() &&
        resource.data.creatorId == request.auth.uid;
    }

    // 메시지
    match /messages/{messageId} {
      allow read: if true;
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
    }

    // 참여자
    match /participants/{participantId} {
      allow read: if true;
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
    }

    // 사용자
    match /users/{userId} {
      allow read: if true;
      allow create, update: if isAuthenticated() &&
        request.auth.uid == userId;
    }
  }
}
```

### 3단계: 인덱스 생성

첫 번째 쿼리 실행 시 Firebase가 자동으로 필요한 인덱스를 제안합니다.
또는 Firebase Console > Firestore Database > **인덱스** 탭에서 수동 생성:

**복합 인덱스 (Composite Indexes):**

1. **debates 컬렉션**
   - 컬렉션: `debates`
   - 필드1: `status` (ASC)
   - 필드2: `updatedAt` (DESC)

2. **messages 컬렉션**
   - 컬렉션: `messages`
   - 필드1: `debateId` (ASC)
   - 필드2: `createdAt` (ASC)

3. **participants 컬렉션**
   - 컬렉션: `participants`
   - 필드1: `debateId` (ASC)
   - 필드2: `joinedAt` (ASC)

## 🌱 초기 데이터 추가 (Seed)

더미 토론방 데이터를 Firestore에 추가하려면:

```bash
npm run seed
```

이 명령어는 6개의 샘플 토론방을 추가합니다:
- 보편적 기본소득 논쟁
- 원격 근무 제도화
- 우주 탐사 예산
- 일회용 컵 보증금제
- 디지털 교과서 도입
- AI 의식 논쟁

## 🧪 테스트

### 로컬 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3002` (또는 표시된 포트) 접속

### 기능 테스트 체크리스트

- [ ] 회원가입 및 이메일 인증
- [ ] 로그인 (이메일/Google)
- [ ] 비밀번호 재설정
- [ ] 토론방 목록 조회
- [ ] 토론방 생성
- [ ] 토론방 입장 및 참여
- [ ] 메시지 전송
- [ ] 실시간 메시지 동기화 (다른 브라우저에서 테스트)
- [ ] 좋아요 기능
- [ ] 참여자 목록 확인

## 🌐 배포 (Vercel/Netlify)

### Vercel 배포

1. [Vercel](https://vercel.com) 가입 및 로그인
2. **New Project** 클릭
3. GitHub 저장소 연결
4. 환경 변수 설정:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
5. **Deploy** 클릭

### Netlify 배포

1. [Netlify](https://netlify.com) 가입 및 로그인
2. **New site from Git** 클릭
3. GitHub 저장소 연결
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. 환경 변수 설정 (Vercel과 동일)
6. **Deploy site** 클릭

## 📊 모니터링

### Firebase Console에서 확인

- **Authentication** > Users: 가입한 사용자 목록
- **Firestore Database** > Data: 저장된 토론방, 메시지, 참여자
- **Usage**: 읽기/쓰기 작업 통계

### Firestore 무료 할당량

- **읽기**: 50,000회/일
- **쓰기**: 20,000회/일
- **삭제**: 20,000회/일
- **저장소**: 1GB

실시간 리스너를 많이 사용하면 읽기 작업이 빠르게 소진될 수 있으니 주의하세요.

## 🔧 문제 해결

### "Permission denied" 오류

→ Firestore 보안 규칙을 확인하세요. 테스트 모드나 올바른 프로덕션 규칙이 적용되어 있는지 확인.

### 데이터가 표시되지 않음

→ Firebase Console에서 Firestore Database에 데이터가 있는지 확인. `npm run seed` 실행.

### 실시간 업데이트가 작동하지 않음

→ 브라우저 콘솔에서 WebSocket 연결 오류 확인. 네트워크 방화벽 설정 확인.

### 인덱스 오류

→ 오류 메시지의 링크를 클릭하여 Firebase가 자동으로 인덱스를 생성하도록 허용.

## 📝 다음 단계

1. ✅ Firestore 활성화
2. ✅ 보안 규칙 설정
3. ✅ 초기 데이터 시딩
4. ⬜ 로컬에서 테스트
5. ⬜ Vercel/Netlify 배포
6. ⬜ 커스텀 도메인 설정

## 🆘 도움말

- [Firebase 문서](https://firebase.google.com/docs)
- [Firestore 가이드](https://firebase.google.com/docs/firestore)
- [Vite 배포 가이드](https://vitejs.dev/guide/static-deploy.html)
