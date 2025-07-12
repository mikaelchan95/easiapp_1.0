import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CompanyCreditOverview } from '../CompanyCreditOverview';
import companyBillingService from '../../../services/companyBillingService';

// Mock the billing service
jest.mock('../../../services/companyBillingService', () => ({
  __esModule: true,
  default: {
    getCompanyBillingStatus: jest.fn(),
    formatCurrency: jest.fn((amount) => `$${amount.toFixed(2)}`),
    formatDate: jest.fn((dateString) => new Date(dateString).toLocaleDateString()),
    getDaysUntilDue: jest.fn((dateString) => {
      const dueDate = new Date(dateString);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }),
    isInvoiceOverdue: jest.fn((dateString) => {
      const dueDate = new Date(dateString);
      const today = new Date();
      return dueDate < today;
    }),
    getPaymentStatusColor: jest.fn((status) => {
      switch (status) {
        case 'paid': return '#10B981';
        case 'pending': return '#F59E0B';
        case 'overdue': return '#EF4444';
        default: return '#3B82F6';
      }
    }),
  },
}));

const mockBillingStatus = {
  company_id: 'test-company',
  company_name: 'Test Company',
  credit_limit: 100000,
  credit_used: 75000,
  current_credit: 25000,
  credit_utilization: 75,
  payment_terms: 'NET30',
  last_billing_date: '2024-01-01',
  billing_status: 'good' as const,
  latest_invoice: {
    id: 'inv-123',
    invoice_number: 'INV-2024-001',
    billing_amount: 15000,
    invoice_date: '2024-01-15',
    payment_due_date: '2024-02-15',
    status: 'pending',
    payment_terms: 'NET30',
    line_items: [],
  },
};

describe('CompanyCreditOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    (companyBillingService.getCompanyBillingStatus as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { getByTestId, getByText } = render(
      <CompanyCreditOverview companyId="test-company" />
    );

    expect(getByTestId('credit-overview-loading')).toBeTruthy();
    expect(getByText('Loading credit information...')).toBeTruthy();
  });

  it('renders error state correctly', async () => {
    (companyBillingService.getCompanyBillingStatus as jest.Mock).mockResolvedValue({
      error: 'Failed to fetch billing status',
    });

    const { getByTestId, getByText } = render(
      <CompanyCreditOverview companyId="test-company" />
    );

    await waitFor(() => {
      expect(getByTestId('credit-overview-error')).toBeTruthy();
      expect(getByText('Failed to fetch billing status')).toBeTruthy();
    });
  });

  it('renders billing status correctly', async () => {
    (companyBillingService.getCompanyBillingStatus as jest.Mock).mockResolvedValue({
      data: mockBillingStatus,
    });

    const { getByTestId, getByText } = render(
      <CompanyCreditOverview companyId="test-company" />
    );

    await waitFor(() => {
      expect(getByTestId('credit-overview')).toBeTruthy();
      expect(getByText('Company Credit')).toBeTruthy();
      expect(getByText('Test Company')).toBeTruthy();
      expect(getByText('High Usage')).toBeTruthy(); // 75% utilization
      expect(getByText('75%')).toBeTruthy();
      expect(getByText('$25000.00')).toBeTruthy(); // Available credit
      expect(getByText('$75000.00')).toBeTruthy(); // Credit used
    });
  });

  it('shows overdue warning for overdue invoices', async () => {
    const overdueInvoice = {
      ...mockBillingStatus.latest_invoice!,
      payment_due_date: '2023-12-01', // Past date
    };

    (companyBillingService.getCompanyBillingStatus as jest.Mock).mockResolvedValue({
      data: {
        ...mockBillingStatus,
        latest_invoice: overdueInvoice,
      },
    });

    (companyBillingService.isInvoiceOverdue as jest.Mock).mockReturnValue(true);
    (companyBillingService.getDaysUntilDue as jest.Mock).mockReturnValue(-30);

    const { getByText } = render(
      <CompanyCreditOverview companyId="test-company" />
    );

    await waitFor(() => {
      expect(getByText(/Overdue by 30 days/)).toBeTruthy();
    });
  });

  it('calls onPress when pressed', async () => {
    const onPressMock = jest.fn();
    
    (companyBillingService.getCompanyBillingStatus as jest.Mock).mockResolvedValue({
      data: mockBillingStatus,
    });

    const { getByTestId } = render(
      <CompanyCreditOverview companyId="test-company" onPress={onPressMock} />
    );

    await waitFor(() => {
      const creditOverview = getByTestId('credit-overview');
      fireEvent.press(creditOverview);
    });

    expect(onPressMock).toHaveBeenCalled();
  });

  it('calls onRefresh when refresh button is pressed', async () => {
    const onRefreshMock = jest.fn();
    
    (companyBillingService.getCompanyBillingStatus as jest.Mock).mockResolvedValue({
      data: mockBillingStatus,
    });

    const { getByTestId } = render(
      <CompanyCreditOverview companyId="test-company" onRefresh={onRefreshMock} />
    );

    await waitFor(() => {
      const refreshButton = getByTestId('refresh-button');
      fireEvent.press(refreshButton);
    });

    expect(onRefreshMock).toHaveBeenCalled();
  });

  it('shows critical status for high utilization', async () => {
    const criticalStatus = {
      ...mockBillingStatus,
      credit_utilization: 95,
      billing_status: 'warning' as const,
    };

    (companyBillingService.getCompanyBillingStatus as jest.Mock).mockResolvedValue({
      data: criticalStatus,
    });

    const { getByText } = render(
      <CompanyCreditOverview companyId="test-company" />
    );

    await waitFor(() => {
      expect(getByText('Critical')).toBeTruthy();
      expect(getByText('95%')).toBeTruthy();
    });
  });

  it('shows overlimit status correctly', async () => {
    const overlimitStatus = {
      ...mockBillingStatus,
      credit_utilization: 105,
      billing_status: 'overlimit' as const,
      current_credit: -5000,
    };

    (companyBillingService.getCompanyBillingStatus as jest.Mock).mockResolvedValue({
      data: overlimitStatus,
    });

    const { getByText } = render(
      <CompanyCreditOverview companyId="test-company" />
    );

    await waitFor(() => {
      expect(getByText('Over Limit')).toBeTruthy();
      expect(getByText('Overlimit')).toBeTruthy();
    });
  });

  it('handles missing latest invoice gracefully', async () => {
    const statusWithoutInvoice = {
      ...mockBillingStatus,
      latest_invoice: null,
    };

    (companyBillingService.getCompanyBillingStatus as jest.Mock).mockResolvedValue({
      data: statusWithoutInvoice,
    });

    const { getByText, queryByText } = render(
      <CompanyCreditOverview companyId="test-company" />
    );

    await waitFor(() => {
      expect(getByText('Company Credit')).toBeTruthy();
      expect(queryByText('Latest Invoice')).toBeFalsy();
    });
  });
});