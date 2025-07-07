import React from 'react';
import { Product } from '../../types';

interface ProductBadgesProps {
  product: Product;
  savings: number;
  size?: 'sm' | 'md';
}

const ProductBadges: React.FC<ProductBadgesProps> = () => {
  // No badges shown
  return null;
};

export default ProductBadges;