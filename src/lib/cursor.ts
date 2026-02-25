/**
 * Cursor-based pagination utilities.
 * Uses (createdAt, id) composite cursor encoded as base64url JSON.
 */

interface CursorData {
  ts: string; // ISO date string
  id: number;
}

/**
 * Encode a cursor from createdAt + id.
 */
export function encodeCursor(createdAt: Date | string, id: number): string {
  const ts = typeof createdAt === "string" ? createdAt : createdAt.toISOString();
  const json = JSON.stringify({ ts, id });
  // Use base64url encoding (no padding, URL-safe)
  return Buffer.from(json).toString("base64url");
}

/**
 * Decode a cursor string back to { ts, id }.
 * Returns null if the cursor is malformed.
 */
export function decodeCursor(cursor: string): CursorData | null {
  try {
    const json = Buffer.from(cursor, "base64url").toString("utf-8");
    const data = JSON.parse(json);
    if (typeof data.ts !== "string" || typeof data.id !== "number") {
      return null;
    }
    // Validate ISO date
    const d = new Date(data.ts);
    if (isNaN(d.getTime())) return null;
    return { ts: data.ts, id: data.id };
  } catch {
    return null;
  }
}
