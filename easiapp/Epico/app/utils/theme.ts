import { TextStyle } from 'react-native';

/**
 * App theme colors based on the design system - SIMPLIFIED
 */
export const COLORS = {
  // Primary colors
  primary: '#000000', // Black
  accent: '#FFFFFF', // White
  
  // UI colors
  background: '#F1F1F1', // Light grey background
  card: '#FFFFFF', // White for cards
  text: '#000000', // Black for text
  textSecondary: '#666666', // Dark gray for secondary text
  border: '#E0E0E0', // Light gray for borders
  placeholder: '#999999', // Medium gray for placeholders
  inactive: '#666666', // Dark gray for inactive elements
  
  // Status colors
  success: '#4CAF50',
  error: '#F44336',
  
  // Backgrounds for dark elements
  secondary: '#333333', // Dark gray for secondary elements
  badgeBackground: '#000000',
};

/**
 * Shadow styles based on the design system
 */
export const SHADOWS = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};

/**
 * Common spacing values based on 8px grid
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

/**
 * Typography styles
 */
export const TYPOGRAPHY = {
  h1: {
    fontSize: 24,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: COLORS.text,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: COLORS.text,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as TextStyle['fontWeight'],
    color: COLORS.text,
  },
  h4: {
    fontSize: 16,
    fontWeight: '600' as TextStyle['fontWeight'],
    color: COLORS.text,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: COLORS.text,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: COLORS.textSecondary,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: COLORS.textSecondary,
  },
}; 