import { z } from "zod";

export const createBookingSchema = z.object({
  storeId: z.string().min(1, "Store wajib dipilih."),
  tableId: z.string().min(1, "Meja wajib dipilih."),
  bookingDate: z.string().min(1, "Tanggal wajib dipilih."),
  selectedSlots: z.array(z.number().int()).min(1, "Pilih minimal 1 slot jam."),
  notes: z.string().optional(),
});

export const registerUserSchema = z
  .object({
    name: z.string().min(4, "Nama minimal 4 karakter."),
    phone: z.string().min(6, "Nomor HP tidak valid."),
    email: z.email("Email tidak valid.").optional().or(z.literal("")),
    password: z.string().min(8, "Password minimal 8 karakter."),
    confirmPassword: z.string().min(8, "Konfirmasi password minimal 8 karakter."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak sama.",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Nama minimal 4 karakter."),
  phone: z.string().min(8, "Nomor HP tidak valid."),
  email: z.string().email("Email tidak valid.").optional().or(z.literal("")),
});  

export const createManualBookingSchema = z.object({
  storeId: z.string().min(1, "Store wajib dipilih."),
  tableId: z.string().min(1, "Meja wajib dipilih."),
  bookingDate: z.string().min(1, "Tanggal wajib dipilih."),
  selectedSlots: z.array(z.number().int()).min(1, "Pilih minimal 1 slot."),
  customerName: z.string().min(4, "Nama customer minimal 4 karakter."),
  customerPhone: z.string().min(6, "Nomor HP customer tidak valid."),
  customerEmail: z.string().email("Email tidak valid.").optional().or(z.literal("")),
  notes: z.string().optional(),
  source: z.enum(["WALK_IN", "ADMIN"]),
  initialStatus: z.enum(["CONFIRMED", "AWAITING_PAYMENT"]),
});