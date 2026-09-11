import { supabase } from '../supabase';
import type { DBChatMessage, Message } from '../types/chat';

export const chatService = {
  /**
   * [Infrastructure Layer] 모든 채팅 세션 및 메시지 로드
   */
  async fetchSessions() {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*, chat_messages(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * 새로운 채팅 세션 DB 생성
   * [Technical Point] chat_sessions.user_id는 NOT NULL + RLS insert 정책(auth.uid() = user_id) 대상이므로
   * 반드시 로그인한 사용자의 id를 함께 전달해야 합니다.
   */
  async createSession(title: string, userId: string) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([{ title, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 채팅 메시지 DB 저장
   */
  async saveMessage(sessionId: string, msg: Message) {
    const { error } = await supabase.from('chat_messages').insert([
      {
        session_id: sessionId,
        role: msg.role,
        content: msg.content,
      },
    ]);
    if (error) throw error;
  },

  /**
   * 채팅 세션 삭제
   */
  async deleteSession(id: string) {
    const { error } = await supabase.from('chat_sessions').delete().eq('id', id);
    if (error) throw error;
  },

  /**
   * 채팅 제목 업데이트
   */
  async updateSessionTitle(id: string, title: string) {
    const { error } = await supabase.from('chat_sessions').update({ title }).eq('id', id);
    if (error) throw error;
  },

  /**
   * [Technical Tip] Data Mapper: DB Raw 데이터를 프론트엔드 도메인 모델로 변환
   */
  mapMessages(dbMessages: DBChatMessage[]): Message[] {
    return dbMessages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      time: m.created_at,
    }));
  },
};
