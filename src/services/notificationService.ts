import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

const NOTIFICATIONS_COLLECTION = 'notifications';

export interface Notification {
  id: string;
  userId: string; // 알림을 받을 사용자 ID
  type: 'like' | 'reply'; // 알림 타입
  actorId: string; // 알림을 발생시킨 사용자 ID
  actorName: string;
  actorAvatar: string;
  debateId: string;
  debateTitle: string;
  messageId: string;
  messageContent: string;
  category: string;
  createdAt: Timestamp;
  read: boolean;
}

/**
 * 좋아요 알림 생성
 */
export async function createLikeNotification(
  targetUserId: string,
  actorId: string,
  actorName: string,
  actorAvatar: string,
  debateId: string,
  debateTitle: string,
  messageId: string,
  messageContent: string,
  category: string
): Promise<void> {
  try {
    // 자기 자신에게는 알림 보내지 않기
    if (targetUserId === actorId) return;

    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      userId: targetUserId,
      type: 'like',
      actorId,
      actorName,
      actorAvatar,
      debateId,
      debateTitle,
      messageId,
      messageContent: messageContent.substring(0, 50),
      category,
      createdAt: serverTimestamp(),
      read: false
    });
  } catch (error) {
    console.error('좋아요 알림 생성 오류:', error);
  }
}

/**
 * 답글 알림 생성
 */
export async function createReplyNotification(
  targetUserId: string,
  actorId: string,
  actorName: string,
  actorAvatar: string,
  debateId: string,
  debateTitle: string,
  messageId: string,
  replyContent: string,
  category: string
): Promise<void> {
  try {
    // 자기 자신에게는 알림 보내지 않기
    if (targetUserId === actorId) return;

    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      userId: targetUserId,
      type: 'reply',
      actorId,
      actorName,
      actorAvatar,
      debateId,
      debateTitle,
      messageId,
      messageContent: replyContent.substring(0, 50),
      category,
      createdAt: serverTimestamp(),
      read: false
    });
  } catch (error) {
    console.error('답글 알림 생성 오류:', error);
  }
}

/**
 * 사용자의 알림 목록 가져오기
 */
export async function getUserNotifications(
  userId: string,
  limitCount: number = 50
): Promise<Notification[]> {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Notification[];
  } catch (error) {
    console.error('알림 목록 가져오기 오류:', error);
    return [];
  }
}
