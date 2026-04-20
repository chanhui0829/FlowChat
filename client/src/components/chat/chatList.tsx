import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus,
  FiMoreVertical,
  FiTrash2,
  FiEdit2,
  FiSearch,
  FiMessageSquare,
} from 'react-icons/fi';

/* Stores */
import { useChatStore } from '../../store/chat.store';

type Props = {
  setDeleteTargetId: (id: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
};

/**
 * @description 사이드바 내 채팅 세션 리스트를 관리하는 컴포넌트입니다.
 * [Key Features]: 검색 필터링, 세션 생성/수정/삭제, 모바일 반응형 레이아웃
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

  /**
   * [성능 고려] 검색어에 따른 리스트 필터링
   */
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

  /* [UX 최적화] 외부 클릭 시 메뉴 및 편집창 자동 닫기/저장 로직 */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpenId(null);
      }

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
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-slate-50 border-r border-slate-200/60 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="flex flex-col h-full p-4">
        {/* Mobile Close Button */}

        {/* New Chat Button: 사진처럼 볼드하고 블루포인트 강조 */}
        <button
          onClick={async () => {
            const newId = await createChat();
            if (newId) {
              navigate(`/chat/${newId}`);
              setSidebarOpen(false);
            }
          }}
          className="flex items-center justify-center gap-2 w-full py-3 mb-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
        >
          <FiPlus strokeWidth={3} size={18} />
          <span>새 채팅</span>
        </button>

        {/* Search Bar: 미니멀한 디자인 */}
        <div className="relative mb-6">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="채팅 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-1">
          최근 채팅
        </div>

        {/* Chat Session List */}
        <div className="flex-1 overflow-y-auto space-y-1 p-1 sidebar-scroll">
          {filteredChats.map((chat) => {
            const isSelected = chat.id === currentChatId;
            const isEditing = editingId === chat.id;

            return (
              <div
                key={chat.id}
                className={`
                  group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all
                  ${
                    isSelected
                      ? 'bg-white shadow-sm ring-1 ring-slate-200'
                      : 'hover:bg-slate-200/50'
                  }
                `}
                onClick={() => {
                  if (isEditing) return;
                  navigate(`/chat/${chat.id}`);
                  setCurrentChat(chat.id);
                  setSidebarOpen(false);
                }}
              >
                {/* Active Indicator */}
                {isSelected && (
                  <div className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full" />
                )}

                <FiMessageSquare
                  className={isSelected ? 'text-blue-600' : 'text-slate-400'}
                  size={18}
                />

                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div ref={editRef} className="flex items-center gap-1 w-full">
                      <input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                        className="w-full px-2 py-0.5 text-sm border-none bg-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <span
                      className={`text-sm truncate block ${
                        isSelected ? 'font-bold text-slate-900' : 'text-slate-600'
                      }`}
                    >
                      {chat.title}
                    </span>
                  )}
                </div>

                {/* Action Menu */}
                {!isEditing && (
                  <div className="relative shrink-0" ref={menuOpenId === chat.id ? menuRef : null}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId((prev) => (prev === chat.id ? null : chat.id));
                      }}
                      className={`p-1 rounded-md hover:bg-slate-200 transition ${
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <FiMoreVertical size={14} className="text-slate-400" />
                    </button>

                    {menuOpenId === chat.id && (
                      <div className="absolute right-0 top-8 z-50 w-32 bg-white border border-slate-100 rounded-xl shadow-xl py-2 animate-in fade-in zoom-in-95">
                        <button
                          onClick={() => {
                            setEditingId(chat.id);
                            setEditValue(chat.title);
                            setMenuOpenId(null);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 transition"
                        >
                          <FiEdit2 size={12} /> 제목 변경
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTargetId(chat.id);
                            setMenuOpenId(null);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition"
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

        {/* Case Study Section: 사진 하단처럼 명확한 구분과 버튼형 디자인 */}
        <div className="pt-2 mt-2 border-t border-slate-200">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
            Case Study
          </div>
          <button
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-slate-900 hover:bg-black text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
            onClick={() => {
              setCurrentChat(null);
              navigate('/case-study');
              setSidebarOpen(false);
            }}
          >
            <span>🚀 프로젝트 상세 보기</span>
            <span className="opacity-50">→</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
