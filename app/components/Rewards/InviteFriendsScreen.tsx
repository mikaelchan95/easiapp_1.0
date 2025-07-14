import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { HapticFeedback } from '../../utils/haptics';
import MobileHeader from '../Layout/MobileHeader';

const mockReferralCode = 'MIKE2024';

const shareOptions = [
  {
    id: 'message',
    title: 'Text Message',
    icon: 'chatbubble-outline',
    color: '#4CAF50',
    action: 'sms',
  },
  {
    id: 'email',
    title: 'Email',
    icon: 'mail-outline',
    color: '#2196F3',
    action: 'email',
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp',
    icon: 'logo-whatsapp',
    color: '#25D366',
    action: 'whatsapp',
  },
  {
    id: 'social',
    title: 'Social Media',
    icon: 'share-social-outline',
    color: '#9C27B0',
    action: 'social',
  },
  {
    id: 'copy',
    title: 'Copy Link',
    icon: 'copy-outline',
    color: '#FF9800',
    action: 'copy',
  },
  {
    id: 'more',
    title: 'More Options',
    icon: 'ellipsis-horizontal',
    color: '#607D8B',
    action: 'more',
  },
];

export default function InviteFriendsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [customMessage, setCustomMessage] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const defaultMessage = `Hey! I've been using EASI for premium spirit deliveries and thought you'd love it too! Use my referral code ${mockReferralCode} when you sign up and we both get S$20 credit. Download the app: [App Store Link]`;

  const handleShareOption = useCallback(
    async (option: (typeof shareOptions)[0]) => {
      const message = customMessage || defaultMessage;

      try {
        switch (option.action) {
          case 'sms':
            await Linking.openURL(`sms:?body=${encodeURIComponent(message)}`);
            break;
          case 'email':
            await Linking.openURL(
              `mailto:?subject=${encodeURIComponent('Join me on EASI!')}&body=${encodeURIComponent(message)}`
            );
            break;
          case 'whatsapp':
            await Linking.openURL(
              `whatsapp://send?text=${encodeURIComponent(message)}`
            );
            break;
          case 'social':
          case 'more':
            await Share.share({
              message,
              title: 'Join EASI - Premium Spirits Delivered',
            });
            break;
          case 'copy':
            // In a real app, this would copy to clipboard
            Alert.alert('Copied!', 'Referral message copied to clipboard');
            break;
        }
        HapticFeedback.light();
      } catch (error) {
        console.error('Error sharing:', error);
        Alert.alert('Error', 'Unable to share at this time');
      }
    },
    [customMessage, defaultMessage]
  );

  const handleBulkInvite = useCallback(() => {
    Alert.alert(
      'Bulk Invite',
      'This feature would allow you to import contacts and send bulk invitations.',
      [{ text: 'OK' }]
    );
  }, []);

  const handlePersonalizedInvite = useCallback(() => {
    Alert.alert(
      'Personalized Invite',
      'This feature would allow you to create personalized invitation messages for specific friends.',
      [{ text: 'OK' }]
    );
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

      {/* Status Bar Background */}
      <View style={[styles.statusBarBackground, { height: insets.top }]} />

      {/* Mobile Header */}
      <MobileHeader
        title="Invite Friends"
        showBackButton={true}
        showCartButton={true}
        showSearch={false}
        showLocationHeader={false}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Referral Code Section */}
        <View style={styles.codeSection}>
          <View style={styles.codeContainer}>
            <View style={styles.codeHeader}>
              <Text style={styles.codeTitle}>Your Referral Code</Text>
              <Text style={styles.codeValue}>{mockReferralCode}</Text>
            </View>
            <Text style={styles.codeDescription}>
              Share this code with friends to earn S$20 credit for both of you
              when they make their first purchase of S$100+
            </Text>
          </View>
        </View>

        {/* Custom Message Section */}
        <View style={styles.messageSection}>
          <Text style={styles.sectionTitle}>Customize Your Message</Text>
          <View style={styles.messageContainer}>
            <TextInput
              style={styles.messageInput}
              value={customMessage}
              onChangeText={setCustomMessage}
              placeholder={defaultMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={COLORS.textSecondary}
            />
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => setCustomMessage('')}
            >
              <Text style={styles.resetButtonText}>Use Default</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Share Options Grid */}
        <View style={styles.shareSection}>
          <Text style={styles.sectionTitle}>Share With Friends</Text>
          <View style={styles.shareGrid}>
            {shareOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={styles.shareOption}
                onPress={() => handleShareOption(option)}
              >
                <View
                  style={[
                    styles.shareIcon,
                    { backgroundColor: `${option.color}15` },
                  ]}
                >
                  <Ionicons name={option.icon} size={24} color={option.color} />
                </View>
                <Text style={styles.shareTitle}>{option.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleBulkInvite}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="people-outline" size={24} color={COLORS.text} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Bulk Invite</Text>
              <Text style={styles.actionDescription}>
                Import contacts and send multiple invitations at once
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handlePersonalizedInvite}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="create-outline" size={24} color={COLORS.text} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Personalized Invites</Text>
              <Text style={styles.actionDescription}>
                Create custom messages for specific friends
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ReferralHistory')}
          >
            <View style={styles.actionIcon}>
              <Ionicons
                name="analytics-outline"
                size={24}
                color={COLORS.text}
              />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Track Performance</Text>
              <Text style={styles.actionDescription}>
                See who you've invited and your earnings
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Tips for Success</Text>
          <View style={styles.tipsContainer}>
            <View style={styles.tip}>
              <View style={styles.tipIcon}>
                <Ionicons name="bulb-outline" size={20} color={COLORS.text} />
              </View>
              <Text style={styles.tipText}>
                Personal messages work better than generic ones. Mention why you
                love the app!
              </Text>
            </View>

            <View style={styles.tip}>
              <View style={styles.tipIcon}>
                <Ionicons name="time-outline" size={20} color={COLORS.text} />
              </View>
              <Text style={styles.tipText}>
                Follow up with friends after they sign up to help them make
                their first purchase
              </Text>
            </View>

            <View style={styles.tip}>
              <View style={styles.tipIcon}>
                <Ionicons name="gift-outline" size={20} color={COLORS.text} />
              </View>
              <Text style={styles.tipText}>
                Remind them about the S$20 credit they'll get - it's a great
                incentive!
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
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
  },
  scrollView: {
    flex: 1,
  },

  // Code Section
  codeSection: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  codeContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    ...SHADOWS.light,
  },
  codeHeader: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  codeTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  codeValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    fontWeight: '800',
    letterSpacing: 2,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  codeDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Message Section
  messageSection: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  messageContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    ...SHADOWS.light,
  },
  messageInput: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
    minHeight: 100,
    marginBottom: SPACING.md,
    textAlignVertical: 'top',
  },
  resetButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  resetButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '500',
  },

  // Share Section
  shareSection: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  shareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  shareOption: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 12,
    ...SHADOWS.light,
  },
  shareIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  shareTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Actions Section
  actionsSection: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    ...SHADOWS.light,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    ...TYPOGRAPHY.h5,
    color: COLORS.text,
    fontWeight: '600',
  },
  actionDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  // Tips Section
  tipsSection: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  tipsContainer: {
    gap: SPACING.md,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 12,
    ...SHADOWS.light,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  tipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    flex: 1,
    lineHeight: 20,
  },

  bottomPadding: {
    height: SPACING.xxl,
  },
});
