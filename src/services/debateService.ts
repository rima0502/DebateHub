import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import type {
  Debate,
  DebateMessage,
  DebateParticipant,
  CreateDebateInput,
  CreateMessageInput,
  DebateCategory,
  DebateSide
} from '../types/debate';
import { createReplyNotification, createLikeNotification } from './notificationService';

// Firestore 컬렉션 이름
const DEBATES_COLLECTION = 'debates';
const MESSAGES_COLLECTION = 'messages';
const PARTICIPANTS_COLLECTION = 'participants';

// ==================== 토론방 관련 ====================

/**
 * 새로운 토론방 생성
 */
export async function createDebate(input: CreateDebateInput): Promise<{ success: boolean; debateId?: string; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 입력 검증
    const title = input.title?.trim();
    const description = input.description?.trim();

    if (!title || title.length === 0) {
      return { success: false, error: '제목을 입력해주세요.' };
    }
    if (title.length > 200) {
      return { success: false, error: '제목은 200자를 초과할 수 없습니다.' };
    }
    if (!description || description.length === 0) {
      return { success: false, error: '설명을 입력해주세요.' };
    }
    if (description.length > 2000) {
      return { success: false, error: '설명은 2000자를 초과할 수 없습니다.' };
    }

    const debateData = {
      title,
      description,
      category: input.category,
      creatorId: user.uid,
      creatorName: user.displayName || '익명',
      status: 'active',
      participantCount: 0,
      messageCount: 0,
      imageUrl: input.imageUrl || `https://picsum.photos/seed/${Date.now()}/600/400`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      pinnedBy: [],
      bannedUsers: []
    };

    const docRef = await addDoc(collection(db, DEBATES_COLLECTION), debateData);

    // 생성자를 호스트로 자동 참여
    await joinDebate(docRef.id, 'HOST');

    return { success: true, debateId: docRef.id };
  } catch (error: any) {
    console.error('토론방 생성 오류:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 토론방 정보 가져오기
 */
export async function getDebate(debateId: string): Promise<Debate | null> {
  try {
    const docRef = doc(db, DEBATES_COLLECTION, debateId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Debate;
    }
    return null;
  } catch (error) {
    console.error('토론방 정보 가져오기 오류:', error);
    return null;
  }
}

/**
 * 토론방 목록 가져오기 (카테고리별 필터링 가능)
 */
export async function getDebates(category?: DebateCategory | '전체', limitCount: number = 20): Promise<Debate[]> {
  try {
    const constraints: QueryConstraint[] = [
      where('status', '==', 'active'),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    ];

    if (category && category !== '전체') {
      constraints.unshift(where('category', '==', category));
    }

    const q = query(collection(db, DEBATES_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Debate[];
  } catch (error) {
    console.error('토론방 목록 가져오기 오류:', error);
    return [];
  }
}

/**
 * 토론방 실시간 구독 (스로틀링 적용)
 */
let debatesThrottleTimer: NodeJS.Timeout | null = null;
const DEBATES_THROTTLE_MS = 1000; // 1초마다 최대 1회 업데이트

export function subscribeToDebates(
  callback: (debates: Debate[]) => void,
  category?: DebateCategory | '전체'
): () => void {
  const constraints: QueryConstraint[] = [
    where('status', '==', 'active'),
    orderBy('updatedAt', 'desc'),
    limit(10) // 20개에서 10개로 감소
  ];

  if (category && category !== '전체') {
    constraints.unshift(where('category', '==', category));
  }

  const q = query(collection(db, DEBATES_COLLECTION), ...constraints);

  return onSnapshot(q, (snapshot) => {
    // 스로틀링: 너무 빈번한 업데이트 방지
    if (debatesThrottleTimer) {
      clearTimeout(debatesThrottleTimer);
    }

    debatesThrottleTimer = setTimeout(() => {
      const debates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Debate[];
      callback(debates);
      debatesThrottleTimer = null;
    }, DEBATES_THROTTLE_MS);
  });
}

/**
 * 단일 토론방 실시간 구독
 */
export function subscribeToDebate(
  debateId: string,
  callback: (debate: Debate | null) => void
): () => void {
  const debateRef = doc(db, DEBATES_COLLECTION, debateId);

  return onSnapshot(debateRef, (snapshot) => {
    if (snapshot.exists()) {
      const debate = {
        id: snapshot.id,
        ...snapshot.data()
      } as Debate;
      callback(debate);
    } else {
      callback(null);
    }
  });
}

/**
 * 토론방 삭제 (생성자만 가능)
 */
export async function deleteDebate(debateId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const debate = await getDebate(debateId);
    if (!debate) {
      return { success: false, error: '토론방을 찾을 수 없습니다.' };
    }

    if (debate.creatorId !== user.uid) {
      return { success: false, error: '토론방 생성자만 삭제할 수 있습니다.' };
    }

    // 먼저 상태를 'deleted'로 변경하여 실시간 구독자들에게 알림
    await updateDoc(doc(db, DEBATES_COLLECTION, debateId), {
      status: 'deleted' as any
    });

    // 약간의 지연 후 실제 삭제 (구독자들이 알림을 받을 시간)
    setTimeout(async () => {
      // 관련 메시지 삭제
      const messagesQuery = query(
        collection(db, MESSAGES_COLLECTION),
        where('debateId', '==', debateId)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      const deleteMessagesPromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));

      // 관련 참여자 삭제
      const participantsQuery = query(
        collection(db, PARTICIPANTS_COLLECTION),
        where('debateId', '==', debateId)
      );
      const participantsSnapshot = await getDocs(participantsQuery);
      const deleteParticipantsPromises = participantsSnapshot.docs.map(doc => deleteDoc(doc.ref));

      // 모든 관련 데이터 삭제
      await Promise.all([...deleteMessagesPromises, ...deleteParticipantsPromises]);

      // 마지막으로 토론방 삭제
      await deleteDoc(doc(db, DEBATES_COLLECTION, debateId));
    }, 1000);

    return { success: true };
  } catch (error: any) {
    console.error('토론방 삭제 오류:', error);
    return { success: false, error: error.message };
  }
}

// ==================== 메시지 관련 ====================

// 메시지 전송 레이트 리밋 추적
const messageRateLimits = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000; // 1분
const MAX_MESSAGES_PER_WINDOW = 10; // 1분에 10개 메시지 제한

/**
 * 메시지 전송
 */
export async function sendMessage(input: CreateMessageInput): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 입력 검증
    const content = input.content?.trim();
    if (!content || content.length === 0) {
      return { success: false, error: '메시지 내용을 입력해주세요.' };
    }
    if (content.length > 5000) {
      return { success: false, error: '메시지는 5000자를 초과할 수 없습니다.' };
    }

    // 레이트 리밋 체크
    const now = Date.now();
    const userTimestamps = messageRateLimits.get(user.uid) || [];
    const recentTimestamps = userTimestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);

    if (recentTimestamps.length >= MAX_MESSAGES_PER_WINDOW) {
      return { success: false, error: '메시지를 너무 빠르게 전송하고 있습니다. 잠시 후 다시 시도해주세요.' };
    }

    recentTimestamps.push(now);
    messageRateLimits.set(user.uid, recentTimestamps);

    const messageData: any = {
      debateId: input.debateId,
      userId: user.uid,
      userName: user.displayName || '익명',
      userAvatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
      content,
      side: input.side,
      likes: 0,
      likedBy: [],
      createdAt: serverTimestamp()
    };

    // replyTo가 있을 때만 추가 (undefined 방지)
    if (input.replyTo) {
      messageData.replyTo = input.replyTo;
    }

    const messageRef = await addDoc(collection(db, MESSAGES_COLLECTION), messageData);

    // 토론방의 메시지 카운트 증가 및 업데이트 시간 갱신
    await updateDoc(doc(db, DEBATES_COLLECTION, input.debateId), {
      messageCount: increment(1),
      updatedAt: serverTimestamp()
    });

    // 답글인 경우 알림 생성
    if (input.replyTo) {
      // 원본 메시지 ID로 직접 가져오기
      const originalMessageRef = doc(db, MESSAGES_COLLECTION, input.replyTo);
      const originalMessageSnap = await getDoc(originalMessageRef);

      if (originalMessageSnap.exists()) {
        const originalMessage = originalMessageSnap.data() as DebateMessage;
        const targetUserId = originalMessage.userId;

        // 토론방 정보 가져오기
        const debate = await getDebate(input.debateId);

        if (debate && targetUserId !== user.uid) {
          await createReplyNotification(
            targetUserId,
            user.uid,
            user.displayName || '익명',
            user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
            input.debateId,
            debate.title,
            messageRef.id,
            input.content,
            debate.category
          );
        }
      }
    }

    return { success: true, messageId: messageRef.id };
  } catch (error: any) {
    console.error('메시지 전송 오류:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 토론방의 메시지 목록 가져오기
 */
export async function getMessages(debateId: string, limitCount: number = 100): Promise<DebateMessage[]> {
  try {
    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where('debateId', '==', debateId),
      orderBy('createdAt', 'asc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DebateMessage[];
  } catch (error) {
    console.error('메시지 목록 가져오기 오류:', error);
    return [];
  }
}

/**
 * 메시지 실시간 구독 (스로틀링 적용)
 */
let messagesThrottleTimer: NodeJS.Timeout | null = null;
const MESSAGES_THROTTLE_MS = 500; // 0.5초마다 최대 1회 업데이트

export function subscribeToMessages(
  debateId: string,
  callback: (messages: DebateMessage[]) => void
): () => void {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('debateId', '==', debateId),
    orderBy('createdAt', 'asc'),
    limit(100) // 최대 100개 메시지만 로드
  );

  return onSnapshot(q, (snapshot) => {
    // 스로틀링: 빠른 연속 메시지 전송 시 렌더링 부담 감소
    if (messagesThrottleTimer) {
      clearTimeout(messagesThrottleTimer);
    }

    messagesThrottleTimer = setTimeout(() => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DebateMessage[];
      callback(messages);
      messagesThrottleTimer = null;
    }, MESSAGES_THROTTLE_MS);
  });
}

/**
 * 메시지 좋아요 토글
 */
export async function toggleMessageLike(messageId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
    const messageSnap = await getDoc(messageRef);

    if (!messageSnap.exists()) {
      return { success: false, error: '메시지를 찾을 수 없습니다.' };
    }

    const messageData = messageSnap.data() as DebateMessage;
    const likedBy = messageData.likedBy || [];
    const isLiked = likedBy.includes(user.uid);

    if (isLiked) {
      // 좋아요 취소
      await updateDoc(messageRef, {
        likes: increment(-1),
        likedBy: arrayRemove(user.uid)
      });
    } else {
      // 좋아요 추가
      await updateDoc(messageRef, {
        likes: increment(1),
        likedBy: arrayUnion(user.uid)
      });

      // 좋아요 알림 생성 (자기 자신이 아닐 경우에만)
      if (messageData.userId !== user.uid) {
        const debate = await getDebate(messageData.debateId);
        if (debate) {
          await createLikeNotification(
            messageData.userId,
            user.uid,
            user.displayName || '익명',
            user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
            messageData.debateId,
            debate.title,
            messageId,
            messageData.content,
            debate.category
          );
        }
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('좋아요 토글 오류:', error);
    return { success: false, error: error.message };
  }
}

// ==================== 참여자 관련 ====================

/**
 * 토론방 참여
 */
export async function joinDebate(debateId: string, side: DebateSide): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 토론방 정보 가져오기
    const debate = await getDebate(debateId);
    if (!debate) {
      return { success: false, error: '토론방을 찾을 수 없습니다.' };
    }

    // 강제퇴장 당한 사용자인지 확인
    if (debate.bannedUsers && debate.bannedUsers.some(banned => banned.userId === user.uid)) {
      return { success: false, error: '강제퇴장되었습니다. 방장에게 문의하세요.' };
    }

    // 이미 참여 중인지 확인
    const q = query(
      collection(db, PARTICIPANTS_COLLECTION),
      where('debateId', '==', debateId),
      where('userId', '==', user.uid)
    );
    const existingParticipant = await getDocs(q);

    if (!existingParticipant.empty) {
      return { success: false, error: '이미 참여 중인 토론방입니다.' };
    }

    const participantData = {
      debateId,
      userId: user.uid,
      userName: user.displayName || '익명',
      userAvatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
      side,
      status: '활동 중',
      warnings: 0,
      joinedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp()
    };

    await addDoc(collection(db, PARTICIPANTS_COLLECTION), participantData);

    // 토론방의 참여자 카운트 증가
    await updateDoc(doc(db, DEBATES_COLLECTION, debateId), {
      participantCount: increment(1)
    });

    return { success: true };
  } catch (error: any) {
    console.error('토론방 참여 오류:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 토론방의 참여자 목록 가져오기
 */
export async function getParticipants(debateId: string): Promise<DebateParticipant[]> {
  try {
    const q = query(
      collection(db, PARTICIPANTS_COLLECTION),
      where('debateId', '==', debateId),
      orderBy('joinedAt', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DebateParticipant[];
  } catch (error) {
    console.error('참여자 목록 가져오기 오류:', error);
    return [];
  }
}

/**
 * 참여자 실시간 구독 (스로틀링 적용)
 */
let participantsThrottleTimer: NodeJS.Timeout | null = null;
const PARTICIPANTS_THROTTLE_MS = 2000; // 2초마다 최대 1회 업데이트

export function subscribeToParticipants(
  debateId: string,
  callback: (participants: DebateParticipant[]) => void
): () => void {
  const q = query(
    collection(db, PARTICIPANTS_COLLECTION),
    where('debateId', '==', debateId),
    orderBy('joinedAt', 'asc'),
    limit(50) // 최대 50명 참여자만 표시
  );

  return onSnapshot(q, (snapshot) => {
    // 스로틀링: 참여자 변경은 자주 일어나지 않으므로 2초 간격
    if (participantsThrottleTimer) {
      clearTimeout(participantsThrottleTimer);
    }

    participantsThrottleTimer = setTimeout(() => {
      const participants = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DebateParticipant[];
      callback(participants);
      participantsThrottleTimer = null;
    }, PARTICIPANTS_THROTTLE_MS);
  });
}

/**
 * 참여자 활동 상태 업데이트 (heartbeat)
 */
export async function updateParticipantActivity(debateId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const q = query(
      collection(db, PARTICIPANTS_COLLECTION),
      where('debateId', '==', debateId),
      where('userId', '==', user.uid)
    );
    const participantSnapshot = await getDocs(q);

    if (participantSnapshot.empty) {
      return { success: false, error: '참여 중이지 않은 토론방입니다.' };
    }

    // 마지막 활동 시간 업데이트
    await updateDoc(participantSnapshot.docs[0].ref, {
      lastActiveAt: serverTimestamp()
    });

    return { success: true };
  } catch (error: any) {
    console.error('활동 상태 업데이트 오류:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 토론방 나가기
 */
export async function leaveDebate(debateId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const q = query(
      collection(db, PARTICIPANTS_COLLECTION),
      where('debateId', '==', debateId),
      where('userId', '==', user.uid)
    );
    const participantSnapshot = await getDocs(q);

    if (participantSnapshot.empty) {
      return { success: false, error: '참여 중이지 않은 토론방입니다.' };
    }

    // 참여자 문서 삭제
    await deleteDoc(participantSnapshot.docs[0].ref);

    // 토론방의 참여자 카운트 감소
    await updateDoc(doc(db, DEBATES_COLLECTION, debateId), {
      participantCount: increment(-1)
    });

    return { success: true };
  } catch (error: any) {
    console.error('토론방 나가기 오류:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 참여자 강제퇴장 (방장만 가능)
 */
export async function kickParticipant(debateId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 방장 권한 확인
    const debate = await getDebate(debateId);
    if (!debate) {
      return { success: false, error: '토론방을 찾을 수 없습니다.' };
    }

    if (debate.creatorId !== user.uid) {
      return { success: false, error: '방장만 강제퇴장시킬 수 있습니다.' };
    }

    // 자기 자신은 강제퇴장시킬 수 없음
    if (userId === user.uid) {
      return { success: false, error: '자기 자신을 강제퇴장시킬 수 없습니다.' };
    }

    // 참여자 정보 가져오기
    const q = query(
      collection(db, PARTICIPANTS_COLLECTION),
      where('debateId', '==', debateId),
      where('userId', '==', userId)
    );
    const participantSnapshot = await getDocs(q);

    let userName = '익명';
    if (!participantSnapshot.empty) {
      const participantData = participantSnapshot.docs[0].data();
      userName = participantData.userName || '익명';

      // 참여자 제거
      await deleteDoc(participantSnapshot.docs[0].ref);

      // 토론방의 참여자 카운트 감소
      await updateDoc(doc(db, DEBATES_COLLECTION, debateId), {
        participantCount: increment(-1)
      });
    }

    // 강제퇴장 목록에 추가 (userId와 userName 함께 저장)
    await updateDoc(doc(db, DEBATES_COLLECTION, debateId), {
      bannedUsers: arrayUnion({
        userId,
        userName,
        bannedAt: serverTimestamp()
      })
    });

    return { success: true };
  } catch (error: any) {
    console.error('강제퇴장 오류:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 강제퇴장 해제 (방장만 가능)
 */
export async function unbanParticipant(debateId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 방장 권한 확인
    const debate = await getDebate(debateId);
    if (!debate) {
      return { success: false, error: '토론방을 찾을 수 없습니다.' };
    }

    if (debate.creatorId !== user.uid) {
      return { success: false, error: '방장만 강제퇴장을 해제할 수 있습니다.' };
    }

    // 강제퇴장 목록에서 제거
    // bannedUsers가 객체 배열이므로 해당 userId를 가진 객체를 찾아서 제거
    if (debate.bannedUsers) {
      const bannedUser = debate.bannedUsers.find(banned => banned.userId === userId);
      if (bannedUser) {
        await updateDoc(doc(db, DEBATES_COLLECTION, debateId), {
          bannedUsers: arrayRemove(bannedUser)
        });
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('강제퇴장 해제 오류:', error);
    return { success: false, error: error.message };
  }
}
