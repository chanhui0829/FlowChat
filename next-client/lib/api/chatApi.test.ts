import { describe, it, expect, vi, afterEach } from 'vitest';
import { sendMessageStream } from './chatApi';

/**
 * 회귀 테스트: 한글(멀티바이트 UTF-8) 문자가 네트워크 청크 경계에서
 * 정확히 반으로 잘렸을 때도 TextDecoder({ stream: true }) + leftover 버퍼
 * 조합이 문자를 깨뜨리지 않고 올바르게 이어붙이는지 확인한다.
 *
 * 과거 버그: decoder.decode(value, { stream: false })(기본값)로 호출하면
 * 멀티바이트 문자가 청크 중간에서 잘렸을 때 각 조각이 U+FFFD(REPLACEMENT
 * CHARACTER)로 깨졌다. { stream: true }를 쓰면 디코더가 잘린 바이트를
 * 내부 상태로 들고 있다가 다음 read()의 바이트와 합쳐서 정확히 복원한다.
 */

// 실제 res.body.getReader()를 흉내내는 최소 구현.
// 준비된 Uint8Array 청크들을 순서대로 하나씩 돌려주고, 다 돌려주면 done:true.
function makeReaderFromChunks(chunks: Uint8Array[]) {
  let i = 0;
  return {
    read: async () => {
      if (i < chunks.length) {
        return { done: false, value: chunks[i++] };
      }
      return { done: true, value: undefined };
    },
  };
}

// UTF-8 바이트 배열에서 "멀티바이트 문자의 첫 바이트"가 시작되는 위치를 찾는다.
// (0xC0 이상은 멀티바이트 시퀀스의 리딩 바이트)
function findMultiByteCharStart(bytes: Uint8Array): number {
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] >= 0xc0) return i;
  }
  throw new Error('멀티바이트 문자를 찾지 못함 — 테스트 데이터를 확인하세요.');
}

describe('sendMessageStream — 한글 청크 분할 회귀 테스트', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('멀티바이트 문자가 청크 경계에서 정확히 잘려도 한글이 깨지지 않는다', async () => {
    const koreanText = '안녕하세요, 스트리밍 테스트입니다.';
    const line = `data: ${JSON.stringify({ content: koreanText })}\n\n`;
    const bytes = new TextEncoder().encode(line);

    // 첫 멀티바이트 문자의 리딩 바이트 바로 다음(=문자 한가운데)에서 자른다.
    const charStart = findMultiByteCharStart(bytes);
    const splitPoint = charStart + 1;
    const chunk1 = bytes.slice(0, splitPoint);
    const chunk2 = bytes.slice(splitPoint);

    // 실제로 문자가 중간에서 잘렸는지 사전 검증 (테스트 자체의 유효성 확인)
    expect(chunk1.length).toBeGreaterThan(0);
    expect(chunk2.length).toBeGreaterThan(0);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => makeReaderFromChunks([chunk1, chunk2]) },
    }) as unknown as typeof fetch;

    const receivedChunks: string[] = [];
    let finalText = '';

    await new Promise<void>((resolve, reject) => {
      sendMessageStream(
        '안녕',
        (data) => receivedChunks.push(data.chunk),
        (full) => {
          finalText = full;
          resolve();
        },
        (err) => reject(err),
        []
      );
    });

    expect(finalText).toBe(koreanText);
    expect(finalText).not.toContain('\uFFFD'); // REPLACEMENT CHARACTER가 없어야 함
  });

  it('[대조군] stream:false로 디코드하면 이 케이스에서 실제로 깨진다 — 테스트가 진짜 버그를 잡는지 확인', () => {
    const koreanText = '안녕하세요, 스트리밍 테스트입니다.';
    const line = `data: ${JSON.stringify({ content: koreanText })}\n\n`;
    const bytes = new TextEncoder().encode(line);
    const charStart = findMultiByteCharStart(bytes);
    const splitPoint = charStart + 1;
    const chunk1 = bytes.slice(0, splitPoint);
    const chunk2 = bytes.slice(splitPoint);

    // 과거 버그를 그대로 재현: 매번 새 디코더로, stream 옵션 없이(기본 false) 디코드
    const buggyDecode = (chunk: Uint8Array) => new TextDecoder('utf-8').decode(chunk);
    const buggyResult = buggyDecode(chunk1) + buggyDecode(chunk2);

    // 이 결과는 반드시 깨져야 한다 — 안 깨지면 이 테스트 케이스 자체가
    // 버그를 재현하지 못하는 것이므로 회귀 테스트로서 의미가 없다는 뜻.
    expect(buggyResult).toContain('\uFFFD');
    expect(buggyResult).not.toBe(koreanText);
  });
});
