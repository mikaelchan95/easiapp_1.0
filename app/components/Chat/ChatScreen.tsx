import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import MobileHeader from '../Layout/MobileHeader';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Status Bar Background */}
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      
      {/* Header */}
      <MobileHeader 
        title="Chat" 
        showBackButton={false} 
        showSearch={false}
        showCartButton={false}
      />

      <View style={styles.content}>
        <Text style={styles.comingSoonText}>Chat Feature</Text>
        <Text style={styles.descriptionText}>Coming Soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  statusBarBackground: {
    backgroundColor: COLORS.card,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  comingSoonText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  descriptionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});