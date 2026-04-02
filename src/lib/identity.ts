export function normalizePhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("62")) {
    return `0${digits.slice(2)}`;
  }

  if (digits.startsWith("8")) {
    return `0${digits}`;
  }

  return digits;
}

export function isEmailIdentifier(value: string) {
  return value.includes("@");
}