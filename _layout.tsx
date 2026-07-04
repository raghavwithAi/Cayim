import { useRef, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text, Dimensions, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, FolderHeart, User } from 'lucide-react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, interpolate, Extrapolation,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { useTheme } from '@/lib/themeContext';
import { colors } from '@/lib/theme';

// Lazy imports to avoid circular dep with expo-router Tabs
import WelcomeScreen from './index';
import VaultScreen from './vault';
import ProfileScreen from './profile';

const { width: W } = Dimensions.get('window');

const TABS = [
  { key: 'home',    label: 'Home',    Icon: Home },
  { key: 'vault',   label: 'Vault',   Icon: FolderHeart },
  { key: 'profile', label: 'Profile', Icon: User },
] as const;

export default function TabsLayout() {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);
  const isScrolling = useRef(false);

  const goTo = useCallback((idx: number) => {
    setActiveTab(idx);
    scrollRef.current?.scrollTo({ x: idx * W, animated: true });
    scrollX.value = withSpring(idx * W, { damping: 20, stiffness: 180 });
  }, []);

  const onMomentumEnd = useCallback((e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / W);
    if (idx !== activeTab) {
      setActiveTab(idx);
      scrollX.value = x;
    }
    isScrolling.current = false;
  }, [activeTab]);

  const onScrollBegin = useCallback(() => { isScrolling.current = true; }, []);

  const tabBarStyle = {
    backgroundColor: t.bg,
    borderTopColor: t.border,
    paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      {/* Swipeable page area */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollBegin={onScrollBegin}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEventThrottle={16}
        // Critical: allow nested vertical scrolls without conflict
        nestedScrollEnabled
        directionalLockEnabled={false}
        style={styles.pager}
        contentContainerStyle={{ width: W * TABS.length }}
        // Disable horizontal scroll freeze by limiting gesture distance
        decelerationRate="fast"
      >
        <View style={{ width: W, flex: 1 }}>
          <WelcomeScreen />
        </View>
        <View style={{ width: W, flex: 1 }}>
          <VaultScreen />
        </View>
        <View style={{ width: W, flex: 1 }}>
          <ProfileScreen />
        </View>
      </ScrollView>

      {/* Tab bar */}
      <View style={[styles.tabBar, tabBarStyle]}>
        {TABS.map(({ key, label, Icon }, idx) => {
          const isActive = idx === activeTab;
          return (
            <Pressable
              key={key}
              onPress={() => goTo(idx)}
              style={styles.tabItem}
              hitSlop={8}
            >
              <View style={[styles.tabIconWrap, isActive && styles.tabIconActive]}>
                <Icon
                  size={22}
                  color={isActive ? colors.primary : t.textTertiary}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </View>
              <Text style={[
                styles.tabLabel,
                { color: isActive ? colors.primary : t.textTertiary },
                isActive && styles.tabLabelActive,
              ]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
        {/* Active indicator pill */}
        <TabIndicator scrollX={scrollX} tabCount={TABS.length} />
      </View>
    </View>
  );
}

function TabIndicator({ scrollX, tabCount }: { scrollX: SharedValue<number>; tabCount: number }) {
  const tabW = W / tabCount;
  const style = useAnimatedStyle(() => {
    const x = interpolate(scrollX.value, [0, W * (tabCount - 1)], [0, W - tabW], Extrapolation.CLAMP);
    return { transform: [{ translateX: x + tabW * 0.15 }] };
  });
  return (
    <Animated.View style={[styles.indicator, { width: (W / tabCount) * 0.7 }, style]} />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pager: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
    position: 'relative',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  tabIconWrap: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  tabIconActive: {
    backgroundColor: colors.glow,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    lineHeight: 14,
  },
  tabLabelActive: {
    fontFamily: 'Inter-SemiBold',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});
