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

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BlogShell>{children}</BlogShell>;
}
