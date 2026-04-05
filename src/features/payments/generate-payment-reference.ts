export function generatePaymentReference(bookingCode: string) {
	return `PAY-${bookingCode}`;
}