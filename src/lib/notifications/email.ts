type SendEmailArgs = {
	to: string | string[];
	subject: string;
	html: string;
	idempotencyKey?: string;
};

function getRequiredEnv(name: string) {
	const value = process.env[name]?.trim();
	return value || null;
}

export function isEmailNotificationConfigured() {
	return Boolean(
		getRequiredEnv("RESEND_API_KEY") &&
			getRequiredEnv("EMAIL_FROM")
	);
}

export async function sendEmail({
	to,
	subject,
	html,
	idempotencyKey,
}: SendEmailArgs) {
	const apiKey = getRequiredEnv("RESEND_API_KEY");
	const from = getRequiredEnv("EMAIL_FROM");

	if (!apiKey || !from) {
		console.info(
			"[email] skipped because RESEND_API_KEY or EMAIL_FROM is not configured"
		);
		return {
			skipped: true,
		};
	}

	const recipients = Array.isArray(to) ? to : [to];

	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
			...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
		},
		body: JSON.stringify({
			from,
			to: recipients,
			subject,
			html,
		}),
		cache: "no-store",
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Email send failed: ${response.status} ${text}`);
	}

	return response.json();
}