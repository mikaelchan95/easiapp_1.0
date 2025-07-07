import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call the optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="warning" size={48} color={COLORS.error} />
            </View>
            
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              We're sorry, but something unexpected happened. Please try again.
            </Text>

            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>

            {__DEV__ && this.state.error && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText}>{this.state.error.message}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.debugText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  content: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
    maxWidth: 320,
    ...SHADOWS.medium,
  },
  iconContainer: {
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    ...SHADOWS.light,
  },
  retryButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.card,
    fontWeight: '600',
  },
  debugInfo: {
    marginTop: SPACING.lg,
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    width: '100%',
  },
  debugTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  debugText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
});

// Simple error fallback component
export const SimpleErrorFallback: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <View style={styles.simpleFallback}>
    <Ionicons name="alert-circle" size={24} color={COLORS.error} />
    <Text style={styles.simpleFallbackText}>Unable to load</Text>
    {onRetry && (
      <TouchableOpacity onPress={onRetry} style={styles.simpleRetryButton}>
        <Text style={styles.simpleRetryText}>Retry</Text>
      </TouchableOpacity>
    )}
  </View>
);

const simpleFallbackStyles = StyleSheet.create({
  simpleFallback: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  simpleFallbackText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  simpleRetryButton: {
    marginLeft: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  simpleRetryText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.card,
    fontWeight: '600',
  },
});

Object.assign(styles, simpleFallbackStyles);

export default ErrorBoundary;