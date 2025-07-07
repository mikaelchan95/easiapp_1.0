import React, { useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  I18nManager,
  Platform,
  PanResponder,
  Dimensions,
} from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '../../utils/haptics';
import { COLORS } from '../../utils/theme';

interface SwipeableListItemProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onArchive?: () => void;
  onFavorite?: () => void;
  rightActions?: Array<{
    label: string;
    icon: string;
    color: string;
    onPress: () => void;
  }>;
  leftActions?: Array<{
    label: string;
    icon: string;
    color: string;
    onPress: () => void;
  }>;
  enabled?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.25;

const SwipeableListItem: React.FC<SwipeableListItemProps> = ({
  children,
  onDelete,
  onArchive,
  onFavorite,
  rightActions,
  leftActions,
  enabled = true,
}) => {
  const swipeableRef = useRef<Swipeable>(null);
  const translateX = useRef(new Animated.Value(0)).current;

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if (!leftActions?.length && !onFavorite) return null;

    const actions = leftActions || [
      {
        label: 'Favorite',
        icon: 'heart',
        color: '#ff6b6b',
        onPress: onFavorite!,
      },
    ];

    return (
      <View style={styles.leftActionsContainer}>
        {actions.map((action, index) => {
          const trans = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [-100, 0],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.actionContainer,
                { transform: [{ translateX: trans }] },
              ]}
            >
              <RectButton
                style={[styles.leftAction, { backgroundColor: action.color }]}
                onPress={() => {
                  HapticFeedback.medium();
                  action.onPress();
                  swipeableRef.current?.close();
                }}
              >
                <Ionicons name={action.icon as any} size={24} color="white" />
                <Text style={styles.actionText}>{action.label}</Text>
              </RectButton>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if (!rightActions?.length && !onDelete && !onArchive) return null;

    const defaultActions = [];
    if (onArchive) {
      defaultActions.push({
        label: 'Archive',
        icon: 'archive',
        color: '#4ECDC4',
        onPress: onArchive,
      });
    }
    if (onDelete) {
      defaultActions.push({
        label: 'Delete',
        icon: 'trash',
        color: '#FF6B6B',
        onPress: onDelete,
      });
    }

    const actions = rightActions || defaultActions;

    return (
      <View style={styles.rightActionsContainer}>
        {actions.map((action, index) => {
          const trans = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [100, 0],
          });

          const scale = dragX.interpolate({
            inputRange: [-200, -100, -50, 0],
            outputRange: [1, 0.9, 0.9, 0.9],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.actionContainer,
                {
                  transform: [{ translateX: trans }, { scale }],
                },
              ]}
            >
              <RectButton
                style={[styles.rightAction, { backgroundColor: action.color }]}
                onPress={() => {
                  if (action.label === 'Delete') {
                    HapticFeedback.heavy();
                  } else {
                    HapticFeedback.medium();
                  }
                  action.onPress();
                  swipeableRef.current?.close();
                }}
              >
                <Ionicons name={action.icon as any} size={24} color="white" />
                <Text style={styles.actionText}>{action.label}</Text>
              </RectButton>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  const onSwipeableWillOpen = (direction: 'left' | 'right') => {
    // Light haptic when swipe starts
    HapticFeedback.light();
  };

  const onSwipeableOpen = (direction: 'left' | 'right') => {
    // Medium haptic when swipe completes
    HapticFeedback.medium();
  };

  if (!enabled) {
    return <View>{children}</View>;
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      onSwipeableWillOpen={onSwipeableWillOpen}
      onSwipeableOpen={onSwipeableOpen}
      overshootLeft={false}
      overshootRight={false}
      friction={2}
      leftThreshold={SWIPE_THRESHOLD}
      rightThreshold={SWIPE_THRESHOLD}
      enableTrackpadTwoFingerGesture={Platform.OS === 'ios'}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              {
                translateX: translateX.interpolate({
                  inputRange: [-100, 0, 100],
                  outputRange: [-10, 0, 10],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
  },
  leftActionsContainer: {
    flexDirection: 'row',
  },
  rightActionsContainer: {
    flexDirection: 'row',
  },
  actionContainer: {
    flex: 1,
  },
  leftAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
    paddingHorizontal: 10,
  },
  rightAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
    paddingHorizontal: 10,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default SwipeableListItem;