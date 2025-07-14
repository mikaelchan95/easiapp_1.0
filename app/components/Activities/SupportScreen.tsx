import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  TextInput,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import * as Animations from '../../utils/animations';

const { width } = Dimensions.get('window');

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

interface ContactMethod {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  action: () => void;
  available: boolean;
  responseTime?: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    question: 'How do I track my order?',
    answer:
      'You can track your order by going to "Order History" in your account, or by clicking the tracking link in your confirmation email.',
    category: 'orders',
    helpful: 45,
  },
  {
    id: '2',
    question: 'What is your return policy?',
    answer:
      'We offer a 30-day return policy for unopened items. Due to regulations, alcohol returns may have restrictions based on your location.',
    category: 'returns',
    helpful: 32,
  },
  {
    id: '3',
    question: 'Do you deliver to my area?',
    answer:
      'We deliver to most areas. Enter your zip code during checkout to see if delivery is available in your location.',
    category: 'delivery',
    helpful: 28,
  },
  {
    id: '4',
    question: 'How do I use my rewards points?',
    answer:
      'Rewards points are automatically applied at checkout. You can also manually apply them on the payment screen.',
    category: 'rewards',
    helpful: 22,
  },
  {
    id: '5',
    question: 'Is my payment information secure?',
    answer:
      'Yes, we use industry-standard encryption and never store your full credit card details. All transactions are processed securely.',
    category: 'security',
    helpful: 18,
  },
];

const HELP_CATEGORIES = [
  {
    id: 'orders',
    title: 'Orders & Delivery',
    icon: 'cube-outline',
    color: '#4CAF50',
  },
  {
    id: 'returns',
    title: 'Returns & Refunds',
    icon: 'return-down-back-outline',
    color: '#2196F3',
  },
  {
    id: 'account',
    title: 'Account & Profile',
    icon: 'person-outline',
    color: '#9C27B0',
  },
  {
    id: 'rewards',
    title: 'Rewards & Points',
    icon: 'gift-outline',
    color: '#FF9800',
  },
  {
    id: 'security',
    title: 'Security & Privacy',
    icon: 'shield-outline',
    color: '#607D8B',
  },
  {
    id: 'delivery',
    title: 'Delivery Info',
    icon: 'location-outline',
    color: '#E91E63',
  },
];

