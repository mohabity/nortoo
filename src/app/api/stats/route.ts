import { NextResponse } from "next/server";
import { getMerchantId } from "@/lib/merchant";

export async function GET() {
  try {
    // Auth guard — ensures only authenticated merchants can access
    await getMerchantId();

    // TODO: Replace mock data with real DB queries
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
  } catch (error) {
    console.error("[Stats] Error:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
