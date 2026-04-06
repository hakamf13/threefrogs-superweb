import { getMidtransBasicAuthHeader, getMidtransConfig } from "@/lib/midtrans";
import { formatMidtransStartTime } from "./format-midtrans-start-time";

type CreateMidtransSnapTransactionParams = {
	orderId: string;
	grossAmount: number;
	bookingCode: string;
	customer: {
		firstName: string;
		email?: string | null;
		phone?: string | null;
	};
};

export async function createMidtransSnapTransaction({
	orderId,
	grossAmount,
	bookingCode,
	customer,
}: CreateMidtransSnapTransactionParams) {
	const config = getMidtransConfig();

	if (!config.serverKey) {
		throw new Error("MIDTRANS_SERVER_KEY is not configured.");
	}

	const response = await fetch(`${config.apiBaseUrl}/snap/v1/transactions`, {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			Authorization: getMidtransBasicAuthHeader(config.serverKey),
		},
		body: JSON.stringify({
			transaction_details: {
				order_id: orderId,
				gross_amount: grossAmount,
			},
			customer_details: {
				first_name: customer.firstName,
				email: customer.email || undefined,
				phone: customer.phone || undefined,
			},
			item_details: [
				{
					id: bookingCode,
					price: grossAmount,
					quantity: 1,
					name: `Mahjong Booking ${bookingCode}`,
				},
			],
			expiry: {
				start_time: formatMidtransStartTime(new Date()),
				unit: "minutes",
				duration: 15,
			},
			callbacks: {
				finish: config.finishRedirectUrl || undefined,
				unfinish: config.unfinishRedirectUrl || undefined,
				error: config.errorRedirectUrl || undefined,
			},
			custom_field1: bookingCode,
			custom_field2: "mahjong",
			custom_field3: "threefrogs",
		}),
	});

	const result = await response.json();

	if (!response.ok) {
		throw new Error(
			result?.error_messages?.join(", ") ||
				result?.status_message ||
				"Failed to create Midtrans Snap transaction."
		);
	}

	return result as {
		token: string;
		redirect_url: string;
	};
}