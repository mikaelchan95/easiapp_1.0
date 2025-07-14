# Company Billing Dashboard Components

A comprehensive suite of React Native components for managing company billing, credit monitoring, invoice tracking, and payment history in the EASI app.

## Overview

The billing dashboard provides sophisticated financial management capabilities for B2B customers, including real-time credit monitoring, invoice management, payment tracking, and billing automation settings.

## Components

### 1. CompanyCreditOverview

**Main credit overview widget for dashboard integration**

A comprehensive credit status widget that displays real-time credit utilization, available credit, latest invoice information, and status warnings.

```tsx
import { CompanyCreditOverview } from '../components/Billing';

<CompanyCreditOverview
  companyId="company-uuid"
  onPress={() => navigation.navigate('BillingDashboard')}
  onRefresh={handleRefresh}
  showHeader={true}
/>;
```

**Features:**

- Real-time credit utilization with progress bar
- Available credit vs. used credit display
- Latest invoice status and due date warnings
- Overdue payment alerts with day counts
- Credit status badges (Good Standing, High Usage, Critical, Over Limit)
- Pull-to-refresh functionality
- Tap to navigate to full billing dashboard

**Design Elements:**

- Monochrome design with status color coding
- Card-based layout with shadow elevation
- Progress bars for credit utilization
- Status badges with appropriate colors
- Clean typography hierarchy

### 2. BillingDashboard

**Comprehensive billing management screen**

A full-featured dashboard with tabbed navigation for overview, invoices, and payments management.

```tsx
import { BillingDashboard } from '../components/Billing';

<BillingDashboard
  companyId="company-uuid"
  companyName="Company Name"
  onNavigateToSettings={() => navigation.navigate('BillingSettings')}
/>;
```

**Features:**

- Three-tab interface: Overview, Invoices, Payments
- Quick actions for common billing tasks
- Financial statistics and metrics
- Chart placeholders for future analytics integration
- Generate invoice functionality
- Manual payment recording
- Settings navigation

**Tabs:**

- **Overview**: Credit status, quick actions, stats, charts
- **Invoices**: Full invoice listing with filtering
- **Payments**: Complete payment history with reconciliation

### 3. InvoicesList

**Invoice listing with pagination and filters**

A sophisticated invoice management component with filtering, search, and pagination capabilities.

```tsx
import { InvoicesList } from '../components/Billing';

<InvoicesList
  companyId="company-uuid"
  onInvoicePress={invoice =>
    navigation.navigate('InvoiceDetail', { invoiceId: invoice.id })
  }
  showFilters={true}
  limit={20}
/>;
```

**Features:**

- Horizontal filter buttons (All, Pending, Paid, Overdue, Cancelled)
- Infinite scroll pagination
- Pull-to-refresh functionality
- Status indicators with color coding
- Due date warnings and overdue alerts
- Outstanding amount tracking
- Invoice detail navigation

**Filter Options:**

- All invoices
- Pending payments
- Paid invoices
- Overdue invoices
- Cancelled invoices

### 4. PaymentHistory

**Payment history and reconciliation**

Comprehensive payment tracking with detailed transaction information and status management.

```tsx
import { PaymentHistory } from '../components/Billing';

<PaymentHistory
  companyId="company-uuid"
  onPaymentPress={payment =>
    navigation.navigate('PaymentDetail', { paymentId: payment.id })
  }
  showFilters={true}
  limit={20}
/>;
```

**Features:**

- Payment method icons and status indicators
- Reference number tracking
- Invoice association indicators
- Recent payment badges
- Summary statistics (total payments, monthly totals)
- Filter by payment status
- Detailed payment information display

**Payment Information:**

- Amount and currency formatting
- Payment method (Bank Transfer, Credit Card, etc.)
- Transaction reference numbers
- Status tracking (Confirmed, Pending, Failed, Cancelled)
- Payment date and processing time
- Associated invoice information
- Transaction notes

### 5. BillingSettingsScreen

**Billing preferences and automation settings**

Comprehensive billing configuration screen for managing automated billing, email notifications, and late fee policies.

```tsx
import { BillingSettingsScreen } from '../components/Billing';

<BillingSettingsScreen
  companyId="company-uuid"
  companyName="Company Name"
  onSave={settings => console.log('Settings saved:', settings)}
  onBack={() => navigation.goBack()}
/>;
```

