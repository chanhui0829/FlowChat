'use client';

import { useCallback, useState } from 'react';
import { FiAlertCircle, FiLock, FiMail, FiX } from 'react-icons/fi';
import { useAuthStore } from '@/lib/authStore';
import Logo from '@/assets/Logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'signIn' | 'signUp';

/**
 * @description 이메일/비밀번호 기반 로그인·회원가입 모달 컴포넌트
 * [Architecture]
 * 별도 페이지 이동 없이 하나의 모달에서 탭 전환만으로 로그인/회원가입을 처리하여
 * 인증 흐름을 최대한 간단하게 유지함.
 */
export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signIn, signUp, isAuthActionLoading, authError, clearAuthError } = useAuthStore();

  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setEmail('');
    setPassword('');
    setNotice(null);
    clearAuthError();
  }, [clearAuthError]);

  const switchMode = useCallback(
    (next: AuthMode) => {
      setMode(next);
      setNotice(null);
      clearAuthError();
    },
    [clearAuthError]
  );

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || !password.trim()) return;

      if (mode === 'signIn') {
        const success = await signIn(email.trim(), password);
        if (success) handleClose();
        return;
      }

      // 회원가입: 이메일 인증이 필요한 프로젝트 설정이면 session이 없으므로 로그인 탭으로 안내
      const { success, needsEmailConfirmation } = await signUp(email.trim(), password);
      if (success && needsEmailConfirmation) {
        setNotice('가입 확인 메일을 보냈어요. 메일함을 확인한 뒤 로그인해주세요.');
        setMode('signIn');
        setPassword('');
      } else if (success) {
        handleClose();
      }
    },
    [email, password, mode, signIn, signUp, handleClose]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[400px] p-8 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <button
          onClick={handleClose}
          aria-label="닫기"
          className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-all"
        >
          <FiX size={18} />
        </button>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-zinc-200/50">
            <Logo className="w-7 h-7 text-zinc-900" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            {mode === 'signIn' ? '로그인' : '회원가입'}
          </h3>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            {mode === 'signIn'
              ? '로그인하고 대화 기록을 이어가보세요.'
              : '가입하고 나만의 대화 기록을 저장해보세요.'}
          </p>
        </div>

        {/* 안내 배너 */}
        {notice && (
          <div className="mb-4 px-4 py-3 bg-zinc-100 rounded-2xl text-zinc-600 text-xs font-medium">
            {notice}
          </div>
        )}

        {/* 에러 배너 */}
        {authError && (
          <div className="mb-4 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-xs font-medium">
            <FiAlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 border border-zinc-200/50 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all"
            />
          </div>
          <div className="relative">
            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 (6자 이상)"
              className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 border border-zinc-200/50 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isAuthActionLoading}
            className="w-full py-4 mt-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-bold transition-all active:scale-[0.98] disabled:bg-zinc-300 disabled:cursor-not-allowed"
          >
            {isAuthActionLoading ? '처리 중...' : mode === 'signIn' ? '로그인' : '회원가입'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-500">
          {mode === 'signIn' ? (
            <>
              아직 계정이 없으신가요?{' '}
              <button
                onClick={() => switchMode('signUp')}
                className="font-bold text-zinc-900 hover:underline"
              >
                회원가입
              </button>
            </>
          ) : (
            <>
              이미 계정이 있으신가요?{' '}
              <button
                onClick={() => switchMode('signIn')}
                className="font-bold text-zinc-900 hover:underline"
              >
                로그인
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
