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

export function generateDateSeries<T>(
  start: Date,
  end: Date,
  initialValue: () => T
): Map<string, T> {
  const map = new Map<string, T>();
  for (let t = new Date(start.getTime()); t <= end; t = new Date(t.getTime() + 86400000)) {
    map.set(formatDateYMD(t), initialValue());
  }
  return map;
}

export function mapToSortedArray<T>(map: Map<string, T>): { date: string; value: T }[] {
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ date, value }));
}
