import { Modal, Pressable, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

type Props = {
  mode: 'date' | 'time' | null;
  value: Date;
  onClose: () => void;
  onConfirm: () => void;
  onChange: (event: DateTimePickerEvent, date?: Date) => void;
};

export function ActivityPickerModal({ mode, value, onClose, onConfirm, onChange }: Props) {
  if (!mode) return null;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/45 px-6">
        <View className="w-full max-w-sm rounded-xl bg-app-dark-bg p-4">
          <Text className="mb-3 text-base font-semibold text-app-dark-text">
            {mode === 'date' ? 'Datum auswählen' : 'Uhrzeit auswählen'}
          </Text>
          <View className="items-center overflow-hidden rounded-md border border-app-dark-card bg-app-dark-bg">
            <DateTimePicker
              value={value}
              mode={mode}
              display="spinner"
              is24Hour
              onChange={onChange}
              themeVariant="dark"
            />
          </View>
          <View className="mt-4 flex-row justify-end gap-3">
            <Pressable onPress={onClose} className="rounded-md border border-app-dark-card px-4 py-2">
              <Text className="font-semibold text-app-dark-text">Abbrechen</Text>
            </Pressable>
            <Pressable onPress={onConfirm} className="rounded-md bg-app-dark-accent px-4 py-2">
              <Text className="font-semibold text-app-dark-text">Übernehmen</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
