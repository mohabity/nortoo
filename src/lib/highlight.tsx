import React from "react";

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Highlight matching search terms in text.
 * Returns React nodes with <mark> tags around matches.
 */
export function highlightText(
  text: string | null | undefined,
  query: string
): React.ReactNode {
  if (!query || !text) return text ?? "";

  const words = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  if (words.length === 0) return text;

  const regex = new RegExp(
    `(${words.map((w) => escapeRegex(w)).join("|")})`,
    "gi"
  );

  // Normalize text for matching but keep original for display
  const normalizedText = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Find match positions in normalized text, apply to original
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(normalizedText)) !== null) {
    // Add text before match (from original)
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    // Add highlighted match (from original)
    parts.push(
      <mark
        key={match.index}
        className="bg-mint-light/60 text-mint-deep rounded-sm px-0.5"
      >
        {text.slice(match.index, match.index + match[0].length)}
      </mark>
    );
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}
