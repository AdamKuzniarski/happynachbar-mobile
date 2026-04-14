import {
  applyLocalDelete,
  applyLocalEdit,
  getConversationSubtitle,
  getConversationTitle,
  getSocketErrorText,
  mergeMessages,
  replaceOptimisticMessage,
  sortMessagesDesc,
  upsertMessage,
  type RoomMessage,
} from '@/lib/chat-room';

function makeMessage(overrides: Partial<RoomMessage> = {}): RoomMessage {
  return {
    id: 'm1',
    conversationId: 'c1',
    senderId: 'u1',
    senderDisplayName: 'Adam',
    body: 'Hallo',
    createdAt: '2026-04-14T10:00:00.000Z',
    editedAt: null,
    deletedAt: null,
    ...overrides,
  };
}

describe('chat-room helper functions', () => {
  test('sortMessagesDesc sortiert Nachrichten nach createdAt absteigend', () => {
    const older = makeMessage({
      id: 'm1',
      createdAt: '2026-04-14T09:00:00.000Z',
    });

    const newer = makeMessage({
      id: 'm2',
      createdAt: '2026-04-14T10:00:00.000Z',
    });

    const result = sortMessagesDesc([older, newer]);

    expect(result.map((item) => item.id)).toEqual(['m2', 'm1']);
  });

  test('sortMessagesDesc nutzt id als Tie-Breaker bie gleicher createdAt.', () => {
    const a = makeMessage({
      id: 'm1',
      createdAt: '2026-04-14T10:00:00.000Z',
    });

    const b = makeMessage({
      id: 'm2',
      createdAt: '2026-04-14T10:00:00.000Z',
    });

    const result = sortMessagesDesc([a, b]);

    expect(result.map((item) => item.id)).toEqual(['m2', 'm1']);
  });

  test('mergeMessages entfernt Duplikate per id und behält den letzten Stand', () => {
    const first = makeMessage({
      id: 'm1',
      body: 'Alt',
    });

    const updated = makeMessage({
      id: 'm1',
      body: 'Neu',
    });

    const result = mergeMessages([first, updated]);

    expect(result).toHaveLength(1);
    expect(result[0].body).toBe('Neu');
  });
});
