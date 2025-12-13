import { type ClassValue, clsx } from "clsx";
import { first, words } from "lodash";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDayPart(date = new Date()) {
  const hours = date.getHours();
  if (hours > 4 && hours < 12) {
    return "morning";
  }
  if (hours < 18) {
    return "afternoon";
  }
  return "evening";
}

export function getFirstName(name?: string | null) {
  return first(words(name ?? "")) ?? "";
}

export function getGreeting(name?: string | null) {
  const firstName = getFirstName(name);
  const dayPart = getDayPart();
  return `Good ${dayPart}, ${firstName ? ` ${firstName}` : ""}.`;
}
