import crypto from "node:crypto";
import { getMidtransConfig } from "@/lib/midtrans";

type VerifyMidtransSignatureParams = {
	orderId: string;
	statusCode: string;
	grossAmount: string;
	signatureKey: string;
};

export function verifyMidtransSignature({
	orderId,
	statusCode,
	grossAmount,
	signatureKey,
}: VerifyMidtransSignatureParams) {
	const { serverKey } = getMidtransConfig();

	if (!serverKey) {
		return false;
	}

	const expected = crypto
		.createHash("sha512")
		.update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
		.digest("hex");

	return expected === signatureKey;
}