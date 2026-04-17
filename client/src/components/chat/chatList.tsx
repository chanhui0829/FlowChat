import { useState, useRef, useEffect } from 'react';
import { FiPlus, FiMoreVertical, FiTrash2, FiEdit2, FiX } from 'react-icons/fi';
import { useChatStore } from '../../store/chat.store';
import { useNavigate } from 'react-router-dom';

type Props = {
  setDeleteTargetId: (id: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
};

export default function ChatList({ setDeleteTargetId, sidebarOpen, setSidebarOpen }: Props) {
  const navigate = useNavigate();
  const { chats, currentChatId, createChat, setCurrentChat } = useChatStore();

  const [search, setSearch] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const menuRef = useRef<HTMLDivElement | null>(null);
  const editRef = useRef<HTMLDivElement | null>(null);

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(search.toLowerCase())
  );

  const saveEdit = () => {
    if (!editingId || !editValue.trim()) {
      setEditingId(null);
      setEditValue('');
      return;
    }

    useChatStore.setState((state) => ({
      chats: state.chats.map((c) => (c.id === editingId ? { ...c, title: editValue } : c)),
    }));

    setEditingId(null);
    setEditValue('');
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingId(null);
        setEditValue('');
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  /**
   *  드롭다운
   */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpenId(null);
      }

      if (editRef.current && !editRef.current.contains(target)) {
        if (editingId) {
          saveEdit();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingId, editValue]);

  return (
    <div
      className={`
        fixed md:static z-40
        w-[260px] h-full bg-white border-r p-4 flex flex-col
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}
    >
      {/* 모바일 닫기 */}
      <div className="md:hidden flex justify-end mb-2">
        <button onClick={() => setSidebarOpen(false)}>✕</button>
      </div>

      {/* 검색 */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 검색어를 입력해주세요"
        className="mb-3 pl-3 p-2 border rounded-lg text-sm"
      />

      {/* 새 채팅 */}
      <button
        onClick={() => {
          const newId = createChat();
          navigate(`/chat/${newId}`);
          setSidebarOpen(false);
        }}
        className="w-full flex items-center justify-center gap-1 bg-blue-500 hover:bg-blue-400 text-white py-2 rounded-lg mb-4"
      >
        <FiPlus /> 새 채팅
      </button>

      <div className="text-xs text-left text-gray-400 mb-2 px-1">최근</div>

      {/* 채팅 리스트 */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {filteredChats.map((chat) => {
          const isEditing = editingId === chat.id;

          return (
            <div
              key={chat.id}
              className={`relative group flex items-center justify-between p-2 rounded-lg cursor-pointer border-l-4 ${
                chat.id === currentChatId
                  ? 'bg-gray-100 border-blue-500 text-gray-900'
                  : 'border-transparent hover:bg-gray-50'
              }`}
            >
              {/* 제목 */}
              <div
                className="flex-1 text-left text-sm min-w-0"
                onClick={() => {
                  if (isEditing) return;

                  navigate(`/chat/${chat.id}`);
                  setTimeout(() => {
                    setCurrentChat(chat.id);
                    setSidebarOpen(false);
                  }, 0);
                }}
              >
                {isEditing ? (
                  <div ref={editRef} className="flex items-center gap-2 w-full">
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveEdit();
                        }
                      }}
                      className="
                        flex-1
                        min-w-0
                        w-0
                        px-2 py-1
                        text-sm
                        border
                        rounded-md
                        outline-none
                        focus:ring-2 focus:ring-blue-400
                      "
                      autoFocus
                    />

                    <FiX
                      size={16}
                      className="cursor-pointer text-gray-400 hover:text-red-500 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(null);
                        setEditValue('');
                      }}
                    />
                  </div>
                ) : (
                  chat.title
                )}
              </div>

              {/* ... 버튼 (editing 상태에서는 숨김) */}
              {!isEditing && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId((prev) => (prev === chat.id ? null : chat.id));
                    }}
                    className="opacity-0 group-hover:opacity-100 transition"
                  >
                    <FiMoreVertical />
                  </button>

                  {menuOpenId === chat.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 top-6 z-50 bg-white border rounded-md shadow-md w-32"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setEditingId(chat.id);
                          setEditValue(chat.title);
                          setMenuOpenId(null);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100"
                      >
                        <FiEdit2 size={14} /> 제목 변경
                      </button>

                      <button
                        onClick={() => {
                          setDeleteTargetId(chat.id);
                          setMenuOpenId(null);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-gray-100"
                      >
                        <FiTrash2 size={14} /> 삭제
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Case Study */}
      <div className="pt-1 mt-2 border-t">
        <div className="text-xs text-gray-400 mb-1 px-1">Case Study</div>

        <button
          className="w-full text-left px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm transition"
          onClick={() => {
            setCurrentChat(null);
            navigate('/case-study');
            setSidebarOpen(false);
          }}
        >
          👉 프로젝트 보기
        </button>
      </div>
    </div>
  );
}
