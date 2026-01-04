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

    const debateData = {
      title: input.title,
      description: input.description,
      category: input.category,
      creatorId: user.uid,
      creatorName: user.displayName || '익명',
      status: 'active',
      participantCount: 0,
      messageCount: 0,
      imageUrl: input.imageUrl || `https://picsum.photos/seed/${Date.now()}/600/400`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      pinnedBy: []
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
export async function getDebates(category?: DebateCategory, limitCount: number = 20): Promise<Debate[]> {
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
 * 토론방 실시간 구독
 */
export function subscribeToDebates(
  callback: (debates: Debate[]) => void,
  category?: DebateCategory
): () => void {
  const constraints: QueryConstraint[] = [
    where('status', '==', 'active'),
    orderBy('updatedAt', 'desc'),
    limit(20)
  ];

  if (category && category !== '전체') {
    constraints.unshift(where('category', '==', category));
  }

  const q = query(collection(db, DEBATES_COLLECTION), ...constraints);

  return onSnapshot(q, (snapshot) => {
    const debates = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Debate[];
    callback(debates);
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

    await deleteDoc(doc(db, DEBATES_COLLECTION, debateId));
    return { success: true };
  } catch (error: any) {
    console.error('토론방 삭제 오류:', error);
    return { success: false, error: error.message };
  }
}

// ==================== 메시지 관련 ====================

/**
 * 메시지 전송
 */
export async function sendMessage(input: CreateMessageInput): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const messageData: any = {
      debateId: input.debateId,
      userId: user.uid,
      userName: user.displayName || '익명',
      userAvatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
      content: input.content,
      side: input.side,
      likes: 0,
      likedBy: [],
      createdAt: serverTimestamp()
    };

    // replyTo가 있을 때만 추가 (undefined 방지)
    if (input.replyTo) {
      messageData.replyTo = input.replyTo;
    }

    await addDoc(collection(db, MESSAGES_COLLECTION), messageData);

    // 토론방의 메시지 카운트 증가 및 업데이트 시간 갱신
    await updateDoc(doc(db, DEBATES_COLLECTION, input.debateId), {
      messageCount: increment(1),
      updatedAt: serverTimestamp()
    });

    return { success: true };
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
 * 메시지 실시간 구독
 */
export function subscribeToMessages(
  debateId: string,
  callback: (messages: DebateMessage[]) => void
): () => void {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('debateId', '==', debateId),
    orderBy('createdAt', 'asc'),
    limit(100)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DebateMessage[];
    callback(messages);
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

    const likedBy = messageSnap.data().likedBy || [];
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
 * 참여자 실시간 구독
 */
export function subscribeToParticipants(
  debateId: string,
  callback: (participants: DebateParticipant[]) => void
): () => void {
  const q = query(
    collection(db, PARTICIPANTS_COLLECTION),
    where('debateId', '==', debateId),
    orderBy('joinedAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const participants = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DebateParticipant[];
    callback(participants);
  });
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
