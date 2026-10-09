export function apiUrl(path: string) {
  const base = (import.meta.env.VITE_API_BASE_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  return `${base}${path}`;
}
