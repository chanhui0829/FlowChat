import { useMutation } from '@tanstack/react-query';
import { sendMessage } from '../api/mcp';

/**
 * 단발성 메시지 전송을 위한 커스텀 훅
 */
export const useSendMessage = () => {
  return useMutation({
    mutationFn: sendMessage,
  });
};