export default function SupportScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [filteredFAQs, setFilteredFAQs] = useState(FAQ_DATA);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Contact methods
  const contactMethods: ContactMethod[] = [
    {
      id: 'chat',
      title: 'Live Chat',
      subtitle: 'Chat with our support team',
      icon: 'chatbubble-outline',
      color: '#4CAF50',
      available: true,
      responseTime: 'Usually responds in 2-3 minutes',
      action: () => console.log('Open live chat'),
    },
    {
      id: 'email',
      title: 'Email Support',
      subtitle: 'Send us a detailed message',
      icon: 'mail-outline',
      color: '#2196F3',
      available: true,
      responseTime: 'Usually responds within 24 hours',
      action: () => Linking.openURL('mailto:support@easiapp.com'),
    },
    {
      id: 'phone',
      title: 'Phone Support',
      subtitle: 'Speak with a representative',
      icon: 'call-outline',
      color: '#FF9800',
      available: true,
      responseTime: 'Mon-Fri 9AM-6PM EST',
      action: () => Linking.openURL('tel:+1-800-EASI-APP'),
    },
    {
      id: 'video',
      title: 'Video Call',
      subtitle: 'Schedule a video consultation',
      icon: 'videocam-outline',
      color: '#9C27B0',
      available: false,
      responseTime: 'Available for premium members',
      action: () => console.log('Schedule video call'),
    },
  ];

  useEffect(() => {
    // Initial animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Animations.TIMING.easeOut,
      }),
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
        easing: Animations.TIMING.easeOut,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Filter FAQs
    let filtered = FAQ_DATA;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        faq =>
          faq.question.toLowerCase().indexOf(searchQuery.toLowerCase()) !==
            -1 ||
          faq.answer.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1
      );
    }

    setFilteredFAQs(filtered);
  }, [selectedCategory, searchQuery]);

  const handleFAQPress = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const renderHelpCategory = (category: any) => {
    const isSelected = selectedCategory === category.id;

    return (
      <TouchableOpacity
        key={category.id}
        style={[
          styles.categoryButton,
          isSelected && styles.categoryButtonSelected,
        ]}
        onPress={() => setSelectedCategory(category.id)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Filter by ${category.title}`}
      >
        <View
          style={[
            styles.categoryIcon,
            { backgroundColor: `${category.color}15` },
          ]}
        >
          <Ionicons
            name={category.icon as any}
            size={20}
            color={isSelected ? COLORS.accent : category.color}
          />
        </View>
        <Text
          style={[
            styles.categoryText,
            isSelected && styles.categoryTextSelected,
          ]}
        >
          {category.title}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFAQItem = (faq: FAQItem) => {
    const isExpanded = expandedFAQ === faq.id;
    const rotateAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

    useEffect(() => {
      Animated.timing(rotateAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
        easing: Animations.TIMING.easeInOut,
      }).start();
    }, [isExpanded]);

    const rotation = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });

    return (
      <View key={faq.id} style={styles.faqItem}>
        <TouchableOpacity
          style={styles.faqQuestion}
          onPress={() => handleFAQPress(faq.id)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`FAQ: ${faq.question}`}
        >
          <Text style={styles.faqQuestionText}>{faq.question}</Text>
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Ionicons name="chevron-down" size={20} color={COLORS.inactive} />
          </Animated.View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.faqAnswer}>
            <Text style={styles.faqAnswerText}>{faq.answer}</Text>
            <View style={styles.faqMeta}>
              <TouchableOpacity style={styles.helpfulButton}>
                <Ionicons
                  name="thumbs-up-outline"
                  size={16}
                  color={COLORS.inactive}
                />
                <Text style={styles.helpfulText}>Helpful ({faq.helpful})</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderContactMethod = (method: ContactMethod) => {
    return (
      <TouchableOpacity
        key={method.id}
        style={[
          styles.contactMethod,
          !method.available && styles.contactMethodDisabled,
        ]}
        onPress={method.action}
        disabled={!method.available}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${method.title}: ${method.subtitle}`}
      >
        <View
          style={[styles.contactIcon, { backgroundColor: `${method.color}15` }]}
        >
          <Ionicons
            name={method.icon as any}
            size={24}
            color={method.available ? method.color : COLORS.inactive}
          />
          {method.available && (
            <View
              style={[styles.statusDot, { backgroundColor: method.color }]}
            />
          )}
        </View>

        <View style={styles.contactInfo}>
          <Text
            style={[
              styles.contactTitle,
              !method.available && styles.contactTitleDisabled,
            ]}
          >
            {method.title}
          </Text>
          <Text style={styles.contactSubtitle}>{method.subtitle}</Text>
          {method.responseTime && (
            <Text style={styles.responseTime}>{method.responseTime}</Text>
          )}
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={method.available ? COLORS.inactive : COLORS.border}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <Text style={styles.headerSubtitle}>How can we help you today?</Text>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <Animated.View style={[styles.searchSection, { opacity: fadeAnim }]}>
          <View
            style={[
              styles.searchContainer,
              isSearchFocused && styles.searchContainerFocused,
            ]}
          >
            <Ionicons name="search-outline" size={20} color={COLORS.inactive} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for help..."
              placeholderTextColor={COLORS.inactive}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              accessible={true}
              accessibilityLabel="Search help topics"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={COLORS.inactive}
                />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Contact Methods */}
        <Animated.View style={[styles.contactSection, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contactGrid}>
            {contactMethods.map(renderContactMethod)}
          </View>
        </Animated.View>

        {/* Help Categories */}
        <Animated.View
          style={[styles.categoriesSection, { opacity: fadeAnim }]}
        >
          <Text style={styles.sectionTitle}>Browse by Topic</Text>
          <View style={styles.categoriesGrid}>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === 'all' && styles.categoryButtonSelected,
              ]}
              onPress={() => setSelectedCategory('all')}
            >
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: `${COLORS.primary}15` },
                ]}
              >
                <Ionicons
                  name="grid-outline"
                  size={20}
                  color={
                    selectedCategory === 'all' ? COLORS.accent : COLORS.primary
                  }
                />
              </View>
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === 'all' && styles.categoryTextSelected,
                ]}
              >
                All Topics
              </Text>
            </TouchableOpacity>
            {HELP_CATEGORIES.map(renderHelpCategory)}
          </View>
        </Animated.View>

        {/* FAQ Section */}
        <Animated.View style={[styles.faqSection, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>
            Frequently Asked Questions
            {selectedCategory !== 'all' && ` (${filteredFAQs.length})`}
          </Text>

          {filteredFAQs.length > 0 ? (
            <View style={styles.faqList}>
              {filteredFAQs.map(renderFAQItem)}
            </View>
          ) : (
            <View style={styles.noResultsContainer}>
              <Ionicons
                name="search-outline"
                size={48}
                color={COLORS.inactive}
              />
              <Text style={styles.noResultsTitle}>No results found</Text>
              <Text style={styles.noResultsText}>
                Try adjusting your search or browse different topics
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Additional Help */}
        <Animated.View
          style={[styles.additionalSection, { opacity: fadeAnim }]}
        >
          <View style={styles.additionalCard}>
            <Ionicons name="bulb-outline" size={32} color={COLORS.primary} />
            <Text style={styles.additionalTitle}>Still need help?</Text>
            <Text style={styles.additionalText}>
              Our support team is here to help you with any questions or issues.
            </Text>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => console.log('Open live chat')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Start live chat"
            >
              <Text style={styles.contactButtonText}>Start Live Chat</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.accent} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginRight: SPACING.md,
    ...SHADOWS.light,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchContainerFocused: {
    borderColor: COLORS.primary,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  contactSection: {
    marginBottom: SPACING.xl,
  },
  contactGrid: {
    paddingHorizontal: SPACING.lg,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.md,
    ...SHADOWS.light,
  },
  contactMethodDisabled: {
    opacity: 0.6,
  },
  contactIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  contactTitleDisabled: {
    color: COLORS.inactive,
  },
  contactSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
  },
  responseTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.inactive,
  },
  categoriesSection: {
    marginBottom: SPACING.xl,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    justifyContent: 'space-between',
  },
  categoryButton: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  categoryTextSelected: {
    color: COLORS.accent,
  },
  faqSection: {
    marginBottom: SPACING.xl,
  },
  faqList: {
    paddingHorizontal: SPACING.lg,
  },
  faqItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    ...SHADOWS.light,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  faqQuestionText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.md,
  },
  faqAnswer: {
    padding: SPACING.lg,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  faqAnswerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  faqMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  helpfulText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.inactive,
    marginLeft: SPACING.xs,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  noResultsTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  noResultsText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  additionalSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  additionalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  additionalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  additionalText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  contactButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
    fontWeight: '600',
    marginRight: SPACING.sm,
  },
});
