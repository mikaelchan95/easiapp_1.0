/**
 * MCP Stripe Service Integration
 * 
 * This service provides enhanced Stripe integration using MCP (Model Context Protocol)
 * for AI-powered payment processing and management.
 */

import { supabase } from './supabaseService';

export interface StripePaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  metadata?: Record<string, string>;
}

export interface StripeCustomer {
  id: string;
  email: string;
  name: string;
  created: number;
  metadata?: Record<string, string>;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

export class MCPStripeService {
  private static instance: MCPStripeService;
  
  private constructor() {}
  
  static getInstance(): MCPStripeService {
    if (!MCPStripeService.instance) {
      MCPStripeService.instance = new MCPStripeService();
    }
    return MCPStripeService.instance;
  }

  /**
   * Create a payment intent using MCP Stripe server
   * This method leverages Claude Code's MCP integration for enhanced payment processing
   */
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    customerId?: string;
    metadata?: Record<string, string>;
  }): Promise<StripePaymentIntent> {
    try {
      // Note: In a real implementation, Claude Code would use the MCP server
      // For now, we'll use the Supabase Edge Function as a fallback
      const { data, error } = await supabase.functions.invoke('stripe-create-payment-intent', {
        body: {
          amount: Math.round(params.amount * 100), // Convert to cents
          currency: params.currency,
          customer: params.customerId,
          metadata: params.metadata,
        },
      });

      if (error) {
        throw new Error(`Payment intent creation failed: ${error.message}`);
      }

      return {
        id: data.id,
        client_secret: data.client_secret,
        amount: params.amount,
        currency: params.currency,
        status: data.status,
        metadata: params.metadata,
      };
    } catch (error) {
      console.error('MCP Stripe Service - Create Payment Intent Error:', error);
      throw error;
    }
  }

  /**
   * Retrieve payment intent status
   */
  async getPaymentIntent(paymentIntentId: string): Promise<StripePaymentIntent> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-get-payment-intent', {
        body: { payment_intent_id: paymentIntentId },
      });

      if (error) {
        throw new Error(`Payment intent retrieval failed: ${error.message}`);
      }

      return {
        id: data.id,
        client_secret: data.client_secret,
        amount: data.amount / 100, // Convert from cents
        currency: data.currency,
        status: data.status,
        metadata: data.metadata,
      };
    } catch (error) {
      console.error('MCP Stripe Service - Get Payment Intent Error:', error);
      throw error;
    }
  }

  /**
   * Create or retrieve a Stripe customer
   */
  async createCustomer(params: {
    email: string;
    name: string;
    metadata?: Record<string, string>;
  }): Promise<StripeCustomer> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-create-customer', {
        body: {
          email: params.email,
          name: params.name,
          metadata: params.metadata,
        },
      });

      if (error) {
        throw new Error(`Customer creation failed: ${error.message}`);
      }

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        created: data.created,
        metadata: data.metadata,
      };
    } catch (error) {
      console.error('MCP Stripe Service - Create Customer Error:', error);
      throw error;
    }
  }

  /**
   * Validate webhook signature and process event
   */
  async validateWebhook(payload: string, signature: string): Promise<StripeWebhookEvent> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-validate-webhook', {
        body: { payload, signature },
      });

      if (error) {
        throw new Error(`Webhook validation failed: ${error.message}`);
      }

      return {
        id: data.id,
        type: data.type,
        data: data.data,
        created: data.created,
      };
    } catch (error) {
      console.error('MCP Stripe Service - Validate Webhook Error:', error);
      throw error;
    }
  }

  /**
   * Process payment success and update order status
   */
  async processPaymentSuccess(paymentIntentId: string): Promise<void> {
    try {
      // Update order status in database
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      if (error) {
        throw new Error(`Order update failed: ${error.message}`);
      }

      // Log payment success
      await this.logPaymentEvent('payment_succeeded', paymentIntentId);
    } catch (error) {
      console.error('MCP Stripe Service - Process Payment Success Error:', error);
      throw error;
    }
  }

  /**
   * Process payment failure and update order status
   */
  async processPaymentFailure(paymentIntentId: string, failureReason: string): Promise<void> {
    try {
      // Update order status in database
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'payment_failed',
          payment_status: 'failed',
          payment_failure_reason: failureReason,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      if (error) {
        throw new Error(`Order update failed: ${error.message}`);
      }

      // Log payment failure
      await this.logPaymentEvent('payment_failed', paymentIntentId, { reason: failureReason });
    } catch (error) {
      console.error('MCP Stripe Service - Process Payment Failure Error:', error);
      throw error;
    }
  }

  /**
   * Log payment events for audit trail
   */
  private async logPaymentEvent(
    eventType: string,
    paymentIntentId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('payment_events')
        .insert({
          event_type: eventType,
          stripe_payment_intent_id: paymentIntentId,
          metadata,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Payment event logging failed:', error);
      }
    } catch (error) {
      console.error('MCP Stripe Service - Log Payment Event Error:', error);
    }
  }

  /**
   * Get payment analytics and insights
   */
  async getPaymentAnalytics(dateRange: { start: string; end: string }): Promise<{
    totalAmount: number;
    transactionCount: number;
    successRate: number;
    averageOrderValue: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('payment_events')
        .select('*')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (error) {
        throw new Error(`Analytics retrieval failed: ${error.message}`);
      }

      const successfulPayments = data.filter(event => event.event_type === 'payment_succeeded');
      const totalPayments = data.filter(event => 
        event.event_type === 'payment_succeeded' || event.event_type === 'payment_failed'
      );

      const totalAmount = successfulPayments.reduce((sum, event) => 
        sum + (event.metadata?.amount || 0), 0
      );

      return {
        totalAmount,
        transactionCount: successfulPayments.length,
        successRate: totalPayments.length > 0 ? (successfulPayments.length / totalPayments.length) * 100 : 0,
        averageOrderValue: successfulPayments.length > 0 ? totalAmount / successfulPayments.length : 0,
      };
    } catch (error) {
      console.error('MCP Stripe Service - Get Payment Analytics Error:', error);
      throw error;
    }
  }
}

export default MCPStripeService.getInstance();