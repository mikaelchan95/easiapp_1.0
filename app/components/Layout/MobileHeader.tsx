import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Pressable,
  SafeAreaView,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../utils/theme';

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
  currentAddress = { name: 'Marina Bay' } 
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
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        )}
        
        {showCartButton && (
          <TouchableOpacity 
            style={styles.cartButton} 
            onPress={handleCartPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="cart-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        )}
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Delivery Address */}
      {showLocationHeader && (
        <View style={styles.addressContainer}>
          <TouchableOpacity 
            style={styles.addressButton}
            onPress={onAddressPress}
            activeOpacity={0.8}
          >
            <View style={styles.addressContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="location" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.deliverToLabel}>Deliver to</Text>
                <Text style={styles.addressName}>{currentAddress.name}</Text>
              </View>
            </View>
            <Ionicons name="chevron-down" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar - Using a non-functional placeholder */}
      {showSearch && (
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.inactive} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search wines, spirits & more..."
            placeholderTextColor={COLORS.placeholder}
              editable={false}
              onPressIn={() => navigation.navigate('SmartSearch', { query: '' })}
          />
        </View>
      </View>
      )}
    </SafeAreaView>
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
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
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
    backgroundColor: '#000000',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  deliverToLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
});

export default MobileHeader; 