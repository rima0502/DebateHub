// 레거시 타입 정의 (기존 코드 호환성을 위해 유지)
export enum Category {
  POLITICS = '정치/사회',
  SCIENCE = '과학/기술',
  HUMANITIES = '인문/철학',
  ECONOMY = '경제',
  FREE = '자유 주제'
}

export interface Debate {
  id: string;
  title: string;
  category: Category | string;
  creator: string;
  openingStatement: string;
  participantCount: number;
  messageCount: number;
  thumbnail?: string;
  status: 'HOT' | 'LIVE' | 'ENDING';
  startTime: string;
  isGuestAllowed: boolean;
}

export interface ChatMessage {
  id: string;
  user: string;
  avatar: string;
  content: string;
  timestamp: string;
  side: 'PRO' | 'CON' | 'HOST';
  likes: number;
  replyTo?: string;
}

export interface Participant {
  id: string;
  name: string;
  side: 'PRO' | 'CON' | 'HOST';
  avatar: string;
  status: string;
  warnings: number;
}

// 새로운 타입 정의는 src/types/debate.ts 참조
export * from './src/types/debate';
