type XenditAction = {
	type?: string;
	descriptor?: string;
	value?: string;
};

type ExtractedPaymentAction = {
	type: string | null;
	descriptor: string | null;
	value: string | null;
	checkoutUrl: string | null;
};

export function extractXenditPaymentAction(payload: unknown): ExtractedPaymentAction {
	const actions = (payload as { actions?: XenditAction[] })?.actions ?? [];

	if (!Array.isArray(actions) || actions.length === 0) {
		return {
			type: null,
			descriptor: null,
			value: null,
			checkoutUrl: null,
		};
	}

	const preferredAction =
		actions.find(
			(action) =>
				action?.type === "REDIRECT_CUSTOMER" &&
				action?.descriptor === "WEB_URL"
		) ??
		actions.find(
			(action) =>
				action?.type === "PRESENT_TO_CUSTOMER" &&
				action?.descriptor === "QR_STRING"
		) ??
		actions[0];

	return {
		type: preferredAction?.type ?? null,
		descriptor: preferredAction?.descriptor ?? null,
		value: preferredAction?.value ?? null,
		checkoutUrl:
			preferredAction?.type === "REDIRECT_CUSTOMER" &&
			preferredAction?.descriptor === "WEB_URL"
				? preferredAction.value ?? null
				: null,
	};
}