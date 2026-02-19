import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: {
      ordersToday: 58,
      avgScore: 38,
      deliveryRate: 78,
      blockedCount: 4,
      totalOrders: 441,
      rtoRate: 22,
    },
  });
}
