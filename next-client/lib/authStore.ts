import { create } from 'zustand';
import { authService } from './services/authService';
import { supabase } from './supabase';
import { useChatStore } from './store';
import type { User } from '@supabase/supabase-js';

/**
 * [Zustand Store Interface]
 * 인증 상태(State)와 행위(Actions)를 명확히 분리하여 스토어의 역할을 정의합니다.
 */
interface AuthState {
  user: User | null;
  isAuthLoading: boolean;
  isAuthActionLoading: boolean;
  authError: string | null;
}

interface AuthActions {
  initAuth: () => void;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
}

// [Technical Point] onAuthStateChange 리스너가 중복 등록되지 않도록 모듈 스코프에서 1회만 초기화
// ChatLayout은 '/' <-> '/chat/[id]' 이동마다 재마운트되므로, 컴포넌트 내부 상태로는 중복 등록을 막을 수 없음
let isAuthListenerRegistered = false;

/**
 * @description 이메일/비밀번호 기반 인증 전역 상태 관리 스토어
 * [Technical Point]
 * 1. Layered Architecture: Supabase Auth 호출은 Service 레이어로 위임하여 결합도를 낮춤.
 * 2. Session Sync: onAuthStateChange 구독으로 로그인/로그아웃이 다른 탭/새로고침에도 동기화됨.
 */
export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  /* --- Initial State --- */
  user: null,
  isAuthLoading: true,
  isAuthActionLoading: false,
  authError: null,

  /* --- Actions --- */

  /**
   * 세션 복구 및 인증 상태 변경 구독 초기화
   */
  initAuth: () => {
    if (isAuthListenerRegistered) return;
    isAuthListenerRegistered = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ user: session?.user ?? null, isAuthLoading: false });
    });

    supabase.auth.onAuthStateChange((event, session) => {
      set({ user: session?.user ?? null });

      // [Fix] 실제 로그아웃 이벤트에서만 게스트/이전 사용자 채팅 로컬 상태를 정리
      // 이유: ChatLayout은 '/' <-> '/chat/[id]' 이동마다 재마운트되는데, 그 mount 이펙트에서
      //       "!user → resetChats()"를 호출하면 비로그인 상태에서 새 채팅을 만들자마자
      //       (라우팅으로 인한 재마운트 시) 방금 만든 로컬 채팅까지 지워지는 문제가 있었음.
      //       로그아웃은 여기 auth 이벤트에서만 감지해 정리하는 것이 안전함.
      if (event === 'SIGNED_OUT') {
        useChatStore.getState().resetChats();
      }
    });
  },

  /**
   * 이메일/비밀번호 로그인
   */
  signIn: async (email, password) => {
    set({ isAuthActionLoading: true, authError: null });
    try {
      await authService.signIn(email, password);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : '로그인에 실패했습니다.';
      set({ authError: message });
      console.error('[Store: signIn Error]', error);
      return false;
    } finally {
      set({ isAuthActionLoading: false });
    }
  },

  /**
   * 이메일/비밀번호 회원가입
   * [Technical Point] 프로젝트의 이메일 인증 설정에 따라 가입 직후 session이 없을 수 있어
   * (needsEmailConfirmation), 호출부(AuthModal)에서 안내 메시지를 분기 처리함.
   */
  signUp: async (email, password) => {
    set({ isAuthActionLoading: true, authError: null });
    try {
      const data = await authService.signUp(email, password);
      return { success: true, needsEmailConfirmation: !data.session };
    } catch (error) {
      const message = error instanceof Error ? error.message : '회원가입에 실패했습니다.';
      set({ authError: message });
      console.error('[Store: signUp Error]', error);
      return { success: false, needsEmailConfirmation: false };
    } finally {
      set({ isAuthActionLoading: false });
    }
  },

  /**
   * 로그아웃
   */
  signOut: async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('[Store: signOut Error]', error);
    }
  },

  /**
   * 인증 에러 상태 초기화
   */
  clearAuthError: () => set({ authError: null }),
}));
