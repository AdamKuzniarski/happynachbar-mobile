import { Ionicons } from '@expo/vector-icons';
import { Pressable, type GestureResponderEvent } from 'react-native';

type FavoriteButtonProps = {
  liked: boolean;
  disabled: boolean;
  onPress: () => void;
};

export function FavortieButton({ liked, disabled = false, onPress }: FavoriteButtonProps) {
  function handlePress(event: GestureResponderEvent) {
    event.stopPropagation();
    if (disabled) return;
    onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      hitSlop={8}
      className={`items-center justify-center rounded-full bg-black/35 p-2 ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      <Ionicons
        name={liked ? 'heart' : 'headset-outline'}
        size={18}
        color={liked ? '#FF6B6B' : '#F3F6EE'}
      />
    </Pressable>
  );
}
