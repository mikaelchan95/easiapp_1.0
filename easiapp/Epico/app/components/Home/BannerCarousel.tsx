import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type BannerCarouselProps = {
  currentBanner: number;
};

const BannerCarousel: React.FC<BannerCarouselProps> = ({ currentBanner = 0 }) => {
  const banners = [
    {
      id: 1,
      title: 'Premium Collection',
      subtitle: 'Rare & Limited',
      description: 'Handpicked spirits from renowned distilleries',
      ctaText: 'Explore',
      accentColor: 'green',
      icon: 'star-outline',
    },
    {
      id: 2,
      title: 'Weekend Sale',
      subtitle: '20% Off',
      description: 'Limited offer on selected vintages',
      ctaText: 'Shop Now',
      accentColor: 'white',
      icon: 'flash-outline',
    },
    {
      id: 3,
      title: 'EASI Rewards',
      subtitle: 'Earn Points',
      description: 'Redeem for exclusive experiences',
      ctaText: 'Learn More',
      accentColor: 'green',
      icon: 'gift-outline',
    },
  ];

  const currentBannerData = banners[currentBanner];
  
  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name={currentBannerData.icon as any} size={18} color="#fff" />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.subtitle}>{currentBannerData.subtitle}</Text>
              <Text style={styles.title}>{currentBannerData.title}</Text>
            </View>
          </View>
          
          <Text style={styles.description}>{currentBannerData.description}</Text>
          
          <TouchableOpacity style={styles.cta}>
            <Text style={styles.ctaText}>{currentBannerData.ctaText}</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.indicators}>
          {banners.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.indicator, 
                index === currentBanner && styles.activeIndicator
              ]} 
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');
const bannerHeight = width * 0.45; // 16:9 aspect ratio

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  banner: {
    width: '100%',
    height: bannerHeight,
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
    maxWidth: '80%',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeIndicator: {
    backgroundColor: '#fff',
    width: 18,
  },
});

export default BannerCarousel; 