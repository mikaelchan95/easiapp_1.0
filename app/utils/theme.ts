import { TextStyle } from 'react-native';

/**
 * App theme colors based on the workspace design system rules
 */
export const COLORS = {
  // Primary colors - following workspace rules
  primary: '#000000', // Black for interactive elements
  accent: '#FFFFFF', // White
  
  // UI colors - strictly following workspace rules
  background: 'hsl(0, 0%, 98%)', // Frame background (very light gray)
  card: 'hsl(0, 0%, 100%)', // Canvas white for all cards/panels/containers
  text: 'hsl(0, 0%, 0%)', // Primary text (black)
  textSecondary: 'hsl(0, 0%, 30%)', // Secondary text (dark gray)
  border: 'hsl(0, 0%, 90%)', // Borders & dividers (subtle light gray)
  placeholder: 'hsl(0, 0%, 40%)', // Placeholder text
  inactive: 'hsl(0, 0%, 45%)', // Inactive elements
  
  // Interactive states - following workspace rules
  buttonBg: 'hsl(0, 0%, 0%)', // Black button background
  buttonText: 'hsl(0, 0%, 100%)', // White button text
  buttonHover: 'hsl(0, 0%, 10%)', // 10% lightness for hover
  buttonActive: 'hsl(0, 0%, 20%)', // 20% lightness for active
  
  // Status colors
  success: '#4CAF50',
  error: '#F44336',
  
  // Legacy support
  secondary: '#333333',
  badgeBackground: '#000000',
};

/**
 * Shadow styles based on workspace design system rules
 */
export const SHADOWS = {
  light: {
    shadowColor: 'rgba(0,0,0,0.04)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  medium: {
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  large: {
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
};

/**
 * Enhanced spacing system with more granular control
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  // Additional spacing for better control
  section: 20, // Between major sections
  card: 12, // Internal card padding
  element: 8, // Between elements within a component
};

/**
 * Typography styles with improved hierarchy
 */
export const TYPOGRAPHY = {
  h1: {
    fontSize: 24,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: COLORS.text,
    lineHeight: 32,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: COLORS.text,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as TextStyle['fontWeight'],
    color: COLORS.text,
    lineHeight: 24,
  },
  h4: {
    fontSize: 16,
    fontWeight: '600' as TextStyle['fontWeight'],
    color: COLORS.text,
    lineHeight: 22,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: COLORS.text,
    lineHeight: 22,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
}; 