/**
 * YouCan Webhook payload for order.create event
 * Based on: https://developer.youcan.shop/store-admin/resthooks/subscribe
 *           https://developer.youcan.shop/store-admin/orders/get
 */
export interface YouCanOrderPayload {
  id: string;
  ref: string;
  total: number;
  currency: string;
  vat?: number;
  notes?: string | null;
  status: number;
  payment_status?: number;
  extra_fields?: unknown;
  created_at: string;
  updated_at: string;

  customer?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    city?: string;
    address?: string;
    zip_code?: string;
    country_code?: string;
  };

  payment?: {
    status: number;
    status_text: string; // "pending" | "paid" | etc.
    gateway_type?: string; // Numeric ID: "1" = COD, "7" = other, etc.
    payload?: {
      gateway: string; // "cod" | "credit_card" | etc.
      gateway_id?: string;
      "thank-you-message"?: string;
      note?: string;
    };
    address?: Array<{
      first_name?: string;
      last_name?: string;
      address?: string;
      city?: string;
      region?: string;
      zip_code?: string;
      country_code?: string;
      phone?: string;
    }>;
    created_at?: string;
    updated_at?: string;
  };

  shipping?: {
    shipping_zone_id?: string;
    status: number;
    status_text?: string;
    price?: number;
    is_free?: boolean;
    tracking_number?: string;
    payload?: {
      id?: string;
      name?: string;
      display_name?: string;
      price?: number;
      is_free?: boolean;
      is_active?: boolean;
    };
    address?: Array<{
      first_name?: string;
      last_name?: string;
      address?: string;
      city?: string;
      region?: string;
      zip_code?: string;
      country_code?: string;
      phone?: string;
    }>;
    created_at?: string;
    updated_at?: string;
  };

  variants?: Array<{
    id: string;
    price: number;
    quantity: number;
    created_at?: number | string;
    updated_at?: number | string;
    extra_fields?: unknown;
    variant?: {
      id: string;
      price: number;
      compare_at_price?: number;
      weight?: number;
      sku?: string;
      inventory?: number;
      product?: {
        id: string;
        name: string;
        slug?: string;
        thumbnail?: string;
        price?: number;
      };
    };
  }>;

  // Legacy / sometimes present
  items?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}
