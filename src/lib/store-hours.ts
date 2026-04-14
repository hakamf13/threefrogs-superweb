import { DayOfWeek } from "@prisma/client";

export type OperatingHourItem = {
  dayOfWeek: DayOfWeek;
  openHour: number | null;
  closeHour: number | null;
  isClosed: boolean;
};

type StoreHoursSource = {
  openHour?: number | null;
  closeHour?: number | null;
  operatingHours?: OperatingHourItem[] | null;
};

const DAY_ORDER: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const DAY_LABEL: Record<DayOfWeek, string> = {
  MONDAY: "Sen",
  TUESDAY: "Sel",
  WEDNESDAY: "Rab",
  THURSDAY: "Kam",
  FRIDAY: "Jum",
  SATURDAY: "Sab",
  SUNDAY: "Min",
};

export function getDayOfWeekForJakartaDate(dateText: string): DayOfWeek {
  const date = new Date(`${dateText}T12:00:00+07:00`);
  const day = date.getDay();

  switch (day) {
    case 0:
      return "SUNDAY";
    case 1:
      return "MONDAY";
    case 2:
      return "TUESDAY";
    case 3:
      return "WEDNESDAY";
    case 4:
      return "THURSDAY";
    case 5:
      return "FRIDAY";
    case 6:
    default:
      return "SATURDAY";
  }
}

export function getStoreHoursForDate(
  store: StoreHoursSource,
  dateText: string
) {
  const dayOfWeek = getDayOfWeekForJakartaDate(dateText);

  const daily =
    store.operatingHours?.find((item) => item.dayOfWeek === dayOfWeek) ?? null;

  if (daily) {
    return {
      dayOfWeek,
      openHour: daily.openHour ?? store.openHour ?? 11,
      closeHour: daily.closeHour ?? store.closeHour ?? 22,
      isClosed: daily.isClosed,
    };
  }

  return {
    dayOfWeek,
    openHour: store.openHour ?? 11,
    closeHour: store.closeHour ?? 22,
    isClosed: false,
  };
}

export function buildHourRange(openHour: number, closeHour: number) {
  if (closeHour <= openHour) return [];

  return Array.from(
    { length: closeHour - openHour },
    (_, index) => openHour + index
  );
}

export function formatHourNumber(hour: number) {
  return `${String(hour).padStart(2, "0")}.00`;
}

function getNormalizedWeeklyHours(store: StoreHoursSource) {
  return DAY_ORDER.map((dayOfWeek) => {
    const daily =
      store.operatingHours?.find((item) => item.dayOfWeek === dayOfWeek) ?? null;

    return {
      dayOfWeek,
      openHour: daily?.openHour ?? store.openHour ?? 11,
      closeHour: daily?.closeHour ?? store.closeHour ?? 22,
      isClosed: daily?.isClosed ?? false,
    };
  });
}

function getDayRangeLabel(days: DayOfWeek[]) {
  if (days.length === 1) {
    return DAY_LABEL[days[0]];
  }

  return `${DAY_LABEL[days[0]]}-${DAY_LABEL[days[days.length - 1]]}`;
}

export function getStoreOperatingHoursSummary(store: StoreHoursSource) {
  const weekly = getNormalizedWeeklyHours(store);

  if (
    weekly.every(
      (item) =>
        !item.isClosed &&
        item.openHour === weekly[0].openHour &&
        item.closeHour === weekly[0].closeHour
    )
  ) {
    return `Setiap hari ${formatHourNumber(weekly[0].openHour)}–${formatHourNumber(
      weekly[0].closeHour
    )}`;
  }

  const groups: Array<{
    days: DayOfWeek[];
    openHour: number;
    closeHour: number;
    isClosed: boolean;
  }> = [];

  for (const item of weekly) {
    const last = groups.at(-1);

    if (
      last &&
      last.isClosed === item.isClosed &&
      last.openHour === item.openHour &&
      last.closeHour === item.closeHour
    ) {
      last.days.push(item.dayOfWeek);
      continue;
    }

    groups.push({
      days: [item.dayOfWeek],
      openHour: item.openHour,
      closeHour: item.closeHour,
      isClosed: item.isClosed,
    });
  }

  return groups
    .map((group) => {
      const dayLabel = getDayRangeLabel(group.days);

      if (group.isClosed) {
        return `${dayLabel} tutup`;
      }

      return `${dayLabel} ${formatHourNumber(group.openHour)}–${formatHourNumber(
        group.closeHour
      )}`;
    })
    .join(" • ");
}