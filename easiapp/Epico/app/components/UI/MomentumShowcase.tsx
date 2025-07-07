import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import * as Animations from '../../utils/animations';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

// Import components we created
import ProgressBar from './ProgressBar';
import ProgressIndicator from './ProgressIndicator';
import AnimatedFeedback from './AnimatedFeedback';

const { width } = Dimensions.get('window');

export default function MomentumShowcase() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // State for various progress indicators
  const [progressValue, setProgressValue] = useState(0.3);
  const [levelProgress, setLevelProgress] = useState(0.7);
  const [currentLevel, setCurrentLevel] = useState(5);
  const [currentPoints, setCurrentPoints] = useState(700);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'success' | 'streak' | 'levelUp'>('success');
  const [streakCount, setStreakCount] = useState(2);
  
  // Animation values
  const animateProgress = () => {
    setProgressValue(0);
    let progress = 0;
    
    const incrementProgress = () => {
      progress += 0.05;
      setProgressValue(progress);
      
      if (progress < 1) {
        setTimeout(incrementProgress, 50);
      }
    };
    
    incrementProgress();
  };
  
  const handleLevelUp = () => {
    // Simulate earning points to reach next level
    setCurrentPoints(prev => {
      // Points needed to reach next level
      const neededPoints = 1000 - prev;
      return prev + neededPoints + Math.floor(Math.random() * 100); // Add a bit more
    });
  };
  
  const handleStreakIncrease = () => {
    setStreakCount(prev => prev + 1);
    
    // If we reached a streak milestone (multiple of 3)
    if ((streakCount + 1) % 3 === 0) {
      setFeedbackType('streak');
      setFeedbackVisible(true);
      
      setTimeout(() => {
        setFeedbackVisible(false);
      }, 3000);
    }
  };
  
  const showFeedback = (type: 'success' | 'streak' | 'levelUp') => {
    setFeedbackType(type);
    setFeedbackVisible(true);
    
    setTimeout(() => {
      setFeedbackVisible(false);
    }, 3000);
  };
  
  // Handle level change when points change
  useEffect(() => {
    if (currentPoints >= 1000) {
      setCurrentLevel(prev => prev + 1);
      setCurrentPoints(prev => prev - 1000);
      
      // Show level up feedback
      showFeedback('levelUp');
    }
  }, [currentPoints]);

  return (
    <View style={styles.container}>
      {/* Status Bar Space */}
      <View style={{ height: insets.top, backgroundColor: COLORS.card }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress & Momentum</Text>
        <View style={styles.spacer} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.sectionTitle}>Progress Bars</Text>
        
        {/* Basic Progress Bar */}
        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>Basic Progress</Text>
          <ProgressBar 
            progress={progressValue}
            height={8}
            showLabel={true}
            animated={true}
          />
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={animateProgress}
          >
            <Text style={styles.buttonText}>Animate</Text>
          </TouchableOpacity>
        </View>
        
        {/* Streak Progress Bar */}
        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>Streak Progress</Text>
          <ProgressBar 
            progress={streakCount % 3 / 3}
            height={8}
            showLabel={true}
            streakCount={Math.floor(streakCount / 3)}
            streakEnabled={true}
            showStreakAnimation={streakCount > 0 && streakCount % 3 === 0}
            fillColor={COLORS.success}
          />
          <Text style={styles.streakText}>
            Streak: {Math.floor(streakCount / 3)}x • {3 - (streakCount % 3)} more to next streak
          </Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleStreakIncrease}
          >
            <Text style={styles.buttonText}>Add Progress</Text>
          </TouchableOpacity>
        </View>
        
        {/* Level Progress Indicator */}
        <Text style={styles.sectionTitle}>Level Progress</Text>
        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>Level Progression</Text>
          <ProgressIndicator
            currentLevel={currentLevel}
            nextLevelThreshold={1000}
            currentPoints={currentPoints}
            showAnimation={true}
            progressColor={COLORS.primary}
          />
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setCurrentPoints(prev => prev + 200)}
          >
            <Text style={styles.buttonText}>Earn 200 Points</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.levelUpButton]}
            onPress={handleLevelUp}
          >
            <Text style={styles.buttonText}>Level Up!</Text>
          </TouchableOpacity>
        </View>
        
        {/* Feedback Animations */}
        <Text style={styles.sectionTitle}>Feedback Animations</Text>
        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>Toast Notifications</Text>
          <View style={styles.feedbackButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.successButton]}
              onPress={() => showFeedback('success')}
            >
              <Text style={styles.buttonText}>Success</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.streakButton]}
              onPress={() => showFeedback('streak')}
            >
              <Text style={styles.buttonText}>Streak</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.levelUpButton]}
              onPress={() => showFeedback('levelUp')}
            >
              <Text style={styles.buttonText}>Level Up</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Animations Explanation */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About Progress & Momentum</Text>
          <Text style={styles.infoText}>
            Progress indicators help users visualize their accomplishments and build anticipation
            for what's next. Streaks, filling bars, and level transitions make progress feel
            tangible and rewarding.
          </Text>
          <View style={styles.infoItem}>
            <Ionicons name="flash" size={20} color={COLORS.primary} />
            <Text style={styles.infoItemText}>Momentum keeps users engaged</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="trending-up" size={20} color={COLORS.primary} />
            <Text style={styles.infoItemText}>Progress builds habit formation</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="star" size={20} color={COLORS.primary} />
            <Text style={styles.infoItemText}>Rewards create positive reinforcement</Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Feedback notifications */}
      <AnimatedFeedback
        type={feedbackType}
        message={
          feedbackType === 'success' 
            ? 'Action completed successfully!' 
            : feedbackType === 'streak' 
              ? `🔥 You're on a streak! ${Math.floor(streakCount / 3)}x multiplier!` 
              : `✨ Level Up! You've reached level ${currentLevel}!`
        }
        visible={feedbackVisible}
        position="bottom"
        showCartAnimation={feedbackType === 'success'}
        streakCount={Math.floor(streakCount / 3)}
        progressValue={feedbackType === 'streak' ? streakCount % 3 / 3 : 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  spacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  demoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  demoTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  streakButton: {
    backgroundColor: '#8C0044',
  },
  levelUpButton: {
    backgroundColor: '#4A148C',
  },
  buttonText: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  streakText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.inactive,
    marginTop: SPACING.sm,
  },
  feedbackButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  infoTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  infoText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  infoItemText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
}); 