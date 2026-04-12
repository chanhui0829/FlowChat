import { useMutation } from '@tanstack/react-query';
import { sendMessage } from '../api/mcp';

export const useSendMessage = () => {
  return useMutation({
    mutationFn: sendMessage,
  });
};
