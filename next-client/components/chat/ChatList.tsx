'use client';

import { memo } from 'react';
import {
  FiPlus,
  FiMoreVertical,
  FiTrash2,
  FiEdit2,
  FiSearch,
  FiMessageSquare,
  FiBookOpen,
  FiAlertCircle,
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';

import { useChatListLogic } from '@/hooks/useChatListLogic';
import { useChatStore } from '@/lib/store';
import type { Chat } from '@/lib/types/chat';

interface ChatListProps {
  setDeleteTargetId: (id: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}
/**
 * @description 채팅 히스토리 및 내비게이션을 담당하는 사이드바 컴포넌트
 *  */
export default function ChatList({
  setDeleteTargetId,
  sidebarOpen,
  setSidebarOpen,
}: ChatListProps) {
  const router = useRouter();
  const { state, actions, refs } = useChatListLogic(setSidebarOpen);
  const { isLoadingChats, error } = useChatStore();
  const isStreaming = useChatStore((state) => state.isStreaming);
  const isCreatingChat = useChatStore((state) => state.isCreatingChat);
  const isSavingMessage = useChatStore((state) => state.isSavingMessage);
  const isAwaitingResponse = useChatStore((state) => state.isAwaitingResponse);

  // 채팅 전환 비활성화 조건
  const isDisabled = isAwaitingResponse || isCreatingChat || isSavingMessage;

  // isStreaming이 true일 때 New Conversation과 채팅 선택을 비활성화

  return (
    <aside
      className={`
      fixed inset-y-0 left-0 z-40 w-80 bg-zinc-50/80 backdrop-blur-2xl border-r border-zinc-200/50 
      transform transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:relative md:translate-x-0
      ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
    `}
    >
      <div className="flex flex-col h-full px-5 py-6">
        {/* New Conversation 버튼: 스트리밍 중 비활성화 */}
        <div className="mb-8">
          <button
            onClick={actions.handleCreateChat}
            disabled={isDisabled}
            className={`
              group w-full py-3.5 flex items-center justify-center gap-2.5 rounded-2xl font-semibold shadow-lg transition-all active:scale-[0.96]
              ${
                isStreaming
                  ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed shadow-none'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-50'
              }
            `}
          >
            <FiPlus size={16} />
            <span>New Conversation</span>
          </button>
        </div>

        {/* 검색 */}
        <div className="relative mb-6">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input
            type="text"
            placeholder="기록 검색..."
            value={state.search}
            onChange={(e) => actions.setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200/50 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all"
          />
        </div>

        {/* 에러 배너 */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-xs font-medium">
            <FiAlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 스트리밍 중 안내 배너 */}
        {isDisabled && (
          <div className="mb-4 flex items-center gap-2.5 px-4 py-3 bg-zinc-100 border border-zinc-200 rounded-2xl text-zinc-500 text-xs font-medium">
            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse shrink-0" />
            AI 응답 중에는 채팅을 전환할 수 없어요
          </div>
        )}

        {/* 채팅 목록 */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 sidebar-scroll">
          {isLoadingChats ? (
            <div className="space-y-2 pt-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded-2xl bg-zinc-100 animate-pulse"
                  style={{ opacity: 1 - i * 0.15 }}
                />
              ))}
            </div>
          ) : (
            state.filteredChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isSelected={chat.id === state.currentChatId}
                isEditing={state.editingId === chat.id}
                menuOpenId={state.menuOpenId}
                setMenuOpenId={actions.setMenuOpenId}
                setEditingId={actions.setEditingId}
                setEditValue={actions.setEditValue}
                editValue={state.editValue}
                handleSaveEdit={actions.handleSaveEdit}
                setDeleteTargetId={setDeleteTargetId}
                onSelect={() => actions.handleChatSelect(chat.id)}
                isSelectDisabled={isDisabled}
                menuRef={refs.menuRef}
                editRef={refs.editRef}
              />
            ))
          )}
        </div>

        {/* 하단 케이스 스터디 버튼 */}
        <div className="mt-auto pt-6 border-t border-zinc-200/50">
          <button
            onClick={() => {
              router.push('/casestudy');
              setSidebarOpen(false);
            }}
            className="flex items-center gap-3.5 w-full px-4 py-4 rounded-2xl text-zinc-500 hover:bg-zinc-900 hover:text-white hover:shadow-md transition-all duration-300 group"
          >
            <FiBookOpen size={18} className="group-hover:rotate-12 transition-transform" />
            <span className="text-[14px] font-bold tracking-tight">Technical Case Study</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── ChatItem ────────────────────────────────────────────────────────────────

interface ChatItemProps {
  chat: Chat;
  isSelected: boolean;
  isEditing: boolean;
  menuOpenId: string | null;
  setMenuOpenId: (id: string | null) => void;
  setEditingId: (id: string | null) => void;
  setEditValue: (value: string) => void;
  editValue: string;
  handleSaveEdit: () => Promise<void>;
  setDeleteTargetId: (id: string) => void;
  onSelect: () => void;
  isSelectDisabled: boolean;
  menuRef: React.RefObject<HTMLDivElement | null>;
  editRef: React.RefObject<HTMLDivElement | null>;
}

const ChatItem = memo(function ChatItem({
  chat,
  isSelected,
  isEditing,
  menuOpenId,
  setMenuOpenId,
  setEditingId,
  setEditValue,
  editValue,
  handleSaveEdit,
  setDeleteTargetId,
  onSelect,
  isSelectDisabled,
  menuRef,
  editRef,
}: ChatItemProps) {
  return (
    <div
      className={`
        group relative flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all
        ${isSelectDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${
          isSelected
            ? 'bg-white shadow-sm ring-1 ring-zinc-200/50'
            : !isSelectDisabled
            ? 'hover:bg-zinc-200/40'
            : ''
        }
      `}
      onClick={() => !isSelectDisabled && onSelect()}
    >
      <FiMessageSquare className={isSelected ? 'text-zinc-900' : 'text-zinc-400'} size={18} />

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div ref={editRef} onClick={(e) => e.stopPropagation()}>
            <input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
              className="w-full bg-zinc-100 rounded-lg px-2 py-1 text-sm outline-none ring-2 ring-zinc-900/10"
              autoFocus
            />
          </div>
        ) : (
          <span
            className={`text-[13.5px] truncate block ${
              isSelected ? 'font-bold text-zinc-900' : 'text-zinc-500'
            }`}
          >
            {chat.title}
          </span>
        )}
      </div>

      {/* 편집/삭제 메뉴: isSelectDisabled(스트리밍 중)에도 허용 */}
      {!isEditing && (
        <div
          className="relative shrink-0"
          ref={menuOpenId === chat.id ? menuRef : null}
          onClick={(e) => e.stopPropagation()} // 메뉴 클릭이 채팅 선택으로 버블링 방지
        >
          <button
            onClick={() => setMenuOpenId(menuOpenId === chat.id ? null : chat.id)}
            className={`p-1.5 rounded-xl hover:bg-zinc-100 transition-all ${
              isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <FiMoreVertical size={14} className="text-zinc-400" />
          </button>

          {menuOpenId === chat.id && (
            <div className="absolute right-0 top-10 z-[100] w-32 bg-white border border-zinc-200 rounded-xl shadow-xl py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setEditingId(chat.id);
                  setEditValue(chat.title);
                  setMenuOpenId(null);
                }}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-[12px] text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                <FiEdit2 size={12} /> 수정
              </button>
              <button
                onClick={() => {
                  setDeleteTargetId(chat.id);
                  setMenuOpenId(null);
                }}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-[12px] text-red-500 hover:bg-red-50 transition-colors"
              >
                <FiTrash2 size={12} /> 삭제
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// eslint에서 memo 컴포넌트 displayName 경고 방지
ChatItem.displayName = 'ChatItem';
