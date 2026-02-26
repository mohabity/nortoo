import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { blogArticles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-auth";
import { z } from "zod";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const articleId = parseInt(id, 10);
  if (isNaN(articleId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const [article] = await db
    .select()
    .from(blogArticles)
    .where(eq(blogArticles.id, articleId))
    .limit(1);

  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: article });
}

const updateSchema = z.object({
  status: z
    .enum(["generating", "published", "failed", "archived"])
    .optional(),
  seoTitle: z.string().max(65).optional(),
  seoDescription: z.string().max(165).optional(),
  title: z.string().min(1).optional(),
  excerpt: z.string().min(1).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const articleId = parseInt(id, 10);
  if (isNaN(articleId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
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

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.status) updateData.status = parsed.data.status;
  if (parsed.data.seoTitle) updateData.seoTitle = parsed.data.seoTitle;
  if (parsed.data.seoDescription)
    updateData.seoDescription = parsed.data.seoDescription;
  if (parsed.data.title) updateData.title = parsed.data.title;
  if (parsed.data.excerpt) updateData.excerpt = parsed.data.excerpt;

  await db
    .update(blogArticles)
    .set(updateData)
    .where(eq(blogArticles.id, articleId));

  return NextResponse.json({ success: true });
}
