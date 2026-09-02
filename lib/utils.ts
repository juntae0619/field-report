import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDateKeyInTimeZone(date = new Date(), timeZone = "Asia/Seoul"): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function formatDate(date: string | Date, withTime = false): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "-";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const base = `${yyyy}.${mm}.${dd}`;
  if (!withTime) return base;
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${base} ${hh}:${min}`;
}

/**
 * 보안 컨텍스트(HTTPS/localhost)가 아니면 crypto.randomUUID 가 없어
 * (HTTP LAN 접속 등) 에러가 나므로 안전한 대체 구현을 사용한다.
 */
export function randomId(): string {
  const c =
    typeof globalThis !== "undefined"
      ? (globalThis.crypto as Crypto | undefined)
      : undefined;
  if (c?.randomUUID) return c.randomUUID();
  if (c?.getRandomValues) {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
      .slice(6, 8)
      .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function formatPriceManwon(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "-";
  const eok = Math.floor(value / 10000);
  const manwon = value % 10000;
  if (eok > 0 && manwon > 0) return `${eok}억 ${manwon.toLocaleString("ko-KR")}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${value.toLocaleString("ko-KR")}만원`;
}

export function formatArea(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "-";
  const pyeong = value / 3.3058;
  return `${value.toLocaleString("ko-KR")}㎡ (${pyeong.toFixed(1)}평)`;
}

export function formatTime(value: string | null): string {
  if (!value) return "-";
  return value.slice(0, 5);
}
