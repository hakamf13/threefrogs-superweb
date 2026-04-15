import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "../../../../../lib/prisma";
import { DayOfWeek } from "@prisma/client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

const DAY_VALUES: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const slug = typeof body?.slug === "string" ? normalizeSlug(body.slug) : "";
    const city =
      typeof body?.city === "string" && body.city.trim().length > 0
        ? body.city.trim()
        : null;
    const address =
      typeof body?.address === "string" && body.address.trim().length > 0
        ? body.address.trim()
        : null;
    const locationHint =
      typeof body?.locationHint === "string" &&
      body.locationHint.trim().length > 0
        ? body.locationHint.trim()
        : null;
    const description =
      typeof body?.description === "string" &&
      body.description.trim().length > 0
        ? body.description.trim()
        : null;
    const openHour = Number(body?.openHour);
    const closeHour = Number(body?.closeHour);
    const isActive = Boolean(body?.isActive);

		const operatingHoursInput: unknown[] = Array.isArray(body?.operatingHours)
			? body.operatingHours
			: [];

		type OperatingHourPayload = {
			dayOfWeek?: unknown;
			openHour?: unknown;
			closeHour?: unknown;
			isClosed?: unknown;
		};

		type NormalizedOperatingHour = {
			dayOfWeek: DayOfWeek;
			openHour: number | null;
			closeHour: number | null;
			isClosed: boolean;
		};

		const normalizedOperatingHours: NormalizedOperatingHour[] =
			operatingHoursInput.map((raw): NormalizedOperatingHour => {
				const value = raw as OperatingHourPayload;

				const parsedOpenHour =
					value.openHour == null ? null : Number(value.openHour);

				const parsedCloseHour =
					value.closeHour == null ? null : Number(value.closeHour);

				return {
					dayOfWeek: value.dayOfWeek as DayOfWeek,
					openHour: Number.isFinite(parsedOpenHour) ? parsedOpenHour : null,
					closeHour: Number.isFinite(parsedCloseHour) ? parsedCloseHour : null,
					isClosed: Boolean(value.isClosed),
				};
			});

		const uniqueDays = new Set(
			normalizedOperatingHours.map((item) => item.dayOfWeek)
		);

		if (uniqueDays.size !== 7) {
			return NextResponse.json(
				{ error: "Hari operasional tidak boleh duplikat." },
				{ status: 400 }
			);
		}

    for (const item of normalizedOperatingHours) {
      if (!DAY_VALUES.includes(item.dayOfWeek as DayOfWeek)) {
        return NextResponse.json(
          { error: "Hari operasional tidak valid." },
          { status: 400 }
        );
      }

      if (!item.isClosed) {
        if (
          !Number.isInteger(item.openHour) ||
          !Number.isInteger(item.closeHour) ||
          (item.openHour as number) < 0 ||
          (item.closeHour as number) > 23 ||
          (item.openHour as number) >= (item.closeHour as number)
        ) {
          return NextResponse.json(
            {
              error: `Jam operasional tidak valid untuk ${item.dayOfWeek}.`,
            },
            { status: 400 }
          );
        }
      }
    }

    const store = await prisma.store.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Store tidak ditemukan." },
        { status: 404 }
      );
    }

    const existingSlug = await prisma.store.findFirst({
      where: {
        slug,
        id: {
          not: id,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: "Slug store sudah dipakai store lain." },
        { status: 409 }
      );
    }

    await prisma.$transaction([
      prisma.store.update({
        where: { id },
        data: {
          name,
          slug,
          city,
          address,
          locationHint,
          description,
          openHour,
          closeHour,
          isActive,
        },
      }),
      prisma.storeOperatingHour.deleteMany({
        where: { storeId: id },
      }),
      prisma.storeOperatingHour.createMany({
        data: normalizedOperatingHours.map((item) => ({
          storeId: id,
          dayOfWeek: item.dayOfWeek as DayOfWeek,
          openHour: item.isClosed ? null : (item.openHour as number),
          closeHour: item.isClosed ? null : (item.closeHour as number),
          isClosed: item.isClosed,
        })),
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update store error:", error);

    return NextResponse.json(
      { error: "Gagal mengupdate data store." },
      { status: 500 }
    );
  }
}