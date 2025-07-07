import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';

const ThemeShowcase: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Color System</Text>
        
        <View style={styles.colorGrid}>
          {/* Neutral colors */}
          <View style={styles.colorRow}>
            <Text style={styles.colorLabel}>Neutral Colors</Text>
            <View style={styles.colorGroup}>
              <ColorSwatch name="neutral100" color={COLORS.neutral100} />
              <ColorSwatch name="neutral95" color={COLORS.neutral95} />
              <ColorSwatch name="neutral90" color={COLORS.neutral90} />
              <ColorSwatch name="neutral80" color={COLORS.neutral80} />
              <ColorSwatch name="neutral60" color={COLORS.neutral60} />
              <ColorSwatch name="neutral40" color={COLORS.neutral40} />
              <ColorSwatch name="neutral30" color={COLORS.neutral30} />
              <ColorSwatch name="neutral20" color={COLORS.neutral20} />
              <ColorSwatch name="neutral10" color={COLORS.neutral10} />
              <ColorSwatch name="neutral0" color={COLORS.neutral0} />
            </View>
          </View>

          {/* Main theme colors */}
          <View style={styles.colorRow}>
            <Text style={styles.colorLabel}>Theme Colors</Text>
            <View style={styles.colorGroup}>
              <ColorSwatch name="bgBase" color={COLORS.bgBase} />
              <ColorSwatch name="bgFrame" color={COLORS.bgFrame} />
              <ColorSwatch name="textPrimary" color={COLORS.textPrimary} />
              <ColorSwatch name="textSecondary" color={COLORS.textSecondary} />
              <ColorSwatch name="buttonBg" color={COLORS.buttonBg} />
              <ColorSwatch name="buttonText" color={COLORS.buttonText} />
              <ColorSwatch name="border" color={COLORS.border} />
            </View>
          </View>

          {/* Semantic colors */}
          <View style={styles.colorRow}>
            <Text style={styles.colorLabel}>Semantic Colors</Text>
            <View style={styles.colorGroup}>
              <ColorSwatch name="success" color={COLORS.success} />
              <ColorSwatch name="warning" color={COLORS.warning} />
              <ColorSwatch name="error" color={COLORS.error} />
              <ColorSwatch name="info" color={COLORS.info} />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Typography</Text>
        
        <View style={styles.typographyShowcase}>
          <Text style={TYPOGRAPHY.h1}>Heading 1</Text>
          <Text style={TYPOGRAPHY.h2}>Heading 2</Text>
          <Text style={TYPOGRAPHY.h3}>Heading 3</Text>
          <Text style={TYPOGRAPHY.h4}>Heading 4</Text>
          <Text style={TYPOGRAPHY.body}>Body Text</Text>
          <Text style={TYPOGRAPHY.caption}>Caption Text</Text>
          <Text style={TYPOGRAPHY.small}>Small Text</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Spacing</Text>
        
        <View style={styles.spacingShowcase}>
          <SpacingExample name="xs" size={SPACING.xs} />
          <SpacingExample name="sm" size={SPACING.sm} />
          <SpacingExample name="md" size={SPACING.md} />
          <SpacingExample name="lg" size={SPACING.lg} />
          <SpacingExample name="xl" size={SPACING.xl} />
          <SpacingExample name="xxl" size={SPACING.xxl} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cards & Surfaces</Text>
        
        <View style={styles.cardShowcase}>
          <View style={styles.cardExample}>
            <Text style={styles.cardTitle}>Primary Card</Text>
            <Text style={styles.cardDescription}>This is a primary card with background color bgBase</Text>
          </View>
          
          <View style={styles.secondaryCardExample}>
            <Text style={styles.cardTitle}>Secondary Card</Text>
            <Text style={styles.cardDescription}>This is a secondary card with background color bgFrame</Text>
          </View>
        </View>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
};

// Helper Components
const ColorSwatch: React.FC<{ name: string; color: string }> = ({ name, color }) => (
  <View style={styles.colorSwatchContainer}>
    <View style={[styles.colorSwatch, { backgroundColor: color }]} />
    <Text style={styles.colorName}>{name}</Text>
  </View>
);

const SpacingExample: React.FC<{ name: string; size: number }> = ({ name, size }) => (
  <View style={styles.spacingExample}>
    <Text style={styles.spacingName}>{name}: {size}px</Text>
    <View style={[styles.spacingBlock, { width: size, height: size }]} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgFrame,
  },
  section: {
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.md,
  },
  colorGrid: {
    marginBottom: SPACING.lg,
  },
  colorRow: {
    marginBottom: SPACING.md,
  },
  colorLabel: {
    ...TYPOGRAPHY.h4,
    marginBottom: SPACING.sm,
  },
  colorGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  colorSwatchContainer: {
    alignItems: 'center',
    width: 70,
    marginBottom: SPACING.sm,
  },
  colorSwatch: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  colorName: {
    ...TYPOGRAPHY.small,
    textAlign: 'center',
  },
  typographyShowcase: {
    backgroundColor: COLORS.bgBase,
    padding: SPACING.md,
    borderRadius: 8,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  spacingShowcase: {
    backgroundColor: COLORS.bgBase,
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  spacingExample: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  spacingName: {
    ...TYPOGRAPHY.caption,
    width: 100,
  },
  spacingBlock: {
    backgroundColor: COLORS.buttonBg,
    marginLeft: SPACING.sm,
  },
  cardShowcase: {
    gap: SPACING.md,
  },
  cardExample: {
    backgroundColor: COLORS.bgBase,
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  secondaryCardExample: {
    backgroundColor: COLORS.bgFrame,
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  cardTitle: {
    ...TYPOGRAPHY.h4,
    marginBottom: SPACING.sm,
  },
  cardDescription: {
    ...TYPOGRAPHY.body,
  },
  spacer: {
    height: 100,
  },
});

export default ThemeShowcase; 