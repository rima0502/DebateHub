# Firebase Firestore 설정 가이드

## 🔥 Firestore 데이터베이스 구조

### 컬렉션 구조

```
debates (토론방)
├── {debateId}
│   ├── id: string
│   ├── title: string
│   ├── description: string
│   ├── category: string ('정치/사회' | '경제' | '기술' | '윤리' | '환경' | '교육')
│   ├── creatorId: string
│   ├── creatorName: string
│   ├── status: string ('active' | 'closed' | 'pending')
│   ├── participantCount: number
│   ├── messageCount: number
│   ├── imageUrl: string (optional)
│   ├── createdAt: Timestamp
│   ├── updatedAt: Timestamp
│   └── pinnedBy: string[] (optional)

messages (토론 메시지)
├── {messageId}
│   ├── id: string
│   ├── debateId: string
│   ├── userId: string
│   ├── userName: string
│   ├── userAvatar: string
│   ├── content: string
│   ├── side: string ('PRO' | 'CON' | 'NEUTRAL' | 'HOST')
│   ├── likes: number
│   ├── likedBy: string[]
│   ├── replyTo: string (optional)
│   └── createdAt: Timestamp

participants (토론 참여자)
├── {participantId}
│   ├── id: string
│   ├── debateId: string
│   ├── userId: string
│   ├── userName: string
│   ├── userAvatar: string
│   ├── side: string ('PRO' | 'CON' | 'NEUTRAL' | 'HOST')
│   ├── status: string ('활동 중' | '대기 중' | '오프라인')
│   ├── warnings: number
│   ├── joinedAt: Timestamp
│   └── lastActiveAt: Timestamp
```

## 📋 Firestore 보안 규칙 설정

Firebase Console에서 다음 보안 규칙을 적용하세요:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 인증된 사용자만 읽기/쓰기 가능
    function isAuthenticated() {
      return request.auth != null;
    }

    // 토론방 규칙
    match /debates/{debateId} {
      // 모든 사용자가 읽을 수 있음
      allow read: if true;

      // 인증된 사용자만 생성 가능
      allow create: if isAuthenticated();

      // 생성자만 업데이트/삭제 가능
      allow update, delete: if isAuthenticated() &&
        resource.data.creatorId == request.auth.uid;
    }

    // 메시지 규칙
    match /messages/{messageId} {
      // 모든 사용자가 읽을 수 있음
      allow read: if true;

      // 인증된 사용자만 생성 가능
      allow create: if isAuthenticated();

      // 작성자만 업데이트/삭제 가능
      allow update, delete: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
    }

    // 참여자 규칙
    match /participants/{participantId} {
      // 모든 사용자가 읽을 수 있음
      allow read: if true;

      // 인증된 사용자만 생성 가능
      allow create: if isAuthenticated();

      // 본인 정보만 업데이트/삭제 가능
      allow update, delete: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## 🚀 사용 방법

### 1. 토론방 목록 가져오기 (Home.tsx)

```typescript
import { useDebates } from '../src/hooks/useDebates';

function Home() {
  const { debates, loading, error } = useDebates('전체');

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>오류: {error}</div>;

  return (
    <div>
      {debates.map(debate => (
        <div key={debate.id}>{debate.title}</div>
      ))}
    </div>
  );
}
```

### 2. 토론방 입장 및 메시지 전송 (DebateRoom.tsx)

```typescript
import { useDebateRoom } from '../src/hooks/useDebateRoom';

function DebateRoom({ debateId }: { debateId: string }) {
  const {
    debate,
    messages,
    participants,
    sendMessage,
    toggleMessageLike,
    joinDebate,
    leaveDebate
  } = useDebateRoom(debateId);

  const handleJoin = async () => {
    await joinDebate('PRO'); // 또는 'CON'
  };

  const handleSendMessage = async (content: string) => {
    await sendMessage({
      debateId,
      content,
      side: 'PRO'
    });
  };

  return (
    <div>
      <h1>{debate?.title}</h1>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  );
}
```

### 3. 새 토론방 생성

```typescript
import { createDebate } from '../src/services/debateService';

async function handleCreateDebate() {
  const result = await createDebate({
    title: '새로운 토론 주제',
    description: '토론 설명',
    category: '기술'
  });

  if (result.success) {
    console.log('토론방 ID:', result.debateId);
  }
}
```

## 📊 Firestore 인덱스 설정

Firebase Console > Firestore Database > 인덱스 탭에서 다음 복합 인덱스를 추가하세요:

1. **debates 컬렉션**
   - category (ASC) + updatedAt (DESC)
   - status (ASC) + updatedAt (DESC)

2. **messages 컬렉션**
   - debateId (ASC) + createdAt (ASC)

3. **participants 컬렉션**
   - debateId (ASC) + joinedAt (ASC)
   - debateId (ASC) + userId (ASC)

## ⚠️ 주의사항

1. **Firestore 무료 할당량**
   - 읽기: 50,000회/일
   - 쓰기: 20,000회/일
   - 삭제: 20,000회/일
   - 저장소: 1GB

2. **실시간 리스너 최적화**
   - 불필요한 실시간 구독은 피하세요
   - 컴포넌트 언마운트 시 반드시 구독을 해제하세요
   - 필요한 경우에만 limit을 적절히 사용하세요

3. **보안**
   - .env 파일은 절대 Git에 커밋하지 마세요
   - Firebase 보안 규칙을 반드시 설정하세요
   - API 키는 공개 저장소에 노출되어도 괜찮지만, 보안 규칙이 중요합니다
