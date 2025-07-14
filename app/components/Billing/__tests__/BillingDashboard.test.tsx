import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { jest } from '@jest/globals';
import BillingDashboard from '../BillingDashboard';
import { AppContext } from '../../../context/AppContext';
import companyBillingService from '../../../services/companyBillingService';

// Mock the company billing service
jest.mock('../../../services/companyBillingService', () => ({
  getCompanyBillingData: jest.fn(),
  getInvoices: jest.fn(),
  getPaymentHistory: jest.fn(),
  getCreditUtilization: jest.fn(),
}));

// Mock react-navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock Animated
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Animated: {
      ...RN.Animated,
      timing: jest.fn(() => ({
        start: jest.fn(),
      })),
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        interpolate: jest.fn(() => '0%'),
      })),
    },
  };
});

const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@company.com',
  accountType: 'company' as const,
};

const mockCompany = {
  id: 'comp-1',
  name: 'Test Company Ltd',
  creditLimit: 50000,
  creditUsed: 32500,
  paymentTerms: 'NET30',
  billingEmail: 'billing@company.com',
};

const mockBillingData = {
  currentBalance: 32500,
  availableCredit: 17500,
  creditLimit: 50000,
  creditUtilization: 65,
  monthlySpend: 12000,
  avgMonthlySpend: 15000,
  paymentDue: 8500,
  dueDate: '2024-02-15',
  lastPayment: {
    amount: 18000,
    date: '2024-01-15',
    method: 'Bank Transfer',
  },
  upcomingInvoices: 2,
  overdueAmount: 0,
};

const mockInvoices = [
  {
    id: 'INV-2024-001',
    number: 'INV-2024-001',
    date: '2024-01-01',
    dueDate: '2024-01-31',
    amount: 15000,
    status: 'paid',
    paidDate: '2024-01-15',
  },
  {
    id: 'INV-2024-002',
    number: 'INV-2024-002',
    date: '2024-01-15',
    dueDate: '2024-02-14',
    amount: 8500,
    status: 'pending',
    paidDate: null,
  },
];

const defaultProps = {
  onNavigateToInvoices: jest.fn(),
  onNavigateToPaymentHistory: jest.fn(),
  onNavigateToSettings: jest.fn(),
};

const mockAppState = {
  user: mockUser,
  company: mockCompany,
  products: [],
  cart: [],
  loading: false,
  searchQuery: '',
  selectedCategory: '',
  selectedLocation: null,
  userLocations: [],
  tabBarVisible: true,
  purchaseAchievement: { visible: false, data: null },
  userStats: {
    totalPoints: 0,
    currentLevel: 1,
    totalSavings: 0,
    orderCount: 0,
  },
  userSettings: {} as any,
};

const mockAppDispatch = jest.fn();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppContext.Provider
    value={{ state: mockAppState, dispatch: mockAppDispatch }}
  >
    {children}
  </AppContext.Provider>
);

