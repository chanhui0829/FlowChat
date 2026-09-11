/**
 * ChatInput 컴포넌트 단위 테스트
 * - 전송 버튼이 제대로 동작하는지
 * - 스트리밍 중에 중지 버튼으로 바뀌는지
 * - 빈 입력값으로 전송하면 onSend 안 불리는지
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInput from '@/components/chat/ChatInput';
import { useChatStore } from '@/lib/store';

// [Fix] ChatInput은 더 이상 isSending prop을 받지 않는다 — isStreaming을 prop
// drilling 대신 useChatStore에서 직접 구독하도록 리팩터링되었기 때문. 이 테스트는
// 리팩터링 전 시그니처(isSending prop)를 그대로 넘기고 있어서 타입 에러로 아예
// 컴파일/실행이 안 되고 있었음 — prop 대신 스토어 상태를 직접 세팅하도록 수정.
const initialChatState = useChatStore.getState();

afterEach(() => {
  useChatStore.setState(initialChatState, true);
});

describe('ChatInput', () => {
  it('입력값이 있을 때 전송 버튼 클릭하면 onSend가 호출된다', async () => {
    const onSend = vi.fn();
    render(<ChatInput input="안녕하세요" setInput={vi.fn()} onSend={onSend} typing="" />);

    await userEvent.click(screen.getByRole('button', { name: '메시지 전송' }));
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('입력값이 비어있으면 전송 버튼이 비활성화된다', () => {
    render(<ChatInput input="" setInput={vi.fn()} onSend={vi.fn()} typing="" />);

    const button = screen.getByRole('button', { name: '메시지 전송' });
    expect(button).toBeDisabled();
  });

  it('스트리밍 중(store.isStreaming=true)이면 버튼이 응답 중지로 바뀐다', () => {
    useChatStore.setState({ isStreaming: true });

    render(<ChatInput input="" setInput={vi.fn()} onSend={vi.fn()} onStop={vi.fn()} typing="" />);

    expect(screen.getByRole('button', { name: '응답 중지' })).toBeInTheDocument();
  });

  it('스트리밍 중 중지 버튼 클릭하면 onStop이 호출된다', async () => {
    useChatStore.setState({ isStreaming: true });
    const onStop = vi.fn();

    render(
      <ChatInput
        input=""
        setInput={vi.fn()}
        onSend={vi.fn()}
        onStop={onStop}
        typing="응답 생성 중..."
      />
    );

    await userEvent.click(screen.getByRole('button', { name: '응답 중지' }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });
});
