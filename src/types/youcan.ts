/**
 * YouCan Webhook payload for order.created event
 * Documentation: https://developer.youcan.shop/webhooks
 */
export interface YouCanOrderPayload {
  id: string;
  ref: string;
  token: string;
  customer: {
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
  payment: {
    gateway: string; // "cod" | "credit_card" | etc.
    status: string;
  };
  shipping: {
    address: string;
    city: string;
    state?: string;
    zip_code?: string;
    country_code?: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    variant?: {
      id: string;
      name: string;
    };
  }>;
  total: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}
