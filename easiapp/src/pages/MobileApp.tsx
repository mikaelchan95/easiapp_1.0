import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigation, NavigationRoute } from '../context/NavigationContext';
import MobileHeader from '../components/Mobile/MobileHeader';
import BannerCarousel from '../components/Mobile/BannerCarousel';
import ProductSectionCard from '../components/Mobile/ProductSectionCard';
import FeaturedProduct from '../components/Mobile/FeaturedProduct';
import { NavbarContainer } from '../components/Navigation';
import ProductDetail from '../components/Mobile/ProductDetail';
import ProductBrowse from './ProductBrowse';
import CartView from '../components/Mobile/CartView';
import CheckoutFlow from '../components/Mobile/CheckoutFlow';
import OrderSuccess from '../components/Mobile/OrderSuccess';
import AuthFlow from '../components/Mobile/AuthFlow';
import EASIRewards from './FlowRewards';
import Profile from './Profile';
import CreditManagement from './Credit/CreditManagement';
import BalanceCards from '../components/Mobile/BalanceCards';
import OnboardingFlow from '../components/Onboarding/OnboardingFlow'; // Import the OnboardingFlow component
import { Product } from '../types';
import { Flame, Sparkles, Target, Star } from 'lucide-react';

// Define the possible app views
type AppView = 'home' | 'products' | 'cart' | 'checkout' | 'success' | 'auth' | 'rewards' | 'profile' | 'credit' | 'onboarding';

