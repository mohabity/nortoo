import { redirect } from "next/navigation";

/**
 * Order detail page — redirects to the orders list with the slide-over open.
 * This ensures direct links (e.g. /dashboard/orders/5) still work.
 */
export default async function OrderDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/orders?selected=${id}`);
}
