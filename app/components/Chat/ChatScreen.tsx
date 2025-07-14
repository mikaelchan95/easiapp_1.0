import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, FONT_WEIGHTS } from '../../utils/theme';
import MobileHeader from '../Layout/MobileHeader';

interface ChatMessage {
  id: string;
  text: string;
  timestamp: Date;
  isUser: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface ChatSupportCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const SUPPORT_CATEGORIES: ChatSupportCategory[] = [
  {
    id: 'orders',
    title: 'Orders & Delivery',
    description: 'Track orders, delivery issues, returns',
    icon: 'bag-outline',
  },
  {
    id: 'products',
    title: 'Product Support',
    description: 'Product questions, availability, recommendations',
    icon: 'cube-outline',
  },
  {
    id: 'billing',
    title: 'Billing & Payments',
    description: 'Payment issues, invoices, billing questions',
    icon: 'card-outline',
  },
  {
    id: 'account',
    title: 'Account & Settings',
    description: 'Profile updates, password reset, preferences',
    icon: 'person-outline',
  },
];

const AUTO_RESPONSES = {
  orders:
    'Hi! I can help you with your orders. You can track your current orders in the Orders section or ask me about delivery times, returns, and order modifications.',
  products:
    "Hello! I'm here to help with product questions. I can provide information about availability, specifications, and recommendations based on your needs.",
  billing:
    "Hi there! For billing questions, I can help you understand your invoices, payment methods, and billing cycles. For urgent payment issues, I'll connect you with our billing team.",
  account:
    'Hello! I can assist with account settings, profile updates, and general app navigation. What would you like help with today?',
  general:
    "Hi! I'm your EASI support assistant. I can help with orders, products, billing, and account questions. How can I assist you today?",
};

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showCategories, setShowCategories] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      text: "👋 Welcome to EASI Support! I'm here to help you with orders, products, billing, and account questions. Choose a category below or type your question.",
      timestamp: new Date(),
      isUser: false,
      status: 'delivered',
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleCategorySelect = (category: ChatSupportCategory) => {
    setShowCategories(false);

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: `I need help with ${category.title}`,
      timestamp: new Date(),
      isUser: true,
      status: 'sent',
    };

    setMessages(prev => [...prev, userMessage]);

    // Simulate typing and auto-response
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const botResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: AUTO_RESPONSES[category.id as keyof typeof AUTO_RESPONSES],
          timestamp: new Date(),
          isUser: false,
          status: 'delivered',
        };
        setMessages(prev => [...prev, botResponse]);
      }, 1500);
    }, 500);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      timestamp: new Date(),
      isUser: true,
      status: 'sending',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setShowCategories(false);

    // Simulate message delivery
    setTimeout(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
        )
      );
    }, 500);

    // Simulate bot typing and response
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const botResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: 'Thanks for your message! Our support team will respond shortly. In the meantime, you can check our FAQ section or browse your order history for quick answers.',
          timestamp: new Date(),
          isUser: false,
          status: 'delivered',
        };
        setMessages(prev => [...prev, botResponse]);
      }, 2000);
    }, 1000);
  };

  const handleCallSupport = () => {
    Alert.alert('Call Support', 'Would you like to call our support team?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Call Now',
        onPress: () => {
          // In a real app, this would use Linking.openURL('tel:+1234567890')
          Alert.alert(
            'Feature Coming Soon',
            'Phone support will be available in the next update.'
          );
        },
      },
    ]);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessage : styles.botMessage,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          item.isUser ? styles.userMessageText : styles.botMessageText,
        ]}
      >
        {item.text}
      </Text>
      <View style={styles.messageFooter}>
        <Text
          style={[
            styles.timestamp,
            item.isUser ? styles.userTimestamp : styles.botTimestamp,
          ]}
        >
          {item.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        {item.isUser && (
          <Ionicons
            name={
              item.status === 'sending'
                ? 'time-outline'
                : 'checkmark-done-outline'
            }
            size={12}
            color={item.isUser ? COLORS.accent : COLORS.textSecondary}
            style={styles.statusIcon}
          />
        )}
      </View>
    </View>
  );

  const renderTypingIndicator = () => (
    <View style={[styles.messageContainer, styles.botMessage]}>
      <View style={styles.typingContainer}>
        <View style={styles.typingDot} />
        <View style={[styles.typingDot, { animationDelay: '0.2s' }]} />
        <View style={[styles.typingDot, { animationDelay: '0.4s' }]} />
      </View>
    </View>
  );

  const renderCategoryCard = ({ item }: { item: ChatSupportCategory }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleCategorySelect(item)}
    >
      <View style={styles.categoryIcon}>
        <Ionicons name={item.icon as any} size={24} color={COLORS.primary} />
      </View>
      <View style={styles.categoryContent}>
        <Text style={styles.categoryTitle}>{item.title}</Text>
        <Text style={styles.categoryDescription}>{item.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Status Bar Background */}
      <View style={[styles.statusBarBackground, { height: insets.top }]} />

      {/* Header */}
      <MobileHeader
        title="Support Chat"
        showBackButton={false}
        showSearch={false}
        showCartButton={false}
        rightButton={
          <TouchableOpacity
            onPress={handleCallSupport}
            style={styles.callButton}
          >
            <Ionicons name="call" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />

      {/* Chat Content */}
      <View style={styles.chatContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={isTyping ? renderTypingIndicator : null}
        />

        {/* Support Categories */}
        {showCategories && messages.length <= 1 && (
          <View style={styles.categoriesContainer}>
            <Text style={styles.categoriesTitle}>How can we help you?</Text>
            <FlatList
              data={SUPPORT_CATEGORIES}
              renderItem={renderCategoryCard}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Input Container */}
        <View
          style={[
            styles.inputContainer,
            { paddingBottom: insets.bottom + SPACING.md },
          ]}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: inputText.trim()
                    ? COLORS.primary
                    : COLORS.textSecondary,
                },
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
            >
              <Ionicons name="send" size={20} color={COLORS.accent} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  callButton: {
    padding: SPACING.xs,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: SPACING.md,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  botMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    ...TYPOGRAPHY.body,
    lineHeight: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 18,
  },
  userMessageText: {
    backgroundColor: COLORS.primary,
    color: COLORS.accent,
  },
  botMessageText: {
    backgroundColor: COLORS.card,
    color: COLORS.text,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    paddingHorizontal: SPACING.xs,
  },
  timestamp: {
    ...TYPOGRAPHY.tiny,
    fontSize: 11,
  },
  userTimestamp: {
    color: COLORS.textSecondary,
  },
  botTimestamp: {
    color: COLORS.textSecondary,
  },
  statusIcon: {
    marginLeft: 4,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: 18,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textSecondary,
    marginHorizontal: 2,
    // Animation would be handled with Animated API in a real implementation
  },
  categoriesContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    margin: SPACING.md,
    borderRadius: 12,
  },
  categoriesTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: FONT_WEIGHTS.medium,
    marginBottom: 2,
  },
  categoryDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  inputContainer: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.background,
    borderRadius: 24,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  textInput: {
    ...TYPOGRAPHY.body,
    flex: 1,
    maxHeight: 100,
    color: COLORS.text,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.xs,
  },
});
