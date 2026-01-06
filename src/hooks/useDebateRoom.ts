import { useState, useEffect } from 'react';
import {
  subscribeToDebate,
  subscribeToMessages,
  sendMessage,
  toggleMessageLike,
  subscribeToParticipants,
  joinDebate,
  leaveDebate
} from '../services/debateService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type {
  Debate,
  DebateMessage,
  DebateParticipant,
  CreateMessageInput,
  DebateSide
} from '../types/debate';

export interface EnrichedMessage extends DebateMessage {
  displayName: string;
  photoURL: string;
}

export interface EnrichedParticipant extends DebateParticipant {
  displayName: string;
  photoURL: string;
}

export function useDebateRoom(debateId: string) {
  const [debate, setDebate] = useState<Debate | null>(null);
  const [messages, setMessages] = useState<EnrichedMessage[]>([]);
  const [participants, setParticipants] = useState<EnrichedParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 토론방 실시간 구독
  useEffect(() => {
    const unsubscribe = subscribeToDebate(debateId, (debateData) => {
      if (debateData) {
        setDebate(debateData);
      } else {
        setError('토론방을 찾을 수 없습니다.');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [debateId]);

  // 메시지 실시간 구독 + 사용자 프로필 불러오기
  useEffect(() => {
    const unsubscribe = subscribeToMessages(debateId, async (updatedMessages) => {
      // 모든 고유 userId 추출
      const userIds = [...new Set(updatedMessages.map(m => m.userId))];

      // 모든 사용자 프로필을 매번 새로 가져오기 (캐시 없음 - 최신 정보 보장)
      const profiles: Record<string, { displayName: string; photoURL: string }> = {};
      await Promise.all(
        userIds.map(async (uid) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              profiles[uid] = {
                displayName: userData.displayName || '익명',
                photoURL: userData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`
              };
            } else {
              profiles[uid] = {
                displayName: '익명',
                photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`
              };
            }
          } catch (error) {
            console.error(`사용자 ${uid} 프로필 로드 실패:`, error);
            profiles[uid] = {
              displayName: '익명',
              photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`
            };
          }
        })
      );

      // 메시지에 프로필 정보 추가
      const enriched = updatedMessages.map(msg => ({
        ...msg,
        displayName: profiles[msg.userId]?.displayName || '익명',
        photoURL: profiles[msg.userId]?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.userId}`
      }));
      setMessages(enriched);
    });

    return () => unsubscribe();
  }, [debateId]);

  // 참여자 실시간 구독 + 사용자 프로필 불러오기
  useEffect(() => {
    const unsubscribe = subscribeToParticipants(debateId, async (updatedParticipants) => {
      // 모든 고유 userId 추출
      const userIds = [...new Set(updatedParticipants.map(p => p.userId))];

      // 모든 사용자 프로필을 매번 새로 가져오기 (캐시 없음 - 최신 정보 보장)
      const profiles: Record<string, { displayName: string; photoURL: string }> = {};
      await Promise.all(
        userIds.map(async (uid) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              profiles[uid] = {
                displayName: userData.displayName || '익명',
                photoURL: userData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`
              };
            } else {
              profiles[uid] = {
                displayName: '익명',
                photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`
              };
            }
          } catch (error) {
            console.error(`사용자 ${uid} 프로필 로드 실패:`, error);
            profiles[uid] = {
              displayName: '익명',
              photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`
            };
          }
        })
      );

      // 참여자에 프로필 정보 추가
      const enriched = updatedParticipants.map(p => ({
        ...p,
        displayName: profiles[p.userId]?.displayName || '익명',
        photoURL: profiles[p.userId]?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.userId}`
      }));
      setParticipants(enriched);
    });

    return () => unsubscribe();
  }, [debateId]);

  const send = async (input: CreateMessageInput) => {
    const result = await sendMessage(input);
    if (!result.success) {
      setError(result.error || '메시지 전송에 실패했습니다.');
    }
    return result;
  };

  const toggleLike = async (messageId: string) => {
    const result = await toggleMessageLike(messageId);
    if (!result.success) {
      setError(result.error || '좋아요 처리에 실패했습니다.');
    }
    return result;
  };

  const join = async (side: DebateSide) => {
    const result = await joinDebate(debateId, side);
    if (!result.success) {
      setError(result.error || '토론방 참여에 실패했습니다.');
    }
    return result;
  };

  const leave = async () => {
    const result = await leaveDebate(debateId);
    if (!result.success) {
      setError(result.error || '토론방 나가기에 실패했습니다.');
    }
    return result;
  };

  return {
    debate,
    messages,
    participants,
    loading,
    error,
    sendMessage: send,
    toggleMessageLike: toggleLike,
    joinDebate: join,
    leaveDebate: leave
  };
}
