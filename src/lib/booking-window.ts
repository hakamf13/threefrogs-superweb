const JAKARTA_TIMEZONE = "Asia/Jakarta";

export function getTodayDateStringInJakarta(now = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(now);
}

export function addDaysToDateString(dateString: string, days: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getBookingWindow(now = new Date()) {
  const minDate = getTodayDateStringInJakarta(now);
  const maxDate = addDaysToDateString(minDate, 29);

  return {
    minDate,
    maxDate,
  };
}

export function isDateWithinBookingWindow(dateString: string, now = new Date()) {
  const { minDate, maxDate } = getBookingWindow(now);
  return dateString >= minDate && dateString <= maxDate;
}

export function getCurrentHourInJakarta(now = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    hour12: false,
  });

  return Number(formatter.format(now));
}