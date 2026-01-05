import { Timestamp } from 'firebase/firestore';

// 토론 카테고리
export type DebateCategory = '정치/사회' | '경제' | '기술' | '윤리' | '환경' | '교육';

// 토론 입장 (찬성/반대/중립/호스트)
export type DebateSide = 'PRO' | 'CON' | 'NEUTRAL' | 'HOST';

// 토론 상태
export type DebateStatus = 'active' | 'closed' | 'pending';

// 참여자 상태
export type ParticipantStatus = '활동 중' | '대기 중' | '오프라인';

// 강제퇴장된 사용자 정보
export interface BannedUser {
  userId: string;
  userName: string;
  bannedAt: Timestamp;
}

// 토론방 인터페이스
export interface Debate {
  id: string;
  title: string;
  description: string;
  category: DebateCategory;
  creatorId: string;
  creatorName: string;
  status: DebateStatus;
  participantCount: number;
  messageCount: number;
  imageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  pinnedBy?: string[]; // 핀한 사용자 ID 목록
  bannedUsers?: (string | BannedUser)[]; // 강제퇴장된 사용자 목록 (하위 호환성: string 또는 BannedUser 객체)
}

// 토론 메시지 인터페이스
export interface DebateMessage {
  id: string;
  debateId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  side: DebateSide;
  likes: number;
  likedBy: string[]; // 좋아요 누른 사용자 ID 목록
  replyTo?: string; // 답장 대상 메시지 ID
  createdAt: Timestamp;
}

// 토론 참여자 인터페이스
export interface DebateParticipant {
  id: string;
  debateId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  side: DebateSide;
  status: ParticipantStatus;
  warnings: number;
  joinedAt: Timestamp;
  lastActiveAt: Timestamp;
}

// Firestore 생성/업데이트용 타입 (Timestamp 대신 Date 사용)
export interface CreateDebateInput {
  title: string;
  description: string;
  category: DebateCategory;
  imageUrl?: string;
}

export interface CreateMessageInput {
  debateId: string;
  content: string;
  side: DebateSide;
  replyTo?: string;
}
