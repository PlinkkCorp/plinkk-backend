export function formatDateYMD(dt: Date): string {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getDateRange(from?: string, to?: string, defaultDays = 29) {
  const now = new Date();
  const end = to ? new Date(to + "T23:59:59.999Z") : new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );
  const start = from
    ? new Date(from + "T00:00:00.000Z")
    : new Date(end.getTime() - defaultDays * 86400000);
  return { start, end };
}
