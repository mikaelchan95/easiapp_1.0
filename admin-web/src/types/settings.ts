export interface LoyaltyConfig {
  earn_rate: number; // Points per dollar
  redemption_rate: number; // Dollar value per point
}

export interface DeliveryConfig {
  default_fee: number;
  express_fee: number;
  free_delivery_threshold: number;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  marketing_emails?: boolean;
}

export interface AppSetting {
  key: string;
  value: any;
  updated_at: string;
  updated_by?: string;
}

export interface UserSetting {
  user_id: string;
  preferences: {
    notifications: NotificationPreferences;
  };
}
