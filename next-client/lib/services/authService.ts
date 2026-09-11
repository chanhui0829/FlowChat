import { supabase } from '../supabase';

/**
 * [Infrastructure Layer] Supabase Auth(이메일/비밀번호)를 감싸는 서비스 레이어
 */
export const authService = {
  /**
   * 이메일/비밀번호 회원가입
   */
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  /**
   * 이메일/비밀번호 로그인
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  /**
   * 로그아웃
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};
