import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import { formatDate } from '@/lib/format';
import type { RoomMessage } from '@/lib/chat-room';

type ChatMessageBubbleProps = {
  item: RoomMessage;
  isMine: boolean;
  isEditing: boolean;
  editingText: string;
  onChangeEditingText: (text: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSubmitEdit: () => void;
  onDelete: () => void;
};

export function ChatMessageBubble({
  item,
  isMine,
  isEditing,
  editingText,
  onChangeEditingText,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  onDelete,
}: ChatMessageBubbleProps) {
  const autor = isMine ? 'Du' : item.senderDisplayName?.trim() || 'Nachbar';
  const canEdit = isMine && !item.deletedAt && !item.optimistic && !isEditing;

  return (
    <View className={`px-4 ${isMine ? 'items-end' : 'items-start'}`}>
      <View
        className={`w-full max-w-[84%] rounded-3xl px-4 py-3 ${isMine ? 'bg-app-dark-accent' : 'bg-app-dark-card'} `}
      >
        <View className={'flex-row items-center gap-2'}>
          <Text className={'flex-1 text-[11px] text-app-dark-brand'}>
            {autor} · {formatDate(item.createdAt)}
          </Text>

          {canEdit ? (
            <View className={'flex-row items-center gap-3'}>
              <Pressable onPress={onStartEdit} hitSlop={8}>
                <Ionicons name="create-outline" size={15} color="#F3F6EE" />
              </Pressable>
              <Pressable onPress={onDelete} hitSlop={8}>
                <Ionicons name="trash-outline" size={15} color="#F3F6EE" />
              </Pressable>
            </View>
          ) : null}
        </View>

        {isEditing ? (
          <View className={'mt-2 gap-2'}>
            <TextInput
              value={editingText}
              onChangeText={onChangeEditingText}
              placeholder="Nachticht bearbeiten"
              placeholderTextColor="#B8C3AF"
              className={
                'rounded-2xl border border-app-dark-bg bg-app-dark-bg px-3 py-3 text-base text-app-dark-text'
              }
              multiline
            />
            <View className={'flex-row items-center gap-2'}>
              <Pressable
                onPress={onSubmitEdit}
                className={'h-9 items-center justify-center rounded-full bg-app-dark-bg px-4'}
              >
                <Text className={'text-xs font-semibold text-app-dark-text'}>Speichern</Text>
              </Pressable>
              <Pressable
                onPress={onCancelEdit}
                className={'h-9 items-center justify-center rounded-full bg-app-dark-bg px-4'}
              >
                <Text>Abbrechen</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <Text className={'mt-1 text-base leading-6 text-app-dark-text'}>
              {item.deletedAt ? 'Nachricht gelöscht' : item.body || '-'}
            </Text>

            <View className={'mt-2 flex-row items-center gap-2'}>
              {item.editedAt && !item.deletedAt ? (
                <Text className={'text-[11px] italic text-app-dark-brand'}>Bearbeiten</Text>
              ) : null}

              {item.optimistic ? (
                <View className={'flex-row items-center gap-1'}>
                  <Ionicons name="time-outline" size={12} color="#F3F6EE" />
                  <Text className={'text-[11px] italic text-app-dark-brand'}>Wird gesendet...</Text>
                </View>
              ) : null}
            </View>
          </>
        )}
      </View>
    </View>
  );
}
