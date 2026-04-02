import { z } from "zod";

export const createBookingSchema = z.object({
  storeId: z.string().min(1, "Store wajib dipilih."),
  tableId: z.string().min(1, "Meja wajib dipilih."),
  bookingDate: z.string().min(1, "Tanggal wajib dipilih."),
  selectedSlots: z.array(z.number().int()).min(1, "Pilih minimal 1 slot jam."),
  customerName: z.string().min(2, "Nama minimal 2 karakter."),
  customerPhone: z.string().min(6, "Nomor HP tidak valid."),
  customerEmail: z.string().email("Email tidak valid.").optional().or(z.literal("")),
  notes: z.string().optional(),
});

export const registerUserSchema = z
  .object({
    name: z.string().min(4, "Nama minimal 4 karakter."),
    email: z.email("Email tidak valid."),
    phone: z.string().min(6, "Nomor HP tidak valid."),
    password: z.string().min(8, "Password minimal 8 karakter."),
    confirmPassword: z.string().min(8, "Konfirmasi password minimal 8 karakter."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak sama.",
    path: ["confirmPassword"],
  });