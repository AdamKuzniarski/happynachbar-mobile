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

  test('upsertMessage fügt neue Nachricht hinzu, und sortriert korrekt', () => {
    const existing = makeMessage({
      id: 'm1',
      createdAt: '2026-04-14T10:00:00.000Z',
    });

    const incoming = makeMessage({
      id: 'm2',
      createdAt: '2026-04-14T11:00:00.000Z',
      body: 'Neu',
    });

    const result = upsertMessage([existing], incoming);

    expect(result.map((item) => item.id)).toEqual(['m2', 'm1']);
  });

  test('getSocketErrorText nimmt error.message wenn vorhanden', () => {
    expect(getSocketErrorText({ message: 'Socket broken' })).toBe('Socket broken');
  });

  test('getSocketErrorTest nutzt Fallback wenn keine brauchbare Message vorhanden', () => {
    expect(getSocketErrorText(null)).toBe(
      'Socket-Verbindung fehlgeschlagen. Bitte API/Token prüfen.',
    );
    expect(getSocketErrorText({ message: '    ' })).toBe(
      'Socket-Verbindung fehlgeschlagen. Bitte API/Token prüfen.',
    );
  });

  test('getConversationTitle liefert sinnvolle Fallbacks', () => {
    expect(getConversationTitle()).toBe('Chat');

    expect(
      getConversationTitle({
        id: 'c1',
        participantId: null,
        participantDisplayName: null,
        participantAvatarUrl: null,
        activityId: 'a1',
        activityTitle: 'Nachbarschaftsgrillen',
        type: 'GROUP',
        hasUnread: false,
        lastMessageBody: null,
        lastMessageAt: null,
      }),
    ).toBe('Nachbarschaftsgrillen');

    expect(
      getConversationTitle({
        id: 'c2',
        participantId: 'u2',
        participantDisplayName: '  Julia  ',
        participantAvatarUrl: null,
        activityId: null,
        activityTitle: null,
        type: 'DIRECT',
        hasUnread: false,
        lastMessageBody: null,
        lastMessageAt: null,
      }),
    ).toBe('Julia');
  });

  test('getConversationSublitle liefert sinnvolle Fallbacks', () => {
    expect(getConversationSubtitle()).toBeNull();

    expect(
      getConversationSubtitle({
        id: 'c1',
        participantId: null,
        participantDisplayName: null,
        participantAvatarUrl: null,
        activityId: 'a1',
        activityTitle: 'Nachbarschaftsgrillen',
        type: 'GROUP',
        hasUnread: false,
        lastMessageBody: null,
        lastMessageAt: null,
      }),
    ).toBe('Gruppenchat');

    expect(
      getConversationSubtitle({
        id: 'c2',
        participantId: 'u2',
        participantDisplayName: 'Julia',
        participantAvatarUrl: null,
        activityId: null,
        activityTitle: null,
        type: 'DIRECT',
        hasUnread: false,
        lastMessageBody: null,
        lastMessageAt: null,
      }),
    ).toBe('Direktnachricht');
  });
});
