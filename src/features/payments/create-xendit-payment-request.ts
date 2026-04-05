import { getXenditBasicAuthHeader, getXenditConfig } from "@/lib/xendit";

type CreateXenditPaymentRequestParams = {
  referenceId: string;
  amount: number;
  bookingCode: string;
  customer: {
    givenNames: string;
    email?: string | null;
    mobileNumber?: string | null;
  };
};

export async function createXenditPaymentRequest({
  referenceId,
  amount,
  bookingCode,
  customer,
}: CreateXenditPaymentRequestParams) {
  const config = getXenditConfig();

  const response = await fetch(`${config.apiBaseUrl}/payment_requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getXenditBasicAuthHeader(config.secretKey),
    },
    body: JSON.stringify({
      reference_id: referenceId,
      type: "PAY",
      country: "ID",
      currency: "IDR",
      request_amount: amount,
      capture_method: "AUTOMATIC",
      channel_code: "QRIS",
      channel_properties: {
        success_return_url: config.successRedirectUrl,
        failure_return_url: config.failureRedirectUrl,
      },
      customer: {
        given_names: customer.givenNames,
        email: customer.email || undefined,
        mobile_number: customer.mobileNumber || undefined,
      },
      metadata: {
        booking_code: bookingCode,
      },
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result?.message || result?.error_code || "Failed to create Xendit payment request."
    );
  }

  return result;
}