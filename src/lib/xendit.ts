function requireEnv(name: string) {
	const value = process.env[name];

	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}

	return value;
}

export function getXenditConfig() {
	return {
		apiBaseUrl:
			process.env.XENDIT_API_BASE_URL || "https://api.xendit.co",
		secretKey: requireEnv("XENDIT_SECRET_KEY"),
		webhookVerificationToken: requireEnv("XENDIT_WEBHOOK_VERIFICATION_TOKEN"),
		successRedirectUrl: requireEnv("XENDIT_SUCCESS_REDIRECT_URL"),
		failureRedirectUrl: requireEnv("XENDIT_FAILURE_REDIRECT_URL"),
	};
}

export function getXenditBasicAuthHeader(secretKey: string) {
	const token = Buffer.from(`${secretKey}:`).toString("base64");

	return `Basic ${token}`;
}