const MobileApp: React.FC = () => {
  const { state, getCartItemCount } = useApp();
  const { setActiveRoute, setCartCount } = useNavigation();
  const [activeCategory, setActiveCategory] = useState('wine');
  const [currentBanner, setCurrentBanner] = useState(0);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [browseCategory, setBrowseCategory] = useState('all');
  const [completedOrderId, setCompletedOrderId] = useState<string>('');
  
  // Product handling
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Check if user has already completed onboarding
    const hasOnboarded = localStorage.getItem('hasOnboarded');
    // Check if user is already signed in
    const userSignedIn = !!state.user;
    // Show onboarding only if user hasn't onboarded before AND isn't signed in
    return hasOnboarded !== 'true' && !userSignedIn;
  });

  // Update cart count in navigation context
  useEffect(() => {
    setCartCount(getCartItemCount());
  }, [state.cart, setCartCount, getCartItemCount]);

  // Auto-rotate banner every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Update the active route when view changes
  useEffect(() => {
    let route: NavigationRoute = 'home';
    
    switch (currentView) {
      case 'products': route = 'explore'; break;
      case 'cart': route = 'cart'; break;
      case 'rewards': route = 'rewards'; break;
      case 'profile': 
      case 'credit': route = 'profile'; break;
      default: route = 'home';
    }
    
    setActiveRoute(route);
  }, [currentView, setActiveRoute]);

  // Memoized product sections for better performance
  const productSections = React.useMemo(() => {
    const featuredProducts = state.products.filter(p => p.featured).slice(0, 6);
    const newArrivals = state.products.slice(3, 6);
    const recommended = state.products.slice(0, 3);
    
    return {
      featured: featuredProducts,
      hotDeals: featuredProducts.slice(0, 3),
      newArrivals,
      recommended
    };
  }, [state.products]);

  const handleCategoryClick = (categoryId: string) => {
    setBrowseCategory(categoryId);
    setCurrentView('products');
  };

  const handleViewAllClick = (category?: string) => {
    setBrowseCategory(category || 'all');
    setCurrentView('products');
  };

  const handleNavigationClick = (route: NavigationRoute) => {
    switch (route) {
      case 'explore':
        setCurrentView('products');
        break;
      case 'home':
        setCurrentView('home');
        break;
      case 'cart':
        setCurrentView(state.user ? 'cart' : 'auth');
        break;
      case 'rewards':
        setCurrentView('rewards');
        break;
      case 'profile':
        setCurrentView(state.user ? 'profile' : 'auth');
        break;
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleCheckout = () => {
    setCurrentView(state.user ? 'checkout' : 'auth');
  };

  const handleOrderComplete = (orderId: string) => {
    setCompletedOrderId(orderId);
    setCurrentView('success');
  };

  const handleAuthSuccess = () => {
    // Mark user as onboarded when they sign in
    localStorage.setItem('hasOnboarded', 'true');
    setCurrentView('home');
  };

  const handleRewardsClick = () => {
    setCurrentView(state.user ? 'rewards' : 'auth');
  };

  const handleCreditClick = () => {
    setCurrentView('credit');
  };

  const handleOnboardingComplete = () => {
    // Mark onboarding as complete
    localStorage.setItem('hasOnboarded', 'true');
    setShowOnboarding(false);
  };

  const handleNavigateFromProfile = (page: string) => {
    switch (page) {
      case 'products':
        setCurrentView('products');
        break;
      case 'rewards':
        setCurrentView('rewards');
        break;
      case 'credit':
        setCurrentView('credit');
        break;
      default:
        setCurrentView('home');
    }
  };

  const handleSignIn = () => {
    setCurrentView('auth');
  };

  // If onboarding needs to be shown, render it
  if (showOnboarding) {
    return (
      <OnboardingFlow 
        onComplete={handleOnboardingComplete} 
        onSkip={handleOnboardingComplete} 
      />
    );
  }

  // Determine which views should hide the navbar
  const shouldHideNavbar = ['checkout', 'success', 'auth', 'cart'].includes(currentView);

  // Render different views
  const renderView = () => {
    switch (currentView) {
      case 'rewards':
        return <EASIRewards onBack={() => setCurrentView('home')} onSignIn={handleSignIn} />;
      case 'auth':
        return <AuthFlow onBack={() => setCurrentView('home')} onSuccess={handleAuthSuccess} />;
      case 'products':
        return <ProductBrowse onBack={() => setCurrentView('home')} initialCategory={browseCategory} />;
      case 'cart':
        return <CartView onBack={() => setCurrentView('home')} onCheckout={handleCheckout} />;
      case 'checkout':
        return <CheckoutFlow onBack={() => setCurrentView('cart')} onComplete={handleOrderComplete} />;
      case 'profile':
        return (
          <Profile 
            onBack={() => setCurrentView('home')} 
            onNavigate={handleNavigateFromProfile}
          />
        );
      case 'credit':
        return <CreditManagement onBack={() => setCurrentView('profile')} />;
      case 'success':
        return (
          <OrderSuccess 
            orderId={completedOrderId}
            onContinueShopping={() => setCurrentView('home')}
            onViewOrders={() => setCurrentView('home')}
          />
        );
      default:
        return null;
    }
  };

  // Return specific view if not home
  if (currentView !== 'home') {
    return (
      <div className="page-container">
        <div className="page-content">
          {renderView()}
        </div>
        {!shouldHideNavbar && (
          <NavbarContainer onNavigate={handleNavigationClick} />
        )}
      </div>
    );
  }

  // Home View
  return (
    <div className="page-container">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 safe-top">
        <MobileHeader />
      </div>

      {/* Scrollable Content */}
      <div className="page-content">
        {/* Balance Cards */}
        <BalanceCards 
          onCreditClick={state.user?.role === 'trade' ? handleCreditClick : undefined}
          onRewardsClick={handleRewardsClick}
          onSignIn={handleSignIn}
        />

        {/* Banner Carousel */}
        <BannerCarousel currentBanner={currentBanner} />

        {/* Product Sections */}
        <ProductSectionCard
          title="Hot Deals"
          icon={Flame}
          iconColor="text-red-500"
          products={productSections.hotDeals}
          onViewAll={() => handleViewAllClick()}
          onProductClick={handleProductClick}
        />

        {/* Today's Special */}
        <div className="px-4 mb-8">
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-50 rounded-2xl border border-yellow-100 flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Special</h3>
                </div>
                <span className="bg-gray-900 text-white text-xs px-3 py-2 rounded-xl font-bold">
                  Limited
                </span>
              </div>
              {productSections.featured.length > 0 && (
                <FeaturedProduct product={productSections.featured[0]} />
              )}
            </div>
          </div>
        </div>

        <ProductSectionCard
          title="New"
          icon={Sparkles}
          iconColor="text-blue-500"
          products={productSections.newArrivals}
          onViewAll={() => handleViewAllClick()}
          onProductClick={handleProductClick}
        />

        <ProductSectionCard
          title="For You"
          icon={Target}
          iconColor="text-purple-500"
          products={productSections.recommended}
          onViewAll={() => handleViewAllClick()}
          onProductClick={handleProductClick}
        />
      </div>

      {/* Bottom Navigation */}
      <NavbarContainer onNavigate={handleNavigationClick} />

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default MobileApp;