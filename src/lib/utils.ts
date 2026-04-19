import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Lowercase, no-space, prototype-compatible status class suffix. */
export function statusClass(status: string): string {
  return `status-${status.toLowerCase().replace(/\s+/g, "")}`;
}
