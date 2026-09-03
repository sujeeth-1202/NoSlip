import React, { useEffect } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QuietTheme, Typography } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 300);

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
  onOpenEditProfile?: () => void;
  onOpenNotifications?: () => void;
  onOpenTrophyWall?: () => void;
  onOpenAbout?: () => void;
  displayName?: string;
  email?: string;
}

export function DrawerMenu({
  isOpen,
  onClose,
  onSignOut,
  onOpenEditProfile,
  onOpenNotifications,
  onOpenTrophyWall,
  onOpenAbout,
  displayName,
  email,
}: DrawerMenuProps) {
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(isOpen ? 1 : 0, { duration: 250 });
  }, [isOpen, progress]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          progress.value,
          [0, 1],
          [-DRAWER_WIDTH, 0],
        ),
      },
    ],
  }));

  if (!isOpen) {
    return null;
  }

  function handleAction(name: string) {
    onClose();
    Alert.alert(name, `${name} settings will be available in the next update.`);
  }

  function handleSignOutPress() {
    onClose();
    onSignOut();
  }

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Dimmed Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Drawer Sheet */}
        <Animated.View
          style={[
            styles.drawerSheet,
            {
              width: DRAWER_WIDTH,
              paddingTop: Math.max(insets.top, 24) + 16,
              paddingBottom: Math.max(insets.bottom, 24) + 16,
            },
            drawerStyle,
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.brandTitle}>NoSlip</Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.itemPressed,
              ]}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          {displayName || email ? (
            <View style={styles.userInfoBox}>
              {displayName ? (
                <Text style={styles.userName} numberOfLines={1}>
                  {displayName}
                </Text>
              ) : null}
              {email ? (
                <Text style={styles.userEmail} numberOfLines={1}>
                  {email}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* Top Section Navigation Items */}
          <View style={styles.topSection}>
            <DrawerItem
              label="Edit Profile"
              onPress={() => {
                onClose();
                onOpenEditProfile?.();
              }}
            />
            <DrawerItem
              label="Notifications"
              onPress={() => {
                onClose();
                onOpenNotifications?.();
              }}
            />
            <DrawerItem
              label="Trophy Wall"
              onPress={() => {
                onClose();
                onOpenTrophyWall?.();
              }}
            />
            <DrawerItem
              label="About"
              onPress={() => {
                onClose();
                onOpenAbout?.();
              }}
            />
          </View>

          {/* Spacer */}
          <View style={styles.flexSpacer} />

          {/* Pinned Bottom Section with Divider */}
          <View style={styles.bottomSection}>
            <View style={styles.divider} />
            <Pressable
              style={({ pressed }) => [
                styles.signOutButton,
                pressed && styles.itemPressed,
              ]}
              onPress={handleSignOutPress}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function DrawerItem({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.drawerItem,
        pressed && styles.itemPressed,
      ]}
      onPress={onPress}
    >
      <Text style={styles.drawerItemText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(46, 43, 36, 0.42)',
  },
  drawerSheet: {
    height: '100%',
    backgroundColor: QuietTheme.surface,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    fontFamily: Typography.display,
    fontSize: 24,
    color: QuietTheme.ink,
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 6,
    borderRadius: 8,
  },
  closeIcon: {
    fontFamily: Typography.sansMedium,
    fontSize: 18,
    color: QuietTheme.inkLight,
  },
  userInfoBox: {
    backgroundColor: QuietTheme.background,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  userName: {
    fontFamily: Typography.sansSemiBold,
    fontSize: 14,
    color: QuietTheme.ink,
  },
  userEmail: {
    fontFamily: Typography.sansRegular,
    fontSize: 12,
    color: QuietTheme.inkLight,
    marginTop: 2,
  },
  topSection: {
    gap: 4,
  },
  drawerItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  drawerItemText: {
    fontFamily: Typography.sansMedium,
    fontSize: 15,
    color: QuietTheme.ink,
  },
  flexSpacer: {
    flex: 1,
  },
  bottomSection: {
    paddingTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: QuietTheme.border,
    marginBottom: 12,
  },
  signOutButton: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  signOutText: {
    fontFamily: Typography.sansMedium,
    fontSize: 15,
    color: QuietTheme.accentBuddy,
  },
  itemPressed: {
    opacity: 0.65,
    backgroundColor: 'rgba(46, 43, 36, 0.05)',
  },
});