**Settings Categories:**

**General Settings:**

- Billing frequency (Monthly, Quarterly, Annual)
- Billing day of month (1-28)
- Automatic billing toggle

**Email Settings:**

- Primary billing email address
- CC email addresses (multiple)
- Payment reminder toggles
- Reminder timing configuration (days before due date)

**Late Fee Settings:**

- Enable/disable late fees
- Late fee type (Percentage vs. Fixed amount)
- Late fee amount configuration
- Grace period settings (days after due date)

**Features:**

- Form validation with error handling
- Real-time change tracking
- Save/Reset functionality with confirmation
- Help section with support contact
- Responsive layout with section organization

## Integration

### Navigation Setup

Add the billing routes to your navigation configuration:

```tsx
// In your stack navigator
import {
  BillingDashboard,
  BillingSettingsScreen
} from '../components/Billing';

// Add routes
<Stack.Screen
  name="BillingDashboard"
  component={BillingDashboard}
  options={{ title: 'Billing Dashboard' }}
/>
<Stack.Screen
  name="BillingSettings"
  component={BillingSettingsScreen}
  options={{ title: 'Billing Settings' }}
/>
```

### Service Integration

All components integrate with the `companyBillingService` for data fetching and management:

```tsx
import companyBillingService from '../services/companyBillingService';

// Example usage in your components
const loadBillingData = async () => {
  const { data, error } =
    await companyBillingService.getCompanyBillingStatus(companyId);
  if (data) {
    setBillingStatus(data);
  }
};
```

### Dashboard Integration

Add the credit overview to your main dashboard:

```tsx
// In your main dashboard component
import { CompanyCreditOverview } from '../components/Billing';

const Dashboard = () => {
  return (
    <ScrollView>
      {/* Other dashboard components */}

      <CompanyCreditOverview
        companyId={user.company_id}
        onPress={() =>
          navigation.navigate('BillingDashboard', {
            companyId: user.company_id,
            companyName: user.company_name,
          })
        }
      />

      {/* More dashboard components */}
    </ScrollView>
  );
};
```

## Styling and Design

### Design System Compliance

All components follow the established monochrome design system:

- **Canvas Cards**: `hsl(0, 0%, 100%)` (pure white)
- **Frame Background**: `hsl(0, 0%, 98%)` (very light gray)
- **Text Colors**: `hsl(0, 0%, 0%)` (black) and `hsl(0, 0%, 30%)` (dark gray)
- **Interactive Elements**: Black backgrounds with white text
- **Shadows**: Light and medium shadow variants

### Status Color Coding

Financial status indicators use semantic colors:

- **Good Standing**: `#10B981` (Green)
- **Warning/High Usage**: `#F59E0B` (Amber)
- **Critical/Overdue**: `#EF4444` (Red)
- **Information**: `#3B82F6` (Blue)

### Typography

Components use the established typography system:

- **Headings**: 18-24px with semibold/bold weights
- **Body Text**: 14-16px with regular/medium weights
- **Captions**: 12px with secondary color
- **Labels**: 10-12px for metadata

## Error Handling

All components include comprehensive error handling:

- Loading states with activity indicators
- Error states with retry functionality
- Network error recovery
- Graceful degradation for missing data
- User-friendly error messages

## Testing

Comprehensive test coverage includes:

- Component rendering tests
- User interaction testing
- Error state handling
- Service integration mocking
- Accessibility compliance

## Accessibility

Components include accessibility features:

- Semantic HTML structure
- Screen reader support
- Touch target sizing (44px minimum)
- Color contrast compliance
- Keyboard navigation support

## Performance Optimization

- Lazy loading for large datasets
- Pagination for invoice and payment lists
- Memoized calculations for financial metrics
- Optimized re-renders with React hooks
- Image optimization for icons and charts

## Future Enhancements

### Phase 2 Features

- Chart integration (Victory Native or similar)
- Export functionality (PDF invoices, CSV reports)
- Advanced filtering and search
- Bulk payment processing
- Mobile payment integration

### Phase 3 Features

- Real-time notifications
- Automated payment matching
- Multi-currency support
- Advanced analytics and reporting
- Integration with accounting software

## Dependencies

- React Native
- React Navigation
- Expo Icons
- Company Billing Service
- Theme utilities

## Support

For technical support or feature requests, contact the development team or refer to the main project documentation.
