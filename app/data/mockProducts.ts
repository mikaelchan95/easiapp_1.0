import { ImageSourcePropType } from 'react-native';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // Base retail price (before GST)
  originalPrice?: number; // Optional for products with discounts
  category: string;
  imageUrl: ImageSourcePropType;
  inStock: boolean;
  stock: number; // Actual stock quantity
  retailPrice: number; // Retail price before GST
  tradePrice: number; // Trade price before GST (typically 10-15% less)
  rating: number;
  volume?: string;
  alcoholContent?: string;
  countryOfOrigin?: string;
  isLimited?: boolean;
  isFeatured?: boolean;
  sku: string;
}

// Update to use local assets instead of remote URLs
export const products: Product[] = [
  {
    id: '1',
    name: 'Macallan 12 Year Old Double Cask',
    description: 'A rich, smooth and mellow Scotch whisky that delivers a honeyed sweetness alongside wood spices.',
    price: 110,
    originalPrice: 129.99,
    category: 'Scotch',
    imageUrl: require('../assets/MAC-2023-Double-Cask-12YO-700ml-bottle-pack-shot-square-WEB-2xl.webp'),
    inStock: true,
    stock: 25,
    retailPrice: 110,
    tradePrice: 95,
    rating: 4.9,
    volume: '700ml',
    alcoholContent: '40%',
    countryOfOrigin: 'Scotland',
    isFeatured: true,
    sku: 'MAC-12-DC-700'
  },
  {
    id: '2',
    name: 'Macallan 18 Year Old Sherry Oak',
    description: 'Matured in sherry seasoned oak casks from Jerez, Spain, this has a rich, complex character with dried fruits and spices.',
    price: 450,
    category: 'Scotch',
    imageUrl: require('../assets/MAC-2024-18YO-Sherry-Cask-BottleBox-Front-REFLECTION-5000x5000-PNG-300dpi-2xl.webp'),
    inStock: true,
    stock: 8,
    retailPrice: 450,
    tradePrice: 385,
    rating: 4.9,
    volume: '700ml',
    alcoholContent: '43%',
    countryOfOrigin: 'Scotland',
    isLimited: true,
    sku: 'MAC-18-SO-700'
  },
  {
    id: '3',
    name: 'Macallan 25 Year Old Sherry Oak',
    description: 'A full-bodied palate of berry fruits, wood smoke, and dry fruits with hints of prunes, raisins, and dates.',
    price: 2800,
    originalPrice: 3200,
    category: 'Scotch',
    imageUrl: require('../assets/MAC-2024-25YO-Sherry-Oak-BottleBox-Front-REFLECTION-5000x5000-PNG-300dpi-2xl.webp'),
    inStock: false,
    stock: 0,
    retailPrice: 2800,
    tradePrice: 2400,
    rating: 5.0,
    volume: '700ml',
    alcoholContent: '43%',
    countryOfOrigin: 'Scotland',
    isLimited: true,
    isFeatured: true,
    sku: 'MAC-25-SO-700'
  },
  {
    id: '4',
    name: 'Macallan 30 Year Old Sherry Oak',
    description: 'Matured exclusively in exceptional sherry seasoned oak casks from Spain, delivering an extraordinarily rich and complex single malt.',
    price: 5500,
    category: 'Scotch',
    imageUrl: require('../assets/MAC-2024-30YO-Sherry-Cask-BottleBox-Front-REFLECTION-5000x5000-PNG-300dpi-2xl.webp'),
    inStock: true,
    stock: 3,
    retailPrice: 5500,
    tradePrice: 4700,
    rating: 5.0,
    volume: '700ml',
    alcoholContent: '43%',
    countryOfOrigin: 'Scotland',
    isLimited: true,
    sku: 'MAC-30-SO-700'
  },
  {
    id: '5',
    name: 'Dom Pérignon Vintage 2013',
    description: 'The 2013 vintage Dom Pérignon is a champagne of patience, allowing each element sufficient time to move forward.',
    price: 269.99,
    originalPrice: 299.99,
    category: 'Champagne',
    imageUrl: require('../assets/SHERRY OAK 12 YEARS OLD.webp'), // Temporary placeholder
    inStock: true,
    stock: 15,
    retailPrice: 269.99,
    tradePrice: 230,
    rating: 4.8,
    volume: '750ml',
    countryOfOrigin: 'France',
    sku: 'DOM-P-2013-750'
  },
  {
    id: '6',
    name: 'Hennessy X.O',
    description: 'A blend of over 100 eaux-de-vie aged up to 30 years, creating a rich and complex cognac with notes of candied fruit and spice.',
    price: 249.99,
    category: 'Cognac',
    imageUrl: require('../assets/SHERRY OAK 12 YEARS OLD.webp'), // Temporary placeholder
    inStock: true,
    stock: 12,
    retailPrice: 249.99,
    tradePrice: 215,
    rating: 4.7,
    volume: '700ml',
    alcoholContent: '40%',
    countryOfOrigin: 'France',
    sku: 'HEN-XO-700'
  },
  {
    id: '7',
    name: 'Hibiki Japanese Harmony',
    description: 'A harmonious blend of Japanese malt and grain whiskies from Yamazaki, Hakushu, and Chita distilleries.',
    price: 159.99,
    originalPrice: 189.99,
    category: 'Japanese Whisky',
    imageUrl: require('../assets/SHERRY OAK 12 YEARS OLD.webp'), // Temporary placeholder
    inStock: true,
    stock: 20,
    retailPrice: 159.99,
    tradePrice: 135,
    rating: 4.6,
    volume: '700ml',
    alcoholContent: '43%',
    countryOfOrigin: 'Japan',
    isFeatured: true,
    sku: 'HIB-JH-700'
  },
  {
    id: '8',
    name: 'Louis XIII Cognac',
    description: 'A legendary cognac that uses eaux-de-vie aged between 40 and 100 years old, served in a handmade crystal decanter.',
    price: 4500,
    category: 'Cognac',
    imageUrl: require('../assets/SHERRY OAK 12 YEARS OLD.webp'), // Temporary placeholder
    inStock: true,
    stock: 2,
    retailPrice: 4500,
    tradePrice: 3850,
    rating: 5.0,
    volume: '700ml',
    alcoholContent: '40%',
    countryOfOrigin: 'France',
    isLimited: true,
    sku: 'LOU-XIII-700'
  }
]; 