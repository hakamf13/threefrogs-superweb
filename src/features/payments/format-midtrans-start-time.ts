export function formatMidtransStartTime(date = new Date()) {
	const jakarta = new Date(
		date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
	);

	const year = jakarta.getFullYear();
	const month = String(jakarta.getMonth() + 1).padStart(2, "0");
	const day = String(jakarta.getDate()).padStart(2, "0");
	const hours = String(jakarta.getHours()).padStart(2, "0");
	const minutes = String(jakarta.getMinutes()).padStart(2, "0");
	const seconds = String(jakarta.getSeconds()).padStart(2, "0");

	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} +0700`;
}