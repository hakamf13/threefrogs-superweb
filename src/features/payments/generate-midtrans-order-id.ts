export function generateMidtransOrderId(bookingCode: string) {
	return `MID-${bookingCode}-${Date.now()}`;
}