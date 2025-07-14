import { DeliveryAddress } from '../types/checkout';

export interface ValidationError {
  field: string;
  message: string;
}

export interface AddressValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate delivery address for checkout
 */
export function validateDeliveryAddress(
  address: Partial<DeliveryAddress>
): AddressValidationResult {
  const errors: ValidationError[] = [];

  // Required fields validation
  if (!address.name?.trim()) {
    errors.push({ field: 'name', message: 'Recipient name is required' });
  }

  if (!address.phone?.trim()) {
    errors.push({ field: 'phone', message: 'Phone number is required' });
  } else if (!isValidPhoneNumber(address.phone)) {
    errors.push({
      field: 'phone',
      message: 'Please enter a valid phone number',
    });
  }

  if (!address.street?.trim()) {
    errors.push({ field: 'street', message: 'Street address is required' });
  }

  if (!address.city?.trim()) {
    errors.push({ field: 'city', message: 'City is required' });
  }

  if (!address.postalCode?.trim()) {
    errors.push({ field: 'postalCode', message: 'Postal code is required' });
  } else if (!isValidSingaporePostalCode(address.postalCode)) {
    errors.push({
      field: 'postalCode',
      message: 'Please enter a valid Singapore postal code',
    });
  }

  if (!address.country?.trim()) {
    errors.push({ field: 'country', message: 'Country is required' });
  }

  // Length validations
  if (address.name && address.name.length > 100) {
    errors.push({
      field: 'name',
      message: 'Name must be less than 100 characters',
    });
  }

  if (address.street && address.street.length > 200) {
    errors.push({
      field: 'street',
      message: 'Street address must be less than 200 characters',
    });
  }

  if (address.unit && address.unit.length > 50) {
    errors.push({
      field: 'unit',
      message: 'Unit number must be less than 50 characters',
    });
  }

  if (address.instructions && address.instructions.length > 500) {
    errors.push({
      field: 'instructions',
      message: 'Delivery instructions must be less than 500 characters',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Singapore phone number
 */
function isValidPhoneNumber(phone: string): boolean {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');

  // Singapore phone number patterns
  // Mobile: 8xxx xxxx or 9xxx xxxx (8 digits, starting with 8 or 9)
  // Landline: 6xxx xxxx (8 digits, starting with 6)
  // With country code: +65 followed by above patterns

  if (cleaned.startsWith('65')) {
    // With country code
    const withoutCountryCode = cleaned.substring(2);
    return /^[689]\d{7}$/.test(withoutCountryCode);
  } else {
    // Without country code
    return /^[689]\d{7}$/.test(cleaned);
  }
}

/**
 * Validate Singapore postal code
 */
function isValidSingaporePostalCode(postalCode: string): boolean {
  // Singapore postal codes are 6 digits
  const cleaned = postalCode.replace(/\s/g, '');
  return /^\d{6}$/.test(cleaned);
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate credit card number (basic Luhn algorithm)
 */
export function isValidCreditCard(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\s/g, '');

  if (!/^\d+$/.test(cleaned) || cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let isEvenPosition = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);

    if (isEvenPosition) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEvenPosition = !isEvenPosition;
  }

  return sum % 10 === 0;
}

/**
 * Validate CVV code
 */
export function isValidCVV(cvv: string, cardType?: string): boolean {
  const cleaned = cvv.replace(/\s/g, '');

  if (cardType === 'amex') {
    return /^\d{4}$/.test(cleaned);
  } else {
    return /^\d{3}$/.test(cleaned);
  }
}

/**
 * Validate expiry date (MM/YY format)
 */
export function isValidExpiryDate(expiryDate: string): boolean {
  const cleaned = expiryDate.replace(/\s/g, '');

  if (!/^\d{2}\/\d{2}$/.test(cleaned)) {
    return false;
  }

  const [month, year] = cleaned.split('/').map(num => parseInt(num));

  if (month < 1 || month > 12) {
    return false;
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100; // Get last 2 digits
  const currentMonth = currentDate.getMonth() + 1;

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return false;
  }

  return true;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('65')) {
    const withoutCountryCode = cleaned.substring(2);
    if (withoutCountryCode.length === 8) {
      return `+65 ${withoutCountryCode.substring(0, 4)} ${withoutCountryCode.substring(4)}`;
    }
  } else if (cleaned.length === 8) {
    return `${cleaned.substring(0, 4)} ${cleaned.substring(4)}`;
  }

  return phone; // Return original if can't format
}

/**
 * Format postal code for display
 */
export function formatPostalCode(postalCode: string): string {
  const cleaned = postalCode.replace(/\s/g, '');

  if (cleaned.length === 6) {
    return `${cleaned.substring(0, 3)} ${cleaned.substring(3)}`;
  }

  return postalCode; // Return original if can't format
}

/**
 * Validate minimum order amount
 */
export function validateMinimumOrder(
  total: number,
  minimumAmount: number = 50
): ValidationError | null {
  if (total < minimumAmount) {
    return {
      field: 'orderTotal',
      message: `Minimum order amount is $${minimumAmount.toFixed(2)}`,
    };
  }
  return null;
}

/**
 * Validate delivery time slot
 */
export function validateDeliveryTimeSlot(
  date: string,
  timeSlot: string
): ValidationError | null {
  const deliveryDate = new Date(date);
  const currentDate = new Date();

  // Must be at least 24 hours in advance
  const minDeliveryTime = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);

  if (deliveryDate < minDeliveryTime) {
    return {
      field: 'deliveryDate',
      message: 'Delivery must be scheduled at least 24 hours in advance',
    };
  }

  // Check if delivery date is too far in future (30 days)
  const maxDeliveryTime = new Date(
    currentDate.getTime() + 30 * 24 * 60 * 60 * 1000
  );

  if (deliveryDate > maxDeliveryTime) {
    return {
      field: 'deliveryDate',
      message: 'Delivery cannot be scheduled more than 30 days in advance',
    };
  }

  return null;
}

/**
 * Validate individual address field
 */
export function validateField(
  field: string,
  value: string
): { isValid: boolean; error?: string } {
  switch (field) {
    case 'name':
      if (!value?.trim()) {
        return { isValid: false, error: 'Recipient name is required' };
      }
      if (value.length > 100) {
        return {
          isValid: false,
          error: 'Name must be less than 100 characters',
        };
      }
      return { isValid: true };

    case 'phone':
      if (!value?.trim()) {
        return { isValid: false, error: 'Phone number is required' };
      }
      if (!isValidPhoneNumber(value)) {
        return { isValid: false, error: 'Please enter a valid phone number' };
      }
      return { isValid: true };

    case 'address':
      if (!value?.trim()) {
        return { isValid: false, error: 'Address is required' };
      }
      if (value.length > 200) {
        return {
          isValid: false,
          error: 'Address must be less than 200 characters',
        };
      }
      return { isValid: true };

    case 'postalCode':
      if (!value?.trim()) {
        return { isValid: false, error: 'Postal code is required' };
      }
      if (!isValidSingaporePostalCode(value)) {
        return {
          isValid: false,
          error: 'Please enter a valid Singapore postal code',
        };
      }
      return { isValid: true };

    default:
      return { isValid: true };
  }
}

/**
 * Validate complete address for checkout
 */
export function validateAddress(address: any): {
  canContinue: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  // Validate required fields
  if (!address.name?.trim()) {
    errors.name = 'Recipient name is required';
  }

  if (!address.phone?.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!isValidPhoneNumber(address.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  if (!address.address?.trim()) {
    errors.address = 'Address is required';
  }

  if (!address.postalCode?.trim()) {
    errors.postalCode = 'Postal code is required';
  } else if (!isValidSingaporePostalCode(address.postalCode)) {
    errors.postalCode = 'Please enter a valid Singapore postal code';
  }

  return {
    canContinue: Object.keys(errors).length === 0,
    errors,
  };
}
