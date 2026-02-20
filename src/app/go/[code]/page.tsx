import { redirect } from "next/navigation";
import { db } from "@/db/index";
import { inviteLinks } from "@/db/schema";
import { eq, and, gt, or, isNull } from "drizzle-orm";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

/**
 * /go/[code] — Magic invite link page.
 *
 * Validates the invite code and redirects to YouCan OAuth
 * with ?mode=register&invite=CODE. If invalid, shows an error.
 */
export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  // Validate invite code
  const [invite] = await db
    .select()
    .from(inviteLinks)
    .where(
      and(
        eq(inviteLinks.code, code),
        eq(inviteLinks.isActive, true),
        // Not expired (null = never expires)
        or(isNull(inviteLinks.expiresAt), gt(inviteLinks.expiresAt, new Date()))
      )
    )
    .limit(1);

  // Check if valid and not exhausted
  if (invite && (invite.maxUses === null || invite.currentUses < invite.maxUses)) {
    redirect(`/api/auth/youcan?mode=register&invite=${encodeURIComponent(code)}`);
  }

  // Invalid or exhausted — show error page
  return (
    <div className="flex min-h-screen items-center justify-center bg-snow px-4">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="mb-8 inline-flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-mint">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#0B0F1A" strokeWidth="2.5" strokeLinecap="round">
              <path d="M3 6h18M7 12h10M10 18h4"/>
            </svg>
          </div>
          <span className="font-display text-2xl font-black tracking-[-0.06em] text-midnight">
            Siift
          </span>
        </div>

        <div className="rounded-sm border border-rose/30 bg-rose-bg p-6">
          <AlertCircle className="mx-auto h-10 w-10 text-rose" />
          <h1 className="mt-3 font-display text-lg font-semibold text-midnight">
            Lien d&apos;invitation invalide
          </h1>
          <p className="mt-2 text-sm text-fog">
            Ce lien est expiré, a atteint sa limite d&apos;utilisation, ou n&apos;existe pas.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-sm bg-mint px-4 py-2.5 text-sm font-medium text-midnight transition-colors hover:bg-mint-dark"
          >
            Créer un compte
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-fog hover:text-slate transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
