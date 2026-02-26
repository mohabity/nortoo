import { cookies } from "next/headers";
import { BlogShell } from "@/components/blog/blog-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | nortoo Blog",
    default: "Blog — nortoo",
  },
  description:
    "Conseils, guides et analyses pour les marchands e-commerce COD au Maroc. Réduisez vos retours, optimisez vos livraisons.",
};

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read locale server-side so the client component can sync reliably
  const cookieStore = await cookies();
  const serverLocale = cookieStore.get("nortoo_lang")?.value === "en" ? "en" : "fr";

  return <BlogShell serverLocale={serverLocale}>{children}</BlogShell>;
}
