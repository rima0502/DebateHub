import { useState, useEffect } from 'react';
import {
  getDebates,
  subscribeToDebates,
  createDebate,
  deleteDebate
} from '../services/debateService';
import type { Debate, CreateDebateInput, DebateCategory } from '../types/debate';

export function useDebates(category?: DebateCategory) {
  const [debates, setDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

    // 실시간 구독 설정
    const unsubscribe = subscribeToDebates((updatedDebates) => {
      setDebates(updatedDebates);
      setLoading(false);
    }, category);

    // 컴포넌트 언마운트 시 구독 해제
    return () => unsubscribe();
  }, [category]);

  const createNew = async (input: CreateDebateInput) => {
    const result = await createDebate(input);
    if (!result.success) {
      setError(result.error || '토론방 생성에 실패했습니다.');
    }
    return result;
  };

  const remove = async (debateId: string) => {
    const result = await deleteDebate(debateId);
    if (!result.success) {
      setError(result.error || '토론방 삭제에 실패했습니다.');
    }
    return result;
  };

  return {
    debates,
    loading,
    error,
    createDebate: createNew,
    deleteDebate: remove
  };
}
