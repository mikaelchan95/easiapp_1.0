import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import MobileHeader from '../Layout/MobileHeader';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category:
    | 'earning'
    | 'spending'
    | 'tiers'
    | 'vouchers'
    | 'expiry'
    | 'general';
}

interface ExpandableCardProps {
  item: FAQItem;
  isExpanded: boolean;
  onToggle: () => void;
}

const ExpandableCard: React.FC<ExpandableCardProps> = ({
  item,
  isExpanded,
  onToggle,
}) => {
  const [animation] = useState(new Animated.Value(isExpanded ? 1 : 0));

  React.useEffect(() => {
    Animated.timing(animation, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, animation]);

  const maxHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1000], // Adjust based on content
  });

  const iconRotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.faqCard}>
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={styles.faqQuestion}>{item.question}</Text>
        <Animated.View
          style={[styles.faqIcon, { transform: [{ rotate: iconRotation }] }]}
        >
          <Ionicons
            name="chevron-down"
            size={20}
            color={COLORS.textSecondary}
          />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View style={[styles.faqAnswerContainer, { maxHeight }]}>
        <View style={styles.faqAnswer}>
          <Text style={styles.faqAnswerText}>{item.answer}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const FAQ_DATA: FAQItem[] = [
  // Earning Points
  {
    id: 'earn-1',
    category: 'earning',
    question: 'How do I earn points?',
    answer:
      'You earn 1 point for every S$1 spent on eligible purchases. Bonus points are awarded for:\n\n• First corporate order: +10,000 points\n• Quarterly volume milestones (>S$50,000): +25,000 points\n• Annual renewal of payment terms: +15,000 points\n• Special promotions and events\n• Birthday bonuses and loyalty milestones',
  },
  {
    id: 'earn-2',
    category: 'earning',
    question: 'What purchases are eligible for points?',
    answer:
      'All wine and spirits purchases through our platform earn points. This includes:\n\n• Individual bottles\n• Case purchases\n• Premium and rare collections\n• Corporate bulk orders\n\nDelivery fees, taxes, and promotional discounts do not earn points.',
  },
  {
    id: 'earn-3',
    category: 'earning',
    question: 'When do points appear in my account?',
    answer:
      'Points are typically credited to your account within 24-48 hours after your order is delivered and confirmed. For large corporate orders, points may take up to 5 business days to appear.\n\nIf points are missing after this timeframe, you can report it through the "Missing Points" section in your rewards tracking.',
  },

  // Spending Points
  {
    id: 'spend-1',
    category: 'spending',
    question: 'How can I use my points?',
    answer:
      'Points can be redeemed for:\n\n• Vouchers (S$500 for 20,000 pts, S$1,500 for 50,000 pts)\n• Volume bundle deals (Buy 120 get 12 free for 100,000 pts)\n• Premium merchandise (Bar tool sets, glassware)\n• Exclusive experiences (Wine tastings, distillery tours)\n\nVouchers are the most popular redemption option and can be used on any future purchase.',
  },
  {
    id: 'spend-2',
    category: 'spending',
    question: 'Do vouchers have minimum order requirements?',
    answer:
      'Yes, vouchers have minimum order requirements to ensure fair usage:\n\n• S$500 vouchers: No minimum order\n• S$1,500 vouchers: Minimum S$1,500 order\n\nVouchers cannot be combined with other promotional discounts, but can be used with tier-based discounts (Silver/Gold member benefits).',
  },
  {
    id: 'spend-3',
    category: 'spending',
    question: 'Can I combine multiple vouchers?',
    answer:
      'No, only one voucher can be applied per order. However, you can use a voucher in combination with your tier-based discounts:\n\n• Silver members: 2% off + voucher\n• Gold members: 5% off + voucher\n\nThis maximizes your savings on large orders.',
  },

  // Tiers
  {
    id: 'tier-1',
    category: 'tiers',
    question: 'How do membership tiers work?',
    answer:
      'Membership tiers are based on your 12-month rolling spend:\n\n• Bronze: S$0 - S$50,000\n• Silver: S$50,001 - S$200,000\n• Gold: S$200,001+\n\nTiers are automatically updated monthly based on your spending history. Higher tiers unlock better benefits and exclusive privileges.',
  },
  {
    id: 'tier-2',
    category: 'tiers',
    question: 'What are the tier benefits?',
    answer:
      'Bronze Benefits:\n• Access to weekly flash-deal alerts\n\nSilver Benefits:\n• 2% off all orders\n• Early-bird slots on same-day delivery\n• All Bronze benefits\n\nGold Benefits:\n• 5% off all orders\n• Free same-day delivery\n• Exclusive volume bundles\n• Priority customer support\n• All Silver benefits',
  },
  {
    id: 'tier-3',
    category: 'tiers',
    question: 'Can I lose my tier status?',
    answer:
      "Tier status is based on a rolling 12-month period. If your spending drops below the tier threshold over 12 months, you may be moved to a lower tier.\n\nFor example, if you're Gold but your 12-month spend drops below S$200,001, you'll move to Silver. However, we review tier changes quarterly, not monthly, to provide stability.",
  },

  // Vouchers
  {
    id: 'voucher-1',
    category: 'vouchers',
    question: 'How long are vouchers valid?',
    answer:
      "Vouchers are valid for 30 days from the date of redemption. You'll receive a confirmation email with your voucher code and expiry date.\n\nWe send reminder notifications:\n• 7 days before expiry\n• 3 days before expiry\n• Final reminder on expiry day\n\nExpired vouchers cannot be extended or reactivated.",
  },
  {
    id: 'voucher-2',
    category: 'vouchers',
    question: 'What happens if my voucher expires?',
    answer:
      'Expired vouchers cannot be used and the points used to redeem them are not refunded. This policy ensures fair usage of the rewards program.\n\nTo avoid losing vouchers:\n• Set calendar reminders\n• Enable push notifications\n• Check your voucher tracking regularly\n• Plan your purchases in advance',
  },
  {
    id: 'voucher-3',
    category: 'vouchers',
    question: 'Can I transfer vouchers to someone else?',
    answer:
      'Vouchers are tied to your account and cannot be transferred to other users. However, for corporate accounts, vouchers can be used by authorized team members on the same account.\n\nIf you need to make a purchase for someone else, you can place the order using your voucher and arrange delivery to their address.',
  },

  // Expiry
  {
    id: 'expiry-1',
    category: 'expiry',
    question: 'Do points expire?',
    answer:
      'Yes, points expire 12 months from the date they were earned. This is a rolling expiry system, meaning points expire individually based on when they were earned, not all at once.\n\nWe provide advance notifications:\n• 30 days before expiry\n• 14 days before expiry\n• 7 days before expiry\n• Final reminder 24 hours before expiry',
  },
  {
    id: 'expiry-2',
    category: 'expiry',
    question: 'How can I check when my points expire?',
    answer:
      'You can view expiring points in the "Expiring" tab of your voucher tracking screen. This shows:\n\n• Points expiring in the next 30 days\n• Exact expiry dates\n• Source of the points (which order/bonus)\n• Urgent warnings for points expiring within 7 days\n\nWe recommend checking this regularly to plan your redemptions.',
  },
  {
    id: 'expiry-3',
    category: 'expiry',
    question: 'Can I extend point expiry dates?',
    answer:
      'Point expiry dates cannot be extended. However, making new purchases will earn fresh points with new 12-month expiry periods.\n\nTo maximize your points:\n• Use older points first (they expire sooner)\n• Redeem for vouchers when you have enough points\n• Plan larger purchases to use expiring points\n• Consider redeeming for experiences or merchandise',
  },

  // General
  {
    id: 'general-1',
    category: 'general',
    question: 'Is there a limit to how many points I can earn?',
    answer:
      'There is no limit to the total number of points you can earn. However, some bonus point promotions may have individual caps.\n\nFor example:\n• Regular spending: Unlimited 1 point per S$1\n• Quarterly bonuses: Capped at 25,000 points per quarter\n• Special promotions: Vary by promotion terms\n\nYour account can hold unlimited points, but remember they expire 12 months after earning.',
  },
  {
    id: 'general-2',
    category: 'general',
    question: 'What if I return an item I purchased?',
    answer:
      "If you return an item, the points earned from that purchase will be deducted from your account. If you've already used those points for redemptions, the return may be processed differently:\n\n• Points available: Deducted immediately\n• Points already used: May require alternative resolution\n• Partial returns: Points deducted proportionally\n\nContact customer support for specific return scenarios.",
  },
  {
    id: 'general-3',
    category: 'general',
    question: 'How do I report missing points?',
    answer:
      'If points are missing from your account:\n\n1. Wait 48 hours after delivery confirmation\n2. Go to Voucher Tracking > Missing tab\n3. Tap "Report Missing Points"\n4. Provide order details and expected points\n5. Our team will investigate within 3-5 business days\n\nKeep your order confirmation and delivery receipts for reference. Most missing points issues are resolved within a week.',
  },
  {
    id: 'general-4',
    category: 'general',
    question: 'Can I see my complete points history?',
    answer:
      'Yes! Your complete points history is available in the Voucher Tracking screen under the "History" tab. This includes:\n\n• All points earned and spent\n• Dates and descriptions\n• Order references\n• Categories (purchase, bonus, milestone, etc.)\n• Filtering options by transaction type\n\nThis helps you track your earning patterns and plan future redemptions.',
  },
];

