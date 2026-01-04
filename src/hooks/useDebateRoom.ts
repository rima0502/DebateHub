import { useState, useEffect } from 'react';
import {
  getDebate,
  getMessages,
  subscribeToMessages,
  sendMessage,
  toggleMessageLike,
  getParticipants,
  subscribeToParticipants,
  joinDebate,
  leaveDebate
} from '../services/debateService';
import type {
  Debate,
  DebateMessage,
  DebateParticipant,
  CreateMessageInput,
  DebateSide
} from '../types/debate';

export function useDebateRoom(debateId: string) {
  const [debate, setDebate] = useState<Debate | null>(null);
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [participants, setParticipants] = useState<DebateParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 토론방 정보 로드
  useEffect(() => {
    const loadDebate = async () => {
      const debateData = await getDebate(debateId);
      if (debateData) {
        setDebate(debateData);
      } else {
        setError('토론방을 찾을 수 없습니다.');
      }
      setLoading(false);
    };

    loadDebate();
  }, [debateId]);

  // 메시지 실시간 구독
  useEffect(() => {
    const unsubscribe = subscribeToMessages(debateId, (updatedMessages) => {
      setMessages(updatedMessages);
    });

    return () => unsubscribe();
  }, [debateId]);

  // 참여자 실시간 구독
  useEffect(() => {
    const unsubscribe = subscribeToParticipants(debateId, (updatedParticipants) => {
      setParticipants(updatedParticipants);
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
