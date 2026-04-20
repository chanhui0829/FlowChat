import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiMoreVertical, FiTrash2, FiEdit2, FiX } from 'react-icons/fi';
import { useChatStore } from '../../store/chat.store';

type Props = {
  setDeleteTargetId: (id: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
};

/**
 * @description 사이드바 내 채팅 세션 리스트를 관리하는 컴포넌트입니다.
 * 검색, 새 채팅 생성, 제목 수정 및 삭제 기능을 포함합니다.
 */
export default function ChatList({ setDeleteTargetId, sidebarOpen, setSidebarOpen }: Props) {
  const navigate = useNavigate();

  // 글로벌 스토어에서 상태 및 액션 추출
  const { chats, currentChatId, createChat, setCurrentChat, updateChatTitle } = useChatStore();

  /* 로컬 UI 상태 관리 */
  const [search, setSearch] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const menuRef = useRef<HTMLDivElement | null>(null);
  const editRef = useRef<HTMLDivElement | null>(null);

  // 검색어에 따른 필터링 리스트 (Case-insensitive)
  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(search.toLowerCase())
  );

  /**
   * 수정된 제목을 저장하고 편집 모드를 종료합니다.
   */
  const handleSaveEdit = useCallback(async () => {
    if (!editingId || !editValue.trim()) {
      setEditingId(null);
      return;
    }

    try {
      await updateChatTitle(editingId, editValue.trim());
    } catch (error) {
      console.error('제목 수정 중 오류 발생:', error);
    } finally {
      setEditingId(null);
      setEditValue('');
    }
  }, [editingId, editValue, updateChatTitle]);

  /* 외부 클릭 시 메뉴 및 편집창 닫기 로직 */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      // 옵션 드롭다운 외부 클릭 시 닫기
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpenId(null);
      }

      // 제목 수정창 외부 클릭 시 자동 저장 및 닫기
      if (editRef.current && !editRef.current.contains(target)) {
        if (editingId) handleSaveEdit();
      }
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingId(null);
        setEditValue('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeydown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [editingId, handleSaveEdit]);

  return (
    <div
      className={`
        fixed md:static z-40
        w-[280px] h-full bg-white border-r p-4 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}
    >
      {/* Mobile Close Button */}
      <div className="md:hidden flex justify-end mb-2">
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          ✕
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="검색어를 입력해주세요"
          className="w-full pl-3 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
        />
      </div>

      {/* New Chat Button */}
      <button
        onClick={async () => {
          const newId = await createChat();
          if (newId) {
            navigate(`/chat/${newId}`);
            setSidebarOpen(false);
          }
        }}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 pr-2 mb-6 rounded-lg shadow-sm transition-all active:scale-[0.98]"
      >
        <FiPlus size={18} />
        <span>새 채팅</span>
      </button>

      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
        Recent Chats
      </div>

      {/* Chat Session List */}
      <div className="flex-1 overflow-y-auto space-y-1 sidebar-scroll pr-1">
        {filteredChats.map((chat) => {
          const isSelected = chat.id === currentChatId;
          const isEditing = editingId === chat.id;

          return (
            <div
              key={chat.id}
              className={`
                relative group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all
                ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-600'}
              `}
            >
              <div
                className="flex-1 min-w-0 flex items-center"
                onClick={() => {
                  if (isEditing) return;
                  navigate(`/chat/${chat.id}`);
                  setCurrentChat(chat.id);
                  setSidebarOpen(false);
                }}
              >
                {isEditing ? (
                  <div ref={editRef} className="flex items-center gap-1 w-full mr-2">
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                      className="flex-1 w-0 min-w-0 px-2 py-0.5 text-sm border-2 border-blue-400 rounded outline-none bg-white"
                      autoFocus
                    />
                    <FiX
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(null);
                      }}
                    />
                  </div>
                ) : (
                  /* [UI Detail] Truncate 적용으로 긴 제목 처리 */
                  <span className="text-sm font-medium truncate pr-2">{chat.title}</span>
                )}
              </div>

              {/* Action Menu (Hover 시 노출) */}
              {!isEditing && (
                <div className="relative shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId((prev) => (prev === chat.id ? null : chat.id));
                    }}
                    className={`p-1 rounded hover:bg-gray-200 transition ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <FiMoreVertical size={14} />
                  </button>

                  {menuOpenId === chat.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 top-7 z-50 bg-white border border-gray-100 rounded-xl shadow-xl w-36 py-1 overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setEditingId(chat.id);
                          setEditValue(chat.title);
                          setMenuOpenId(null);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-gray-600 hover:bg-gray-50 transition"
                      >
                        <FiEdit2 size={12} /> 제목 변경
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTargetId(chat.id);
                          setMenuOpenId(null);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 transition"
                      >
                        <FiTrash2 size={12} /> 채팅 삭제
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Project/Case Study Section */}
      <div className="pt-2 mt-2 border-t border-gray-100">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
          Case Study
        </div>
        <button
          className="w-full flex items-center justify-between px-3 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-sm font-semibold text-gray-700 transition-all active:scale-[0.98]"
          onClick={() => {
            setCurrentChat(null);
            navigate('/case-study');
            setSidebarOpen(false);
          }}
        >
          <span>🚀 프로젝트 상세 보기</span>
          <span className="text-gray-300">→</span>
        </button>
      </div>
    </div>
  );
}
