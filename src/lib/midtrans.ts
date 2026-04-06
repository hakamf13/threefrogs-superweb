function getEnv(name: string) {
	return process.env[name]?.trim() || "";
}

export function isMidtransConfigured() {
	return Boolean(getEnv("MIDTRANS_SERVER_KEY"));
}

export function getMidtransConfig() {
	const isProduction = getEnv("MIDTRANS_IS_PRODUCTION") === "true";

	return {
		isProduction,
		apiBaseUrl: isProduction
			? "https://app.midtrans.com"
			: "https://app.sandbox.midtrans.com",
		serverKey: getEnv("MIDTRANS_SERVER_KEY"),
		clientKey: getEnv("NEXT_PUBLIC_MIDTRANS_CLIENT_KEY"),
		merchantId: getEnv("MIDTRANS_MERCHANT_ID"),
		finishRedirectUrl: getEnv("MIDTRANS_FINISH_REDIRECT_URL"),
		unfinishRedirectUrl: getEnv("MIDTRANS_UNFINISH_REDIRECT_URL"),
		errorRedirectUrl: getEnv("MIDTRANS_ERROR_REDIRECT_URL"),
	};
}

export function getMidtransBasicAuthHeader(serverKey: string) {
	const token = Buffer.from(`${serverKey}:`).toString("base64");
	return `Basic ${token}`;
}