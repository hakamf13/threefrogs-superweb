import { prisma } from "@/lib/prisma";

type UpdateBookingPaymentRequestParams = {
  bookingId: string;
  paymentReferenceId: string;
  paymentMethodCode: string;
  gatewayStatus: string | null;
  gatewayToken: string | null;
  checkoutUrl: string | null;
  actionType: string | null;
  actionDescriptor: string | null;
  actionValue: string | null;
  payload: unknown;
};

export async function updateBookingPaymentRequest({
  bookingId,
  paymentReferenceId,
  paymentMethodCode,
  gatewayStatus,
  gatewayToken,
  checkoutUrl,
  actionType,
  actionDescriptor,
  actionValue,
  payload,
}: UpdateBookingPaymentRequestParams) {
  await prisma.booking.update({
    where: {
      id: bookingId,
    },
    data: {
      paymentReferenceId,
      paymentGatewayProvider: "MIDTRANS",
      paymentGatewayStatus: gatewayStatus,
      paymentMethodCode,
      paymentGatewayToken: gatewayToken,
      paymentCheckoutUrl: checkoutUrl,
      paymentActionType: actionType,
      paymentActionDescriptor: actionDescriptor,
      paymentActionValue: actionValue,
      paymentGatewayPayload: payload as object,
      paymentRequestedAt: new Date(),
    },
  });
}