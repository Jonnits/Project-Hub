export function formatRelative(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.round((Date.now() - then) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function issueKey(projectKey: string, number: number) {
  return `${projectKey}-${number}`;
}

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function keyFromName(name: string) {
  const letters = name.replace(/[^a-zA-Z]/g, "");
  if (letters.length >= 3) return letters.slice(0, 3).toUpperCase();
  const words = name.trim().split(/\s+/).filter(Boolean);
  const fromWords = words.map((word) => word[0]).join("");
  return (fromWords || "PRJ").slice(0, 4).toUpperCase();
}

export function uid(prefix = "id") {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}
