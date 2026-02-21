import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    plan?: string;
    merchantId?: number;
    role?: string;
  }
  interface Session {
    user: {
      userId: number;
      merchantId: number;
      role: string;
      plan: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: number;
    merchantId?: number;
    role?: string;
    plan?: string;
  }
}
