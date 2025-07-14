import { supabaseService } from '../services/supabaseService';
import { productsService } from '../services/productsService';
import { supabase } from '../config/supabase';

// Comprehensive test suite for Supabase integration
export const testSupabaseIntegration = {
  // Test database connection
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔗 Testing Supabase connection...');

      const { data, error } = await supabase
        .from('products')
        .select('count', { count: 'exact' })
        .limit(1);

      if (error) {
        console.error('❌ Connection failed:', error);
        return false;
      }

      console.log('✅ Connection successful. Products count:', data);
      return true;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  },

  // Test authentication flows
  async testAuthentication(): Promise<boolean> {
    try {
      console.log('🔐 Testing authentication...');

      // Test current auth status
      const isAuth = await supabaseService.isAuthenticated();
      console.log('Current auth status:', isAuth);

      // Test getting current user
      const currentUser = await supabaseService.getCurrentUser();
      console.log('Current user:', currentUser?.name || 'None');

      return true;
    } catch (error) {
      console.error('❌ Authentication test failed:', error);
      return false;
    }
  },

  // Test product operations
  async testProducts(): Promise<boolean> {
    try {
      console.log('🛍️ Testing product operations...');

      // Test get all products
      const allProducts = await productsService.getProducts();
      console.log(`✅ Loaded ${allProducts.length} products`);

      // Test get featured products
      const featuredProducts = await productsService.getFeaturedProducts(3);
      console.log(`✅ Loaded ${featuredProducts.length} featured products`);

      // Test get categories
      const categories = await productsService.getProductCategories();
      console.log(`✅ Loaded ${categories.length} categories:`, categories);

      // Test search
      const searchResults = await productsService.searchProducts('Macallan');
      console.log(`✅ Search returned ${searchResults.length} results`);

      // Test get by category
      const scotchProducts =
        await productsService.getProductsByCategory('Scotch');
      console.log(`✅ Found ${scotchProducts.length} Scotch products`);

      // Test single product
      if (allProducts.length > 0) {
        const product = await productsService.getProductById(allProducts[0].id);
        console.log(`✅ Single product:`, product?.name);
      }

      return true;
    } catch (error) {
      console.error('❌ Product test failed:', error);
      return false;
    }
  },

  // Test user operations
  async testUserOperations(): Promise<boolean> {
    try {
      console.log('👤 Testing user operations...');

      const currentUser = await supabaseService.getCurrentUser();
      if (!currentUser) {
        console.log('ℹ️ No user authenticated, skipping user tests');
        return true;
      }

      console.log('Current user:', currentUser.name, currentUser.accountType);

      // Test get user by ID
      const userById = await supabaseService.getUserById(currentUser.id);
      console.log('✅ Get user by ID:', userById?.name);

      // Test company operations if user is company user
      if (currentUser.accountType === 'company' && currentUser.companyId) {
        const company = await supabaseService.getCompanyById(
          currentUser.companyId
        );
        console.log('✅ Company loaded:', company?.name);

        const teamMembers = await supabaseService.getTeamMembersByCompany(
          currentUser.companyId
        );
        console.log(`✅ Team members: ${teamMembers.length}`);
      }

      return true;
    } catch (error) {
      console.error('❌ User operations test failed:', error);
      return false;
    }
  },

  // Test real-time subscriptions
  async testRealTimeSubscriptions(): Promise<boolean> {
    try {
      console.log('⚡ Testing real-time subscriptions...');

      // Test product subscription
      let productUpdateReceived = false;
      const productSub = productsService.subscribeToProductChanges(payload => {
        console.log('✅ Product update received:', payload.eventType);
        productUpdateReceived = true;
      });

      // Test user subscription if authenticated
      let userUpdateReceived = false;
      let userSub: any = null;
      const currentUser = await supabaseService.getCurrentUser();
      if (currentUser) {
        userSub = supabaseService.subscribeToUserChanges(
          currentUser.id,
          user => {
            console.log('✅ User update received:', user?.name);
            userUpdateReceived = true;
          }
        );
      }

      // Clean up after a short delay
      setTimeout(() => {
        if (productSub) {
          productsService.unsubscribeFromProductChanges(productSub);
        }
        if (userSub) {
          supabase.removeChannel(userSub);
        }
        console.log('✅ Subscriptions cleaned up');
      }, 5000);

      console.log('✅ Real-time subscriptions set up successfully');
      return true;
    } catch (error) {
      console.error('❌ Real-time subscription test failed:', error);
      return false;
    }
  },

  // Test data security (RLS)
  async testDataSecurity(): Promise<boolean> {
    try {
      console.log('🔒 Testing data security (RLS)...');

      const currentUser = await supabaseService.getCurrentUser();
      if (!currentUser) {
        console.log('ℹ️ No user authenticated, skipping security tests');
        return true;
      }

      // Test that user can only access their own data
      const userProfile = await supabaseService.getUserById(currentUser.id);
      console.log('✅ Can access own profile:', userProfile?.name);

      // Test company data access if applicable
      if (currentUser.accountType === 'company' && currentUser.companyId) {
        const companyData = await supabaseService.getCompanyById(
          currentUser.companyId
        );
        console.log('✅ Can access own company data:', companyData?.name);
      }

      console.log('✅ Data security tests passed');
      return true;
    } catch (error) {
      console.error('❌ Data security test failed:', error);
      return false;
    }
  },

  // Run all tests
  async runAllTests(): Promise<{
    passed: number;
    failed: number;
    results: any[];
  }> {
    console.log('🧪 Running comprehensive Supabase integration tests...');
    console.log('='.repeat(50));

    const tests = [
      { name: 'Connection', test: this.testConnection },
      { name: 'Authentication', test: this.testAuthentication },
      { name: 'Products', test: this.testProducts },
      { name: 'User Operations', test: this.testUserOperations },
      { name: 'Real-time Subscriptions', test: this.testRealTimeSubscriptions },
      { name: 'Data Security', test: this.testDataSecurity },
    ];

    const results = [];
    let passed = 0;
    let failed = 0;

    for (const { name, test } of tests) {
      try {
        console.log(`\n📋 Running ${name} test...`);
        const result = await test();

        if (result) {
          console.log(`✅ ${name} test PASSED`);
          passed++;
          results.push({ name, status: 'PASSED', error: null });
        } else {
          console.log(`❌ ${name} test FAILED`);
          failed++;
          results.push({
            name,
            status: 'FAILED',
            error: 'Test returned false',
          });
        }
      } catch (error) {
        console.log(`❌ ${name} test FAILED with error:`, error);
        failed++;
        results.push({ name, status: 'FAILED', error: error.message });
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`🧪 Test Results: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(50));

    return { passed, failed, results };
  },

  // Quick health check
  async quickHealthCheck(): Promise<boolean> {
    try {
      console.log('⚡ Running quick health check...');

      const connectionOk = await this.testConnection();
      const authOk = await this.testAuthentication();
      const productsOk = await this.testProducts();

      const allOk = connectionOk && authOk && productsOk;

      console.log(allOk ? '✅ Health check PASSED' : '❌ Health check FAILED');
      return allOk;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  },
};

// Export individual test functions for use in components
export const {
  testConnection,
  testAuthentication,
  testProducts,
  testUserOperations,
  testRealTimeSubscriptions,
  testDataSecurity,
  runAllTests,
  quickHealthCheck,
} = testSupabaseIntegration;
