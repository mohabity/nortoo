import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Get the current authenticated merchant from the Auth.js session.
 * Returns null if not authenticated.
 */
export async function getCurrentMerchant() {
  const session = await auth();
  if (!session?.user?.merchantId) return null;
  return {
    merchantId: session.user.merchantId,
    email: session.user.email,
    name: session.user.name,
    plan: session.user.plan,
  };
}

/**
 * Require authentication. Throws AuthError if not logged in.
 * Use in API routes that need the merchant context.
 */
export async function requireMerchant() {
  const merchant = await getCurrentMerchant();
  if (!merchant) {
    throw new AuthError();
  }
  return merchant;
}

/**
 * Custom error class for auth failures.
 */
export class AuthError extends Error {
  constructor() {
    super("Non authentifié");
  }
}

/**
 * Standard 401 JSON response for API routes.
 */
export function handleAuthError() {
  return NextResponse.json(
    { error: "Non authentifié. Connectez-vous sur /login." },
    { status: 401 }
  );
}
