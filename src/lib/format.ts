// Dates are shown in clinic time (Baguio City).
export function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function isWithinDays(iso: string, days: number) {
  return Date.parse(iso) >= Date.now() - days * 24 * 60 * 60 * 1000;
}
