import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { blogConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-auth";
import { z } from "zod";

export async function GET(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [config] = await db.select().from(blogConfig).limit(1);

  if (!config) {
    // Auto-create default config
    const [created] = await db
      .insert(blogConfig)
      .values({
        articlesPerWeek: 3,
        minQueueSize: 10,
        autoTranslate: true,
        paused: false,
      })
      .returning();
    return NextResponse.json({ data: created });
  }

  return NextResponse.json({ data: config });
}

const updateSchema = z.object({
  articlesPerWeek: z.number().min(1).max(14).optional(),
  minQueueSize: z.number().min(5).max(50).optional(),
  autoTranslate: z.boolean().optional(),
  paused: z.boolean().optional(),
  pausedUntil: z.string().nullable().optional(),
});

export async function PUT(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 }
    );
  }

  const [config] = await db.select().from(blogConfig).limit(1);

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.articlesPerWeek !== undefined)
    updateData.articlesPerWeek = parsed.data.articlesPerWeek;
  if (parsed.data.minQueueSize !== undefined)
    updateData.minQueueSize = parsed.data.minQueueSize;
  if (parsed.data.autoTranslate !== undefined)
    updateData.autoTranslate = parsed.data.autoTranslate;
  if (parsed.data.paused !== undefined) updateData.paused = parsed.data.paused;
  if (parsed.data.pausedUntil !== undefined)
    updateData.pausedUntil = parsed.data.pausedUntil
      ? new Date(parsed.data.pausedUntil)
      : null;

  if (config) {
    await db
      .update(blogConfig)
      .set(updateData)
      .where(eq(blogConfig.id, config.id));
  } else {
    await db.insert(blogConfig).values({
      ...updateData,
      articlesPerWeek:
        (updateData.articlesPerWeek as number) ?? 3,
      minQueueSize: (updateData.minQueueSize as number) ?? 10,
      autoTranslate: (updateData.autoTranslate as boolean) ?? true,
      paused: (updateData.paused as boolean) ?? false,
    });
  }

  return NextResponse.json({ success: true });
}
