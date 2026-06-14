import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

export const Icons = {
  spark: (p: P) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
  mark: (p: P) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 2.5l2.4 5.3 5.8.6-4.3 3.9 1.2 5.7L12 15.9 6.9 18l1.2-5.7L3.8 8.4l5.8-.6L12 2.5z"
        fill="#fff"
        opacity="0.95"
      />
    </svg>
  ),
  lock: (p: P) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}>
      <rect
        x="5"
        y="11"
        width="14"
        height="9"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
  warn: (p: P) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 4.5l8.5 14.5H3.5L12 4.5z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M12 10v4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" />
    </svg>
  ),
  send: (p: P) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M21 4L3 11l6.5 2.2M21 4l-2.4 16-5.4-4.9M21 4L9.5 13.2m0 0l3.7 2.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  mail: (p: P) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}>
      <rect
        x="3"
        y="5.5"
        width="18"
        height="13"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M4 7.5l8 5.5 8-5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  chat: (p: P) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M5 5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10l-4.5 3.2V16H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  ),
  check: (p: P) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M5 12.5l4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  pencil: (p: P) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M4 20h4L18.5 9.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  ),
  x: (p: P) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
  chevron: (p: P) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  flower: (p: P) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="6.5" r="3.1" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="17.5" r="3.1" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6.5" cy="12" r="3.1" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="12" r="3.1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
};

export const STATUS_TEXT: Record<"green" | "amber" | "red", string> = {
  green: "Green",
  amber: "Yellow",
  red: "Red",
};
export const STATUS_CLASS: Record<"green" | "amber" | "red", string> = {
  green: "s-green",
  amber: "s-amber",
  red: "s-red",
};
export const LEVEL_CLASS: Record<"green" | "amber" | "red", string> = {
  green: "lvl-green",
  amber: "lvl-amber",
  red: "lvl-red",
};
export const DOT_COLOR: Record<"green" | "amber" | "red", string> = {
  green: "var(--green)",
  amber: "var(--amber)",
  red: "var(--red)",
};

export function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
