function getEnv(name: string, fallback = "") {
	return process.env[name]?.trim() || fallback;
}

export const appConfig = {
	nodeEnv: getEnv("NODE_ENV", "development"),
	appBaseUrl: getEnv("APP_BASE_URL", "http://localhost:3000"),
	paymentMode: getEnv("PAYMENT_MODE", "MANUAL").toUpperCase(),
	cloudinaryCloudName: getEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"),
	cloudinaryUploadPreset: getEnv("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"),
};

export function isManualPaymentMode() {
	return appConfig.paymentMode === "MANUAL";
}

export function isMidtransPaymentMode() {
	return appConfig.paymentMode === "MIDTRANS";
}