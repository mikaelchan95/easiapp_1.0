import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { categorizeProducts } from '../utils/product';

export const useHomeData = () => {
  const { state } = useApp();
  
  const featuredProducts = useMemo(() => 
    state.products.filter(product => product.featured).slice(0, 4)
  , [state.products]);
  
  const newArrivals = useMemo(() => 
    [...state.products]
      .sort((a, b) => 0.5 - Math.random()) // Mock "new" products with random sort
      .slice(0, 4)
  , [state.products]);

  const trendingProducts = useMemo(() => 
    [...state.products]
      .filter(p => p.stock > 0)
      .sort((a, b) => b.stock - a.stock) // Simulate trending with stock levels
      .slice(0, 4)
  , [state.products]);

  const productsByCategory = useMemo(() => 
    categorizeProducts(state.products)
  , [state.products]);

  const topCategories = useMemo(() => [
    {
      name: 'Premium Whisky',
      description: 'Single malts and rare blends',
      image: 'https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg?auto=compress&cs=tinysrgb&w=400',
      count: (productsByCategory['whisky'] || []).length,
      slug: 'whisky'
    },
    {
      name: 'Fine Wines',
      description: 'Bordeaux, Burgundy & Champagne',
      image: 'https://images.pexels.com/photos/1120873/pexels-photo-1120873.jpeg?auto=compress&cs=tinysrgb&w=400',
      count: (productsByCategory['wine'] || []).length,
      slug: 'wine'
    },
    {
      name: 'Craft Spirits',
      description: 'Artisanal vodka, gin & rum',
      image: 'https://images.pexels.com/photos/5530273/pexels-photo-5530273.jpeg?auto=compress&cs=tinysrgb&w=400',
      count: (productsByCategory['spirits'] || []).length,
      slug: 'spirits'
    }
  ], [productsByCategory]);

  return {
    featuredProducts,
    newArrivals,
    trendingProducts,
    topCategories,
    productsByCategory
  };
};