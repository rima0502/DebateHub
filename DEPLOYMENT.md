# DebateHub 배포 가이드

## 🔥 Firebase 설정

### 1. Firebase 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `DebateHub` (또는 원하는 이름)
4. Google Analytics 설정 (선택사항)

### 2. Firebase 웹 앱 등록
1. Firebase Console에서 프로젝트 선택
2. 프로젝트 설정 ⚙️ > 일반 탭
3. "내 앱" 섹션에서 웹 아이콘 `</>` 클릭
4. 앱 닉네임 입력: `DebateHub Web`
5. Firebase SDK 구성 코드가 표시됨

### 3. 환경 변수 설정
1. 프로젝트 루트에 `.env` 파일 생성:
```bash
cp .env.example .env
```

2. `.env` 파일에 Firebase 설정값 입력:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Firebase 서비스 활성화

#### Authentication (인증)
1. Firebase Console > Authentication
2. "시작하기" 클릭
3. 로그인 방법 탭에서 활성화:
   - 이메일/비밀번호 ✅
   - Google (선택사항) ✅

#### Firestore Database (데이터베이스)
1. Firebase Console > Firestore Database
2. "데이터베이스 만들기" 클릭
3. 위치 선택: `asia-northeast3 (서울)` 또는 `asia-northeast1 (도쿄)`
4. 보안 규칙: **테스트 모드**로 시작 (나중에 프로덕션 모드로 변경)

#### Storage (파일 저장소)
1. Firebase Console > Storage
2. "시작하기" 클릭
3. 보안 규칙: 기본값 사용
4. 위치: Firestore와 동일한 위치 선택

### 5. Firestore 보안 규칙 설정
Firebase Console > Firestore Database > 규칙 탭에서 다음 규칙 적용:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자는 자신의 문서만 읽기/쓰기 가능
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // 토론방은 모두가 읽을 수 있지만, 인증된 사용자만 생성 가능
    match /debates/{debateId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        (resource.data.createdBy == request.auth.uid ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }

    // 메시지는 인증된 사용자만 읽기/쓰기
    match /debates/{debateId}/messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 🚀 Vercel 배포

### 1. Git 저장소 연결
```bash
# Git 초기화 (아직 안 했다면)
git init

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit: DebateHub"

# GitHub에 저장소 생성 후
git remote add origin https://github.com/your-username/debatehub.git
git branch -M main
git push -u origin main
```

### 2. Vercel 프로젝트 생성
1. [Vercel](https://vercel.com)에 로그인 (GitHub 계정 연동)
2. "Add New..." > "Project" 클릭
3. DebateHub 저장소 선택
4. "Import" 클릭

### 3. Vercel 환경 변수 설정
1. Vercel 프로젝트 설정 > Environment Variables
2. `.env` 파일의 모든 변수를 추가:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

### 4. 빌드 설정 확인
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 5. 배포
1. "Deploy" 버튼 클릭
2. 배포 완료 대기 (2-3분)
3. 배포 URL 확인: `https://your-project.vercel.app`

---

## 🔄 자동 배포 설정

Git에 푸시할 때마다 자동으로 배포됩니다:

```bash
# 코드 수정 후
git add .
git commit -m "기능 추가: 새로운 기능"
git push

# Vercel이 자동으로 배포를 시작합니다!
```

---

## 📊 Firestore 데이터 구조

### Collection: `users`
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string,
  createdAt: timestamp,
  role: 'user' | 'admin'
}
```

### Collection: `debates`
```javascript
{
  id: string,
  title: string,
  category: string,
  description: string,
  image: string,
  createdBy: string,
  createdAt: timestamp,
  participants: number,
  messages: number,
  status: 'active' | 'closed'
}
```

### SubCollection: `debates/{debateId}/messages`
```javascript
{
  id: string,
  userId: string,
  userName: string,
  userAvatar: string,
  content: string,
  side: 'PRO' | 'CON' | 'NEUTRAL',
  likes: number,
  replyTo: string | null,
  timestamp: timestamp
}
```

---

## 🛠️ 로컬 개발

```bash
# 개발 서버 실행
npm run dev

# 빌드 테스트
npm run build
npm run preview
```

---

## ✅ 배포 체크리스트

- [ ] Firebase 프로젝트 생성
- [ ] Authentication 활성화
- [ ] Firestore Database 생성
- [ ] Storage 활성화
- [ ] 보안 규칙 설정
- [ ] `.env` 파일 생성 및 설정
- [ ] Git 저장소 생성 및 푸시
- [ ] Vercel 프로젝트 생성
- [ ] Vercel 환경 변수 설정
- [ ] 배포 완료 및 테스트

---

## 🆘 문제 해결

### Firebase 연결 오류
- `.env` 파일의 API 키가 정확한지 확인
- Firebase Console에서 도메인이 승인되었는지 확인

### Vercel 빌드 실패
- `package.json`의 모든 의존성이 설치되었는지 확인
- 로컬에서 `npm run build`가 성공하는지 테스트

### 배포 후 404 에러
- `vercel.json`의 라우팅 설정 확인
- SPA 리다이렉트 설정 확인
