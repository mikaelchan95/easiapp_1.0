import { Product } from '../types';

export const getCategoryEmoji = (category: string): string => {
  return ''; // Removed emojis
};

export const formatPrice = (price: number): string => {
  return `$${price.toFixed(0)}`;
};

export const calculateDiscount = (retail: number, trade: number): number => {
  if (retail <= 0) return 0;
  return Math.round((retail - trade) / retail * 100);
};

export const getStockLabel = (quantity: number): string => {
  if (quantity <= 0) return 'Out of Stock';
  if (quantity <= 5) return `${quantity} left`;
  if (quantity <= 10) return 'Low stock';
  return `${quantity} available`;
};

export const getStockColor = (quantity: number): string => {
  if (quantity <= 0) return 'bg-red-400';
  if (quantity <= 5) return 'bg-yellow-400';
  return 'bg-green-400';
};

export const getStockStatus = (quantity: number): string => {
  if (quantity <= 0) return 'sold-out';
  if (quantity <= 5) return 'low-stock';
  if (quantity <= 10) return 'limited';
  return 'in-stock';
};

export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getSameDayEligibilityLabel = (product: Product): string => {
  return product.sameDayEligible !== false 
    ? 'Same-day eligible' 
    : 'Standard delivery';
};

export const generateProductUrl = (product: Product): string => {
  return `/products/${product.id}`;
};

export const getProductsByCategory = (products: Product[], category: string): Product[] => {
  if (category === 'all') return products;
  return products.filter(p => p.category === category);
};

// Sort products by different criteria
export const sortProducts = (products: Product[], sortBy: string = 'featured'): Product[] => {
  const sortedProducts = [...products];
  
  switch(sortBy) {
    case 'price-asc':
      return sortedProducts.sort((a, b) => a.retailPrice - b.retailPrice);
    case 'price-desc':
      return sortedProducts.sort((a, b) => b.retailPrice - a.retailPrice);
    case 'name-asc':
      return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
    case 'stock-desc':
      return sortedProducts.sort((a, b) => b.stock - a.stock);
    case 'featured':
    default:
      return sortedProducts.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }
};

// Calculate average rating (mock function)
export const getProductRating = (productId: string): { rating: number; count: number } => {
  // In a real application, this would fetch from a backend
  return {
    rating: 4.5 + (parseInt(productId) % 10) / 20, // Just for variation
    count: 10 + parseInt(productId) * 3 % 100
  };
};

// Categorize products by their category
export const categorizeProducts = (products: Product[]): { [key: string]: Product[] } => {
  return products.reduce((acc, product) => {
    const category = product.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as { [key: string]: Product[] });
};