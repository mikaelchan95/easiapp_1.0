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
  warning: '#FF9800',
  info: '#2196F3',
  
  // Status background colors
  successBackground: '#E8F5E8',
  errorBackground: '#FFEBEE',
  warningBackground: '#FFF3E0',
  infoBackground: '#E3F2FD',
  primaryBackground: '#F5F5F5',
  
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
 * Font sizes following iOS Human Interface Guidelines and Material Design
 * Based on 16px as the base font size for optimal readability
 */
export const FONT_SIZES = {
  // Headings
  h1: 28,      // Large titles, hero text
  h2: 24,      // Section headers, page titles
  h3: 20,      // Subsection headers
  h4: 18,      // Card titles, important labels
  h5: 16,      // Standard headings
  h6: 14,      // Small headings
  
  // Body text
  body: 16,    // Main body text, standard reading
  bodySmall: 14, // Secondary body text
  
  // UI elements
  button: 16,  // Button text
  buttonSmall: 14, // Small button text
  caption: 14, // Captions, help text
  label: 12,   // Labels, metadata
  tiny: 10,    // Badges, very small text
};

/**
 * Font weights following system standards
 */
export const FONT_WEIGHTS = {
  light: '300' as TextStyle['fontWeight'],
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
  heavy: '800' as TextStyle['fontWeight'],
};

/**
 * Typography styles with consistent naming and usage
 * Use these instead of hardcoded fontSize values
 */
export const TYPOGRAPHY = {
  // Headings - for titles and section headers
  h1: {
    fontSize: FONT_SIZES.h1,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    lineHeight: FONT_SIZES.h1 * 1.2,
  },
  h2: {
    fontSize: FONT_SIZES.h2,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    lineHeight: FONT_SIZES.h2 * 1.2,
  },
  h3: {
    fontSize: FONT_SIZES.h3,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    lineHeight: FONT_SIZES.h3 * 1.2,
  },
  h4: {
    fontSize: FONT_SIZES.h4,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    lineHeight: FONT_SIZES.h4 * 1.2,
  },
  h5: {
    fontSize: FONT_SIZES.h5,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
    lineHeight: FONT_SIZES.h5 * 1.2,
  },
  h6: {
    fontSize: FONT_SIZES.h6,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
    lineHeight: FONT_SIZES.h6 * 1.2,
  },
  
  // Body text - for main content
  body: {
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.text,
    lineHeight: FONT_SIZES.body * 1.4,
  },
  bodySmall: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.text,
    lineHeight: FONT_SIZES.bodySmall * 1.4,
  },
  
  // UI elements
  button: {
    fontSize: FONT_SIZES.button,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
    lineHeight: FONT_SIZES.button * 1.2,
  },
  buttonSmall: {
    fontSize: FONT_SIZES.buttonSmall,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
    lineHeight: FONT_SIZES.buttonSmall * 1.2,
  },
  
  // Secondary text
  caption: {
    fontSize: FONT_SIZES.caption,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZES.caption * 1.3,
  },
  label: {
    fontSize: FONT_SIZES.label,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZES.label * 1.3,
  },
  tiny: {
    fontSize: FONT_SIZES.tiny,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZES.tiny * 1.3,
  },
  
  // Deprecated - keeping for backward compatibility
  small: {
    fontSize: FONT_SIZES.label,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZES.label * 1.3,
  },
};

/**
 * Complete theme object for easy import and use
 */
export const theme = {
  colors: {
    canvas: COLORS.card,
    frame: COLORS.background,
    background: COLORS.background,
    surface: COLORS.card,
    primary: COLORS.primary,
    text: COLORS.text,
    textSecondary: COLORS.textSecondary,
    border: COLORS.border,
    success: COLORS.success,
    error: COLORS.error,
    warning: COLORS.warning,
    info: COLORS.info,
    successBackground: COLORS.successBackground,
    errorBackground: COLORS.errorBackground,
    warningBackground: COLORS.warningBackground,
    infoBackground: COLORS.infoBackground,
    primaryBackground: COLORS.primaryBackground,
    interactive: COLORS.buttonBg,
  },
  shadows: SHADOWS,
  spacing: SPACING,
  typography: TYPOGRAPHY,
  fontSizes: FONT_SIZES,
  fontWeights: FONT_WEIGHTS,
}; 