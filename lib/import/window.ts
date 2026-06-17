export type ImportWindow = {
  days: number;
  start: Date;
  end: Date;
  startIso: string;
  endIso: string;
  startDate: string;
  endDate: string;
  label: string;
};

export function getImportWindow(): ImportWindow {
  const configuredDays = Number(process.env.IMPORT_WINDOW_DAYS || 365);
  const days = Number.isFinite(configuredDays) && configuredDays > 0 ? Math.floor(configuredDays) : 365;
  const start = new Date();
  const end = new Date(start);
  end.setDate(start.getDate() + days);

  return {
    days,
    start,
    end,
    startIso: start.toISOString().replace(/\.\d{3}Z$/, "Z"),
    endIso: end.toISOString().replace(/\.\d{3}Z$/, "Z"),
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    label: `next ${days} days`
  };
}

export function isDateInImportWindow(value: string | null | undefined, window = getImportWindow()) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date >= window.start && date <= window.end;
}
