import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { NavigationProvider } from './context/NavigationContext';
import { PopupProvider } from './components/PopupContainer';
import MobileApp from './pages/MobileApp';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Admin from './pages/Admin';

function App() {
  // Force mobile app as primary experience
  const isMobile = true;
  
  // Set CSS variable for viewport height to fix iOS 100vh issues
  useEffect(() => {
    const setAppHeight = () => {
      const doc = document.documentElement;
      doc.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    
    window.addEventListener('resize', setAppHeight);
    window.addEventListener('orientationchange', setAppHeight);
    setAppHeight();
    
    return () => {
      window.removeEventListener('resize', setAppHeight);
      window.removeEventListener('orientationchange', setAppHeight);
    };
  }, []);

  return (
    <AppProvider>
      <NavigationProvider>
        <PopupProvider>
          <Router>
            {isMobile ? (
              // Mobile App - Single page with internal navigation
              <div className="min-h-screen bg-gray-100 flex items-start justify-center">
                <MobileApp />
              </div>
            ) : (
              // Desktop App - Traditional routing
              <div className="min-h-screen bg-gray-100">
                <Header />
                <main className="min-h-screen">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            )}
          </Router>
        </PopupProvider>
      </NavigationProvider>
    </AppProvider>
  );
}

export default App;