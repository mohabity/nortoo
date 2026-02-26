import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { blogConfig, blogTopics } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["pause", "resume", "generate-now", "retry-failed", "replenish-topics"]),
});

export async function POST(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  }

  const { action } = parsed.data;

  switch (action) {
    case "pause": {
      await db
        .update(blogConfig)
        .set({ paused: true, updatedAt: new Date() })
        .where(eq(blogConfig.id, 1));
      return NextResponse.json({ success: true, action: "paused" });
    }

    case "resume": {
      await db
        .update(blogConfig)
        .set({ paused: false, pausedUntil: null, updatedAt: new Date() })
        .where(eq(blogConfig.id, 1));
      return NextResponse.json({ success: true, action: "resumed" });
    }

    case "generate-now": {
      // Trigger blog-generate cron manually
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";
      const secret = process.env.CRON_SECRET;

      const res = await fetch(`${baseUrl}/api/cron/blog-generate`, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const result = await res.json();
      return NextResponse.json({ success: true, action: "generate-now", result });
    }

    case "retry-failed": {
      // Reset all failed topics to queued (reset attempts)
      const updated = await db
        .update(blogTopics)
        .set({ status: "queued", attempts: 0, errorMessage: null })
        .where(eq(blogTopics.status, "failed"));
      return NextResponse.json({ success: true, action: "retry-failed" });
    }

    case "replenish-topics": {
      // Trigger blog-topics cron manually
      const baseUrl2 = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";
      const secret2 = process.env.CRON_SECRET;

      const res2 = await fetch(`${baseUrl2}/api/cron/blog-topics`, {
        headers: { Authorization: `Bearer ${secret2}` },
      });
      const result2 = await res2.json();
      return NextResponse.json({ success: true, action: "replenish-topics", result: result2 });
    }
  }
}
