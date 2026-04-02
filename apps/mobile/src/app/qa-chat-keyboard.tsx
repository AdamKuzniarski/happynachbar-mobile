import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  type KeyboardEvent,
  type View as RNView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatComposer } from '@/components/chat/ChatComposer';

export default function ChatKeyboardQaPage() {
  const [text, setText] = useState('');
  const [composerBottom, setComposerBottom] = useState<number | null>(null);
  const [keyboardTop, setKeyboardTop] = useState<number | null>(null);
  const composerContainerRef = useRef<RNView | null>(null);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  function measureComposerBottom() {
    composerContainerRef.current?.measureInWindow((_, y, __, height) => {
      setComposerBottom(y + height);
    });
  }

  function syncKeyboardTopFromMetrics() {
    const metrics = Keyboard.metrics();
    setKeyboardTop(metrics?.screenY ?? null);

    if (metrics) {
      requestAnimationFrame(() => {
        measureComposerBottom();
      });
    }
  }

  useEffect(() => {
    let measurementTimeout: ReturnType<typeof setTimeout> | null = null;
    let metricsInterval: ReturnType<typeof setInterval> | null = null;

    function scheduleComposerMeasurement() {
      requestAnimationFrame(() => {
        measureComposerBottom();
      });

      measurementTimeout = setTimeout(() => {
        measureComposerBottom();
      }, 250);
    }

    function onKeyboardShow(event: KeyboardEvent) {
      setKeyboardTop(event.endCoordinates.screenY);
      scheduleComposerMeasurement();
    }

    function onKeyboardHide() {
      setKeyboardTop(null);
      scheduleComposerMeasurement();
    }

    const showSubscriptions = [
      Keyboard.addListener('keyboardWillShow', onKeyboardShow),
      Keyboard.addListener('keyboardDidShow', onKeyboardShow),
      Keyboard.addListener('keyboardWillChangeFrame', onKeyboardShow),
      Keyboard.addListener('keyboardDidChangeFrame', onKeyboardShow),
    ];
    const hideSubscriptions = [
      Keyboard.addListener('keyboardWillHide', onKeyboardHide),
      Keyboard.addListener('keyboardDidHide', onKeyboardHide),
    ];

    // Maestro can surface the software keyboard without a reliable keyboardDidShow event.
    // Poll the native metrics on this dev-only QA screen to keep the status label in sync.
    syncKeyboardTopFromMetrics();
    metricsInterval = setInterval(syncKeyboardTopFromMetrics, 100);

    return () => {
      if (measurementTimeout) {
        clearTimeout(measurementTimeout);
      }
      if (metricsInterval) {
        clearInterval(metricsInterval);
      }
      showSubscriptions.forEach((subscription) => subscription.remove());
      hideSubscriptions.forEach((subscription) => subscription.remove());
    };
  }, []);

  useEffect(() => {
    measureComposerBottom();
  }, [windowHeight, insets.bottom, text]);

  const keyboardSafetyLabel = useMemo(() => {
    if (keyboardTop === null) return 'Keyboard safe: waiting for keyboard';
    if (composerBottom === null) return 'Keyboard safe: measuring composer';

    return composerBottom <= keyboardTop ? 'Keyboard safe: yes' : 'Keyboard safe: no';
  }, [composerBottom, keyboardTop]);

  if (!__DEV__) {
    return (
      <SafeAreaView className="flex-1 bg-app-dark-bg">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-app-dark-brand">
            This screen is only available in development builds.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-app-dark-bg">
      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <View className="border-b border-app-dark-card px-4 py-4">
          <Text className="text-lg font-semibold text-app-dark-text">QA Chat Keyboard</Text>
          <Text className="mt-1 text-sm text-app-dark-brand">
            Use this screen to verify that the composer stays visible when the keyboard is open.
          </Text>
          <Text testID="qa-keyboard-safety" className="mt-2 text-sm font-semibold text-app-dark-text">
            {keyboardSafetyLabel}
          </Text>
          <Text className="mt-1 text-xs text-app-dark-brand">
            composerBottom={composerBottom ?? -1} keyboardTop={keyboardTop ?? -1} windowHeight=
            {windowHeight}
          </Text>
        </View>

        <ScrollView
          testID="qa-chat-scroll"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 12 }}
        >
          {Array.from({ length: 16 }).map((_, index) => (
            <View
              key={index}
              className="rounded-md border border-app-dark-card bg-app-dark-bg px-4 py-3"
            >
              <Text className="text-sm text-app-dark-brand">
                Placeholder message block {index + 1}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View ref={composerContainerRef} onLayout={measureComposerBottom}>
          <ChatComposer
            value={text}
            onChange={setText}
            onSend={() => {}}
            bottomInset={Math.max(insets.bottom, 12)}
            keyboardOffset={0}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
