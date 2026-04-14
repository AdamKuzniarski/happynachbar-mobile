import type { ReactNode } from 'react';
import { Platform, ScrollView, type StyleProp, type ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  SafeAreaView,
  useSafeAreaInsets,
  type Edge,
} from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  bottomPadding?: number;
  keyboardAware?: boolean;
  safeAreaEdges?: Edge[];
};

const baseContentContainerStyle: ViewStyle = {
  flexGrow: 1,
  padding: 16,
};

const defaultSafeAreaEdges: Edge[] = ['top', 'left', 'right'];

export function ScreenScrollView({
  children,
  contentContainerStyle,
  bottomPadding = 16,
  keyboardAware = false,
  safeAreaEdges = defaultSafeAreaEdges,
}: Props) {
  const insets = useSafeAreaInsets();
  const contentInsetBottom = bottomPadding + insets.bottom;

  const mergedContentContainerStyle = [
    baseContentContainerStyle,
    { paddingBottom: contentInsetBottom },
    contentContainerStyle,
  ];

  const keyboardGap =
    Platform.OS === 'android'
      ? Math.max(88, insets.bottom + 64)
      : Math.max(24, insets.bottom + 12);

  return (
    <SafeAreaView edges={safeAreaEdges} className="flex-1 bg-app-dark-bg">
      {keyboardAware ? (
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          contentContainerStyle={mergedContentContainerStyle}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          enableOnAndroid
          extraHeight={keyboardGap}
          extraScrollHeight={keyboardGap}
          viewIsInsideTabBar
        >
          {children}
        </KeyboardAwareScrollView>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={mergedContentContainerStyle}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          {children}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
