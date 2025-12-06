export interface RewardCatalogItem {
    id: string;
    title: string;
    description: string;
    points_required: number;
    reward_type: 'voucher' | 'bundle' | 'swag' | 'experience';
    reward_value?: number;
    validity_days?: number;
    stock_quantity?: number;
    is_active: boolean;
    image_url?: string;
    terms_conditions?: string;
    created_at?: string;
    updated_at?: string;
  }
  
