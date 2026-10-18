/**
 * Minimal className merge helper. Accepts strings, falsy values, and objects
 * mapping class names to booleans; joins the truthy classes with a space.
 * Framework-free and dependency-free.
 */
export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | Record<string, boolean | null | undefined>;

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === "string" || typeof input === "number") {
      classes.push(String(input));
      continue;
    }
    for (const [key, value] of Object.entries(input)) {
      if (value) classes.push(key);
    }
  }
  return classes.join(" ");
}
