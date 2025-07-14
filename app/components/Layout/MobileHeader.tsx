import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../utils/theme';
import { useAppContext } from '../../context/AppContext';
import SmartSearchDropdown from '../UI/SmartSearchDropdown';

// Cart Badge Component
const CartBadge: React.FC = () => {
  const { state } = useAppContext();
  const cartItemCount = state.cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  if (cartItemCount === 0) return null;

  return (
    <View style={styles.cartBadge}>
      <Text style={styles.cartBadgeText}>
        {cartItemCount > 99 ? '99+' : cartItemCount.toString()}
      </Text>
    </View>
  );
};

interface MobileHeaderProps {
  title?: string;
  showBackButton?: boolean;
  showCartButton?: boolean;
  showSearch?: boolean;
  showLocationHeader?: boolean;
  onAddressPress?: () => void;
  onCartPress?: () => void;
  onBackPress?: () => void;
  currentAddress?: {
    name: string;
  };
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBackButton = false,
  showCartButton = true,
  showSearch = true,
  showLocationHeader = false,
  onAddressPress,
  onCartPress,
  onBackPress,
  currentAddress = { name: 'Marina Bay' },
}) => {
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const handleCartPress = () => {
    if (onCartPress) {
      onCartPress();
    } else {
      navigation.navigate('Main', { screen: 'Cart' });
    }
  };

  if (showBackButton) {
    return (
      <View style={styles.simpleHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        {title && (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        )}

        {showCartButton && (
          <TouchableOpacity
            style={styles.cartButton}
            onPress={handleCartPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="cart-outline" size={24} color={COLORS.text} />
            <CartBadge />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Delivery Address */}
      {showLocationHeader && (
        <View style={styles.addressContainer}>
          <TouchableOpacity
            style={styles.addressButton}
            onPress={onAddressPress}
            activeOpacity={0.7}
          >
            <View style={styles.addressContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="location" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.deliverToLabel}>Deliver to</Text>
                <Text style={styles.addressName}>{currentAddress.name}</Text>
              </View>
            </View>
            <Ionicons
              name="chevron-down"
              size={22}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Smart Search Dropdown */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <SmartSearchDropdown
            placeholder="Search wines, spirits & more..."
            showDropdownOnFocus={true}
            maxSuggestions={5}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0,
  },
  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  cartButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  title: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  addressContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    alignItems: 'center',
  },
  addressButton: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
    width: '100%',
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 42,
    height: 42,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deliverToLabel: {
    ...TYPOGRAPHY.label,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  addressName: {
    ...TYPOGRAPHY.h5,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  cartBadgeText: {
    ...TYPOGRAPHY.label,
    color: COLORS.card,
    fontWeight: '700',
  },
});

export default MobileHeader;
