import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    plan?: string;
  }
  interface Session {
    user: {
      merchantId: number;
      plan: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    merchantId?: number;
    plan?: string;
  }
}
