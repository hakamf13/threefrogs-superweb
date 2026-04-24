import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function requireAdminSession() {
	const session = await auth();

	if (!session?.user || session.user.role !== "ADMIN") {
		return {
			session: null,
			response: NextResponse.json(
				{ error: "Akses ditolak." },
				{ status: 403 }
			),
		} as const;
	}

	return {
		session,
		response: null,
	} as const;
}