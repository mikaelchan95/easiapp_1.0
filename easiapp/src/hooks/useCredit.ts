import { useState, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CreditAccount, CreditInvoice, CreditPayment } from '../types/credit';
import { MOCK_CREDIT_ACCOUNTS, MOCK_INVOICES } from '../data/creditData';

export const useCredit = () => {
  const { state } = useApp();
  const [creditAccount, setCreditAccount] = useState<CreditAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<CreditInvoice[]>([]);
  const [payments, setPayments] = useState<CreditPayment[]>([]);

  // Find the credit account for the current user when user changes
  useEffect(() => {
    if (state.user?.role === 'trade') {
      setLoading(true);
      
      // Simulate API call with a small delay for better UX
      setTimeout(() => {
        // Find the correct account for this specific user
        const userAccount = MOCK_CREDIT_ACCOUNTS.find(account => account.userId === state.user?.id);
        setCreditAccount(userAccount || null);
        
        // Filter invoices for this user
        const userInvoices = MOCK_INVOICES.filter(invoice => invoice.userId === state.user?.id);
        setInvoices(userInvoices);
        
        setLoading(false);
      }, 500);
    } else {
      setCreditAccount(null);
      setInvoices([]);
    }
  }, [state.user]);

  const isCreditEligible = useCallback(() => {
    return state.user?.role === 'trade' && creditAccount?.status === 'active';
  }, [state.user, creditAccount]);

  const canUseCreditForAmount = useCallback((amount: number) => {
    if (!creditAccount) return false;
    return creditAccount.availableCredit >= amount;
  }, [creditAccount]);

  const calculateCreditUtilization = useCallback(() => {
    if (!creditAccount) return 0;
    return (creditAccount.usedCredit / creditAccount.creditLimit) * 100;
  }, [creditAccount]);

  const getCreditStatus = useCallback(() => {
    const utilization = calculateCreditUtilization();
    if (utilization >= 90) return { status: 'critical', color: 'red', message: 'Near limit' };
    if (utilization >= 70) return { status: 'warning', color: 'yellow', message: 'High usage' };
    return { status: 'good', color: 'green', message: 'Good standing' };
  }, [calculateCreditUtilization]);

  const useCreditForOrder = useCallback(async (orderAmount: number, orderId: string) => {
    if (!creditAccount || !canUseCreditForAmount(orderAmount)) {
      throw new Error('Insufficient credit available');
    }

    setLoading(true);
    
    try {
      // Simulate API call with enhanced feedback
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update credit account
      const updatedAccount = {
        ...creditAccount,
        usedCredit: creditAccount.usedCredit + orderAmount,
        availableCredit: creditAccount.availableCredit - orderAmount
      };
      setCreditAccount(updatedAccount);

      // Generate invoice
      const invoice = generateInvoice(orderId, orderAmount);
      setInvoices(prev => [invoice, ...prev]);

      return invoice;
    } finally {
      setLoading(false);
    }
  }, [creditAccount, canUseCreditForAmount]);

  const generateInvoice = useCallback((orderId: string, amount: number): CreditInvoice => {
    const issueDate = new Date().toISOString();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (creditAccount?.paymentTerms || 30));

    return {
      id: `INV-${Date.now()}`,
      orderId,
      userId: state.user!.id,
      amount,
      issueDate,
      dueDate: dueDate.toISOString(),
      status: 'pending',
      paymentTerms: creditAccount?.paymentTerms || 30,
      items: state.cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.tradePrice,
        total: item.product.tradePrice * item.quantity,
        sku: item.product.sku
      })),
      taxAmount: amount * 0.09, // 9% GST
      subtotal: amount / 1.09,
      total: amount
    };
  }, [creditAccount, state.user, state.cart]);

  const makePayment = useCallback(async (invoiceId: string, amount: number) => {
    setLoading(true);
    
    try {
      // Simulate network request with appropriate delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const payment: CreditPayment = {
        id: `PAY-${Date.now()}`,
        invoiceId,
        amount,
        paymentDate: new Date().toISOString(),
        paymentMethod: 'bank_transfer',
        reference: `REF-${Date.now()}`,
        status: 'completed'
      };
      
      setPayments(prev => [payment, ...prev]);
      
      // Update invoice status
      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId 
          ? { ...inv, status: 'paid', paidDate: payment.paymentDate, paidAmount: amount }
          : inv
      ));
      
      // Update credit account
      if (creditAccount) {
        setCreditAccount(prev => prev ? {
          ...prev,
          usedCredit: Math.max(0, prev.usedCredit - amount),
          availableCredit: Math.min(prev.creditLimit, prev.availableCredit + amount),
          lastPaymentDate: payment.paymentDate
        } : null);
      }
      
      return payment;
    } finally {
      setLoading(false);
    }
  }, [creditAccount]);

  const formatCurrency = useCallback((amount: number) => {
    return `$${amount.toLocaleString('en-SG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }, []);

  const formatPaymentTerms = useCallback((days: number) => {
    return `Net ${days} days`;
  }, []);

  return {
    // State
    creditAccount,
    loading,
    invoices,
    payments,
    
    // Computed
    isCreditEligible: isCreditEligible(),
    creditUtilization: calculateCreditUtilization(),
    creditStatus: getCreditStatus(),
    
    // Actions  
    canUseCreditForAmount,
    useCreditForOrder,
    makePayment,
    
    // Utils
    formatCurrency,
    formatPaymentTerms
  };
};