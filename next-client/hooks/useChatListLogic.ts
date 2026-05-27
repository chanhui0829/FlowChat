'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/lib/store';

export const useChatListLogic = (setSidebarOpen: (v: boolean) => void) => {
  const router = useRouter();
  const { chats, currentChatId, createChat, setCurrentChat, updateChatTitle } = useChatStore();
  const isAwaitingResponse = useChatStore((state) => state.isAwaitingResponse);

  // isStreaming만 구독 — isSending은 메시지 저장 중에도 true가 되어 범위가 너무 넓음
  // 채팅방 전환/생성은 "AI가 응답 중일 때"만 막는 게 UX상 적절

  const [search, setSearch] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const menuRef = useRef<HTMLDivElement | null>(null);
  const editRef = useRef<HTMLDivElement | null>(null);

  const filteredChats = useMemo(() => {
    const keyword = search.toLowerCase();
    return chats.filter((chat) => chat.title.toLowerCase().includes(keyword));
  }, [chats, search]);

  const handleChatSelect = useCallback(
    (id: string) => {
      // 스트리밍 중 채팅방 전환 차단
      // 이유: 응답이 완료되기 전에 채팅방을 바꾸면 finalContent가 엉뚱한 곳에 저장될 수 있음
      if (isAwaitingResponse) return;

      setCurrentChat(id);
      router.push(`/chat/${id}`);
      setSidebarOpen(false);
    },
    [router, setCurrentChat, setSidebarOpen, isAwaitingResponse]
  );

  const handleCreateChat = useCallback(async () => {
    // 스트리밍 중 새 채팅 생성 차단 (같은 이유)
    if (isAwaitingResponse) return;

    const newId = await createChat();
    if (newId) {
      router.push(`/chat/${newId}`);
      setSidebarOpen(false);
    }
  }, [createChat, router, setSidebarOpen, isAwaitingResponse]);

  const handleSaveEdit = useCallback(async () => {
    // 제목 편집은 스트리밍 중에도 허용 — 현재 응답과 무관한 작업
    if (!editingId || !editValue.trim()) {
      setEditingId(null);
      return;
    }
    try {
      await updateChatTitle(editingId, editValue.trim());
    } finally {
      setEditingId(null);
      setEditValue('');
    }
  }, [editingId, editValue, updateChatTitle]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) setMenuOpenId(null);
      if (editRef.current && !editRef.current.contains(target)) {
        if (editingId) handleSaveEdit();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingId, handleSaveEdit]);

  return {
    state: {
      search,
      menuOpenId,
      editingId,
      editValue,
      filteredChats,
      currentChatId,
      isAwaitingResponse,
    },
    actions: {
      setSearch,
      setMenuOpenId,
      setEditingId,
      setEditValue,
      handleSaveEdit,
      handleCreateChat,
      handleChatSelect,
    },
    refs: { menuRef, editRef },
  };
};