describe('BillingDashboard', () => {
  const mockCompanyBillingService = companyBillingService as jest.Mocked<
    typeof companyBillingService
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCompanyBillingService.getCompanyBillingData.mockResolvedValue({
      data: mockBillingData,
    });
    mockCompanyBillingService.getInvoices.mockResolvedValue({
      data: mockInvoices,
    });
  });

  it('renders billing dashboard with company information', async () => {
    const { getByText } = render(
      <TestWrapper>
        <BillingDashboard {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Test Company Ltd')).toBeTruthy();
      expect(getByText('Billing Dashboard')).toBeTruthy();
    });
  });

  it('displays credit utilization information', async () => {
    const { getByText } = render(
      <TestWrapper>
        <BillingDashboard {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('S$32,500')).toBeTruthy(); // Current balance
      expect(getByText('S$17,500')).toBeTruthy(); // Available credit
      expect(getByText('S$50,000')).toBeTruthy(); // Credit limit
      expect(getByText('65%')).toBeTruthy(); // Credit utilization
    });
  });

  it('shows payment due information', async () => {
    const { getByText } = render(
      <TestWrapper>
        <BillingDashboard {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('S$8,500')).toBeTruthy(); // Payment due
      expect(getByText('Due: Feb 15, 2024')).toBeTruthy();
    });
  });

  it('displays last payment information', async () => {
    const { getByText } = render(
      <TestWrapper>
        <BillingDashboard {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('S$18,000')).toBeTruthy(); // Last payment amount
      expect(getByText('Jan 15, 2024')).toBeTruthy(); // Last payment date
      expect(getByText('Bank Transfer')).toBeTruthy(); // Payment method
    });
  });

  it('shows recent invoices section', async () => {
    const { getByText } = render(
      <TestWrapper>
        <BillingDashboard {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Recent Invoices')).toBeTruthy();
      expect(getByText('INV-2024-001')).toBeTruthy();
      expect(getByText('INV-2024-002')).toBeTruthy();
      expect(getByText('PAID')).toBeTruthy();
      expect(getByText('PENDING')).toBeTruthy();
    });
  });

  it('navigates to invoices when view all is pressed', async () => {
    const onNavigateToInvoices = jest.fn();

    const { getByText } = render(
      <TestWrapper>
        <BillingDashboard
          {...defaultProps}
          onNavigateToInvoices={onNavigateToInvoices}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('View All Invoices')).toBeTruthy();
    });

    fireEvent.press(getByText('View All Invoices'));
    expect(onNavigateToInvoices).toHaveBeenCalled();
  });

  it('navigates to payment history when button is pressed', async () => {
    const onNavigateToPaymentHistory = jest.fn();

    const { getByText } = render(
      <TestWrapper>
        <BillingDashboard
          {...defaultProps}
          onNavigateToPaymentHistory={onNavigateToPaymentHistory}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Payment History')).toBeTruthy();
    });

    fireEvent.press(getByText('Payment History'));
    expect(onNavigateToPaymentHistory).toHaveBeenCalled();
  });

  it('shows credit utilization warning when high', async () => {
    const highUtilizationData = {
      ...mockBillingData,
      creditUtilization: 85,
      availableCredit: 7500,
    };

    mockCompanyBillingService.getCompanyBillingData.mockResolvedValue({
      data: highUtilizationData,
    });

    const { getByText } = render(
      <TestWrapper>
        <BillingDashboard {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('High Credit Utilization')).toBeTruthy();
      expect(getByText('85%')).toBeTruthy();
    });
  });

  it('displays overdue amount warning when applicable', async () => {
    const overdueData = {
      ...mockBillingData,
      overdueAmount: 5000,
    };

    mockCompanyBillingService.getCompanyBillingData.mockResolvedValue({
      data: overdueData,
    });

    const { getByText } = render(
      <TestWrapper>
        <BillingDashboard {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Overdue Amount')).toBeTruthy();
      expect(getByText('S$5,000')).toBeTruthy();
    });
  });

  it('shows loading state while fetching data', () => {
    mockCompanyBillingService.getCompanyBillingData.mockReturnValue(
      new Promise(() => {}) // Never resolves
    );

    const { getByText } = render(
      <TestWrapper>
        <BillingDashboard {...defaultProps} />
      </TestWrapper>
    );

    expect(getByText('Loading billing data...')).toBeTruthy();
  });

  it('handles API errors gracefully', async () => {
    mockCompanyBillingService.getCompanyBillingData.mockRejectedValue(
      new Error('Failed to fetch billing data')
    );

    const { getByText } = render(
      <TestWrapper>
        <BillingDashboard {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Failed to load billing data')).toBeTruthy();
    });
  });

  it('refreshes data when pull to refresh is triggered', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <BillingDashboard {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByTestId('billing-dashboard')).toBeTruthy();
    });

    // Simulate pull to refresh
    fireEvent(getByTestId('billing-dashboard'), 'refresh');

    expect(
      mockCompanyBillingService.getCompanyBillingData
    ).toHaveBeenCalledTimes(2);
  });

  it('displays monthly spending comparison', async () => {
    const { getByText } = render(
      <TestWrapper>
        <BillingDashboard {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('This Month')).toBeTruthy();
      expect(getByText('S$12,000')).toBeTruthy(); // Monthly spend
      expect(getByText('Average')).toBeTruthy();
      expect(getByText('S$15,000')).toBeTruthy(); // Avg monthly spend
    });
  });

  it('shows payment terms information', async () => {
    const { getByText } = render(
      <TestWrapper>
        <BillingDashboard {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Payment Terms')).toBeTruthy();
      expect(getByText('NET30')).toBeTruthy();
    });
  });

  it('displays credit limit progress bar correctly', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <BillingDashboard {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      const progressBar = getByTestId('credit-utilization-progress');
      expect(progressBar).toBeTruthy();
      // Progress should be 65% (32500/50000)
    });
  });

  it('handles empty invoices list', async () => {
    mockCompanyBillingService.getInvoices.mockResolvedValue({
      data: [],
    });

    const { getByText } = render(
      <TestWrapper>
        <BillingDashboard {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('No recent invoices')).toBeTruthy();
    });
  });

  it('formats large currency amounts correctly', async () => {
    const largeAmountData = {
      ...mockBillingData,
      currentBalance: 125000.5,
      creditLimit: 200000,
    };

    mockCompanyBillingService.getCompanyBillingData.mockResolvedValue({
      data: largeAmountData,
    });

    const { getByText } = render(
      <TestWrapper>
        <BillingDashboard {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('S$125,000.50')).toBeTruthy();
      expect(getByText('S$200,000')).toBeTruthy();
    });
  });

  it('shows quick actions section', async () => {
    const { getByText } = render(
      <TestWrapper>
        <BillingDashboard {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Quick Actions')).toBeTruthy();
      expect(getByText('Make Payment')).toBeTruthy();
      expect(getByText('Download Statement')).toBeTruthy();
      expect(getByText('Billing Settings')).toBeTruthy();
    });
  });

  it('navigates to settings when settings button is pressed', async () => {
    const onNavigateToSettings = jest.fn();

    const { getByText } = render(
      <TestWrapper>
        <BillingDashboard
          {...defaultProps}
          onNavigateToSettings={onNavigateToSettings}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Billing Settings')).toBeTruthy();
    });

    fireEvent.press(getByText('Billing Settings'));
    expect(onNavigateToSettings).toHaveBeenCalled();
  });
});
