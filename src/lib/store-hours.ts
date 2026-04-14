import { DayOfWeek } from "@prisma/client";

type OperatingHourItem = {
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