export default function RewardsFAQScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All', icon: 'apps-outline' },
    { id: 'earning', label: 'Earning', icon: 'add-circle-outline' },
    { id: 'spending', label: 'Spending', icon: 'card-outline' },
    { id: 'tiers', label: 'Tiers', icon: 'trophy-outline' },
    { id: 'vouchers', label: 'Vouchers', icon: 'pricetag-outline' },
    { id: 'expiry', label: 'Expiry', icon: 'time-outline' },
    { id: 'general', label: 'General', icon: 'help-circle-outline' },
  ];

  const filteredFAQs =
    selectedCategory === 'all'
      ? FAQ_DATA
      : FAQ_DATA.filter(item => item.category === selectedCategory);

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const expandAll = () => {
    setExpandedItems(new Set(filteredFAQs.map(item => item.id)));
  };

  const collapseAll = () => {
    setExpandedItems(new Set());
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

      {/* Status Bar Background */}
      <View style={[styles.statusBarBackground, { height: insets.top }]} />

      {/* Mobile Header */}
      <MobileHeader
        title="Rewards FAQ"
        showBackButton={true}
        showCartButton={true}
        showSearch={false}
        showLocationHeader={false}
      />

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons
                name={category.icon as any}
                size={16}
                color={
                  selectedCategory === category.id
                    ? COLORS.card
                    : COLORS.textSecondary
                }
              />
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === category.id &&
                    styles.categoryButtonTextActive,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionButton} onPress={expandAll}>
          <Ionicons name="expand-outline" size={16} color={COLORS.primary} />
          <Text style={styles.quickActionText}>Expand All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={collapseAll}
        >
          <Ionicons name="contract-outline" size={16} color={COLORS.primary} />
          <Text style={styles.quickActionText}>Collapse All</Text>
        </TouchableOpacity>
      </View>

      {/* FAQ Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Info */}
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>How Points Work</Text>
          <Text style={styles.headerSubtitle}>
            Everything you need to know about earning, spending, and managing
            your rewards points.
          </Text>
        </View>

        {/* FAQ Items */}
        {filteredFAQs.map(item => (
          <ExpandableCard
            key={item.id}
            item={item}
            isExpanded={expandedItems.has(item.id)}
            onToggle={() => toggleExpanded(item.id)}
          />
        ))}

        {/* Contact Support */}
        <View style={styles.supportSection}>
          <View style={styles.supportCard}>
            <Ionicons name="headset-outline" size={32} color={COLORS.primary} />
            <Text style={styles.supportTitle}>Still have questions?</Text>
            <Text style={styles.supportText}>
              Our customer support team is here to help with any rewards-related
              questions.
            </Text>
            <TouchableOpacity style={styles.supportButton}>
              <Text style={styles.supportButtonText}>Contact Support</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.card} />
            </TouchableOpacity>
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

  // Category Filter
  categoryContainer: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryScroll: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryButtonText: {
    ...TYPOGRAPHY.bodySmall,
    marginLeft: SPACING.xs,
    color: COLORS.textSecondary,
  },
  categoryButtonTextActive: {
    color: COLORS.card,
    fontWeight: '600',
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActionText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
    fontWeight: '500',
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.md,
  },

  // Header Info
  headerInfo: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // FAQ Cards
  faqCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    ...SHADOWS.light,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  faqQuestion: {
    ...TYPOGRAPHY.h5,
    flex: 1,
    marginRight: SPACING.md,
    lineHeight: 22,
  },
  faqIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqAnswerContainer: {
    overflow: 'hidden',
  },
  faqAnswer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  faqAnswerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  // Support Section
  supportSection: {
    paddingVertical: SPACING.xl,
  },
  supportCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  supportTitle: {
    ...TYPOGRAPHY.h4,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  supportText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  supportButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.card,
    fontWeight: '600',
    marginRight: SPACING.xs,
  },

  // Bottom Padding
  bottomPadding: {
    height: SPACING.xxl,
  },
});
